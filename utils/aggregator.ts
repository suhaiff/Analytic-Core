import { ProcessedRow, ChartConfig, AggregationType } from '../types';
import { getYear, getMonth, getDay } from './formatters';

export function evaluateDaxMeasure(formula: string, rows: ProcessedRow[], customMeasures?: any[], allRows?: ProcessedRow[]): number {
  // allRows is the full (pre-grouped) dataset used by context-sensitive functions
  // like SAMEPERIODLASTYEAR and DATEADD that need to look rows up outside the current group.
  const fullDataset = allRows || rows;
  if (!formula || rows.length === 0) return 0;
  
  let jsFormula = formula;
  
  // Replace TODAY() with current date string (without time) so it can be parsed as a Date literal
  jsFormula = jsFormula.replace(/TODAY\(\)/gi, `"${new Date().toISOString().split('T')[0]}"`);
  
  let match;
  let index = 0;
  const values: Record<string, number> = {};

  // 1a. Process CALCULATE + DATESINPERIOD
  // Uses a bracket-aware extractor to correctly capture expressions containing commas.
  // Syntax: CALCULATE(<expr>, DATESINPERIOD(<DateCol>, MAX(<DateCol>), -90, DAY))
  const calcDatesPattern = /CALCULATE\s*\(/gi;
  let calcMatch;
  calcDatesPattern.lastIndex = 0;
  const tempFormula1 = jsFormula;
  const calcDateReplacements: Array<{from: string, to: string}> = [];

  while ((calcMatch = calcDatesPattern.exec(tempFormula1)) !== null) {
      // Find the matching closing paren for CALCULATE(
      const startIdx = calcMatch.index + calcMatch[0].length;
      let depth = 1;
      let i = startIdx;
      while (i < tempFormula1.length && depth > 0) {
          if (tempFormula1[i] === '(') depth++;
          else if (tempFormula1[i] === ')') depth--;
          i++;
      }
      const inner = tempFormula1.slice(startIdx, i - 1).trim(); // everything inside CALCULATE(...)
      const fullMatch = tempFormula1.slice(calcMatch.index, i);

      // Split inner into: first arg (expression) and the rest (filter args)
      // Split at top-level commas only
      const topLevelSplit = (str: string): string[] => {
          const parts: string[] = [];
          let d = 0; let cur = '';
          for (const c of str) {
              if (c === '(' ) d++;
              else if (c === ')') d--;
              if (c === ',' && d === 0) { parts.push(cur.trim()); cur = ''; }
              else cur += c;
          }
          if (cur.trim()) parts.push(cur.trim());
          return parts;
      };

      const args = topLevelSplit(inner);
      if (args.length < 2) continue;

      let expression = args[0];
      const filterArg = args.slice(1).join(', ');

      // Resolve a [MeasureName] reference that refers to another custom measure
      const measureRefMatch = /^\[([^\]]+)\]$/.exec(expression.trim());
      if (measureRefMatch && customMeasures) {
          const refMeasure = customMeasures.find((m: any) => m.name === measureRefMatch[1]);
          if (refMeasure) expression = refMeasure.dax_formula;
      }

      // Now parse the filter: DATESINPERIOD(<DateCol>, MAX(<DateCol>), <offset>, <interval>)
      const datesInPeriodMatch = /^DATESINPERIOD\(\s*(?:'[^']+'\[([^\]]+)\]|\[([^\]]+)\])\s*,\s*MAX\(\s*(?:'[^']+'\[([^\]]+)\]|\[([^\]]+)\])\s*\)\s*,\s*(-?\d+)\s*,\s*(DAY|MONTH|QUARTER|YEAR)\s*\)$/i.exec(filterArg.trim())
          || /^DATESINPERIOD\(\s*(?:'[^']+')??\[([^\]]+)\]\s*,\s*MAX\(\s*(?:'[^']+')??\[([^\]]+)\]\s*\)\s*,\s*(-?\d+)\s*,\s*(DAY|MONTH|QUARTER|YEAR)\s*\)$/i.exec(filterArg.trim());

      if (!datesInPeriodMatch) continue;

      // Groups differ per regex; find the non-null column names
      const nonNullGroups = datesInPeriodMatch.slice(1).filter(Boolean);
      const dateCol = nonNullGroups[0];
      const offset = parseInt(nonNullGroups[nonNullGroups.length - 2], 10);
      const interval = nonNullGroups[nonNullGroups.length - 1].toUpperCase();

      const key = `__val${index++}__`;
      let val = 0;
      let validRows = rows.filter(r => r[dateCol] !== undefined && r[dateCol] !== null && !isNaN(new Date(r[dateCol]).getTime()));

      if (validRows.length > 0) {
          const maxDate = new Date(Math.max(...validRows.map(r => new Date(r[dateCol]).getTime())));
          let startDate = new Date(maxDate);
          if (interval === 'DAY') startDate.setDate(startDate.getDate() + offset);
          else if (interval === 'MONTH') startDate.setMonth(startDate.getMonth() + offset);
          else if (interval === 'QUARTER') startDate.setMonth(startDate.getMonth() + (offset * 3));
          else if (interval === 'YEAR') startDate.setFullYear(startDate.getFullYear() + offset);

          const minTime = Math.min(startDate.getTime(), maxDate.getTime());
          const maxTime = Math.max(startDate.getTime(), maxDate.getTime());

          const filteredRows = validRows.filter(r => {
              const d = new Date(r[dateCol]).getTime();
              return d >= minTime && d <= maxTime;
          });

          val = evaluateDaxMeasure(expression, filteredRows, customMeasures, fullDataset);
      }

      calcDateReplacements.push({ from: fullMatch, to: key });
      values[key] = val;
  }
  calcDateReplacements.forEach(({ from, to }) => { jsFormula = jsFormula.replace(from, to); });


  // 1b. Process CALCULATE + PREVIOUSYEAR / PREVIOUSQUARTER / PREVIOUSMONTH / SAMEPERIODLASTYEAR
  // Syntax: CALCULATE(<expression>, PREVIOUSYEAR(<DateColumn>))
  const calcPrevRegex = /CALCULATE\(\s*(.+?)\s*,\s*(PREVIOUSYEAR|PREVIOUSQUARTER|PREVIOUSMONTH|SAMEPERIODLASTYEAR)\(\s*(?:'[^']+'\[([^\]]+)\]|\[([^\]]+)\])\s*\)\s*\)/gi;
  let remainingFormulaForPrev = jsFormula;
  while ((match = calcPrevRegex.exec(remainingFormulaForPrev)) !== null) {
      const [fullMatch, expression, funcRaw, dateCol1, dateCol2] = match;
      if (!jsFormula.includes(fullMatch)) continue;

      const func = funcRaw.toUpperCase();
      const dateCol = dateCol1 || dateCol2;
      const key = `__val${index++}__`;
      let val = 0;
      let validRows = rows.filter(r => r[dateCol] !== undefined && r[dateCol] !== null);

      if (validRows.length > 0) {
          const maxDate = new Date(Math.max(...validRows.map(r => new Date(r[dateCol]).getTime())));
          const maxYear = maxDate.getFullYear();
          const maxMonth = maxDate.getMonth();

          let filteredRows: any[] = [];
          if (func === 'PREVIOUSYEAR') {
              // All dates in the previous calendar year
              filteredRows = validRows.filter(r => new Date(r[dateCol]).getFullYear() === maxYear - 1);
          } else if (func === 'PREVIOUSQUARTER') {
              const currentQuarter = Math.floor(maxMonth / 3);
              const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
              const prevQuarterYear = currentQuarter === 0 ? maxYear - 1 : maxYear;
              filteredRows = validRows.filter(r => {
                  const d = new Date(r[dateCol]);
                  return d.getFullYear() === prevQuarterYear && Math.floor(d.getMonth() / 3) === prevQuarter;
              });
          } else if (func === 'PREVIOUSMONTH') {
              const prevMonth = maxMonth === 0 ? 11 : maxMonth - 1;
              const prevMonthYear = maxMonth === 0 ? maxYear - 1 : maxYear;
              filteredRows = validRows.filter(r => {
                  const d = new Date(r[dateCol]);
                  return d.getFullYear() === prevMonthYear && d.getMonth() === prevMonth;
              });
          // For SAMEPERIODLASTYEAR: shift the current context's exact date range back 1 year
          // and look up those rows from the FULL dataset (Power BI filter-context behavior)
          // For SAMEPERIODLASTYEAR: shift the exact distinct dates in the context back 1 year
          } else if (func === 'SAMEPERIODLASTYEAR') {
              const exactDates = new Set<number>();
              validRows.forEach(r => {
                  const d = new Date(r[dateCol]);
                  d.setHours(0, 0, 0, 0);
                  exactDates.add(d.getTime());
              });
              
              const shiftedDates = new Set<number>();
              exactDates.forEach(time => {
                  const d = new Date(time);
                  d.setFullYear(d.getFullYear() - 1);
                  shiftedDates.add(d.getTime());
              });
              
              const fullValidRows = fullDataset.filter(r => r[dateCol] !== undefined && r[dateCol] !== null);
              filteredRows = fullValidRows.filter(r => {
                  const d = new Date(r[dateCol]);
                  d.setHours(0, 0, 0, 0);
                  return shiftedDates.has(d.getTime());
              });
          }

          val = evaluateDaxMeasure(expression, filteredRows, customMeasures, fullDataset);
      }

      values[key] = val;
      jsFormula = jsFormula.replace(fullMatch, key);
  }

  // 1c. Process standalone PREVIOUSYEAR / PREVIOUSQUARTER / PREVIOUSMONTH / SAMEPERIODLASTYEAR
  // Syntax: PREVIOUSYEAR(<expression>, <DateColumn>)
  const prevRegex = /(PREVIOUSYEAR|PREVIOUSQUARTER|PREVIOUSMONTH|SAMEPERIODLASTYEAR)\(\s*(.+?)\s*,\s*\[([^\]]+)\]\s*\)/gi;
  let remainingFormulaForPrev2 = jsFormula;
  while ((match = prevRegex.exec(remainingFormulaForPrev2)) !== null) {
      const [fullMatch, funcRaw, expression, dateCol] = match;
      if (!jsFormula.includes(fullMatch)) continue;

      const func = funcRaw.toUpperCase();
      const key = `__val${index++}__`;
      let val = 0;
      let validRows = rows.filter(r => r[dateCol] !== undefined && r[dateCol] !== null);

      if (validRows.length > 0) {
          const maxDate = new Date(Math.max(...validRows.map(r => new Date(r[dateCol]).getTime())));
          const maxYear = maxDate.getFullYear();
          const maxMonth = maxDate.getMonth();

          let filteredRows: any[] = [];
          if (func === 'PREVIOUSYEAR') {
              filteredRows = validRows.filter(r => new Date(r[dateCol]).getFullYear() === maxYear - 1);
          } else if (func === 'PREVIOUSQUARTER') {
              const currentQuarter = Math.floor(maxMonth / 3);
              const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
              const prevQuarterYear = currentQuarter === 0 ? maxYear - 1 : maxYear;
              filteredRows = validRows.filter(r => {
                  const d = new Date(r[dateCol]);
                  return d.getFullYear() === prevQuarterYear && Math.floor(d.getMonth() / 3) === prevQuarter;
              });
          } else if (func === 'PREVIOUSMONTH') {
              const prevMonth = maxMonth === 0 ? 11 : maxMonth - 1;
              const prevMonthYear = maxMonth === 0 ? maxYear - 1 : maxYear;
              filteredRows = validRows.filter(r => {
                  const d = new Date(r[dateCol]);
                  return d.getFullYear() === prevMonthYear && d.getMonth() === prevMonth;
              });
          } else if (func === 'SAMEPERIODLASTYEAR') {
              const exactDates = new Set<number>();
              validRows.forEach(r => {
                  const d = new Date(r[dateCol]);
                  d.setHours(0, 0, 0, 0);
                  exactDates.add(d.getTime());
              });
              
              const shiftedDates = new Set<number>();
              exactDates.forEach(time => {
                  const d = new Date(time);
                  d.setFullYear(d.getFullYear() - 1);
                  shiftedDates.add(d.getTime());
              });
              
              const fullValidRows = fullDataset.filter(r => r[dateCol] !== undefined && r[dateCol] !== null);
              filteredRows = fullValidRows.filter(r => {
                  const d = new Date(r[dateCol]);
                  d.setHours(0, 0, 0, 0);
                  return shiftedDates.has(d.getTime());
              });
          }

          val = evaluateDaxMeasure(expression, filteredRows, customMeasures, fullDataset);
      }

      values[key] = val;
      jsFormula = jsFormula.replace(fullMatch, key);
  }

  // 1d. Process DATEADD
  // Syntax: DATEADD(<expression>, <DateColumn>, <NumberOfIntervals>, <Interval>)
  // e.g. DATEADD(SUM([Sales Amount]), [Order Date], -1, MONTH)
  const dateAddRegex = /DATEADD\(\s*(.+?)\s*,\s*\[([^\]]+)\]\s*,\s*(-?\d+)\s*,\s*(DAY|MONTH|QUARTER|YEAR)\s*\)/gi;
  let remainingFormulaForDateAdd = jsFormula;
  while ((match = dateAddRegex.exec(remainingFormulaForDateAdd)) !== null) {
      const [fullMatch, expression, dateCol, offsetStr, intervalStr] = match;
      if (!jsFormula.includes(fullMatch)) continue;

      const key = `__val${index++}__`;
      const offset = parseInt(offsetStr, 10);
      const interval = intervalStr.toUpperCase();
      let val = 0;
      // validRows = current filter context (the current group's rows)
      let validRows = rows.filter(r => r[dateCol] !== undefined && r[dateCol] !== null);

      if (validRows.length > 0) {
          // DATEADD Power BI behavior:
          // 1. Get the exact distinct dates in the current context
          // 2. Shift each date individually
          // 3. Find all rows in the full dataset matching any of the shifted dates
          const exactDates = new Set<number>();
          validRows.forEach(r => {
              const d = new Date(r[dateCol]);
              d.setHours(0, 0, 0, 0);
              exactDates.add(d.getTime());
          });

          const shiftedDates = new Set<number>();
          exactDates.forEach(time => {
              const d = new Date(time);
              if (interval === 'DAY') d.setDate(d.getDate() + offset);
              else if (interval === 'MONTH') d.setMonth(d.getMonth() + offset);
              else if (interval === 'QUARTER') d.setMonth(d.getMonth() + offset * 3);
              else if (interval === 'YEAR') d.setFullYear(d.getFullYear() + offset);
              shiftedDates.add(d.getTime());
          });

          const fullValidRows = fullDataset.filter(r => r[dateCol] !== undefined && r[dateCol] !== null);
          const filteredRows = fullValidRows.filter(r => {
              const d = new Date(r[dateCol]);
              d.setHours(0, 0, 0, 0);
              return shiftedDates.has(d.getTime());
          });

          val = evaluateDaxMeasure(expression, filteredRows, customMeasures, fullDataset);
      }

      values[key] = val;
      jsFormula = jsFormula.replace(fullMatch, key);
  }

  // 1e. Process DATESBETWEEN
  // Syntax: DATESBETWEEN(<expression>, <DateColumn>, <StartDate>, <EndDate>)
  // e.g. DATESBETWEEN(SUM([Sales Amount]), [Order Date], "2024-01-01", "2024-03-31")
  const datesBetweenRegex = /DATESBETWEEN\(\s*(.+?)\s*,\s*\[([^\]]+)\]\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/gi;
  let remainingFormulaForDatesBetween = jsFormula;
  while ((match = datesBetweenRegex.exec(remainingFormulaForDatesBetween)) !== null) {
      const [fullMatch, expression, dateCol, startDateStr, endDateStr] = match;
      if (!jsFormula.includes(fullMatch)) continue;

      const key = `__val${index++}__`;
      let val = 0;
      const startTime = new Date(startDateStr).getTime();
      const endTime = new Date(endDateStr).getTime();
      let validRows = rows.filter(r => r[dateCol] !== undefined && r[dateCol] !== null);

      const filteredRows = validRows.filter(r => {
          const d = new Date(r[dateCol]).getTime();
          return d >= startTime && d <= endTime;
      });

      val = evaluateDaxMeasure(expression, filteredRows, customMeasures, fullDataset);

      values[key] = val;
      jsFormula = jsFormula.replace(fullMatch, key);
  }

  // 1f. Process standalone DATESINPERIOD
  // Syntax: DATESINPERIOD(<expression>, <DateColumn>, <StartDate>, <NumberOfIntervals>, <Interval>)
  // e.g. DATESINPERIOD(SUM([Sales Amount]), [Order Date], "2024-01-01", 30, DAY)
  const datesinperiodRegex = /DATESINPERIOD\(\s*(.+?)\s*,\s*\[([^\]]+)\]\s*,\s*["']([^"']+)["']\s*,\s*(-?\d+)\s*,\s*(DAY|MONTH|QUARTER|YEAR)\s*\)/gi;
  let remainingFormulaForDSP = jsFormula;
  while ((match = datesinperiodRegex.exec(remainingFormulaForDSP)) !== null) {
      const [fullMatch, expression, dateCol, startDateStr, countStr, intervalStr] = match;
      if (!jsFormula.includes(fullMatch)) continue;

      const key = `__val${index++}__`;
      const count = parseInt(countStr, 10);
      const interval = intervalStr.toUpperCase();
      let val = 0;
      let validRows = rows.filter(r => r[dateCol] !== undefined && r[dateCol] !== null);

      const startDate = new Date(startDateStr);
      const endDate = new Date(startDateStr);
      if (interval === 'DAY') endDate.setDate(endDate.getDate() + count - 1);
      else if (interval === 'MONTH') endDate.setMonth(endDate.getMonth() + count - 1);
      else if (interval === 'QUARTER') endDate.setMonth(endDate.getMonth() + (count * 3) - 1);
      else if (interval === 'YEAR') endDate.setFullYear(endDate.getFullYear() + count - 1);

      const filteredRows = validRows.filter(r => {
          const d = new Date(r[dateCol]).getTime();
          return d >= startDate.getTime() && d <= endDate.getTime();
      });

      val = evaluateDaxMeasure(expression, filteredRows, customMeasures, fullDataset);

      values[key] = val;
      jsFormula = jsFormula.replace(fullMatch, key);
  }

  // 1. Process Time Intelligence functions first (since they can contain other expressions)
  const timeIntRegex = /(TOTALMTD|TOTALYTD|TOTALQTD|TOTALWTD)\(\s*(.+?)\s*,\s*\[([^\]]+)\]\s*\)/gi;
  let remainingFormulaForTime = jsFormula;
  while ((match = timeIntRegex.exec(remainingFormulaForTime)) !== null) {
      const [fullMatch, funcRaw, expression, dateCol] = match;
      if (!jsFormula.includes(fullMatch)) continue;
      
      const func = funcRaw.toUpperCase();
      const key = `__val${index++}__`;
      
      let val = 0;
      let validRows = rows.filter(r => r[dateCol] !== undefined && r[dateCol] !== null);
      
      if (validRows.length > 0) {
          const maxDate = new Date(Math.max(...validRows.map(r => new Date(r[dateCol]).getTime())));
          const maxYear = maxDate.getFullYear();
          const maxMonth = maxDate.getMonth();
          
          let filteredRows: any[] = [];
          if (func === 'TOTALMTD') {
              filteredRows = validRows.filter(r => {
                  const d = new Date(r[dateCol]);
                  return d.getFullYear() === maxYear && d.getMonth() === maxMonth && d.getTime() <= maxDate.getTime();
              });
          } else if (func === 'TOTALYTD') {
              filteredRows = validRows.filter(r => {
                  const d = new Date(r[dateCol]);
                  return d.getFullYear() === maxYear && d.getTime() <= maxDate.getTime();
              });
          } else if (func === 'TOTALQTD') {
              const currentQuarter = Math.floor(maxMonth / 3);
              filteredRows = validRows.filter(r => {
                  const d = new Date(r[dateCol]);
                  return d.getFullYear() === maxYear && Math.floor(d.getMonth() / 3) === currentQuarter && d.getTime() <= maxDate.getTime();
              });
          } else if (func === 'TOTALWTD') {
              // Week starts on Sunday (day 0). Find the start of the current week.
              const startOfWeek = new Date(maxDate);
              startOfWeek.setDate(maxDate.getDate() - maxDate.getDay()); // go back to Sunday
              startOfWeek.setHours(0, 0, 0, 0); // beginning of that day
              filteredRows = validRows.filter(r => {
                  const d = new Date(r[dateCol]);
                  return d.getTime() >= startOfWeek.getTime() && d.getTime() <= maxDate.getTime();
              });
          }
          
          // Evaluate the inner expression on the filtered subset of rows
          val = evaluateDaxMeasure(expression, filteredRows, customMeasures, fullDataset);
      }
      
      values[key] = val;
      jsFormula = jsFormula.replace(fullMatch, key);
  }

  // 1g. Generic CALCULATE with a basic filter condition
  // e.g. CALCULATE(SUM([Sales]), [Region] = "West")
  // e.g. CALCULATE(SUM([Sales]), FILTER('Table', [Region] = "West"))
  const calculateFilterRegex = /CALCULATE\(\s*(.+?)\s*,\s*(?:FILTER\(\s*(?:'[^']+'\s*,\s*)?|)(?:'[^']+'\[([^\]]+)\]|\[([^\]]+)\])\s*(=|>|<|>=|<=|<>)\s*(['"]?[^'")]+['"]?)(?:\s*\))?\s*\)/gi;
  let remainingFormulaForCalcFilter = jsFormula;
  while ((match = calculateFilterRegex.exec(remainingFormulaForCalcFilter)) !== null) {
      const [fullMatch, expression, col1, col2, op, valStr] = match;
      if (!jsFormula.includes(fullMatch)) continue;
      
      const col = col1 || col2;
      const key = `__val${index++}__`;
      let valToCompare = valStr.replace(/^['"](.*)['"]$/, '$1');
      const isNumCompare = !isNaN(Number(valToCompare));
      const numCompare = isNumCompare ? Number(valToCompare) : NaN;
      
      const filteredRows = fullDataset.filter(r => {
          let rowVal = r[col];
          if (rowVal === undefined || rowVal === null) return false;
          
          if (isNumCompare) {
             rowVal = Number(rowVal);
             if (op === '=') return rowVal === numCompare;
             if (op === '>') return rowVal > numCompare;
             if (op === '<') return rowVal < numCompare;
             if (op === '>=') return rowVal >= numCompare;
             if (op === '<=') return rowVal <= numCompare;
             if (op === '<>') return rowVal !== numCompare;
          } else {
             rowVal = String(rowVal).toLowerCase();
             valToCompare = valToCompare.toLowerCase();
             if (op === '=') return rowVal === valToCompare;
             if (op === '<>') return rowVal !== valToCompare;
          }
          return false;
      });
      
      const val = evaluateDaxMeasure(expression, filteredRows, customMeasures, fullDataset);
      
      values[key] = val;
      jsFormula = jsFormula.replace(fullMatch, key);
  }

  // 2. Process aggregate functions: e.g. SUM([SalesAmount])
  const aggRegex = /(SUM|AVERAGE|COUNT|DISTINCTCOUNT|MIN|MAX)\(\s*\[([^\]]+)\]\s*\)/gi;
  let remainingFormulaForAgg = jsFormula;
  while ((match = aggRegex.exec(remainingFormulaForAgg)) !== null) {
      const [fullMatch, funcRaw, col] = match;
      if (!jsFormula.includes(fullMatch)) continue;
      
      const func = funcRaw.toUpperCase();
      const key = `__val${index++}__`;
      
      let val = 0;
      // For COUNT, any non-null/non-undefined value is counted (text columns too)
      const nonNullRows = rows.filter(r => r[col] !== undefined && r[col] !== null && r[col] !== '');
      
      const getValue = (val: any) => {
          const num = Number(val);
          if (!isNaN(num)) return num;
          if (typeof val === 'string' && val.trim() !== '') {
              const d = Date.parse(val);
              if (!isNaN(d)) return d;
          }
          return NaN;
      };
      
      let validRows = rows.filter(r => r[col] !== undefined && r[col] !== null && !isNaN(getValue(r[col])));
      
      if (func === 'SUM' || func === 'AVERAGE') {
          val = validRows.reduce((sum, r) => sum + Number(r[col]), 0);
          if (func === 'AVERAGE') val = validRows.length > 0 ? val / validRows.length : 0;
      } else if (func === 'COUNT') {
          val = nonNullRows.length;
      } else if (func === 'DISTINCTCOUNT') {
          const uniqueVals = new Set(nonNullRows.map(r => r[col]));
          val = uniqueVals.size;
      } else if (func === 'MIN') {
          val = validRows.length > 0 ? Math.min(...validRows.map(r => getValue(r[col]))) : 0;
      } else if (func === 'MAX') {
          val = validRows.length > 0 ? Math.max(...validRows.map(r => getValue(r[col]))) : 0;
      }
      
      values[key] = val;
      jsFormula = jsFormula.replace(fullMatch, key);
  }
  
  // Find any remaining standalone [MeasureName] or [ColumnName]
  const measureRegex = /\[([^\]]+)\]/g;
  let remainingFormula = jsFormula;
  let remainingMatch;
  while ((remainingMatch = measureRegex.exec(remainingFormula)) !== null) {
      const [fullMatch, name] = remainingMatch;
      if (!jsFormula.includes(fullMatch)) continue;
      
      const key = `__val${index++}__`;
      let val = 0;
      
      const customMeasure = customMeasures?.find(m => m.name === name);
      if (customMeasure && customMeasure.dax_formula) {
          // Recursively evaluate the nested DAX measure
          val = evaluateDaxMeasure(customMeasure.dax_formula, rows, customMeasures, fullDataset);
      } else {
          // Implicit SUM if it's a raw column reference
          let validRows = rows.filter(r => r[name] !== undefined && r[name] !== null && !isNaN(Number(r[name])));
          val = validRows.reduce((sum, r) => sum + Number(r[name]), 0);
      }
      
      values[key] = val;
      jsFormula = jsFormula.replace(new RegExp('\\[' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\]', 'g'), key);
  }
  
  Object.keys(values).forEach(key => {
      jsFormula = jsFormula.replace(new RegExp(key, 'g'), String(values[key]));
  });

  // Evaluate DATEDIFF function
  // Matches strings (e.g. "2024-01-01") OR numeric timestamps from evaluated MIN/MAX
  jsFormula = jsFormula.replace(
      /DATEDIFF\(\s*(?:['"]([^'"]+)['"]|(-?\d+(?:\.\d+)?))\s*,\s*(?:['"]([^'"]+)['"]|(-?\d+(?:\.\d+)?))\s*,\s*(DAY|MONTH|QUARTER|YEAR)\s*\)/gi,
      (m, t1Str, t1Num, t2Str, t2Num, intervalStr) => {
          const d1Time = t1Str ? Date.parse(t1Str) : Number(t1Num);
          const d2Time = t2Str ? Date.parse(t2Str) : Number(t2Num);
          const d1 = new Date(d1Time);
          const d2 = new Date(d2Time);
          const interval = intervalStr.toUpperCase();
          let diff = 0;
          if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
              if (interval === 'DAY') diff = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
              else if (interval === 'MONTH') diff = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
              else if (interval === 'QUARTER') diff = (d2.getFullYear() - d1.getFullYear()) * 4 + (Math.floor(d2.getMonth() / 3) - Math.floor(d1.getMonth() / 3));
              else if (interval === 'YEAR') diff = d2.getFullYear() - d1.getFullYear();
          }
          return String(diff);
      }
  );

  try {
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${jsFormula}`)();
      return isNaN(result) ? 0 : parseFloat(result.toFixed(2));
  } catch (e) {
      return 0;
  }
}

export const aggregateData = (data: ProcessedRow[], config: ChartConfig, customMeasures?: any[]): any[] => {
  const customMeasure1 = customMeasures?.find(m => m.name === config.dataKey);
  const customMeasure2 = config.dataKey2 ? customMeasures?.find(m => m.name === config.dataKey2) : null;
  const daxFormula1 = customMeasure1 ? customMeasure1.dax_formula : null;
  const daxFormula2 = customMeasure2 ? customMeasure2.dax_formula : null;
  // --- DATE FILTERS: Narrow the dataset by year/month/day before any aggregation ---
  let workingData = data;
  if (Array.isArray(config.dateFilters) && config.dateFilters.length > 0) {
    workingData = data.filter(row => {
      return config.dateFilters!.every(filter => {
        const rawVal = row[filter.column];
        if (rawVal === null || rawVal === undefined) return false;
        if (filter.year !== undefined && getYear(rawVal) !== filter.year) return false;
        if (filter.month !== undefined && getMonth(rawVal) !== filter.month) return false;
        if (filter.day !== undefined && getDay(rawVal) !== filter.day) return false;
        return true;
      });
    });
  }

  // --- CATEGORICAL FILTERS (chartFilters): Filter the dataset by specific categorical values ---
  // We apply them to workingData (date-filtered) for normal aggregation...
  if (config.chartFilters && Object.keys(config.chartFilters).length > 0) {
    workingData = workingData.filter(row => {
      return Object.entries(config.chartFilters!).every(([col, val]) => {
        const rawVal = row[col];
        if (rawVal === null || rawVal === undefined) return false;
        
        // Support array of values (OR logic) or single value
        if (Array.isArray(val)) {
          return val.some(v => String(rawVal).toLowerCase() === String(v).toLowerCase());
        }
        return String(rawVal).toLowerCase() === String(val).toLowerCase();
      });
    });
  }

  // --- ALL DATA FOR CONTEXT: categorical filters applied, but NO date filter ---
  // This is used by DATEADD and SAMEPERIODLASTYEAR so they can cross date boundaries
  // and look up rows from prior periods that were excluded by the date filter.
  let allDataForContext = data;
  if (config.chartFilters && Object.keys(config.chartFilters).length > 0) {
    allDataForContext = data.filter(row => {
      return Object.entries(config.chartFilters!).every(([col, val]) => {
        const rawVal = row[col];
        if (rawVal === null || rawVal === undefined) return false;
        if (Array.isArray(val)) {
          return val.some(v => String(rawVal).toLowerCase() === String(v).toLowerCase());
        }
        return String(rawVal).toLowerCase() === String(val).toLowerCase();
      });
    });
  }


  if (config.type === 'KPI') {
    if (daxFormula1) {
        return [{ value: evaluateDaxMeasure(daxFormula1, workingData, customMeasures, allDataForContext), label: config.title }];
    }

    // For KPI, we just return a single value
    if (config.aggregation === AggregationType.COUNT) {
      return [{ value: workingData.length, label: config.title }];
    }

    if (config.aggregation === AggregationType.DISTINCT) {
      const uniqueValues = new Set(
        workingData
          .map(row => row[config.dataKey])
          .filter(value => value !== null && value !== undefined && value !== '')
          .map(value => String(value))
      );
      return [{ value: uniqueValues.size, label: config.title }];
    }

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;

    workingData.forEach(row => {
      const val = Number(row[config.dataKey]) || 0;
      sum += val;
      if (val < min) min = val;
      if (val > max) max = val;
    });

    let value = sum;
    if (config.aggregation === AggregationType.AVERAGE) value = workingData.length > 0 ? sum / workingData.length : 0;
    else if (config.aggregation === AggregationType.MINIMUM) value = min === Infinity ? 0 : min;
    else if (config.aggregation === AggregationType.MAXIMUM) value = max === -Infinity ? 0 : max;

    return [{ value: parseFloat(value.toFixed(2)), label: config.title }];
  }

  // --- SCATTER: Return raw numeric pairs ---
  if (config.type === 'SCATTER') {
    return workingData
      .filter(row => {
        const x = Number(row[config.xAxisKey]);
        const y = Number(row[config.dataKey]);
        return !isNaN(x) && !isNaN(y);
      })
      .slice(0, 500)
      .map(row => ({
        [config.xAxisKey]: Number(row[config.xAxisKey]),
        [config.dataKey]: Number(row[config.dataKey]),
      }));
  }

  // --- HEATMAP & MATRIX: Cross-tabulate two categorical columns ---
  if ((config.type === 'HEATMAP' || config.type === 'MATRIX') && config.yAxisKey) {
    const matrix: { [key: string]: { [key: string]: { sum: number; count: number; min: number; max: number; distinct: Set<string> } } } = {};
    const xValues = new Set<string>();
    const yValues = new Set<string>();

    workingData.forEach(row => {
      const xVal = String(row[config.xAxisKey] ?? 'Unknown');
      const yVal = String(row[config.yAxisKey!] ?? 'Unknown');
      const numVal = Number(row[config.dataKey]) || 0;

      xValues.add(xVal);
      yValues.add(yVal);

      if (!matrix[yVal]) matrix[yVal] = {};
      if (!matrix[yVal][xVal]) matrix[yVal][xVal] = { sum: 0, count: 0, min: Infinity, max: -Infinity, distinct: new Set<string>() };
      matrix[yVal][xVal].sum += numVal;
      matrix[yVal][xVal].count += 1;
      matrix[yVal][xVal].distinct.add(String(row[config.dataKey] ?? ''));
      if (numVal < matrix[yVal][xVal].min) matrix[yVal][xVal].min = numVal;
      if (numVal > matrix[yVal][xVal].max) matrix[yVal][xVal].max = numVal;
    });

    const xArr = Array.from(xValues).sort().slice(0, 20);
    const yArr = Array.from(yValues).sort().slice(0, 20);

    const result: any[] = [];
    yArr.forEach(yVal => {
      xArr.forEach(xVal => {
        const cell = matrix[yVal]?.[xVal] || { sum: 0, count: 0, min: Infinity, max: -Infinity, distinct: new Set<string>() };
        let value = 0;
        if (config.aggregation === AggregationType.COUNT) value = cell.count;
        else if (config.aggregation === AggregationType.DISTINCT) value = cell.distinct.size;
        else if (config.aggregation === AggregationType.AVERAGE) value = cell.count > 0 ? cell.sum / cell.count : 0;
        else if (config.aggregation === AggregationType.MINIMUM) value = cell.count > 0 ? cell.min : 0;
        else if (config.aggregation === AggregationType.MAXIMUM) value = cell.count > 0 ? cell.max : 0;
        else value = cell.sum;

        result.push({
          x: xVal,
          y: yVal,
          value: parseFloat(value.toFixed(2)),
        });
      });
    });

    return result;
  }

  // --- TABLE: Always return raw data up to 2000 rows ---
  if (config.type === 'TABLE') {
    return workingData.slice(0, 2000);
  }

  if (config.aggregation === AggregationType.NONE) {
    // For Trend charts, we want more data points to show the full story.
    if (config.type === 'LINE' || config.type === 'AREA') {
      return workingData.slice(0, 2000);
    }
    // For Bar/Pie, too many slices look bad, so we keep a tighter limit
    return workingData.slice(0, 50);
  }

  // Group By logic
  const groups: { [key: string]: { count: number; sum: number; sum2: number; count2: number; min: number; max: number; min2: number; max2: number; distinct: Set<string>; distinct2: Set<string>; rows: ProcessedRow[] } } = {};

  workingData.forEach(row => {
    const valRaw = row[config.xAxisKey];
    const key = (valRaw !== undefined && valRaw !== null) ? String(valRaw) : 'Unknown';
    const val = Number(row[config.dataKey]) || 0;
    const val2 = config.dataKey2 ? (Number(row[config.dataKey2]) || 0) : 0;

    if (!groups[key]) {
      groups[key] = { count: 0, sum: 0, sum2: 0, count2: 0, min: val, max: val, min2: val2, max2: val2, distinct: new Set<string>(), distinct2: new Set<string>(), rows: [] };
    }
    groups[key].rows.push(row);
    groups[key].count += 1;
    groups[key].sum += val;
    groups[key].sum2 += val2;
    groups[key].count2 += 1;
    groups[key].distinct.add(String(row[config.dataKey] ?? ''));
    if (config.dataKey2) {
      groups[key].distinct2.add(String(row[config.dataKey2] ?? ''));
    }
    if (val < groups[key].min) groups[key].min = val;
    if (val > groups[key].max) groups[key].max = val;
    if (val2 < groups[key].min2) groups[key].min2 = val2;
    if (val2 > groups[key].max2) groups[key].max2 = val2;
  });

  let aggregated = Object.keys(groups).map(key => {
    let value = 0;
    let value2 = 0;

    if (daxFormula1) {
      value = evaluateDaxMeasure(daxFormula1, groups[key].rows, customMeasures, allDataForContext);
    } else {
      if (config.aggregation === AggregationType.COUNT) {
      value = groups[key].count;
      value2 = groups[key].count;
    } else if (config.aggregation === AggregationType.DISTINCT) {
      value = groups[key].distinct.size;
      value2 = groups[key].distinct2.size;
    } else if (config.aggregation === AggregationType.SUM) {
      value = groups[key].sum;
      value2 = groups[key].sum2;
    } else if (config.aggregation === AggregationType.AVERAGE) {
      value = groups[key].sum / groups[key].count;
      value2 = groups[key].count2 > 0 ? groups[key].sum2 / groups[key].count2 : 0;
    } else if (config.aggregation === AggregationType.MINIMUM) {
      value = groups[key].min;
      value2 = groups[key].min2;
    } else if (config.aggregation === AggregationType.MAXIMUM) {
      value = groups[key].max;
      value2 = groups[key].max2;
    }
    }

    if (config.dataKey2) {
      if (daxFormula2) {
        value2 = evaluateDaxMeasure(daxFormula2, groups[key].rows, customMeasures, allDataForContext);
      }
    }

    const row: any = {
      [config.xAxisKey]: key,
      [config.dataKey]: parseFloat(value.toFixed(2)),
    };

    // Include second metric if present
    if (config.dataKey2) {
      row[config.dataKey2] = parseFloat(value2.toFixed(2));
    }

    return row;
  });

  // --- SORT & LIMIT: Apply sortOrder and topN if specified, or auto-detect from title ---
  let effectiveSortOrder = config.sortOrder;
  let effectiveTopN = config.topN;

  // Auto-detect from chart title for existing charts that lack explicit sortOrder/topN
  if (!effectiveSortOrder || !effectiveTopN) {
    const titleLower = (config.title || '').toLowerCase();
    const topMatch = titleLower.match(/\btop\s+(\d+)\b/);
    const bottomMatch = titleLower.match(/\bbottom\s+(\d+)\b/);
    if (topMatch) {
      if (!effectiveSortOrder) effectiveSortOrder = 'DESC';
      if (!effectiveTopN) effectiveTopN = parseInt(topMatch[1], 10);
    } else if (bottomMatch) {
      if (!effectiveSortOrder) effectiveSortOrder = 'ASC';
      if (!effectiveTopN) effectiveTopN = parseInt(bottomMatch[1], 10);
    }
  }

  if (effectiveSortOrder) {
    const direction = effectiveSortOrder === 'ASC' ? 1 : -1;
    aggregated = aggregated.sort((a, b) => direction * ((a[config.dataKey] as number) - (b[config.dataKey] as number)));
  }
  if (effectiveTopN && effectiveTopN > 0) {
    aggregated = aggregated.slice(0, effectiveTopN);
  }

  // --- WATERFALL: Transform aggregated data into waterfall format ---
  if (config.type === 'WATERFALL') {
    let cumulative = 0;
    return aggregated.map((item, idx) => {
      const val = item[config.dataKey];
      const base = cumulative;
      cumulative += val;
      return {
        [config.xAxisKey]: item[config.xAxisKey],
        [config.dataKey]: val,
        _base: base,
        _total: cumulative,
        _isPositive: val >= 0,
        _index: idx,
      };
    });
  }

  return aggregated;
};