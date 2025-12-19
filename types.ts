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
  sourceType?: 'file' | 'google_sheet';
  headerIndex?: number;
}

export enum ChartType {
  BAR = 'BAR',
  LINE = 'LINE',
  AREA = 'AREA',
  PIE = 'PIE',
  KPI = 'KPI'
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
  dataKey: string; // Metric
  aggregation: AggregationType;
  color?: string;
}

export interface SavedDashboard {
  id: string;
  name: string;
  date: string;
  dataModel: DataModel;
  chartConfigs: ChartConfig[];
}

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}