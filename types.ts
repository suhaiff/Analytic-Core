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

export enum ColumnType {
  TEXT = 'TEXT',
  INTEGER = 'INTEGER',
  DECIMAL = 'DECIMAL',
  CURRENCY = 'CURRENCY',
  PERCENT = 'PERCENT',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  UNKNOWN = 'UNKNOWN'
}

export interface ColumnMetadata {
  detectedType: ColumnType;
  finalType: ColumnType;
  confidence: number;
  source: 'AI' | 'RULE' | 'USER';
  requiresConfirmation: boolean;
}

export interface AggregatedColumnDefinition {
  id: string;
  sourceColumn: string;
  label: string;
  aggregation: AggregationType;
}

export interface DataModel {
  name: string;
  data: ProcessedRow[];
  columns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  columnMetadata?: { [columnName: string]: ColumnMetadata };
  aggregatedColumns?: AggregatedColumnDefinition[];
  fileId?: number;
  sourceType?: 'file' | 'google_sheet' | 'sharepoint' | 'sql_dump' | 'sql_database';
  headerIndex?: number;
  joinConfigs?: JoinConfig[];
  tableConfigs?: { [tableId: string]: { headerIndex: number; name: string } };
}

export enum AggregationType {
  SUM = 'SUM',
  COUNT = 'COUNT',
  DISTINCT = 'DISTINCT',
  AVERAGE = 'AVERAGE',
  MINIMUM = 'MINIMUM',
  MAXIMUM = 'MAXIMUM',
  NONE = 'NONE'
}

export interface ChartConfig {
  id: string;
  title: string;
  description: string;
  type: ChartType;
  xAxisKey: string; // Dimension
  dataKey: string; // Metric (primary)
  dataKey2?: string; // Metric (secondary) — for dual-metric charts
  yAxisKey?: string; // Second dimension — for heatmap
  aggregation: AggregationType;
  color?: string;
  color2?: string;
  multicolor?: boolean;
  sectionId?: string; // Link to a DashboardSection
  chartFilters?: { [column: string]: any }; // Per-chart filters
  sortOrder?: 'ASC' | 'DESC'; // Sort aggregated data by primary metric
  topN?: number; // Limit the number of results (e.g., 10 for "Top 10")
  dateFilters?: { // Date-range filters applied before aggregation
    column: string; // The date column to filter on (e.g., "Order Date")
    year?: number;  // Filter by year (e.g., 2023)
    month?: number; // Filter by month 1-12 (e.g., 1 for January)
    day?: number;   // Filter by specific day of month
  }[];
  drillThrough?: { // Power BI-style drill-through: click a value to see breakdown
    dateColumn: string; // The date column to use for the next-level breakdown
    nextLevel: 'month' | 'day'; // The time granularity of the breakdown
  };
}

export interface DashboardSection {
  id: string;
  name: string;
}

export interface SavedDashboard {
  id: string;
  name: string;
  date: string;
  dataModel: DataModel;
  chartConfigs: ChartConfig[];
  sections?: DashboardSection[];
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