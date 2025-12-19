import React, { useMemo, useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Brush, LabelList
} from 'recharts';
import { DataModel, ChartConfig, ChartType } from '../types';
import { aggregateData } from '../utils/aggregator';
import { LayoutDashboard, Download, Share2, TrendingUp, Loader2, Maximize2, X, Home, Save, Edit, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ChartBuilder } from './ChartBuilder';
import { useTheme } from '../ThemeContext';
import { getThemeClasses, type Theme } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import { formatCurrency, isCurrencyColumn, isDateTimeColumn, isExcelSerialDate, excelSerialToDate } from '../utils/formatters';

interface DashboardProps {
    dataModel: DataModel;
    chartConfigs: ChartConfig[];
    onHome: () => void;
    onSave: (name: string, charts: ChartConfig[]) => void;
    onRefresh?: () => Promise<void>;
}

// Vibrant dark mode palette
const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

const RenderChart = ({ config, data, isExpanded = false, theme }: { config: ChartConfig, data: any[], isExpanded?: boolean, theme: Theme }) => {
    const colors = getThemeClasses(theme);
    if (!data || data.length === 0) return <div className={`flex items-center justify-center h-full ${colors.textMuted} text-sm`}>No Data Available</div>;

    // Detect if this is a currency field
    const isCurrency = isCurrencyColumn(config.dataKey);
    // Detect if x-axis is a date field
    const isDateAxis = isDateTimeColumn(config.xAxisKey);

    const commonProps = {
        data: data,
        margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    const themeColors = getThemeClasses(theme);

    // Custom formatter for labels
    const labelFormatter = (value: any) => {
        if (isCurrency) {
            return formatCurrency(value);
        }
        return value;
    };

    // Custom formatter for Y-axis
    const yAxisFormatter = (value: any) => {
        if (isCurrency) {
            // Shorten large numbers for Y-axis
            const num = parseFloat(value);
            if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
            if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
            if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
            return `₹${num}`;
        }
        return value;
    };

    // Custom formatter for X-axis
    const xAxisFormatter = (value: any) => {
        if (isDateAxis) {
            const num = typeof value === 'number' ? value : parseFloat(value);
            if (!isNaN(num) && isExcelSerialDate(num)) {
                return excelSerialToDate(num);
            }
        }

        const str = String(value);
        if (str.length > 12) return str.substring(0, 10) + '..';
        return str;
    };

    // Custom Tooltip Content
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            let displayLabel = label;
            if (isDateAxis) {
                const num = typeof label === 'number' ? label : parseFloat(label);
                if (!isNaN(num) && isExcelSerialDate(num)) {
                    displayLabel = excelSerialToDate(num);
                }
            }

            return (
                <div style={{
                    backgroundColor: themeColors.chartTooltipBg,
                    border: `1px solid ${themeColors.chartTooltipBorder}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: theme === 'dark' ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                    <p style={{ color: themeColors.chartTooltipText, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {displayLabel}
                    </p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color, fontSize: '11px', margin: '2px 0' }}>
                            {entry.name}: <strong>{isCurrency ? formatCurrency(entry.value) : entry.value}</strong>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const AxisProps = {
        axisLine: false,
        tickLine: false,
        tick: { fontSize: 11, fill: themeColors.chartAxisText },
        dy: 10,
        minTickGap: 30,
        tickFormatter: (val: any) => {
            const str = String(val);
            if (str.length > 12) return str.substring(0, 10) + '..';
            return str;
        }
    };

    const showBrush = data.length > 15;

    switch (config.type) {
        case ChartType.BAR:
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.chartGrid} />
                        <XAxis dataKey={config.xAxisKey} {...AxisProps} tickFormatter={xAxisFormatter} />
                        <YAxis {...AxisProps} tickFormatter={yAxisFormatter} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} iconType="square" wrapperStyle={{ fontSize: '12px', color: themeColors.chartLegendText, paddingBottom: '10px' }} />
                        <Bar dataKey={config.dataKey} fill={COLORS[0]} radius={[4, 4, 0, 0]}>
                            <LabelList dataKey={config.dataKey} position="top" fill={themeColors.chartLabelText} fontSize={11} formatter={labelFormatter} />
                        </Bar>
                        {showBrush && (
                            <Brush
                                dataKey={config.xAxisKey}
                                height={30}
                                stroke="#6366f1"
                                fill="#1e293b"
                                tickFormatter={() => ''}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            );
        case ChartType.LINE:
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.chartGrid} />
                        <XAxis dataKey={config.xAxisKey} {...AxisProps} tickFormatter={xAxisFormatter} />
                        <YAxis {...AxisProps} tickFormatter={yAxisFormatter} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} iconType="line" wrapperStyle={{ fontSize: '12px', color: themeColors.chartLegendText, paddingBottom: '10px' }} />
                        <Line
                            type="monotone"
                            dataKey={config.dataKey}
                            stroke={COLORS[1]}
                            strokeWidth={3}
                            dot={data.length > 50 ? false : { fill: theme === 'dark' ? '#0f172a' : '#ffffff', stroke: COLORS[1], strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: COLORS[1] }}
                        >
                            {data.length <= 20 && <LabelList dataKey={config.dataKey} position="top" fill={themeColors.chartLabelText} fontSize={11} formatter={labelFormatter} />}
                        </Line>
                        {showBrush && (
                            <Brush
                                dataKey={config.xAxisKey}
                                height={30}
                                stroke="#6366f1"
                                fill="#1e293b"
                                tickFormatter={() => ''}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            );
        case ChartType.AREA:
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.chartGrid} />
                        <XAxis dataKey={config.xAxisKey} {...AxisProps} tickFormatter={xAxisFormatter} />
                        <YAxis {...AxisProps} tickFormatter={yAxisFormatter} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: '12px', color: themeColors.chartLegendText, paddingBottom: '10px' }} />
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS[4]} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={COLORS[4]} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey={config.dataKey} stroke={COLORS[4]} fill="url(#colorGradient)" strokeWidth={2}>
                            {data.length <= 20 && <LabelList dataKey={config.dataKey} position="top" fill={themeColors.chartLabelText} fontSize={11} formatter={labelFormatter} />}
                        </Area>
                        {showBrush && (
                            <Brush
                                dataKey={config.xAxisKey}
                                height={30}
                                stroke="#6366f1"
                                fill="#1e293b"
                                tickFormatter={() => ''}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            );
        case ChartType.PIE:
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={isExpanded ? 120 : 60}
                            outerRadius={isExpanded ? 160 : 80}
                            paddingAngle={5}
                            dataKey={config.dataKey}
                            nameKey={config.xAxisKey}
                            stroke="none"
                            label={({ name, value, percent }) => {
                                const formattedValue = isCurrency ? formatCurrency(value) : value;
                                let displayName = name;
                                if (isDateAxis) {
                                    const num = typeof name === 'number' ? name : parseFloat(name);
                                    if (!isNaN(num) && isExcelSerialDate(num)) {
                                        displayName = excelSerialToDate(num);
                                    }
                                }
                                return `${displayName}: ${formattedValue} (${(percent * 100).toFixed(0)}%)`;
                            }}
                            labelLine={{ stroke: themeColors.chartLabelText, strokeWidth: 1 }}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: themeColors.chartLegendText }} />
                    </PieChart>
                </ResponsiveContainer>
            );
        default:
            return null;
    }
};

export const Dashboard: React.FC<DashboardProps> = ({ dataModel, chartConfigs, onHome, onSave, onRefresh }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    // Local state for charts allows editing/adding charts in-place
    const [currentCharts, setCurrentCharts] = useState<ChartConfig[]>(chartConfigs);
    const [isEditing, setIsEditing] = useState(false);

    // UI State
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [dashboardName, setDashboardName] = useState(dataModel.name);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (!onRefresh) return;
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Update local state if props change (e.g. loading a new dashboard)
    useEffect(() => {
        setCurrentCharts(chartConfigs);
        setDashboardName(dataModel.name);
    }, [chartConfigs, dataModel.name]);

    const kpis = useMemo(() => currentCharts.filter(c => c.type === ChartType.KPI), [currentCharts]);
    const charts = useMemo(() => currentCharts.filter(c => c.type !== ChartType.KPI), [currentCharts]);

    const [isExporting, setIsExporting] = useState(false);
    const [expandedChartId, setExpandedChartId] = useState<string | null>(null);

    const expandedChartConfig = useMemo(() =>
        currentCharts.find(c => c.id === expandedChartId),
        [expandedChartId, currentCharts]);

    const handleExportPDF = async () => {
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const element = document.getElementById('dashboard-container');
            if (!element) throw new Error("Dashboard container not found");

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
                useCORS: true,
                logging: false,
                ignoreElements: (node) => node.classList.contains('no-export') || node.classList.contains('chart-controls')
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${dataModel.name.replace(/\s+/g, '_')}_Dashboard.pdf`);

        } catch (error) {
            console.error("Export PDF Error:", error);
            alert("Failed to generate PDF. Please try using the browser Print function.");
        } finally {
            setIsExporting(false);
        }
    };

    const openSaveModal = () => {
        setDashboardName(dataModel.name);
        setIsSaveModalOpen(true);
    };

    const handleSaveConfirm = () => {
        if (!dashboardName.trim()) {
            alert("Please enter a valid name");
            return;
        }
        onSave(dashboardName, currentCharts);
        setIsSaveModalOpen(false);
    };

    const handleUpdateFromBuilder = (updatedCharts: ChartConfig[]) => {
        setCurrentCharts(updatedCharts);
        setIsEditing(false);
    };

    return (
        <>
            {/* Save Dashboard Modal */}
            {isSaveModalOpen && (
                <div className={`fixed inset-0 z-[60] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
                    <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-8 max-w-md w-full shadow-2xl`}>
                        <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>Save Dashboard</h3>
                        <div className="mb-6">
                            <label className={`block text-xs font-bold ${colors.textMuted} uppercase mb-2`}>Dashboard Name</label>
                            <input
                                type="text"
                                value={dashboardName}
                                onChange={(e) => setDashboardName(e.target.value)}
                                className={`w-full ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none`}
                                placeholder="Enter name..."
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsSaveModalOpen(false)}
                                className={`px-4 py-2 rounded-lg ${colors.textTertiary} hover:${colors.textPrimary} ${colors.bgTertiary} transition`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveConfirm}
                                className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Mode Modal - Overlays the entire screen with ChartBuilder */}
            {isEditing && (
                <div className="fixed inset-0 z-50 bg-slate-950 animate-fade-in">
                    <ChartBuilder
                        dataModel={dataModel}
                        onGenerateReport={handleUpdateFromBuilder}
                        onHome={() => setIsEditing(false)}
                        initialBucket={currentCharts}
                        mode="update"
                    />
                </div>
            )}

            {/* Expanded Chart Modal */}
            {expandedChartConfig && (
                <div className={`fixed inset-0 z-50 ${colors.overlayBg} backdrop-blur-md flex items-center justify-center p-4 lg:p-8 animate-fade-in no-print`}>
                    <div className={`${colors.bgSecondary} w-full h-full max-w-7xl max-h-[90vh] rounded-2xl border ${colors.borderPrimary} shadow-2xl flex flex-col relative`}>
                        <div className={`p-6 border-b ${colors.borderPrimary} flex justify-between items-start`}>
                            <div>
                                <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>{expandedChartConfig.title}</h2>
                                <p className={`${colors.textMuted} mt-1`}>{expandedChartConfig.description}</p>
                            </div>
                            <button
                                onClick={() => setExpandedChartId(null)}
                                className={`p-2 ${colors.bgTertiary} hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors ${colors.textMuted}`}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 p-6 min-h-0">
                            <RenderChart
                                config={expandedChartConfig}
                                data={aggregateData(dataModel.data, expandedChartConfig)}
                                isExpanded={true}
                                theme={theme}
                            />
                        </div>
                        <div className={`p-4 ${colors.bgSecondary} border-t ${colors.borderPrimary} text-center`}>
                            <p className={`text-xs ${colors.textMuted}`}>Use the slider below the chart to zoom into specific time periods or categories.</p>
                        </div>
                    </div>
                </div>
            )}

            <div id="dashboard-container" className={`min-h-screen ${colors.bgPrimary} flex flex-col ${colors.textSecondary} print:${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
                {/* Header */}
                <header className={`${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'} backdrop-blur border-b ${colors.borderPrimary} px-4 sm:px-6 lg:px-8 py-3 sm:py-4 sticky top-0 z-30 shadow-lg print:hidden`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center max-w-7xl mx-auto w-full gap-3 md:gap-0">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button onClick={onHome} className={`p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 rounded-full hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition no-export shrink-0`} title="Return Home">
                                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <div className="min-w-0 flex-1">
                                <h1 className={`text-base sm:text-xl font-bold ${colors.textPrimary} flex items-center gap-2 flex-wrap`}>
                                    <span className="truncate">{dataModel.name}</span>
                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wider shrink-0">Live</span>
                                    {dataModel.sourceType === 'google_sheet' && (
                                        <button
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            className={`p-1.5 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:text-indigo-400 transition flex items-center gap-1.5`}
                                            title="Refresh Data"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                                            <span className="text-[10px] font-bold uppercase hidden sm:inline">Refresh</span>
                                        </button>
                                    )}
                                </h1>
                                <p className={`text-[10px] sm:text-xs ${colors.textMuted} truncate`}>InsightAI Generated Report</p>
                            </div>
                            {/* Mobile Theme Toggle (moved here for better access) */}
                            <div className="md:hidden">
                                <ThemeToggle />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 no-export w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className={`flex items-center gap-2 ${colors.textTertiary} hover:${colors.textPrimary} px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:${colors.bgTertiary} transition font-medium text-xs sm:text-sm border border-transparent hover:${colors.borderSecondary} whitespace-nowrap`}
                                    title="Edit Charts"
                                >
                                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Edit / Add Charts</span>
                                </button>
                                <button
                                    onClick={openSaveModal}
                                    className={`flex items-center gap-2 ${colors.textTertiary} hover:${colors.textPrimary} px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:${colors.bgTertiary} transition font-medium text-xs sm:text-sm border border-transparent hover:${colors.borderSecondary}`}
                                    title="Save Dashboard"
                                >
                                    <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Save</span>
                                </button>
                                <button className={`flex items-center gap-2 ${colors.textTertiary} hover:${colors.textPrimary} px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:${colors.bgTertiary} transition font-medium text-xs sm:text-sm border border-transparent hover:${colors.borderSecondary}`}>
                                    <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Share</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="hidden md:block">
                                    <ThemeToggle />
                                </div>
                                <button
                                    onClick={handleExportPDF}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-wait text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition font-medium text-xs sm:text-sm shadow-lg shadow-indigo-900/20 whitespace-nowrap"
                                >
                                    {isExporting ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                    {isExporting ? '...' : <span className="hidden xs:inline">Export PDF</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Print Header */}
                <div className={`hidden print:block px-8 py-6 border-b ${colors.borderPrimary} mb-6`}>
                    <h1 className={`text-3xl font-bold ${colors.textPrimary}`}>{dataModel.name} Dashboard</h1>
                    <p className={`${colors.textMuted}`}>Generated via InsightAI</p>
                </div>

                <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full print:p-4">

                    {/* KPIs Row */}
                    {kpis.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:grid-cols-4">
                            {kpis.map((kpi, i) => {
                                const data = aggregateData(dataModel.data, kpi);
                                const value = data[0]?.value || 0;
                                const isCurrency = isCurrencyColumn(kpi.dataKey);
                                const displayValue = isCurrency ? formatCurrency(value) : (typeof value === 'number' ? value.toLocaleString('en-IN') : value);
                                return (
                                    <div key={kpi.id} className={`${colors.bgSecondary} rounded-xl border ${colors.borderPrimary} p-6 shadow-xl relative overflow-hidden group print:shadow-none ${theme === 'dark' ? 'print:border-slate-600' : 'print:border-slate-300'}`}>
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition transform group-hover:scale-110 print:hidden">
                                            <TrendingUp className="w-16 h-16 text-indigo-500" />
                                        </div>
                                        <h3 className={`text-xs font-bold ${colors.textMuted} uppercase tracking-wider mb-1`}>{kpi.title}</h3>
                                        <div className={`text-3xl font-bold ${colors.textPrimary} mt-2`}>
                                            {displayValue}
                                        </div>
                                        <div className={`mt-4 h-1 w-full ${theme === 'dark' ? 'bg-slate-800 print:bg-slate-700' : 'bg-slate-200 print:bg-slate-300'} rounded-full overflow-hidden`}>
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 w-2/3 rounded-full print:bg-indigo-600"></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
                        {charts.map(chart => {
                            const aggregatedData = aggregateData(dataModel.data, chart);
                            return (
                                <div key={chart.id} className={`${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} p-6 shadow-lg h-[420px] flex flex-col hover:${colors.borderHover} transition-colors print:shadow-none ${theme === 'dark' ? 'print:border-slate-600' : 'print:border-slate-300'} print:break-inside-avoid relative group`}>
                                    <div className="mb-6 pr-8">
                                        <h3 className={`font-bold text-lg ${colors.textSecondary} truncate`}>{chart.title}</h3>
                                        <p className={`text-xs ${colors.textMuted} mt-1 truncate`}>{chart.description}</p>
                                    </div>

                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity chart-controls no-print">
                                        <button
                                            onClick={() => setExpandedChartId(chart.id)}
                                            className={`p-2 ${colors.bgTertiary} hover:bg-indigo-600 ${colors.textMuted} hover:text-white rounded-lg transition-all shadow-lg`}
                                            title="Maximize Chart"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex-1 w-full min-h-0 min-w-0 overflow-hidden">
                                        <RenderChart config={chart} data={aggregatedData} theme={theme} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {charts.length === 0 && kpis.length === 0 && (
                        <div className={`text-center py-20 border-2 border-dashed ${colors.borderPrimary} rounded-3xl ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-100/50'}`}>
                            <LayoutDashboard className={`w-12 h-12 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'} mx-auto mb-4`} />
                            <h3 className={`text-xl font-bold ${colors.textPrimary}`}>Empty Dashboard</h3>
                            <p className={`${colors.textMuted} mt-2`}>Go back and select some charts to populate this view.</p>
                            <button onClick={() => setIsEditing(true)} className="mt-6 text-indigo-400 hover:underline">
                                Add Charts Now
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};