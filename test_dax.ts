import { evaluateDaxMeasure } from './utils/aggregator';
import { ProcessedRow } from './types';

const data: ProcessedRow[] = [
  { 'Sales Amount': 100, 'Order Date': '2026-07-01' },
  { 'Sales Amount': 200, 'Order Date': '2026-07-15' },
  { 'Sales Amount': 300, 'Order Date': '2025-07-01' },
  { 'Sales Amount': 400, 'Order Date': '2025-07-15' },
  { 'Sales Amount': 500, 'Order Date': '2025-08-01' }, // Outside shifted range
];

const workingData = data.filter(d => (d['Order Date'] as string).startsWith('2026'));

const result = evaluateDaxMeasure(
  "DATEADD(SUM([Sales Amount]), [Order Date], -1, YEAR)",
  workingData,
  [],
  data
);

console.log('Result:', result);
