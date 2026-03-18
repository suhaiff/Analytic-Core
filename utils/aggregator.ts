import { ProcessedRow, ChartConfig, AggregationType } from '../types';
import { getYear, getMonth, getDay } from './formatters';

export const aggregateData = (data: ProcessedRow[], config: ChartConfig): any[] => {
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


  if (config.type === 'KPI') {
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

  if (config.aggregation === AggregationType.NONE) {
    // For Trend charts and Tables, we want more data points to show the full story.
    if (config.type === 'LINE' || config.type === 'AREA' || config.type === 'TABLE') {
      return workingData.slice(0, 2000);
    }
    // For Bar/Pie, too many slices look bad, so we keep a tighter limit
    return workingData.slice(0, 50);
  }

  // Group By logic
  const groups: { [key: string]: { count: number; sum: number; sum2: number; count2: number; min: number; max: number; min2: number; max2: number; distinct: Set<string>; distinct2: Set<string> } } = {};

  workingData.forEach(row => {
    const valRaw = row[config.xAxisKey];
    const key = (valRaw !== undefined && valRaw !== null) ? String(valRaw) : 'Unknown';
    const val = Number(row[config.dataKey]) || 0;
    const val2 = config.dataKey2 ? (Number(row[config.dataKey2]) || 0) : 0;

    if (!groups[key]) {
      groups[key] = { count: 0, sum: 0, sum2: 0, count2: 0, min: val, max: val, min2: val2, max2: val2, distinct: new Set<string>(), distinct2: new Set<string>() };
    }
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