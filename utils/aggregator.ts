import { ProcessedRow, ChartConfig, AggregationType } from '../types';

export const aggregateData = (data: ProcessedRow[], config: ChartConfig): any[] => {
  if (config.type === 'KPI') {
    // For KPI, we just return a single value
    if (config.aggregation === AggregationType.COUNT) {
      return [{ value: data.length, label: config.title }];
    }

    const total = data.reduce((acc, row) => {
      const val = Number(row[config.dataKey]) || 0;
      return acc + val;
    }, 0);

    const value = config.aggregation === AggregationType.AVERAGE ? total / data.length : total;
    return [{ value: parseFloat(value.toFixed(2)), label: config.title }];
  }

  // --- SCATTER: Return raw numeric pairs ---
  if (config.type === 'SCATTER') {
    return data
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

  // --- HEATMAP: Cross-tabulate two categorical columns ---
  if (config.type === 'HEATMAP' && config.yAxisKey) {
    const matrix: { [key: string]: { [key: string]: { sum: number; count: number } } } = {};
    const xValues = new Set<string>();
    const yValues = new Set<string>();

    data.forEach(row => {
      const xVal = String(row[config.xAxisKey] ?? 'Unknown');
      const yVal = String(row[config.yAxisKey!] ?? 'Unknown');
      const numVal = Number(row[config.dataKey]) || 0;

      xValues.add(xVal);
      yValues.add(yVal);

      if (!matrix[yVal]) matrix[yVal] = {};
      if (!matrix[yVal][xVal]) matrix[yVal][xVal] = { sum: 0, count: 0 };
      matrix[yVal][xVal].sum += numVal;
      matrix[yVal][xVal].count += 1;
    });

    const xArr = Array.from(xValues).sort().slice(0, 20);
    const yArr = Array.from(yValues).sort().slice(0, 20);

    const result: any[] = [];
    yArr.forEach(yVal => {
      xArr.forEach(xVal => {
        const cell = matrix[yVal]?.[xVal] || { sum: 0, count: 0 };
        let value = 0;
        if (config.aggregation === AggregationType.COUNT) value = cell.count;
        else if (config.aggregation === AggregationType.AVERAGE) value = cell.count > 0 ? cell.sum / cell.count : 0;
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
    // For Trend charts (Line/Area), we want more data points to show the full story.
    if (config.type === 'LINE' || config.type === 'AREA') {
      return data.slice(0, 2000);
    }
    // For Bar/Pie, too many slices look bad, so we keep a tighter limit
    return data.slice(0, 50);
  }

  // Group By logic
  const groups: { [key: string]: { count: number; sum: number; sum2: number; count2: number } } = {};

  data.forEach(row => {
    const valRaw = row[config.xAxisKey];
    const key = (valRaw !== undefined && valRaw !== null) ? String(valRaw) : 'Unknown';
    const val = Number(row[config.dataKey]) || 0;
    const val2 = config.dataKey2 ? (Number(row[config.dataKey2]) || 0) : 0;

    if (!groups[key]) {
      groups[key] = { count: 0, sum: 0, sum2: 0, count2: 0 };
    }
    groups[key].count += 1;
    groups[key].sum += val;
    groups[key].sum2 += val2;
    groups[key].count2 += 1;
  });

  const aggregated = Object.keys(groups).map(key => {
    let value = 0;
    let value2 = 0;
    if (config.aggregation === AggregationType.COUNT) {
      value = groups[key].count;
      value2 = groups[key].count;
    } else if (config.aggregation === AggregationType.SUM) {
      value = groups[key].sum;
      value2 = groups[key].sum2;
    } else if (config.aggregation === AggregationType.AVERAGE) {
      value = groups[key].sum / groups[key].count;
      value2 = groups[key].count2 > 0 ? groups[key].sum2 / groups[key].count2 : 0;
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