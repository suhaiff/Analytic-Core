export interface RawData {
  headers: string[];
  rows: string[][];
}

export interface ProcessedRow {
  [key: string]: string | number;
}

export interface DataTable {
  id: string;
  name: string;
  rawData: RawData;
}

export enum JoinType {
  INNER = 'INNER',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  FULL = 'FULL'
}

export interface JoinConfig {
  id: string;
  leftTableId: string;
  rightTableId: string;
  leftKey: string;
  rightKey: string;
  type: JoinType;
}

export interface DataModel {
  name: string;
  data: ProcessedRow[];
  columns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  fileId?: number;
  sourceType?: 'file' | 'google_sheet' | 'sharepoint' | 'sql_dump' | 'sql_database';
  headerIndex?: number;
}

export enum ChartType {
  BAR = 'BAR',
  LINE = 'LINE',
  AREA = 'AREA',
  PIE = 'PIE',
  KPI = 'KPI',
  HORIZONTAL_BAR = 'HORIZONTAL_BAR',
  GROUPED_BAR = 'GROUPED_BAR',
  STACKED_BAR = 'STACKED_BAR',
  COMBO = 'COMBO',
  SCATTER = 'SCATTER',
  WATERFALL = 'WATERFALL',
  HEATMAP = 'HEATMAP',
  TABLE = 'TABLE',
  MATRIX = 'MATRIX'
}

export enum AggregationType {
  SUM = 'SUM',
  COUNT = 'COUNT',
  AVERAGE = 'AVERAGE',
  NONE = 'NONE'
}

export interface ChartConfig {
  id: string;
  title: string;
  description: string;
  type: ChartType;
  xAxisKey: string; // Dimension
  dataKey: string; // Metric (primary)
  dataKey2?: string; // Metric (secondary) — for grouped/stacked/combo charts
  yAxisKey?: string; // Second dimension — for heatmap
  aggregation: AggregationType;
  color?: string;
  multicolor?: boolean;
}

export interface SavedDashboard {
  id: string;
  name: string;
  date: string;
  dataModel: DataModel;
  chartConfigs: ChartConfig[];
  filterColumns?: string[];
}

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}