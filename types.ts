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

export interface AppendConfig {
  id: string;
  topTableId: string;
  bottomTableId: string;
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
  columnCurrencies?: { [columnName: string]: string };
  aggregatedColumns?: AggregatedColumnDefinition[];
  fileId?: number;
  sourceType?: 'file' | 'google_sheet' | 'sharepoint' | 'sql_dump' | 'sql_database';
  headerIndex?: number;
  joinConfigs?: JoinConfig[];
  appendConfigs?: AppendConfig[];
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
  ignoreGlobalFilters?: boolean; // If true, this chart will not be affected by global dashboard filters

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
  fontFamily?: string; // Font type for this chart (default: Arial)
  fontSize?: number; // Font size for this chart

  analytics?: AnalyticsLinesConfig; // Line-chart analytics (trendline, min/max/avg, forecast)
}

// ---- Line-chart analytics (Power BI-style options) ----
export type AnalyticsLineStyleKind = 'solid' | 'dashed' | 'dotted';

export interface AnalyticsLineStyle {
  enabled?: boolean;
  color?: string;          // hex color
  transparency?: number;   // 0-100 (0 = fully opaque)
  lineStyle?: AnalyticsLineStyleKind;
  dataLabels?: boolean;
}

export type ForecastUnits = 'points' | 'days' | 'months' | 'years';

export interface ForecastOptions extends AnalyticsLineStyle {
  length?: number;            // how many units to forecast ahead
  ignoreLast?: number;        // how many trailing points to exclude when fitting
  units?: ForecastUnits;      // axis units used for forecast labels
  confidenceLevel?: number;   // 50 / 75 / 85 / 90 / 95
  bandColor?: string;         // color of the confidence band
  bandTransparency?: number;  // 0-100 (higher = more transparent)
  showConfidenceBand?: boolean;
}

export interface AnalyticsLinesConfig {
  trendline?: AnalyticsLineStyle;
  min?: AnalyticsLineStyle;
  max?: AnalyticsLineStyle;
  average?: AnalyticsLineStyle;
  forecast?: ForecastOptions;
}

export interface DashboardSection {
  id: string;
  name: string;
}

export interface RefreshSchedule {
  id: string;
  dashboard_id: number;
  user_id: number;
  source_type: 'google_sheet' | 'sql_database' | 'sharepoint';
  source_credentials: any;
  refresh_frequency: 'hourly' | 'every_6_hours' | 'daily' | 'weekly' | 'monthly';
  refresh_time_utc: string;
  refresh_day?: number | null;
  timezone?: string;
  refresh_month_day?: number | null;
  is_active: boolean;
  last_refreshed_at?: string | null;
  last_refresh_status?: 'success' | 'failed' | 'running' | null;
  last_refresh_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedDashboard {
  id: string;
  name: string;
  date: string;
  dataModel: DataModel;
  chartConfigs: ChartConfig[];
  sections?: DashboardSection[];
  filterColumns?: string[];
  folder_id?: string | null;
  is_workspace?: boolean;
  user_id?: number;
  owner_name?: string;
  shared_access_level?: DashboardAccessLevel;
  refresh_schedule?: RefreshSchedule | null;
}

export type UserRole = 'ADMIN' | 'USER';

export enum AccessLevel {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  domain?: string;
  organization_id?: string;
  organization_name?: string;
  is_superuser?: boolean;
  must_change_password?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  created_at?: string;
}

export type DashboardAccessLevel = 'VIEW' | 'EDIT' | 'CO_OWNER';

export interface DashboardAccessEntry {
  id: string;
  dashboard_id: string;
  user_id: number;
  user_name?: string;
  user_email?: string;
  access_level: DashboardAccessLevel;
  granted_by?: number;
  created_at?: string;
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  organization_id?: string;
  access_users?: { id: number; name: string; email: string; level: AccessLevel }[];
  access_groups?: { id: string; name: string; level: AccessLevel }[];
  is_owner?: boolean;
  effective_level?: AccessLevel;
}

export interface WorkspaceGroup {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  members: { id: number; name: string; email: string }[];
}