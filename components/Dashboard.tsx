import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Brush, LabelList,
    ScatterChart, Scatter, ZAxis, ComposedChart
} from 'recharts';
import { DataModel, ChartConfig, ChartType, DashboardSection, AggregationType } from '../types';
import { aggregateData } from '../utils/aggregator';
import {
    LayoutDashboard, Download, Share2, TrendingUp, Loader2, Maximize2,
    X, Home, Save, Edit, RefreshCw, Plus, ArrowRight, Filter, Trash2,
    ChevronDown, Check, MousePointer2, Table as TableIcon, Grid3x3
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ChartBuilder } from './ChartBuilder';
import { useTheme } from '../ThemeContext';
import { getThemeClasses, type Theme } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import { formatCurrency, formatCompactCurrency, isCurrencyColumn, isCountColumn, isDateTimeColumn, isExcelSerialDate, excelSerialToDate, smartFormat, formatDateForTick, getYear, getMonth, getDay, getMonthName } from '../utils/formatters';
import { DashboardLoader } from './DashboardLoader';


interface DashboardProps {
    dataModel: DataModel;
    chartConfigs: ChartConfig[];
    sections?: DashboardSection[];
    filterColumns?: string[];
    onHome: () => void;
    onSave: (name: string, charts: ChartConfig[], sections?: DashboardSection[], filterColumns?: string[]) => void;
    onRefresh?: () => Promise<void>;
}

// Vibrant dark mode palette
const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

const RenderChart = React.memo(({ config, data, isExpanded = false, theme, onItemClick, activeFilterValue, isAnimationActive = true, columnMetadata, isExporting = false }: { config: ChartConfig, data: any[], isExpanded?: boolean, theme: Theme, onItemClick?: (value: any) => void, activeFilterValue?: any, isAnimationActive?: boolean, columnMetadata?: any, isExporting?: boolean }) => {
    const colors = getThemeClasses(theme);
    if (!data || data.length === 0) return <div className={`flex items-center justify-center h-full ${colors.textMuted} text-sm`}>No Data Available</div>;

    const handleChartClick = (d: any) => {
        if (!onItemClick) return;
        // Recharts passes different objects depending on the chart type
        // Usually, the raw data value is in activeLabel, activePayload, or the data object itself
        const value = d?.activeLabel || d?.[config.xAxisKey] || d?.name || (d?.payload && d.payload[config.xAxisKey]) || (d?.activePayload && d.activePayload[0]?.payload?.[config.xAxisKey]);
        if (value !== undefined) {
            onItemClick(value);
        }
    };

    // Helper to check if a column is of a certain type in metadata
    const isColumnType = (colName: string, type: 'CURRENCY' | 'DATE' | 'INTEGER' | 'PERCENT') => {
        if (columnMetadata && columnMetadata[colName]) {
            const meta = columnMetadata[colName];
            const finalType = meta.finalType || meta.detectedType;
            return finalType === type;
        }
        // Fallback to rule-based
        if (type === 'CURRENCY') return isCurrencyColumn(colName);
        if (type === 'DATE') return isDateTimeColumn(colName);
        if (type === 'INTEGER') return isCountColumn(colName);
        return false;
    };

    // Better detection: check BOTH axes independently
    const isXCurrency = isColumnType(config.xAxisKey, 'CURRENCY');
    const isYCurrency = isColumnType(config.dataKey, 'CURRENCY');
    const isY2Currency = config.dataKey2 ? isColumnType(config.dataKey2, 'CURRENCY') : false;

    // Detect if axes are date fields
    const isXDate = isColumnType(config.xAxisKey, 'DATE');
    const isYDate = isColumnType(config.dataKey, 'DATE');

    const commonProps = {
        data: data,
        margin: isExporting
            ? { top: 5, right: 30, left: 25, bottom: 65 } // Minimized top margin for PDF export
            : { top: 30, right: 40, left: 20, bottom: 25 }
    };

    const themeColors = getThemeClasses(theme);

    // Helper to format any value based on column name
    const formatByColumn = (value: any, key: string, compact = false) => {
        return smartFormat(value, key, columnMetadata);
    };

    // Custom formatter for labels (usually for dataKey)
    const labelFormatter = (value: any) => {
        if (isYCurrency) return formatCurrency(value);
        return value;
    };

    // Helper to check if a value is in the active filter (supports arrays)
    const isValueFiltered = (value: any): boolean => {
        if (!activeFilterValue) return false;
        if (Array.isArray(activeFilterValue)) {
            return activeFilterValue.some(v => String(v) === String(value));
        }
        return String(value) === String(activeFilterValue);
    };

    // Custom formatter for Y-axis
    const yAxisFormatter = (value: any) => {
        if (isYCurrency) return formatCompactCurrency(value);
        if (typeof value === 'number') {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        }
        return value;
    };

    // Custom formatter for X-axis
    const xAxisFormatter = (value: any) => {
        if (value === null || value === undefined || value === '') return 'Not Specified';
        if (isXDate) {
            const num = typeof value === 'number' ? value : parseFloat(value);
            if (!isNaN(num) && isExcelSerialDate(num)) return formatDateForTick(num);
        }
        if (isXCurrency) return formatCompactCurrency(value);

        const str = String(value);
        if (isExporting) {
            return str.length > 22 ? str.substring(0, 20) + '..' : str;
        }
        if (str.length > 12) return str.substring(0, 10) + '..';
        return str;
    };

    // Custom Tooltip Content
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            // For Pie charts, the name is in payload[0].name, while label might be missing
            let displayLabel = label || payload[0].name || payload[0].payload?.name || 'Not Specified';
            
            if (displayLabel !== 'Not Specified' && isXDate) {
                const num = typeof displayLabel === 'number' ? displayLabel : parseFloat(displayLabel);
                if (!isNaN(num) && isExcelSerialDate(num)) {
                    displayLabel = excelSerialToDate(num);
                }
            } else if (displayLabel !== 'Not Specified' && isXCurrency && typeof displayLabel === 'number') {
                displayLabel = formatCurrency(displayLabel);
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
                            {entry.name}: <strong>{formatByColumn(entry.value, entry.dataKey || config.dataKey)}</strong>
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
        tick: { fontSize: isExporting ? 9 : 10, fill: themeColors.chartAxisText },
        minTickGap: isExporting ? 2 : 5,
        tickFormatter: (val: any) => {
            if (val === null || val === undefined || val === '') return '';
            const str = String(val);
            if (isExporting) return str.length > 20 ? str.substring(0, 18) + '..' : str;
            if (str.length > 15) return str.substring(0, 12) + '..';
            return str;
        }
    };

    const showBrush = data.length > 15;

    const ChartLegend = ({ payload }: any) => {
        if (!payload || payload.length === 0) return null;

        return (
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '20px',
                    paddingTop: '2px',
                    paddingBottom: '10px',
                    flexWrap: 'wrap',
                    height: isExporting ? 'auto' : '24px',
                    minHeight: isExporting ? '20px' : '24px'
                }}
            >
                {payload.map((entry: any, index: number) => {
                    const legendColor =
                        entry?.color ||
                        entry?.payload?.fill ||
                        config.color ||
                        COLORS[index % COLORS.length];

                    return (
                        <div
                            key={`legend-${index}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                color: themeColors.chartLegendText,
                                lineHeight: '1'
                            }}
                        >
                            {!isExporting && (
                                <div
                                    data-legend-dot
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '2px',
                                        backgroundColor: legendColor,
                                        flexShrink: 0
                                    }}
                                />
                            )}
                            <span>
                                {entry?.value || config.dataKey}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const InteractiveTick = (props: any) => {
        const { x, y, payload, textAnchor, angle, fill, fontSize, tickFormatter, isDate } = props;
        const isClickable = !isExporting && onItemClick && isDate;
        
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={12}
                    textAnchor={textAnchor}
                    fill={fill}
                    fontSize={fontSize || (isExporting ? 8 : 10)}
                    transform={`rotate(${angle || 0})`}
                    onClick={(e) => {
                        if (isClickable && onItemClick) {
                            e.stopPropagation();
                            onItemClick(payload.value);
                        }
                    }}
                    className={isClickable ? 'hover:fill-indigo-400 transition-colors' : ''}
                    style={{ 
                        cursor: isClickable ? 'pointer' : 'default', 
                        userSelect: 'none',
                        fontWeight: isClickable ? 600 : 400
                    }}
                >
                    {tickFormatter ? tickFormatter(payload.value) : payload.value}
                </text>
            </g>
        );
    };
    switch (config.type) {
        case ChartType.BAR: {
            const minWidth = Math.max(100, data.length * (isExpanded ? 45 : 35));
            return (
                <div style={{ width: '100%', height: '100%', overflowX: data.length > 15 ? 'auto' : 'hidden', overflowY: 'hidden' }} className="custom-chart-scrollbar">
                    <div style={{ minWidth: data.length > 15 ? `${minWidth}px` : '100%', width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart {...commonProps}>
                                <defs>
                                    <linearGradient id={`barGradient-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={config.color || COLORS[0]} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={config.color || COLORS[0]} stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.chartGrid} />
                                <XAxis
                                    dataKey={config.xAxisKey}
                                    {...AxisProps}
                                    tick={<InteractiveTick tickFormatter={xAxisFormatter} isDate={isXDate} />}
                                    angle={isXDate ? 0 : -25}
                                    textAnchor={isXDate ? "middle" : "end"}
                                    height={isXDate ? (isExporting ? 40 : 50) : (isExporting ? 75 : 90)}
                                    interval={data.length > 30 ? 'preserveStartEnd' : 0}
                                />
                                <YAxis {...AxisProps} width={70} tickFormatter={yAxisFormatter} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" height={isExporting ? 28 : 36} content={<ChartLegend />} />
                                <Bar
                                    dataKey={config.dataKey}
                                    radius={0}
                                    onClick={(d: any) => {
                                        const value = d?.[config.xAxisKey] || (d?.payload && d.payload[config.xAxisKey]);
                                        if (value !== undefined && onItemClick) onItemClick(value);
                                    }}
                                    cursor="pointer"
                                    isAnimationActive={isAnimationActive}
                                    barSize={data.length > 40 ? undefined : (isExpanded ? 30 : 25)}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={activeFilterValue && isValueFiltered(entry[config.xAxisKey])
                                                ? '#f59e0b'
                                                : (config.multicolor ? COLORS[index % COLORS.length] : `url(#barGradient-${config.id})`)}
                                            fillOpacity={activeFilterValue && !isValueFiltered(entry[config.xAxisKey]) ? 0.4 : 1}
                                            style={{ transition: 'all 0.3s ease' }}
                                        />
                                    ))}
                                    <LabelList
                                        dataKey={config.dataKey}
                                        position="top"
                                        fill={themeColors.chartLabelText}
                                        fontSize={data.length > 20 ? 8 : 10}
                                        fontWeight={600}
                                        formatter={labelFormatter}
                                        offset={10}
                                    />
                                </Bar>
                                {showBrush && !isExpanded && (
                                    <Brush
                                        dataKey={config.xAxisKey}
                                        height={30}
                                        stroke="#6366f1"
                                        fill={theme === 'dark' ? '#1e293b' : '#f8fafc'}
                                        tickFormatter={() => ''}
                                    />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        case ChartType.HORIZONTAL_BAR:
            const horizontalBarHeight = Math.max(isExpanded ? 500 : 320, data.length * (isExpanded ? 40 : 35) + 80);
            return (
                <div style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
                    <div style={{ height: horizontalBarHeight, width: '100%', minHeight: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                {...commonProps}
                                layout="vertical"
                                margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={themeColors.chartGrid} />
                                <XAxis type="number" {...AxisProps} hide={data.length > 20 && !isExpanded} tickFormatter={yAxisFormatter} />
                                <YAxis
                                    type="category"
                                    dataKey={config.xAxisKey}
                                    {...AxisProps}
                                    width={isExporting ? 150 : 120}
                                    interval={0}
                                    tick={<InteractiveTick isDate={isXDate} tickFormatter={(val: any) => {
                                        const str = (val === null || val === undefined || val === '') ? 'Not Specified' : String(val);
                                        if (isExporting) return str.length > 25 ? str.substring(0, 22) + '..' : str;
                                        return str.length > 20 ? str.substring(0, 17) + '..' : str;
                                    }} />}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" height={36} content={<ChartLegend />} />
                                <Bar
                                    dataKey={config.dataKey}
                                    radius={0}
                                    onClick={(d: any) => {
                                        const value = d?.[config.xAxisKey] || (d?.payload && d.payload[config.xAxisKey]);
                                        if (value !== undefined && onItemClick) onItemClick(value);
                                    }}
                                    cursor="pointer"
                                    isAnimationActive={isAnimationActive}
                                    barSize={isExpanded ? 24 : 18}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={activeFilterValue && isValueFiltered(entry[config.xAxisKey])
                                                ? '#f59e0b'
                                                : (config.multicolor ? COLORS[index % COLORS.length] : (config.color || COLORS[0]))}
                                            fillOpacity={activeFilterValue && !isValueFiltered(entry[config.xAxisKey]) ? 0.4 : 1}
                                            style={{ transition: 'all 0.3s ease' }}
                                        />
                                    ))}
                                    <LabelList
                                        dataKey={config.dataKey}
                                        position="right"
                                        fill={themeColors.chartLabelText}
                                        fontSize={data.length > 20 ? 8 : 10}
                                        fontWeight={600}
                                        formatter={labelFormatter}
                                        offset={8}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );

        case ChartType.GROUPED_BAR: {
            const minWidth = Math.max(100, data.length * (isExpanded ? 50 : 40));
            return (
                <div style={{ width: '100%', height: '100%', overflowX: data.length > 12 ? 'auto' : 'hidden', overflowY: 'hidden' }} className="custom-chart-scrollbar">
                    <div style={{ minWidth: data.length > 12 ? `${minWidth}px` : '100%', width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.chartGrid} />
                                <XAxis
                                    dataKey={config.xAxisKey}
                                    {...AxisProps}
                                    tick={<InteractiveTick tickFormatter={xAxisFormatter} isDate={isXDate} />}
                                    angle={isXDate ? 0 : -25}
                                    textAnchor={isXDate ? "middle" : "end"}
                                    height={isXDate ? (isExporting ? 40 : 50) : (isExporting ? 75 : 90)}
                                    interval={data.length > 30 ? 'preserveStartEnd' : 0}
                                />
                                <YAxis {...AxisProps} width={70} tickFormatter={yAxisFormatter} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" height={isExporting ? 28 : 36} content={<ChartLegend />} />
                                <Bar
                                    dataKey={config.dataKey}
                                    fill={config.color || COLORS[0]}
                                    radius={0}
                                    isAnimationActive={isAnimationActive}
                                    cursor="pointer"
                                    barSize={data.length > 25 ? undefined : (isExpanded ? 25 : 20)}
                                    onClick={(d: any) => {
                                        const value = d?.[config.xAxisKey] || (d?.payload && d.payload[config.xAxisKey]);
                                        if (value !== undefined && onItemClick) onItemClick(value);
                                    }}
                                >
                                    <LabelList
                                        dataKey={config.dataKey}
                                        position="top"
                                        fill={themeColors.chartLabelText}
                                        fontSize={8}
                                        fontWeight={600}
                                        formatter={labelFormatter}
                                        offset={8}
                                    />
                                </Bar>
                                {config.dataKey2 && (
                                    <Bar
                                        dataKey={config.dataKey2}
                                        fill={config.color2 || COLORS[1]}
                                        radius={0}
                                        isAnimationActive={isAnimationActive}
                                        cursor="pointer"
                                        barSize={data.length > 25 ? undefined : (isExpanded ? 25 : 20)}
                                    >
                                        <LabelList
                                            dataKey={config.dataKey2}
                                            position="top"
                                            fill={themeColors.chartLabelText}
                                            fontSize={8}
                                            fontWeight={600}
                                            formatter={((val: any) => smartFormat(val, config.dataKey2!, columnMetadata)) as any}
                                            offset={8}
                                        />
                                    </Bar>
                                )}
                                {showBrush && !isExpanded && (
                                    <Brush dataKey={config.xAxisKey} height={30} stroke="#6366f1" fill="#1e293b" tickFormatter={() => ''} />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        case ChartType.STACKED_BAR: {
            const minWidth = Math.max(100, data.length * (isExpanded ? 45 : 35));
            return (
                <div style={{ width: '100%', height: '100%', overflowX: data.length > 15 ? 'auto' : 'hidden', overflowY: 'hidden' }} className="custom-chart-scrollbar">
                    <div style={{ minWidth: data.length > 15 ? `${minWidth}px` : '100%', width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.chartGrid} />
                                <XAxis
                                    dataKey={config.xAxisKey}
                                    {...AxisProps}
                                    tick={<InteractiveTick tickFormatter={xAxisFormatter} isDate={isXDate} />}
                                    angle={isXDate ? 0 : -25}
                                    textAnchor={isXDate ? "middle" : "end"}
                                    height={isXDate ? (isExporting ? 40 : 50) : (isExporting ? 75 : 90)}
                                    interval={data.length > 30 ? 'preserveStartEnd' : 0}
                                />
                                <YAxis {...AxisProps} width={70} tickFormatter={yAxisFormatter} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" height={isExporting ? 28 : 36} content={<ChartLegend />} />
                                <Bar
                                    dataKey={config.dataKey}
                                    stackId="stack"
                                    fill={config.color || COLORS[0]}
                                    radius={0}
                                    isAnimationActive={isAnimationActive}
                                    cursor="pointer"
                                    barSize={data.length > 40 ? undefined : (isExpanded ? 35 : 30)}
                                    onClick={(d: any) => {
                                        const value = d?.[config.xAxisKey] || (d?.payload && d.payload[config.xAxisKey]);
                                        if (value !== undefined && onItemClick) onItemClick(value);
                                    }}
                                />
                                {config.dataKey2 && (
                                    <Bar
                                        dataKey={config.dataKey2}
                                        stackId="stack"
                                        fill={config.color2 || COLORS[1]}
                                        radius={0}
                                        isAnimationActive={isAnimationActive}
                                        cursor="pointer"
                                        barSize={data.length > 40 ? undefined : (isExpanded ? 35 : 30)}
                                    />
                                )}
                                {showBrush && !isExpanded && (
                                    <Brush dataKey={config.xAxisKey} height={30} stroke="#6366f1" fill="#1e293b" tickFormatter={() => ''} />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        case ChartType.COMBO: {
            const minWidth = Math.max(100, data.length * (isExpanded ? 45 : 35));
            return (
                <div style={{ width: '100%', height: '100%', overflowX: data.length > 15 ? 'auto' : 'hidden', overflowY: 'hidden' }} className="custom-chart-scrollbar">
                    <div style={{ minWidth: data.length > 15 ? `${minWidth}px` : '100%', width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.chartGrid} />
                                <XAxis
                                    dataKey={config.xAxisKey}
                                    {...AxisProps}
                                    tick={<InteractiveTick tickFormatter={xAxisFormatter} isDate={isXDate} />}
                                    angle={isXDate ? 0 : -25}
                                    textAnchor={isXDate ? "middle" : "end"}
                                    height={isXDate ? (isExporting ? 40 : 50) : (isExporting ? 75 : 90)}
                                    interval={data.length > 30 ? 'preserveStartEnd' : 0}
                                />
                                <YAxis {...AxisProps} width={70} tickFormatter={yAxisFormatter} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" height={isExporting ? 28 : 36} content={<ChartLegend />} />
                                <Bar
                                    dataKey={config.dataKey}
                                    fill={config.color || COLORS[0]}
                                    radius={0}
                                    isAnimationActive={isAnimationActive}
                                    cursor="pointer"
                                    barSize={data.length > 40 ? undefined : (isExpanded ? 30 : 25)}
                                    onClick={(d: any) => {
                                        const value = d?.[config.xAxisKey] || (d?.payload && d.payload[config.xAxisKey]);
                                        if (value !== undefined && onItemClick) onItemClick(value);
                                    }}
                                >
                                    <LabelList
                                        dataKey={config.dataKey}
                                        position="top"
                                        fill={themeColors.chartLabelText}
                                        fontSize={9}
                                        fontWeight={600}
                                        formatter={labelFormatter}
                                        offset={8}
                                    />
                                </Bar>
                                {config.dataKey2 && (
                                    <Line
                                        type="monotone"
                                        dataKey={config.dataKey2}
                                        stroke={config.color2 || COLORS[2]}
                                        strokeWidth={2.5}
                                        dot={data.length > (isExpanded ? 60 : 40) ? false : {
                                            fill: theme === 'dark' ? '#0f172a' : '#ffffff',
                                            stroke: config.color2 || COLORS[2],
                                            strokeWidth: 2,
                                            r: 3
                                        }}
                                        isAnimationActive={isAnimationActive}
                                    />
                                )}
                                {showBrush && !isExpanded && (
                                    <Brush dataKey={config.xAxisKey} height={30} stroke="#6366f1" fill="#1e293b" tickFormatter={() => ''} />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        case ChartType.LINE: {
            const minWidth = Math.max(100, data.length * (isExpanded ? 40 : 30));
            return (
                <div style={{ width: '100%', height: '100%', overflowX: data.length > 20 ? 'auto' : 'hidden', overflowY: 'hidden' }} className="custom-chart-scrollbar">
                    <div style={{ minWidth: data.length > 20 ? `${minWidth}px` : '100%', width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.chartGrid} />
                                <XAxis
                                    dataKey={config.xAxisKey}
                                    {...AxisProps}
                                    tick={<InteractiveTick tickFormatter={xAxisFormatter} isDate={isXDate} />}
                                    angle={isXDate ? 0 : -25}
                                    textAnchor={isXDate ? "middle" : "end"}
                                    height={isXDate ? 50 : 90}
                                    interval={data.length > 30 ? 'preserveStartEnd' : 0}
                                />
                                <YAxis {...AxisProps} width={70} tickFormatter={yAxisFormatter} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" height={36} content={<ChartLegend />} />
                                <Line
                                    type="monotone"
                                    dataKey={config.dataKey}
                                    stroke={config.color || COLORS[1]}
                                    strokeWidth={2.5}
                                    isAnimationActive={isAnimationActive}
                                    dot={data.length > (isExpanded ? 100 : 60) ? false : {
                                        fill: theme === 'dark' ? '#0f172a' : '#ffffff',
                                        stroke: config.color || COLORS[1],
                                        strokeWidth: 2,
                                        r: 3,
                                        cursor: 'pointer'
                                    }}
                                    activeDot={{ r: 5, fill: config.color || COLORS[1], stroke: '#fff', strokeWidth: 2, cursor: 'pointer' }}
                                    onClick={(d: any) => {
                                        const value = d?.activeLabel || d?.[config.xAxisKey] || (d?.payload && d.payload[config.xAxisKey]);
                                        if (value !== undefined && onItemClick) onItemClick(value);
                                    }}
                                />
                                {showBrush && !isExpanded && (
                                    <Brush
                                        dataKey={config.xAxisKey}
                                        height={30}
                                        stroke="#6366f1"
                                        fill={theme === 'dark' ? '#1e293b' : '#f8fafc'}
                                        tickFormatter={() => ''}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }
        case ChartType.AREA: {
            const minWidth = Math.max(100, data.length * (isExpanded ? 40 : 30));
            return (
                <div style={{ width: '100%', height: '100%', overflowX: data.length > 20 ? 'auto' : 'hidden', overflowY: 'hidden' }} className="custom-chart-scrollbar">
                    <div style={{ minWidth: data.length > 20 ? `${minWidth}px` : '100%', width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.chartGrid} />
                                <XAxis
                                    dataKey={config.xAxisKey}
                                    {...AxisProps}
                                    tick={<InteractiveTick tickFormatter={xAxisFormatter} isDate={isXDate} />}
                                    angle={isXDate ? 0 : -25}
                                    textAnchor={isXDate ? "middle" : "end"}
                                    height={isXDate ? 50 : 90}
                                    interval={data.length > 30 ? 'preserveStartEnd' : 0}
                                />
                                <YAxis {...AxisProps} width={70} tickFormatter={yAxisFormatter} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" height={36} content={<ChartLegend />} />
                                <defs>
                                    <linearGradient id={`areaGradient-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={config.color || COLORS[4]} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={config.color || COLORS[4]} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey={config.dataKey}
                                    stroke={config.color || COLORS[4]}
                                    fill={`url(#areaGradient-${config.id})`}
                                    strokeWidth={2.5}
                                    isAnimationActive={isAnimationActive}
                                    dot={data.length > (isExpanded ? 100 : 60) ? false : {
                                        fill: theme === 'dark' ? '#0f172a' : '#ffffff',
                                        stroke: config.color || COLORS[4],
                                        strokeWidth: 2,
                                        r: 3,
                                    }}
                                    activeDot={{ r: 5, fill: config.color || COLORS[4], stroke: '#fff', strokeWidth: 2, cursor: 'pointer' }}
                                    onClick={(d: any) => {
                                        const value = d?.activeLabel || d?.[config.xAxisKey] || (d?.payload && d.payload[config.xAxisKey]);
                                        if (value !== undefined && onItemClick) onItemClick(value);
                                    }}
                                    cursor="pointer"
                                >
                                    {data.length <= 20 && <LabelList dataKey={config.dataKey} position="top" fill={themeColors.chartLabelText} fontSize={10} fontWeight={600} formatter={labelFormatter} offset={12} />}
                                </Area>
                                {showBrush && !isExpanded && (
                                    <Brush
                                        dataKey={config.xAxisKey}
                                        height={30}
                                        stroke="#6366f1"
                                        fill={theme === 'dark' ? '#1e293b' : '#f8fafc'}
                                        tickFormatter={() => ''}
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        case ChartType.SCATTER: {
            const minWidth = Math.max(100, data.length * (isExpanded ? 40 : 30));
            return (
                <div style={{ width: '100%', height: '100%', overflowX: data.length > 20 ? 'auto' : 'hidden', overflowY: 'hidden' }} className="custom-chart-scrollbar">
                    <div style={{ minWidth: data.length > 20 ? `${minWidth}px` : '100%', width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 30, right: 40, left: 20, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={themeColors.chartGrid} />
                                <XAxis
                                    type="number"
                                    dataKey={config.xAxisKey}
                                    name={config.xAxisKey}
                                    {...AxisProps}
                                    tick={<InteractiveTick tickFormatter={xAxisFormatter} isDate={isXDate} />}
                                />
                                <YAxis
                                    type="number"
                                    dataKey={config.dataKey}
                                    name={config.dataKey}
                                    {...AxisProps}
                                    width={80}
                                    tickFormatter={yAxisFormatter}
                                />
                                <ZAxis range={[40, 200]} />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }: any) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div style={{
                                                    backgroundColor: themeColors.chartTooltipBg,
                                                    border: `1px solid ${themeColors.chartTooltipBorder}`,
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    boxShadow: theme === 'dark' ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                }}>
                                                    <p style={{ color: themeColors.chartTooltipText, fontSize: '11px', margin: '2px 0' }}>
                                                        {config.xAxisKey}: <strong>{formatByColumn(d[config.xAxisKey], config.xAxisKey)}</strong>
                                                    </p>
                                                    <p style={{ color: config.color || COLORS[0], fontSize: '11px', margin: '2px 0' }}>
                                                        {config.dataKey}: <strong>{formatByColumn(d[config.dataKey], config.dataKey)}</strong>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend verticalAlign="top" height={36} content={<ChartLegend />} />
                                <Scatter
                                    name={config.dataKey}
                                    data={data}
                                    fill={config.color || COLORS[0]}
                                    fillOpacity={0.7}
                                    isAnimationActive={isAnimationActive}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        case ChartType.WATERFALL: {
            const waterfallColor = (entry: any) => entry._isPositive ? '#10b981' : '#f43f5e';
            const minWidth = Math.max(100, data.length * (isExpanded ? 50 : 40));
            return (
                <div style={{ width: '100%', height: '100%', overflowX: data.length > 12 ? 'auto' : 'hidden', overflowY: 'hidden' }} className="custom-chart-scrollbar">
                    <div style={{ minWidth: data.length > 12 ? `${minWidth}px` : '100%', width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.chartGrid} />
                                <XAxis
                                    dataKey={config.xAxisKey}
                                    {...AxisProps}
                                    tick={<InteractiveTick tickFormatter={xAxisFormatter} isDate={isXDate} />}
                                    angle={isXDate ? 0 : -25}
                                    textAnchor={isXDate ? "middle" : "end"}
                                    height={isXDate ? 50 : 90}
                                    interval={data.length > 30 ? 'preserveStartEnd' : 0}
                                />
                                <YAxis {...AxisProps} width={70} tickFormatter={yAxisFormatter} />
                                <Tooltip
                                    content={({ active, payload, label }: any) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0]?.payload;
                                            let displayLabel = label || 'Not Specified';
                                            if (label && isXDate) {
                                                const num = typeof label === 'number' ? label : parseFloat(label);
                                                if (!isNaN(num) && isExcelSerialDate(num)) {
                                                    displayLabel = excelSerialToDate(num);
                                                }
                                            } else if (label && isXCurrency && typeof label === 'number') {
                                                displayLabel = formatCurrency(label);
                                            }
                                            return (
                                                <div style={{
                                                    backgroundColor: themeColors.chartTooltipBg,
                                                    border: `1px solid ${themeColors.chartTooltipBorder}`,
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    boxShadow: theme === 'dark' ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                }}>
                                                    <p style={{ color: themeColors.chartTooltipText, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                                                        {displayLabel}
                                                    </p>
                                                    <p style={{ color: d?._isPositive ? '#10b981' : '#f43f5e', fontSize: '11px', margin: '2px 0' }}>
                                                        Change: <strong>{formatByColumn(d?.[config.dataKey], config.dataKey)}</strong>
                                                    </p>
                                                    <p style={{ color: themeColors.chartTooltipText, fontSize: '11px', margin: '2px 0' }}>
                                                        Running Total: <strong>{formatByColumn(d?._total, config.dataKey)}</strong>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend verticalAlign="top" height={36} content={<ChartLegend />} />
                                {/* Invisible base bar */}
                                <Bar dataKey="_base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
                                {/* Visible delta bar */}
                                <Bar
                                    dataKey={config.dataKey}
                                    stackId="waterfall"
                                    radius={0}
                                    isAnimationActive={isAnimationActive}
                                    cursor="pointer"
                                    barSize={data.length > 30 ? undefined : (isExpanded ? 30 : 25)}
                                    onClick={(d: any) => {
                                        const value = d?.[config.xAxisKey] || (d?.payload && d.payload[config.xAxisKey]);
                                        if (value !== undefined && onItemClick) onItemClick(value);
                                    }}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`wf-${index}`} fill={waterfallColor(entry)} />
                                    ))}

                                </Bar>
                                {showBrush && !isExpanded && (
                                    <Brush
                                        dataKey={config.xAxisKey}
                                        height={30}
                                        stroke="#6366f1"
                                        fill={theme === 'dark' ? '#1e293b' : '#f8fafc'}
                                        tickFormatter={() => ''}
                                    />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        case ChartType.HEATMAP: {
            if (!data || data.length === 0) return <div className={`flex items-center justify-center h-full ${colors.textMuted} text-sm`}>No Data Available</div>;

            const xVals = Array.from(new Set(data.map((d: any) => d.x)));
            const yVals = Array.from(new Set(data.map((d: any) => d.y)));
            const values = data.map((d: any) => d.value);
            const minVal = Math.min(...values);
            const maxVal = Math.max(...values);
            const range = maxVal - minVal || 1;

            const getHeatColor = (val: number) => {
                const t = (val - minVal) / range;
                // indigo gradient: light → dark
                const r = Math.round(99 - t * 60);
                const g = Math.round(102 - t * 60);
                const b = Math.round(241);
                return `rgba(${r}, ${g}, ${b}, ${0.15 + t * 0.85})`;
            };

            return (
                <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: '8px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `80px repeat(${xVals.length}, 1fr)`,
                        gap: '2px',
                        fontSize: '10px',
                        minWidth: xVals.length > 8 ? `${xVals.length * 60}px` : undefined,
                    }}>
                        {/* Header row */}
                        <div style={{ padding: '6px 4px', fontWeight: 700, color: themeColors.chartAxisText }} />
                        {xVals.map((x: any) => (
                            <div key={x} 
                                style={{
                                    padding: '6px 4px',
                                    fontWeight: 600,
                                    color: themeColors.chartAxisText,
                                    textAlign: 'center',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: onItemClick ? 'pointer' : 'default'
                                }}
                                onClick={() => onItemClick && onItemClick(x)}
                            >
                                {String(x).length > 8 ? String(x).substring(0, 6) + '..' : x}
                            </div>
                        ))}
                        {/* Data rows */}
                        {yVals.map((y: any) => (
                            <React.Fragment key={y}>
                                <div key={y}
                                    style={{
                                        padding: '6px 4px',
                                        fontWeight: 600,
                                        color: themeColors.chartAxisText,
                                        display: 'flex',
                                        alignItems: 'center',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        cursor: onItemClick ? 'pointer' : 'default'
                                    }}
                                    onClick={() => onItemClick && onItemClick(y)}
                                >
                                    {String(y).length > 10 ? String(y).substring(0, 8) + '..' : y}
                                </div>
                                {xVals.map((x: any) => {
                                    const cell = data.find((d: any) => d.x === x && d.y === y);
                                    const val = cell?.value ?? 0;
                                    return (
                                        <div
                                            key={`${x}-${y}`}
                                            style={{
                                                padding: '6px 4px',
                                                backgroundColor: getHeatColor(val),
                                                borderRadius: '4px',
                                                textAlign: 'center',
                                                color: (val - minVal) / range > 0.5
                                                    ? '#ffffff'
                                                    : themeColors.chartAxisText,
                                                fontWeight: 600,
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer',
                                                minHeight: '28px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            title={`${config.xAxisKey}: ${x}\n${config.yAxisKey}: ${y}\n${config.dataKey}: ${val}`}
                                            onClick={() => onItemClick && onItemClick(x)}
                                        >
                                            {formatByColumn(val, config.dataKey)}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            );
        }

        case ChartType.PIE:
            return (
                <ResponsiveContainer width="100%" height={isExporting ? 280 : (isExpanded ? 500 : 300)}>
                    <PieChart margin={{ top: 0, right: 10, bottom: 10, left: 10 }}>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={isExporting ? 45 : (isExpanded ? 120 : 70)}
                            outerRadius={isExporting ? 75 : (isExpanded ? 180 : 100)}
                            paddingAngle={4}
                            dataKey={config.dataKey}
                            nameKey={config.xAxisKey}
                            stroke={theme === 'dark' ? '#1e293b' : '#fff'}
                            strokeWidth={2}
                            isAnimationActive={isAnimationActive}
                            onClick={(d) => onItemClick && onItemClick(d.name)}
                            cursor="pointer"
                            label={({ name, value, percent, x, y, cx }) => {
                                const formattedValue = formatByColumn(value, config.dataKey);
                                const isRight = x > cx;
                                return (
                                    <text
                                        x={x}
                                        y={y}
                                        fill={themeColors.chartLabelText}
                                        textAnchor={isRight ? 'start' : 'end'}
                                        dominantBaseline="central"
                                        fontSize={isExporting ? 8.5 : 11}
                                        fontWeight={600}
                                    >
                                        {formattedValue} ({(percent * 100).toFixed(0)}%)
                                    </text>
                                );
                            }}
                            labelLine={{ stroke: themeColors.chartLabelText, strokeWidth: 1, opacity: 0.5 }}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={activeFilterValue && isValueFiltered(entry[config.xAxisKey]) ? '#f59e0b' : COLORS[index % COLORS.length]}
                                    fillOpacity={activeFilterValue && !isValueFiltered(entry[config.xAxisKey]) ? 0.4 : 1}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType={isExporting ? "none" : "circle"}
                            iconSize={isExporting ? 0 : 10}
                            wrapperStyle={{
                                paddingTop: isExporting ? '8px' : '20px',
                                fontSize: isExporting ? '9px' : '11px',
                                fontWeight: 500,
                                color: themeColors.chartLegendText,
                                bottom: isExporting ? '-10px' : '0px'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            );
        case ChartType.TABLE: {
            const tableTotal = data.reduce((acc, row) => acc + (Number(row[config.dataKey]) || 0), 0);
            const tableTotal2 = config.dataKey2 ? data.reduce((acc, row) => acc + (Number(row[config.dataKey2]) || 0), 0) : 0;
            const fmtNum = (v: number, key: string) => formatByColumn(v, key);
            return (
                <div style={{ width: '100%', height: '100%', overflow: 'auto' }} className="custom-chart-scrollbar">
                    <table className="w-full border-collapse" style={{ fontSize: isExporting ? '7.5px' : '11px' }}>
                        <thead>
                            <tr style={{ background: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}>
                                <th className={`px-2 py-1 text-center font-bold text-[7.5px] uppercase tracking-widest border-b-2 ${theme === 'dark' ? 'border-indigo-500/30 text-slate-500' : 'border-indigo-400/30 text-slate-400'}`}>#</th>
                                <th className={`px-3 py-1 text-left font-bold text-[7.5px] uppercase tracking-widest border-b-2 ${theme === 'dark' ? 'border-indigo-500/30 text-slate-500' : 'border-indigo-400/30 text-slate-400'}`}>{config.xAxisKey}</th>
                                <th className={`px-3 py-1 text-right font-bold text-[7.5px] uppercase tracking-widest border-b-2 ${theme === 'dark' ? 'border-indigo-500/30 text-slate-500' : 'border-indigo-400/30 text-slate-400'}`}>{config.dataKey}</th>
                                {config.dataKey2 && <th className={`px-3 py-1 text-right font-bold text-[7.5px] uppercase tracking-widest border-b-2 ${theme === 'dark' ? 'border-indigo-500/30 text-slate-500' : 'border-indigo-400/30 text-slate-400'}`}>{config.dataKey2}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i}
                                    style={{ background: i % 2 === 0 ? (theme === 'dark' ? 'rgba(30,41,59,0.3)' : 'rgba(241,245,249,0.5)') : 'transparent' }}
                                    className="transition-colors cursor-pointer"
                                    onClick={() => onItemClick && onItemClick(row[config.xAxisKey])}
                                >
                                    <td className={`px-2 py-0.5 ${isExporting ? 'text-[7.5px]' : 'text-[10px]'} text-center ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} font-mono`}>{i + 1}</td>
                                    <td className={`px-2 py-0.5 ${isExporting ? 'text-[7.5px]' : 'text-xs'} font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{formatByColumn(row[config.xAxisKey], config.xAxisKey)}</td>
                                    <td className={`px-2 py-0.5 ${isExporting ? 'text-[7.5px]' : 'text-xs'} font-bold text-right font-mono ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{fmtNum(Number(row[config.dataKey]) || 0, config.dataKey)}</td>
                                    {config.dataKey2 && <td className={`px-2 py-0.5 ${isExporting ? 'text-[7.5px]' : 'text-xs'} font-bold text-right font-mono ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmtNum(Number(row[config.dataKey2]) || 0, config.dataKey2)}</td>}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: theme === 'dark' ? '#0f172a' : '#f1f5f9', borderTop: `2px solid ${theme === 'dark' ? '#6366f1' : '#818cf8'}` }}>
                                <td className={`px-2 py-1.5 ${isExporting ? 'text-[7.5px]' : 'text-[10px]'} font-bold text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Σ</td>
                                <td className={`px-3 py-1.5 ${isExporting ? 'text-[7.5px]' : 'text-xs'} font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{data.length} rows</td>
                                <td className={`px-3 py-1.5 ${isExporting ? 'text-[7.5px]' : 'text-xs'} font-black text-right font-mono ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>{fmtNum(tableTotal, config.dataKey)}</td>
                                {config.dataKey2 && <td className={`px-3 py-1.5 ${isExporting ? 'text-[7.5px]' : 'text-xs'} font-black text-right font-mono ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>{fmtNum(tableTotal2, config.dataKey2)}</td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            );
        }

        case ChartType.MATRIX: {
            if (!data || data.length === 0) return <div className={`flex items-center justify-center h-full ${colors.textMuted} text-sm`}>No Data Available</div>;

            const mxVals = Array.from(new Set(data.map((d: any) => d.x))).sort();
            const myVals = Array.from(new Set(data.map((d: any) => d.y))).sort();
            const allValues = data.map((d: any) => d.value);
            const mMinVal = Math.min(...allValues);
            const mMaxVal = Math.max(...allValues);
            const mRange = mMaxVal - mMinVal || 1;
            const fmtMatrixNum = (v: number) => {
                if (isExporting && mxVals.length > 8 && isYCurrency) return formatCompactCurrency(v);
                return formatByColumn(v, config.dataKey);
            };

            // Compute row and column totals
            const rowTotals: { [key: string]: number } = {};
            const colTotals: { [key: string]: number } = {};
            myVals.forEach(y => { rowTotals[y as string] = 0; });
            mxVals.forEach(x => { colTotals[x as string] = 0; });
            data.forEach((d: any) => {
                rowTotals[d.y] = (rowTotals[d.y] || 0) + d.value;
                colTotals[d.x] = (colTotals[d.x] || 0) + d.value;
            });
            const grandTotal = Object.values(rowTotals).reduce((a, b) => a + b, 0);

            const getCellBg = (val: number) => {
                const t = (val - mMinVal) / mRange;
                if (theme === 'dark') {
                    return `rgba(99, 102, 241, ${0.08 + t * 0.55})`;
                } else {
                    return `rgba(99, 102, 241, ${0.05 + t * 0.35})`;
                }
            };

            const matrixFontSize = isExporting ? (mxVals.length > 15 ? '6px' : (mxVals.length > 8 ? '7.5px' : '9px')) : '11px';

            return (
                <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: '0' }}>
                    <table className="w-full border-collapse" style={{ fontSize: matrixFontSize, tableLayout: isExporting && mxVals.length > 8 ? 'fixed' : 'auto' }}>
                        <thead>
                            <tr style={{ background: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}>
                                <th className={`px-2 py-2 text-left font-bold text-[8px] uppercase tracking-tighter border-b-2 border-r ${theme === 'dark' ? 'border-indigo-500/30 text-slate-500' : 'border-indigo-400/30 text-slate-400'}`} style={{ borderColor: themeColors.chartGrid, width: isExporting ? '80px' : 'auto' }}>
                                    {isExporting ? 'Y \\ X' : `${config.yAxisKey} ↓ / ${config.xAxisKey} →`}
                                </th>
                                {mxVals.map(x => (
                                    <th key={x} 
                                        className={`px-1 py-1.5 text-center font-bold uppercase tracking-tighter border-b-2 border-r ${theme === 'dark' ? 'border-indigo-500/30 text-slate-400' : 'border-indigo-400/30 text-slate-500'}`} 
                                        style={{ borderColor: themeColors.chartGrid, fontSize: isExporting && mxVals.length > 12 ? '6px' : 'inherit', cursor: onItemClick ? 'pointer' : 'default' }}
                                        onClick={() => onItemClick && onItemClick(x)}
                                    >
                                        {(() => {
                                            const formatted = formatByColumn(x, config.xAxisKey);
                                            return formatted.length > (mxVals.length > 15 ? 4 : 10) 
                                                ? formatted.substring(0, (mxVals.length > 15 ? 3 : 8)) + '..' 
                                                : formatted;
                                        })()}
                                    </th>
                                ))}
                                <th className={`px-3 py-2.5 text-center font-bold text-[9px] uppercase tracking-widest border-b-2 ${theme === 'dark' ? 'border-indigo-500/30 text-indigo-400' : 'border-indigo-400/30 text-indigo-600'}`}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myVals.map((y, ri) => (
                                <tr key={y} style={{ background: ri % 2 === 0 ? (theme === 'dark' ? 'rgba(30,41,59,0.2)' : 'rgba(241,245,249,0.4)') : 'transparent' }}>
                                    <td className={`px-2 py-1.5 font-bold border-r ${theme === 'dark' ? 'text-slate-300 bg-slate-800/30' : 'text-slate-600 bg-slate-50/60'}`} style={{ borderColor: themeColors.chartGrid, fontSize: isExporting && mxVals.length > 12 ? '7px' : 'inherit', width: isExporting ? '60px' : 'auto' }}>
                                        {(() => {
                                            const formatted = formatByColumn(y, config.yAxisKey);
                                            return formatted.length > (isExporting ? 10 : 14) 
                                                ? formatted.substring(0, (isExporting ? 8 : 12)) + '..' 
                                                : formatted;
                                        })()}
                                    </td>
                                    {mxVals.map(x => {
                                        const cell = data.find((d: any) => d.x === x && d.y === y);
                                        const val = cell?.value ?? 0;
                                        const t = (val - mMinVal) / mRange;
                                        return (
                                            <td key={`${x}-${y}`}
                                                className={`px-0.5 py-1 text-center font-bold border-r cursor-pointer transition-all`}
                                                style={{
                                                    borderColor: themeColors.chartGrid,
                                                    backgroundColor: getCellBg(val),
                                                    color: t > 0.6 ? '#ffffff' : (theme === 'dark' ? '#94a3b8' : '#475569'),
                                                    height: isExporting ? '24px' : 'auto',
                                                    overflow: 'hidden',
                                                    textOverflow: 'clip'
                                                }}
                                                title={`${config.yAxisKey}: ${formatByColumn(y, config.yAxisKey)}\n${config.xAxisKey}: ${formatByColumn(x, config.xAxisKey)}\n${config.dataKey}: ${val}`}
                                                onClick={() => onItemClick && onItemClick(x)}
                                            >
                                                {fmtMatrixNum(val)}
                                            </td>
                                        );
                                    })}
                                    <td className={`px-3 py-2 text-center font-black text-xs ${theme === 'dark' ? 'text-indigo-300 bg-slate-800/40' : 'text-indigo-700 bg-slate-100/60'}`}>
                                        {fmtMatrixNum(rowTotals[y as string] || 0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: theme === 'dark' ? '#0f172a' : '#f1f5f9', borderTop: `2px solid ${theme === 'dark' ? '#6366f1' : '#818cf8'}` }}>
                                <td className={`px-3 py-2.5 font-bold text-[9px] uppercase tracking-widest border-r ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} style={{ borderColor: themeColors.chartGrid }}>Total</td>
                                {mxVals.map(x => (
                                    <td key={x} className={`px-2 py-2.5 text-center font-black text-xs border-r ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`} style={{ borderColor: themeColors.chartGrid }}>
                                        {fmtMatrixNum(colTotals[x as string] || 0)}
                                    </td>
                                ))}
                                <td className={`px-3 py-2.5 text-center font-black text-xs ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                                    {fmtMatrixNum(grandTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            );
        }

        default:
            return null;
    }
});

// ─── FilterSidebar ────────────────────────────────────────────────────────────
// Owns ALL sidebar-internal state so its open/close/search actions never
// trigger a Dashboard re-render.
interface FilterSidebarProps {
    filterableColumns: string[];
    activeFilters: { [col: string]: any[] };
    pageFilters: { [col: string]: any[] };
    activeTabName: string;
    toggleFilter: (col: string, val: any) => void;
    clearFilters: () => void;
    togglePageFilter: (col: string, val: any) => void;
    clearPageFilters: () => void;
    theme: Theme;
    colors: ReturnType<typeof getThemeClasses>;
}

const FilterSidebar = React.memo<FilterSidebarProps>(({ 
    filterableColumns, activeFilters, pageFilters, uniqueValuesMap, activeTabName, 
    toggleFilter, clearFilters, togglePageFilter, clearPageFilters, 
    theme, colors 
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // Separate state for Global and Page filter sections
    const [expandedGlobalCols, setExpandedGlobalCols] = useState<Set<string>>(new Set());
    const [expandedPageCols, setExpandedPageCols] = useState<Set<string>>(new Set());
    const [globalColSearch, setGlobalColSearch] = useState<{ [col: string]: string }>({});
    const [pageColSearch, setPageColSearch] = useState<{ [col: string]: string }>({});

    const toggleGlobalColumn = useCallback((col: string) => {
        setExpandedGlobalCols(prev => {
            const next = new Set(prev);
            if (next.has(col)) { next.delete(col); } else { next.add(col); }
            return next;
        });
    }, []);

    const togglePageColumn = useCallback((col: string) => {
        setExpandedPageCols(prev => {
            const next = new Set(prev);
            if (next.has(col)) { next.delete(col); } else { next.add(col); }
            return next;
        });
    }, []);

    const totalGlobalActiveCount: number = (Object.values(activeFilters) as any[][]).reduce((acc: number, vals: any[]) => acc + (Array.isArray(vals) ? vals.length : 0), 0);
    const totalPageActiveCount: number = (pageFilters ? (Object.values(pageFilters) as any[][]) : []).reduce((acc: number, vals: any[]) => acc + (Array.isArray(vals) ? vals.length : 0), 0);
    const grandTotalActiveCount = totalGlobalActiveCount + totalPageActiveCount;

    const renderFilterGroup = (
        title: string,
        activeCount: number,
        activeFilterState: { [col: string]: any[] },
        expandedCols: Set<string>,
        colSearchState: { [col: string]: string },
        onToggleColumn: (col: string) => void,
        setColSearch: React.Dispatch<React.SetStateAction<{ [col: string]: string }>>,
        onToggleFilterItem: (col: string, val: any) => void,
        onClearAll: () => void
    ) => {
        return (
            <div className="flex flex-col border-b border-slate-700/30 pb-2 mb-2 last:border-b-0 last:mb-0">
                <div className={`px-4 py-2 ${colors.bgTertiary} border-y ${colors.borderPrimary} flex items-center justify-between shadow-sm sticky top-0 z-10`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.textSecondary}`}>{title}</span>
                    {activeCount > 0 && (
                        <span className="shrink-0 text-[8px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full shadow border border-indigo-400">
                            {activeCount}
                        </span>
                    )}
                </div>
                {!isSidebarCollapsed && activeCount > 0 && (
                    <div className={`px-4 py-1.5 border-b ${colors.borderPrimary}`}>
                        <button
                            onClick={onClearAll}
                            className={`w-full flex items-center justify-center gap-1.5 px-3 py-1 text-[10px] font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors uppercase tracking-wider`}
                        >
                            <Trash2 className="w-3 h-3" /> Clear filters
                        </button>
                    </div>
                )}
                {!isSidebarCollapsed && (
                    <div className="flex-1 overflow-y-visible py-1">
                        {filterableColumns.map(col => {
                            const isExpanded = expandedCols.has(col);
                            const colVals = Array.isArray(activeFilterState[col]) ? activeFilterState[col] : [];
                            const colActiveCount = colVals.length;
                            const search = colSearchState[col] || '';
                            const allVals = uniqueValuesMap[col] || [];
                            const uniqueVals = search ? allVals.filter(v => String(v).toLowerCase().includes(search.toLowerCase())) : allVals;

                            return (
                                <div key={col} className={`border-b ${colors.borderPrimary} last:border-b-0`}>
                                    <button
                                        onClick={() => onToggleColumn(col)}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors ${
                                            colActiveCount > 0 ? 'text-indigo-400' : `${colors.textSecondary} hover:${colors.textPrimary}`
                                        } hover:${colors.bgTertiary}`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="truncate">{col.includes('.') ? col.split('.').pop() : col}</span>
                                            {colActiveCount > 0 && (
                                                <span className="shrink-0 text-[9px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                                                    {colActiveCount}
                                                </span>
                                            )}
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${colors.textMuted}`} />
                                    </button>

                                    {isExpanded && (
                                        <div className="pb-2">
                                            <div className="px-3 pb-2">
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    value={search}
                                                    onChange={e => setColSearch(prev => ({ ...prev, [col]: e.target.value }))}
                                                    className={`w-full px-2.5 py-1.5 text-[11px] rounded-lg ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-1 focus:ring-indigo-500 outline-none transition-all`}
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto no-scrollbar px-2">
                                                {uniqueVals.length === 0 ? (
                                                    <p className={`text-[10px] ${colors.textMuted} text-center py-3 italic`}>No values found</p>
                                                ) : uniqueVals.map(val => {
                                                    const valStr = String(val);
                                                    const actualVal = valStr === '(Empty)' ? '' : valStr;
                                                    const isSelected = colVals.some((v: any) => String(v) === String(actualVal));
                                                    return (
                                                        <button
                                                            key={valStr}
                                                            onClick={() => onToggleFilterItem(col, actualVal)}
                                                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all mb-0.5 text-left ${
                                                                isSelected ? 'bg-indigo-500/15 text-indigo-300 font-semibold' : `${colors.textMuted} hover:${colors.bgTertiary} hover:${colors.textSecondary}`
                                                            }`}
                                                        >
                                                            <span className={`shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                                                                isSelected ? 'bg-indigo-500 border-indigo-400' : 'border-current opacity-30'
                                                            }`}>
                                                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                                            </span>
                                                            <span className="truncate">{valStr}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside
            className={`print:hidden shrink-0 flex flex-col border-r ${colors.borderPrimary} transition-all duration-300 ${isSidebarCollapsed ? 'w-12' : 'w-64'} sticky top-[57px] sm:top-[65px] md:top-[73px] self-start`}
            style={{ height: 'calc(100vh - 73px)', overflowY: 'auto' }}
        >
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 border-b ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'} sticky top-0 z-20 shadow-sm`}>
                {!isSidebarCollapsed && (
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-indigo-400" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${colors.textPrimary}`}>Filters</span>
                        {grandTotalActiveCount > 0 && (
                            <span className="text-[9px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                                {grandTotalActiveCount}
                            </span>
                        )}
                    </div>
                )}
                <button
                    onClick={() => setIsSidebarCollapsed(c => !c)}
                    className={`p-1.5 rounded-lg ${colors.textMuted} hover:${colors.textPrimary} hover:${colors.bgTertiary} transition-colors`}
                    title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? '-rotate-90' : 'rotate-90'}`} />
                </button>
            </div>

            {!isSidebarCollapsed && (
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {renderFilterGroup(
                        "Global Filters",
                        totalGlobalActiveCount,
                        activeFilters,
                        expandedGlobalCols,
                        globalColSearch,
                        toggleGlobalColumn,
                        setGlobalColSearch,
                        toggleFilter,
                        clearFilters
                    )}
                    
                    {renderFilterGroup(
                        `Page filter`,
                        totalPageActiveCount,
                        pageFilters || {},
                        expandedPageCols,
                        pageColSearch,
                        togglePageColumn,
                        setPageColSearch,
                        togglePageFilter,
                        clearPageFilters
                    )}
                </div>
            )}

            {isSidebarCollapsed && (
                <div className="flex flex-col items-center gap-2 py-3 overflow-y-auto no-scrollbar">
                    {filterableColumns.map(col => {
                        const globalVals = Array.isArray(activeFilters[col]) ? activeFilters[col] : [];
                        const pageVals = pageFilters && Array.isArray(pageFilters[col]) ? pageFilters[col] : [];
                        const activeCount = globalVals.length + pageVals.length;
                        return (
                            <button
                                key={col}
                                onClick={() => { setIsSidebarCollapsed(false); toggleGlobalColumn(col); }}
                                title={col}
                                className={`relative p-2 rounded-lg transition-colors ${
                                    activeCount > 0 ? 'bg-indigo-500/20 text-indigo-400' : `${colors.textMuted} hover:${colors.bgTertiary}`
                                }`}
                            >
                                <Filter className="w-4 h-4" />
                                {activeCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold bg-indigo-500 text-white w-3.5 h-3.5 rounded-full flex items-center justify-center">
                                        {activeCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </aside>
    );
});

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({ dataModel, chartConfigs, sections: explicitSections = [], filterColumns = [], onHome, onSave, onRefresh }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    // Local state for charts allows editing/adding charts in-place
    const [currentCharts, setCurrentCharts] = useState<ChartConfig[]>(Array.isArray(chartConfigs) ? chartConfigs : []);
    const [currentSections, setCurrentSections] = useState<DashboardSection[]>(explicitSections);
    const [currentFilterColumns, setCurrentFilterColumns] = useState<string[]>(filterColumns);
    const [isEditing, setIsEditing] = useState(false);

    // --- TIME INTELLIGENCE STATE ---
    const [chartDrillStates, setChartDrillStates] = useState<{ [chartId: string]: { level: 'year' | 'month' | 'day', year: number | null, month: number | null } }>({});

    // --- DRILL-THROUGH STATE (Power BI style) ---
    const [drillThroughState, setDrillThroughState] = useState<{
        sourceChart: ChartConfig;
        clickedYear: number;
    } | null>(null);

    // UI State
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [dashboardName, setDashboardName] = useState(dataModel?.name || "Untitled Dashboard");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- NEW: Per-Chart Filter Dropdown State ---
    const [chartFilterMenuOpen, setChartFilterMenuOpen] = useState<string | null>(null);
    const [chartFilterColumn, setChartFilterColumn] = useState<{ [chartId: string]: string | null }>({});
    const [chartFilterSearch, setChartFilterSearch] = useState<{ [chartId: string]: string }>({});
    const hoveredChartRef = useRef<string | null>(null); // Use ref to avoid re-renders on hover

    // --- Top N / Bottom N State ---
    const [topBottomMenuOpen, setTopBottomMenuOpen] = useState<string | null>(null);
    const TOPBOTTOM_ELIGIBLE_TYPES = new Set(['BAR', 'LINE', 'HORIZONTAL_BAR', 'GROUPED_BAR', 'STACKED_BAR', 'COMBO', 'WATERFALL', 'TABLE']);

    const updateChartTopBottom = useCallback((chartId: string, sortOrder: 'ASC' | 'DESC' | undefined, topN: number | undefined) => {
        setCurrentCharts(prev => prev.map(c => {
            if (c.id !== chartId) return c;
            return { ...c, sortOrder, topN };
        }));
    }, []);

    const clearChartTopBottom = useCallback((chartId: string) => {
        setCurrentCharts(prev => prev.map(c => {
            if (c.id !== chartId) return c;
            const { sortOrder, topN, ...rest } = c;
            return rest as ChartConfig;
        }));
        setTopBottomMenuOpen(null);
    }, []);
    
    // Sidebar state is managed inside <FilterSidebar> — not here — to avoid Dashboard re-renders.

    // --- NEW: Global Filtering State ---
    const [activeFilters, setActiveFilters] = useState<{ [column: string]: any[] }>({});

    // --- NEW: Page Filtering State ---
    const [pageFilters, setPageFilters] = useState<{ [tabIndex: number]: { [column: string]: any[] } }>({});


    // --- NEW: Per-Chart Filtering State (supports multiple values per column) ---
    const [chartFilters, setChartFilters] = useState<{ [chartId: string]: { [column: string]: any[] } }>({});

    // Filtered data calculation (global filters only — now supports multiple values per column)
    const filteredData = useMemo(() => {
        if (!dataModel || !dataModel.data) return [];
        if (Object.keys(activeFilters).length === 0) return dataModel.data;

        try {
            return dataModel.data.filter(row => {
                if (!row) return false;
                return Object.entries(activeFilters).every(([col, vals]) => {
                    if (!Array.isArray(vals) || vals.length === 0) return true;
                    return vals.some(v => String(row[col]) === String(v));
                });
            });
        } catch (e) {
            console.error("Error in filtering logic:", e);
            return dataModel.data || [];
        }
    }, [dataModel?.data, activeFilters]);

    // Helper function to apply per-chart filters (supports multiple values)
    const applyChartFilters = (data: any[], chartId: string): any[] => {
        const filters = chartFilters[chartId];
        if (!filters || Object.keys(filters).length === 0) return data;

        try {
            return data.filter(row => {
                if (!row) return false;
                return Object.entries(filters).every(([col, vals]) => {
                    // vals is now an array of values to match
                    if (!Array.isArray(vals) || vals.length === 0) return true;
                    return vals.some(val => String(row[col]) === String(val));
                });
            });
        } catch (e) {
            console.error("Error in chart filtering logic:", e);
            return data;
        }
    };

    // Toggle per-chart filter (supports multiple values)
    const toggleChartFilter = useCallback((chartId: string, column: string, value: any) => {
        setChartFilters(prev => {
            const next = { ...prev };
            const currentChart = next[chartId] ? { ...next[chartId] } : {};
            const currentValues = currentChart[column] ? [...currentChart[column]] : [];

            const valueStr = String(value);
            const index = currentValues.findIndex(v => String(v) === valueStr);

            if (index >= 0) {
                currentValues.splice(index, 1);
            } else {
                currentValues.push(value);
            }

            if (currentValues.length === 0) {
                delete currentChart[column];
            } else {
                currentChart[column] = currentValues;
            }

            if (Object.keys(currentChart).length === 0) {
                delete next[chartId];
            } else {
                next[chartId] = currentChart;
            }

            return next;
        });
    }, []);

    // Toggle Bar Chart Orientation
    const toggleChartOrientation = useCallback((chartId: string) => {
        setCurrentCharts(prev => prev.map(chart => {
            if (chart.id === chartId) {
                if (chart.type === ChartType.BAR) return { ...chart, type: ChartType.HORIZONTAL_BAR };
                if (chart.type === ChartType.HORIZONTAL_BAR) return { ...chart, type: ChartType.BAR };
            }
            return chart;
        }));
    }, []);

    // Clear per-chart filters
    const clearChartFilters = useCallback((chartId: string) => {
        setChartFilters(prev => {
            const next = { ...prev };
            delete next[chartId];
            return next;
        });
    }, []);

    // --- TIME INTELLIGENCE LOGIC ---
    const getDrillDownData = useCallback((chart: ChartConfig, data: any[]) => {
        const checkIsDate = (col: string) => {
            if (dataModel.columnMetadata?.[col]) {
                const meta = dataModel.columnMetadata[col];
                return (meta.finalType || meta.detectedType) === 'DATE';
            }
            return isDateTimeColumn(col);
        };
        const isXDate = checkIsDate(chart.xAxisKey);
        if (!isXDate || chart.type === ChartType.KPI) return data;

        const drillState = chartDrillStates[chart.id] || { level: 'initial', year: null, month: null };
        
        // Compute effective level and context
        let currentLevel = drillState.level;
        let currentYear = drillState.year;
        let currentMonth = drillState.month;

        if (currentLevel === 'initial') {
            const years = Array.from(new Set(data.map(d => getYear(d[chart.xAxisKey])).filter(y => y !== null)));
            currentLevel = years.length > 1 ? 'year' : 'month';
            currentYear = years.length === 1 ? years[0] : null;
        }

        let processedData = data;
        let xAxisTransform = (val: any) => val;

        if (currentLevel === 'year') {
            xAxisTransform = (val: any) => getYear(val);
        } else if (currentLevel === 'month') {
            // Filter by year if available
            processedData = data.filter(d => {
                const rowYear = getYear(d[chart.xAxisKey]);
                return !currentYear || rowYear === currentYear;
            });
            xAxisTransform = (val: any) => getMonthName(getMonth(val)!);
        } else if (currentLevel === 'day') {
            // Filter by year and month strictly
            processedData = data.filter(d => {
                const rowYear = getYear(d[chart.xAxisKey]);
                const rowMonth = getMonth(d[chart.xAxisKey]);
                const yearMatch = !currentYear || rowYear === currentYear;
                const monthMatch = !currentMonth || rowMonth === currentMonth;
                return yearMatch && monthMatch;
            });
            xAxisTransform = (val: any) => getDay(val);
        }

        // Now aggregate based on the transformed X-axis
        const groups: { [key: string]: { count: number; sum: number, sum2: number, min: number, max: number, min2: number, max2: number } } = {};
        processedData.forEach(row => {
            const key = String(xAxisTransform(row[chart.xAxisKey]));
            const val = Number(row[chart.dataKey]) || 0;
            const val2 = chart.dataKey2 ? (Number(row[chart.dataKey2]) || 0) : 0;

            if (!groups[key]) groups[key] = { count: 0, sum: 0, sum2: 0, min: val, max: val, min2: val2, max2: val2 };
            groups[key].count++;
            groups[key].sum += val;
            groups[key].sum2 += val2;
            if (val < groups[key].min) groups[key].min = val;
            if (val > groups[key].max) groups[key].max = val;
            if (val2 < groups[key].min2) groups[key].min2 = val2;
            if (val2 > groups[key].max2) groups[key].max2 = val2;
        });

        // Convert back to chart data format
        return Object.keys(groups).map(key => {
            let primaryVal = 0;
            if (chart.aggregation === AggregationType.COUNT) primaryVal = groups[key].count;
            else if (chart.aggregation === AggregationType.AVERAGE) primaryVal = groups[key].sum / groups[key].count;
            else if (chart.aggregation === AggregationType.MINIMUM) primaryVal = groups[key].min;
            else if (chart.aggregation === AggregationType.MAXIMUM) primaryVal = groups[key].max;
            else primaryVal = groups[key].sum;

            const result: any = {
                [chart.xAxisKey]: key,
                [chart.dataKey]: parseFloat(primaryVal.toFixed(2))
            };
            if (chart.dataKey2) {
                let secondaryVal = 0;
                if (chart.aggregation === AggregationType.COUNT) secondaryVal = groups[key].count;
                else if (chart.aggregation === AggregationType.AVERAGE) secondaryVal = groups[key].sum2 / groups[key].count;
                else if (chart.aggregation === AggregationType.MINIMUM) secondaryVal = groups[key].min2;
                else if (chart.aggregation === AggregationType.MAXIMUM) secondaryVal = groups[key].max2;
                else secondaryVal = groups[key].sum2;

                result[chart.dataKey2] = parseFloat(secondaryVal.toFixed(2));
            }
            return result;
        }).sort((a, b) => {
            // Sort logic: Years/Months/Days should be in order
            if (currentLevel === 'month') {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return months.indexOf(a[chart.xAxisKey]) - months.indexOf(b[chart.xAxisKey]);
            }
            return String(a[chart.xAxisKey]).localeCompare(String(b[chart.xAxisKey]), undefined, { numeric: true });
        });
    }, [chartDrillStates]);

    const handleDrillDown = useCallback((chartId: string, chart: ChartConfig, clickedValue: any) => {
        const checkIsDate = (col: string) => {
            if (dataModel.columnMetadata?.[col]) {
                const meta = dataModel.columnMetadata[col];
                return (meta.finalType || meta.detectedType) === 'DATE';
            }
            return isDateTimeColumn(col);
        };
        const isXDate = checkIsDate(chart.xAxisKey);
        if (!isXDate) return false;

        const current = chartDrillStates[chartId];
        let effectiveLevel = 'year';
        let currentYear = null;

        if (!current) {
            const years = Array.from(new Set(dataModel.data.map(d => getYear(d[chart.xAxisKey])).filter(y => y !== null)));
            effectiveLevel = years.length > 1 ? 'year' : 'month';
            currentYear = years.length === 1 ? years[0] : null;
        } else {
            effectiveLevel = current.level;
            currentYear = current.year;
        }

        if (effectiveLevel === 'day') return false; // Already at deepest level

        setChartDrillStates(prev => {
            if (effectiveLevel === 'year') {
                return { ...prev, [chartId]: { level: 'month', year: parseInt(clickedValue), month: null } };
            } else if (effectiveLevel === 'month') {
                const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(clickedValue) + 1;
                return { ...prev, [chartId]: { level: 'day', year: currentYear, month: monthIndex } };
            }
            return prev;
        });
        return true;
    }, [dataModel.data, chartDrillStates]);

    const resetDrillDown = useCallback((chartId: string) => {
        setChartDrillStates(prev => {
            const next = { ...prev };
            delete next[chartId];
            return next;
        });
    }, []);

    // --- DRILL-THROUGH DATA COMPUTATION ---
    const computeDrillThroughData = useCallback((sourceChart: ChartConfig, year: number): any[] => {
        if (!sourceChart.drillThrough?.dateColumn) return [];
        const dateCol = sourceChart.drillThrough.dateColumn;
        const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // Filter rows for the selected year
        const yearRows = filteredData.filter(row => getYear(row[dateCol]) === year);
        // Group by month
        const monthGroups: { [m: number]: { sum: number; count: number; min: number; max: number; distinct: Set<string> } } = {};
        yearRows.forEach(row => {
            const m = getMonth(row[dateCol]);
            if (!m) return;
            const val = Number(row[sourceChart.dataKey]) || 0;
            if (!monthGroups[m]) monthGroups[m] = { sum: 0, count: 0, min: val, max: val, distinct: new Set() };
            monthGroups[m].sum += val;
            monthGroups[m].count += 1;
            monthGroups[m].distinct.add(String(row[sourceChart.dataKey] ?? ''));
            if (val < monthGroups[m].min) monthGroups[m].min = val;
            if (val > monthGroups[m].max) monthGroups[m].max = val;
        });
        // Return 12 months in order
        return MONTH_NAMES.map((name, idx) => {
            const m = idx + 1;
            const g = monthGroups[m];
            if (!g) return { [sourceChart.xAxisKey]: name, [sourceChart.dataKey]: 0 };
            let value = g.sum;
            if (sourceChart.aggregation === AggregationType.COUNT) value = g.count;
            else if (sourceChart.aggregation === AggregationType.AVERAGE) value = g.count > 0 ? g.sum / g.count : 0;
            else if (sourceChart.aggregation === AggregationType.MINIMUM) value = g.min;
            else if (sourceChart.aggregation === AggregationType.MAXIMUM) value = g.max;
            else if (sourceChart.aggregation === AggregationType.DISTINCT) value = g.distinct.size;
            return { [sourceChart.xAxisKey]: name, [sourceChart.dataKey]: parseFloat(value.toFixed(2)) };
        });
    }, [filteredData]);

    const toggleFilter = useCallback((column: string, value: any) => {
        setActiveFilters(prev => {
            const next = { ...prev };
            const currentVals = Array.isArray(next[column]) ? [...next[column]] : [];
            const valueStr = String(value);
            const idx = currentVals.findIndex(v => String(v) === valueStr);
            if (idx >= 0) {
                currentVals.splice(idx, 1);
            } else {
                currentVals.push(value);
            }
            if (currentVals.length === 0) {
                delete next[column];
            } else {
                next[column] = currentVals;
            }
            return next;
        });
    }, []);

    const clearFilters = useCallback(() => setActiveFilters({}), []);

    // --- NEW: Manual Filter Dropdown Logic ---
    const [openFilterMenu, setOpenFilterMenu] = useState(false);
    const [selectedFilterCol, setSelectedFilterCol] = useState<string | null>(null);
    const [filterSearch, setFilterSearch] = useState('');
    const [columnSearch, setColumnSearch] = useState('');


    const filterableColumns = useMemo(() => {
        if (!dataModel || !dataModel.columns) return [];
        // If specific filter columns were chosen in ChartBuilder, use only those.
        // Otherwise fall back to all columns present in data.
        const sourceColumns = currentFilterColumns.length > 0
            ? currentFilterColumns.filter(col => dataModel.columns.includes(col))
            : dataModel.columns;
        return sourceColumns.filter(col => {
            if (!col) return false;
            const firstRow = dataModel.data && dataModel.data[0];
            return firstRow && (col in firstRow);
        });
    }, [dataModel, currentFilterColumns]);

    const getUniqueValues = useCallback((column: string): string[] => {
        if (!column || !dataModel || !dataModel.data) return [];
        try {
            const rawValues = Array.from(new Set<string>(dataModel.data.map((r: any) => {
                const val = r[column];
                return val === null || val === undefined ? '' : String(val);
            })));
            return rawValues
                .map(v => (v === 'null' || v === 'undefined' || v === '') ? '(Empty)' : v)
                .sort((a, b) => String(a).localeCompare(String(b)));
        } catch (e) {
            console.error("Error getting unique values for", column, e);
            return [];
        }
    }, [dataModel?.data]);

    // Pre-compute unique values for all sidebar filter columns once — passed as stable prop to FilterSidebar
    const uniqueValuesMap = useMemo(() => {
        const map: { [col: string]: string[] } = {};
        filterableColumns.forEach(col => { map[col] = getUniqueValues(col); });
        return map;
    }, [filterableColumns, getUniqueValues]);

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
        if (dataModel) {
            setCurrentCharts(chartConfigs);
            setCurrentFilterColumns(filterColumns);
            setDashboardName(dataModel.name);
        }
    }, [chartConfigs, filterColumns, dataModel?.name]);

    const kpis = useMemo(() => {
        if (!Array.isArray(currentCharts)) return [];
        return currentCharts.filter(c => c && c.type === ChartType.KPI);
    }, [currentCharts]);

    const charts = useMemo(() => {
        if (!Array.isArray(currentCharts)) return [];
        return currentCharts.filter(c => c && c.type !== ChartType.KPI);
    }, [currentCharts]);

    const [isExporting, setIsExporting] = useState(false);
    const [expandedChartId, setExpandedChartId] = useState<string | null>(null);

    // --- Section-based Tabs ---
    const CHARTS_PER_TAB = 4;

    // Words to skip when picking a section name from chart titles
    const STOP_WORDS = new Set([
        'by', 'of', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'a', 'an',
        'for', 'with', 'per', 'vs', 'total', 'count', 'sum', 'average', 'avg',
        'top', 'over', 'chart', 'graph', 'distribution', 'analysis', 'breakdown',
        'trend', 'monthly', 'annual', 'yearly', 'weekly', 'daily', 'number',
        'report', 'overview', 'summary', 'data', 'view', 'all', 'each'
    ]);

    // Splits chart list into sections
    const sections = useMemo(() => {
        if (currentSections && currentSections.length > 0) {
            // Group by explicit sectionId
            return currentSections.map(s =>
                charts.filter(c => c.sectionId === s.id)
            ).filter(group => group.length > 0 || currentSections.length > 0);
            // We keep empty sections if they were explicitly defined
        }

        // Fallback to automatic splitting
        const result: ChartConfig[][] = [];
        for (let i = 0; i < charts.length; i += CHARTS_PER_TAB) {
            result.push(charts.slice(i, i + CHARTS_PER_TAB));
        }
        return result;
    }, [charts, explicitSections]);

    // Derive unique names for ALL sections
    const deriveSectionNames = (allSections: ChartConfig[][]): string[] => {
        if (currentSections && currentSections.length > 0) {
            return currentSections.map(s => s.name);
        }

        // Normalize a word: lowercase, strip trailing 's'/'es' for basic plural handling
        const normalizeWord = (word: string): string => {
            const lower = word.toLowerCase().replace(/[^a-z]/g, '');
            if (lower.length > 5 && lower.endsWith('es')) return lower.slice(0, -2);
            if (lower.length > 4 && lower.endsWith('s')) return lower.slice(0, -1);
            return lower;
        };

        const usedNames = new Set<string>();

        return allSections.map((sec, i) => {
            if (!sec.length) return `Section ${i + 1}`;

            // Collect candidate words from ALL chart titles in the section (prioritising first chart)
            const candidates: string[] = [];
            sec.forEach(chart => {
                const words = (chart.title || '').split(/\s+/);
                for (const word of words) {
                    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
                    const norm = normalizeWord(word);
                    if (clean.length > 2 && !STOP_WORDS.has(clean) && !STOP_WORDS.has(norm)) {
                        const display = word.replace(/[^a-zA-Z]/g, '');
                        if (display.length > 2) {
                            const label = display.charAt(0).toUpperCase() + display.slice(1).toLowerCase();
                            candidates.push(label);
                        }
                    }
                }
            });

            // Build frequency map on normalized forms, but store display form
            const normFreq: Record<string, { display: string; count: number }> = {};
            candidates.forEach(label => {
                const norm = normalizeWord(label);
                if (!normFreq[norm]) normFreq[norm] = { display: label, count: 0 };
                normFreq[norm].count += 1;
            });

            // Rank by frequency, then try each until we find a unique one
            const ranked = Object.values(normFreq).sort((a, b) => b.count - a.count);

            for (const { display } of ranked) {
                const normKey = normalizeWord(display);
                // Check uniqueness against already-used normalized forms
                const alreadyUsed = Array.from(usedNames).some(u => normalizeWord(u) === normKey);
                if (!alreadyUsed) {
                    usedNames.add(display);
                    return display;
                }
            }

            // Fallback: Section N
            const fallback = `Section ${i + 1}`;
            usedNames.add(fallback);
            return fallback;
        });
    };

    const [activeTab, setActiveTab] = useState(0);

    // Toggle page filter scoped to current activeTab
    const togglePageFilter = useCallback((column: string, value: any) => {
        setPageFilters(prev => {
            const next = { ...prev };
            const currentTabFilters = next[activeTab] ? { ...next[activeTab] } : {};
            const currentVals = Array.isArray(currentTabFilters[column]) ? [...currentTabFilters[column]] : [];
            const valueStr = String(value);
            const idx = currentVals.findIndex(v => String(v) === valueStr);
            if (idx >= 0) {
                currentVals.splice(idx, 1);
            } else {
                currentVals.push(value);
            }
            if (currentVals.length === 0) {
                delete currentTabFilters[column];
            } else {
                currentTabFilters[column] = currentVals;
            }

            if (Object.keys(currentTabFilters).length === 0) {
                delete next[activeTab];
            } else {
                next[activeTab] = currentTabFilters;
            }
            return next;
        });
    }, [activeTab]);

    const clearPageFilters = useCallback(() => {
        setPageFilters(prev => {
            const next = { ...prev };
            delete next[activeTab];
            return next;
        });
    }, [activeTab]);
    const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);
    const [editingTabValue, setEditingTabValue] = useState('');
    const tabInputRef = useRef<HTMLInputElement>(null);

    // Preserve any tab names the user manually renamed
    const [userRenamedTabs, setUserRenamedTabs] = useState<Record<string, string>>({});

    // Compute tab names synchronously — always up to date, no async state needed
    // userRenamedTabs is keyed by the auto-derived name so renames survive chart additions
    const resolvedTabNames = useMemo(() => {
        const derived = deriveSectionNames(sections);
        return derived.map(name => userRenamedTabs[name] ?? name);
    }, [sections, userRenamedTabs]);

    // Focus tab name input when editing starts
    useEffect(() => {
        if (editingTabIndex !== null && tabInputRef.current) {
            tabInputRef.current.focus();
            tabInputRef.current.select();
        }
    }, [editingTabIndex]);

    // Reset to first tab when chart count changes
    useEffect(() => {
        setActiveTab(0);
    }, [charts.length]);

    const activeSection = sections[activeTab] || [];

    const saveTabName = () => {
        if (editingTabIndex !== null) {
            const derived = deriveSectionNames(sections);
            const originalName = derived[editingTabIndex] || `Section ${editingTabIndex + 1}`;
            const newName = editingTabValue.trim() || originalName;
            // Key by the original auto-derived name so rename survives chart additions
            setUserRenamedTabs(prev => ({ ...prev, [originalName]: newName }));
            setEditingTabIndex(null);
        }
    };


    const expandedChartConfig = useMemo(() => {
        if (!currentCharts) return undefined;
        return currentCharts.find(c => c.id === expandedChartId);
    }, [expandedChartId, currentCharts]);

    // --- NEW: PDF Export Logic ---
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    interface PDFPageContent {
        pageId: number;
        tabIndex: number;
        tabName: string;
        charts: ChartConfig[];
        isFirstPageOfTab: boolean;
        isFirstPageOfPDF: boolean;
        pageKPIs?: ChartConfig[];
    }

    const pdfExportPages = useMemo(() => {
        if (!isExportingPDF) return [];

        const pages: PDFPageContent[] = [];
        if (sections.length === 0) return [];

        // Tab 1
        const tab1Name = resolvedTabNames[0] || "Summary";
        const tab1Charts = sections[0] || [];

        // Calculate how much space KPIs take on the first page to adjust chart count
        const kpiRows = Math.ceil(kpis.length / 4);
        let chartsOnFirstPage = 6;
        
        if (kpiRows >= 5) {
            chartsOnFirstPage = 0; // If lots of KPIs, don't put charts on first page
        } else if (kpiRows >= 4) {
            chartsOnFirstPage = 2; // 4 rows of KPIs = 2 charts
        } else if (kpiRows >= 1) {
            chartsOnFirstPage = 4; // 1-3 rows of KPIs = 4 charts
        }

        // First page of Tab 1 (and PDF)
        pages.push({
            pageId: 1,
            tabIndex: 0,
            tabName: tab1Name,
            charts: tab1Charts.slice(0, chartsOnFirstPage),
            isFirstPageOfTab: true,
            isFirstPageOfPDF: true,
            pageKPIs: kpis
        });

        // Tab 1 Overflow
        if (tab1Charts.length > chartsOnFirstPage) {
            for (let i = chartsOnFirstPage; i < tab1Charts.length; i += 6) {
                pages.push({
                    pageId: pages.length + 1,
                    tabIndex: 0,
                    tabName: tab1Name,
                    charts: tab1Charts.slice(i, i + 6),
                    isFirstPageOfTab: false,
                    isFirstPageOfPDF: false
                });
            }
        }

        // Subsequent Tabs
        for (let t = 1; t < sections.length; t++) {
            const tabName = resolvedTabNames[t] || `Section ${t + 1}`;
            const tabCharts = sections[t] || [];

            for (let i = 0; i < tabCharts.length; i += 6) {
                pages.push({
                    pageId: pages.length + 1,
                    tabIndex: t,
                    tabName: tabName,
                    charts: tabCharts.slice(i, i + 6),
                    isFirstPageOfTab: i === 0,
                    isFirstPageOfPDF: false
                });
            }
        }

        return pages;
    }, [isExportingPDF, sections, kpis, resolvedTabNames]);

    const handleExportPDF = async () => {
        setIsExporting(true);
        setIsExportingPDF(true);

        // Wait for all charts to render in the hidden export view
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4',
                compress: true
            });

            const pageElements = document.querySelectorAll('[data-pdf-page]');
            if (!pageElements.length) throw new Error("Export elements not found");

            const bgColor = theme === 'dark' ? '#0f172a' : '#f8fafc';
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < pageElements.length; i++) {
                const el = pageElements[i] as HTMLElement;

                const canvas = await html2canvas(el, {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    backgroundColor: bgColor,
                    width: 1200, // Widened for more internal chart space
                    height: 1696,
                    windowWidth: 1200,
                    windowHeight: 1696
                });

                // Use JPEG for faster generation and smaller file size
                const imgData = canvas.toDataURL('image/jpeg', 0.85);

                if (i > 0) pdf.addPage();

                // Ensure page background
                pdf.setFillColor(bgColor);
                pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            pdf.save(`${dataModel.name.replace(/\s+/g, '_')}_Report.pdf`);
        } catch (error) {
            console.error("Export PDF Error:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsExporting(false);
            setIsExportingPDF(false);
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
        onSave(dashboardName, currentCharts, currentSections, currentFilterColumns);
        setIsSaveModalOpen(false);
    };

    const handleUpdateFromBuilder = (updatedCharts: ChartConfig[], updatedFilterCols: string[], updatedSections?: DashboardSection[]) => {
        setCurrentCharts(updatedCharts);
        setCurrentFilterColumns(updatedFilterCols);
        if (updatedSections) setCurrentSections(updatedSections);
        setIsEditing(false);
    };

    try {
        if (!dataModel) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
                    <LayoutDashboard className="w-16 h-16 text-slate-700 mb-4" />
                    <h2 className="text-xl font-bold">Data Model Missing</h2>
                    <p className="text-slate-400 mt-2">Could not find data to display. Please try uploading your file again.</p>
                    <button onClick={onHome} className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg">Return Home</button>
                </div>
            );
        }

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
                            onGenerateReport={(updatedCharts, updatedFilterCols, updatedSections) => handleUpdateFromBuilder(updatedCharts, updatedFilterCols, updatedSections)}
                            onHome={() => setIsEditing(false)}
                            initialBucket={currentCharts}
                            initialFilterColumns={currentFilterColumns}
                            sections={currentSections}
                            mode="update"
                        />
                    </div>
                )}

                {/* ── DRILL-THROUGH MODAL (Power BI style) ── */}
                {drillThroughState && (() => {
                    const { sourceChart, clickedYear } = drillThroughState;
                    const drillData = computeDrillThroughData(sourceChart, clickedYear);
                    // Build a virtual chart config for the monthly view
                    const monthlyConfig: ChartConfig = {
                        ...sourceChart,
                        id: `${sourceChart.id}-drillthrough`,
                        title: `${sourceChart.title} — ${clickedYear} Monthly Breakdown`,
                        description: `Month-by-month breakdown for ${clickedYear}`,
                        aggregation: AggregationType.NONE, // data is already pre-aggregated
                        sortOrder: undefined,
                        topN: undefined,
                        dateFilters: undefined,
                        drillThrough: undefined,
                        type: sourceChart.type === 'HORIZONTAL_BAR' ? 'HORIZONTAL_BAR' : 'BAR',
                    };
                    return (
                        <div className={`fixed inset-0 z-[60] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 lg:p-8 animate-fade-in no-print`}>
                            <div className={`${colors.bgSecondary} w-full h-full max-w-7xl max-h-[92vh] rounded-2xl border ${colors.borderPrimary} shadow-2xl flex flex-col relative`}>
                                {/* Header */}
                                <div className={`p-5 border-b ${colors.borderPrimary} flex items-center justify-between gap-4`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Breadcrumb */}
                                        <button
                                            onClick={() => setDrillThroughState(null)}
                                            className={`flex items-center gap-1.5 text-sm font-medium ${colors.textMuted} hover:text-indigo-400 transition-colors shrink-0`}
                                        >
                                            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                                            {sourceChart.title}
                                        </button>
                                        <span className={`${colors.textMuted} text-sm`}>›</span>
                                        <div className="min-w-0">
                                            <h2 className={`text-lg sm:text-xl font-bold ${colors.textPrimary} truncate`}>
                                                {clickedYear} — Monthly View
                                            </h2>
                                            <p className={`text-xs ${colors.textMuted} mt-0.5`}>
                                                Click a bar to go back · Showing Jan – Dec {clickedYear}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDrillThroughState(null)}
                                        className={`shrink-0 p-2 ${colors.bgTertiary} hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors ${colors.textMuted}`}
                                        title="Close drill-through"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Year nav pills */}
                                <div className={`px-5 py-2 border-b ${colors.borderPrimary} flex items-center gap-2 flex-wrap`}>
                                    <span className={`text-[11px] uppercase tracking-wider font-bold ${colors.textMuted}`}>Jump to year:</span>
                                    {Array.from(new Set(
                                        filteredData
                                            .map(row => getYear(row[sourceChart.drillThrough!.dateColumn]))
                                            .filter((y): y is number => y !== null)
                                    )).sort().map(yr => (
                                        <button
                                            key={yr}
                                            onClick={() => setDrillThroughState({ sourceChart, clickedYear: yr })}
                                            className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all ${
                                                yr === clickedYear
                                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                                    : `${colors.bgTertiary} ${colors.textMuted} hover:text-indigo-400`
                                            }`}
                                        >
                                            {yr}
                                        </button>
                                    ))}
                                </div>

                                {/* Chart area */}
                                <div className="flex-1 p-6 min-h-0">
                                    {drillData.every(d => d[sourceChart.dataKey] === 0) ? (
                                        <div className={`flex flex-col items-center justify-center h-full gap-3 ${colors.textMuted}`}>
                                            <TrendingUp className="w-12 h-12 opacity-30" />
                                            <p className="text-sm font-medium">No data available for {clickedYear}</p>
                                        </div>
                                    ) : (
                                        <RenderChart
                                            config={monthlyConfig}
                                            data={drillData}
                                            isExpanded={true}
                                            theme={theme}
                                            columnMetadata={dataModel.columnMetadata}
                                            isAnimationActive={true}
                                        />
                                    )}
                                </div>

                                {/* Footer */}
                                <div className={`px-5 py-3 border-t ${colors.borderPrimary} flex items-center justify-between`}>
                                    <p className={`text-[11px] ${colors.textMuted}`}>
                                        Drill-through from <span className="font-semibold">{sourceChart.title}</span>
                                    </p>
                                    <button
                                        onClick={() => setDrillThroughState(null)}
                                        className={`text-xs font-medium px-3 py-1.5 rounded-lg ${colors.bgTertiary} ${colors.textMuted} hover:text-indigo-400 transition-colors flex items-center gap-1`}
                                    >
                                        <ArrowRight className="w-3 h-3 rotate-180" /> Back to Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Expanded Chart Modal */}
                {expandedChartConfig && (
                    <div className={`fixed inset-0 z-50 ${colors.overlayBg} glass-effect flex items-center justify-center p-4 lg:p-8 animate-fade-in no-print`}>
                        <div className={`${colors.bgSecondary} w-full h-full max-w-7xl max-h-[90vh] rounded-2xl border ${colors.borderPrimary} shadow-2xl elevation-lg flex flex-col relative`}>
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
                                    data={(() => {
                                        const baseData = expandedChartConfig.ignoreGlobalFilters ? dataModel.data : filteredData;
                                        return isDateTimeColumn(expandedChartConfig.xAxisKey) 
                                            ? getDrillDownData(expandedChartConfig, applyChartFilters(baseData, expandedChartConfig.id))
                                            : aggregateData(applyChartFilters(baseData, expandedChartConfig.id), expandedChartConfig);
                                    })()}
                                    isExpanded={true}
                                    theme={theme}
                                    isAnimationActive={!isExporting}
                                    onItemClick={(val) => {
                                        const drilled = handleDrillDown(expandedChartConfig.id, expandedChartConfig, val);
                                        if (!drilled) toggleFilter(expandedChartConfig.xAxisKey, val);
                                    }}
                                    activeFilterValue={activeFilters[expandedChartConfig.xAxisKey]}
                                    columnMetadata={dataModel.columnMetadata}
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
                    <header className={`${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'} glass-effect border-b ${colors.borderPrimary} px-4 sm:px-6 lg:px-8 py-3 sm:py-4 sticky top-0 z-30 shadow-lg print:hidden`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center max-w-7xl mx-auto w-full gap-3 md:gap-0">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button onClick={onHome} className={`p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 rounded-full hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition no-export shrink-0 active-press`} title="Return Home">
                                    <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <div className="min-w-0 flex-1">
                                    <h1 data-pdf-title className={`text-base sm:text-xl font-bold ${colors.textPrimary} flex items-center gap-2 flex-wrap`}>
                                        <span className="truncate">{dataModel.name}</span>
                                        <span data-pdf-badge className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wider shrink-0">Live</span>
                                        {(dataModel.sourceType === 'google_sheet' || dataModel.sourceType === 'sharepoint') && (
                                            <button
                                                onClick={handleRefresh}
                                                disabled={isRefreshing}
                                                className={`p-1.5 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:text-indigo-400 transition flex items-center gap-1.5 active-press`}
                                                title="Refresh Data"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                                                <span className="text-[10px] font-bold uppercase hidden sm:inline">Refresh</span>
                                            </button>
                                        )}
                                    </h1>
                                    <p className={`text-[10px] sm:text-xs ${colors.textMuted} truncate`}>InsightAI Generated Report</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 no-export w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className={`flex items-center gap-2 ${colors.textTertiary} hover:${colors.textPrimary} px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:${colors.bgTertiary} transition font-medium text-xs sm:text-sm border border-transparent hover:${colors.borderSecondary} whitespace-nowrap active-press`}
                                        title="Edit Charts"
                                    >
                                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">Edit / Add Charts</span>
                                    </button>
                                    <button
                                        onClick={openSaveModal}
                                        className={`flex items-center gap-2 ${colors.textTertiary} hover:${colors.textPrimary} px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:${colors.bgTertiary} transition font-medium text-xs sm:text-sm border border-transparent hover:${colors.borderSecondary} active-press`}
                                        title="Save Dashboard"
                                    >
                                        <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">Save</span>
                                    </button>
                                    {/* <button className={`flex items-center gap-2 ${colors.textTertiary} hover:${colors.textPrimary} px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:${colors.bgTertiary} transition font-medium text-xs sm:text-sm border border-transparent hover:${colors.borderSecondary} active-press`}>
                                    <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Share</span>
                                </button> */}
                                    <ThemeToggle className="scale-90 sm:scale-100" />
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleExportPDF}
                                        disabled={isExporting}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-wait text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition font-medium text-xs sm:text-sm shadow-lg shadow-indigo-900/20 whitespace-nowrap active-press"
                                    >
                                        {isExporting ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                        {isExporting ? '...' : <span className="hidden xs:inline">Export PDF</span>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* --- Interactive Filter Bar --- */}
                    <div data-pdf-filter-bar className={`${colors.bgSecondary} border-b ${colors.borderPrimary} px-4 sm:px-6 lg:px-8 py-2 sticky top-[57px] sm:top-[65px] md:top-[73px] z-20 shadow-sm print:hidden`}>
                        <div className="max-w-full mx-auto flex flex-wrap items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Filter className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Active Filters</span>
                            </div>

                            {Object.keys(activeFilters).length === 0 ? (
                                <div className={`text-[10px] sm:text-xs ${colors.textMuted} italic`}>
                                    {filterColumns.length > 0 ? 'Use the sidebar to filter the dashboard...' : 'Click on any chart element to filter the dashboard...'}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 items-center">
                                    {Object.entries(activeFilters).map(([col, vals]) => {
                                        const valArray = Array.isArray(vals) ? vals : [vals];
                                        return valArray.map((val, idx) => (
                                            <div
                                                key={`${col}-${idx}`}
                                                className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium"
                                            >
                                                <span className="opacity-60">{col}:</span>
                                                <span className="font-bold">{String(val)}</span>
                                                <button
                                                    onClick={() => toggleFilter(col, val)}
                                                    className="ml-1 hover:text-white transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ));
                                    })}
                                    <button
                                        onClick={clearFilters}
                                        className={`flex items-center gap-1.5 px-2 py-1 text-[10px] sm:text-xs font-bold ${colors.textMuted} hover:text-red-400 transition-colors uppercase`}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Clear All
                                    </button>
                                </div>
                            )}

                            {/* Manual 'Add Filter' Dropdown — only shown when no sidebar filter columns are configured */}
                            {currentFilterColumns.length === 0 && (
                            <div className="relative ml-2 border-l border-slate-700/50 pl-4">
                                <button
                                    onClick={() => {
                                        setOpenFilterMenu(!openFilterMenu);
                                        setSelectedFilterCol(null);
                                        setColumnSearch('');
                                        setFilterSearch('');
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${openFilterMenu ? 'bg-indigo-500 border-indigo-400 text-white' : `${colors.bgPrimary} ${colors.borderSecondary} ${colors.textSecondary} hover:${colors.borderPrimary} hover:${colors.textPrimary}`} transition-all text-xs font-bold shadow-lg active-press`}
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Filter</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${openFilterMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {openFilterMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setOpenFilterMenu(false)}></div>
                                        <div className={`absolute top-full left-0 mt-3 w-72 max-h-[450px] overflow-hidden ${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 flex flex-col`}>

                                            {!selectedFilterCol ? (
                                                // STEP 1: Select Column
                                                <>
                                                    <div className={`p-3 border-b ${colors.borderPrimary} ${colors.bgTertiary}/30`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.textMuted}`}>Select Column</span>
                                                            <X className="w-3.5 h-3.5 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setOpenFilterMenu(false)} />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Search columns..."
                                                            autoFocus
                                                            className={`w-full px-3 py-2 text-xs rounded-lg ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                                                            value={columnSearch}
                                                            onChange={(e) => setColumnSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="overflow-y-auto p-1.5 no-scrollbar max-h-80">
                                                        {filterableColumns
                                                            .filter(c => c.toLowerCase().includes(columnSearch.toLowerCase()))
                                                            .map(col => (
                                                                <button
                                                                    key={col}
                                                                    onClick={() => setSelectedFilterCol(col)}
                                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all mb-0.5 ${activeFilters[col] ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                                                >
                                                                    <div className="flex flex-col items-start truncate mr-2">
                                                                        {col.includes('.') && <span className="text-[9px] opacity-50 block">{col.split('.')[0]}</span>}
                                                                        <span className="truncate">{col.includes('.') ? col.split('.').pop() : col}</span>
                                                                    </div>
                                                                    <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-30" />
                                                                </button>
                                                            ))}
                                                    </div>
                                                </>
                                            ) : (
                                                // STEP 2: Select Value
                                                <>
                                                    <div className={`p-3 border-b ${colors.borderPrimary} ${colors.bgTertiary}/30`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <button
                                                                onClick={() => setSelectedFilterCol(null)}
                                                                className="p-1 rounded-md hover:bg-slate-700/50 transition"
                                                            >
                                                                <Home className="w-3.5 h-3.5" />
                                                            </button>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 truncate">
                                                                {selectedFilterCol.includes('.') ? selectedFilterCol.split('.').pop() : selectedFilterCol}
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Search values..."
                                                            autoFocus
                                                            className={`w-full px-3 py-2 text-xs rounded-lg ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                                                            value={filterSearch}
                                                            onChange={(e) => setFilterSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="overflow-y-auto p-1.5 no-scrollbar max-h-80">
                                                        {getUniqueValues(selectedFilterCol)
                                                            .filter(v => String(v).toLowerCase().includes(filterSearch.toLowerCase()))
                                                            .map(val => {
                                                                const valueStr = String(val);
                                                                const actualVal = valueStr === '(Empty)' ? '' : valueStr;
                                                                const colVals = Array.isArray(activeFilters[selectedFilterCol]) ? activeFilters[selectedFilterCol] : [];
                                                                const isSelected = colVals.some((v: any) => String(v) === String(actualVal));
                                                                return (
                                                                    <button
                                                                        key={valueStr}
                                                                        onClick={() => {
                                                                            if (selectedFilterCol) {
                                                                                toggleFilter(selectedFilterCol, actualVal);
                                                                            }
                                                                            setOpenFilterMenu(false);
                                                                        }}
                                                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all mb-0.5 ${isSelected ? 'bg-indigo-500/20 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                                                    >
                                                                        <span className="truncate mr-4">{valueStr}</span>
                                                                        {isSelected && <Check className="w-4 h-4 shrink-0 text-indigo-400" />}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            )}

                            {/* Summary of visible vs total */}
                            <div className="ml-auto flex items-center gap-2 text-[10px] sm:text-xs font-medium">
                                <span className={colors.textMuted}>Showing</span>
                                <span className="text-indigo-400 font-bold">{filteredData.length.toLocaleString()}</span>
                                <span className={colors.textMuted}>/</span>
                                <span className={colors.textPrimary}>{dataModel.data.length.toLocaleString()}</span>
                                <span className={colors.textMuted}>rows</span>
                            </div>
                        </div>
                    </div>

                    {/* Print Header */}
                    <div className={`hidden print:block px-8 py-6 border-b ${colors.borderPrimary} mb-6`}>
                        <h1 className={`text-3xl font-bold ${colors.textPrimary}`}>{dataModel.name} Dashboard</h1>
                        <p className={`${colors.textMuted}`}>Generated via InsightAI</p>
                    </div>

                    <div className="flex flex-1 min-h-0 print:block">

                    {/* --- Filter Sidebar (only when filterColumns are configured) --- */}
                    {currentFilterColumns.length > 0 && (
                        <FilterSidebar
                            filterableColumns={filterableColumns}
                            activeFilters={activeFilters}
                            pageFilters={pageFilters[activeTab] || {}}
                            activeTabName={resolvedTabNames[activeTab] || `Tab ${activeTab + 1}`}
                            uniqueValuesMap={uniqueValuesMap}
                            toggleFilter={toggleFilter}
                            clearFilters={clearFilters}
                            togglePageFilter={togglePageFilter}
                            clearPageFilters={clearPageFilters}
                            theme={theme}
                            colors={colors}
                        />
                    )}

                    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 print:p-4">

                        {/* KPIs Row */}
                        {kpis.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:grid-cols-4">
                                {kpis.map((kpi, i) => {
                                    const baseData = kpi.ignoreGlobalFilters ? dataModel.data : filteredData;
                                    const data = aggregateData(applyChartFilters(baseData, kpi.id), kpi);
                                    const value = data[0]?.value || 0;
                                    const displayValue = smartFormat(value, kpi.dataKey, dataModel.columnMetadata);
                                    return (
                                        <div key={kpi.id} className={`${colors.bgSecondary} rounded-xl border ${colors.borderPrimary} p-6 shadow-xl relative overflow-hidden group print:shadow-none ${theme === 'dark' ? 'print:border-slate-600' : 'print:border-slate-300'} hover-lift elevation-lg`}>
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

                        {/* Section Tabs - show whenever there are charts */}
                        {sections.length > 0 && resolvedTabNames.length > 0 && (
                            <div className="mb-6">
                                <div className={`flex items-center gap-1 p-1 rounded-xl ${theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-100'} border ${colors.borderPrimary} w-fit max-w-full overflow-x-auto no-scrollbar`}>
                                    {resolvedTabNames.map((name, i) => (
                                        <div key={i} className="relative group/tab flex items-center shrink-0">
                                            {editingTabIndex === i ? (
                                                <input
                                                    ref={tabInputRef}
                                                    type="text"
                                                    value={editingTabValue}
                                                    onChange={e => setEditingTabValue(e.target.value)}
                                                    onBlur={saveTabName}
                                                    onKeyDown={e => e.key === 'Enter' && saveTabName()}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold outline-none border-b-2 border-indigo-500 bg-transparent ${colors.textPrimary} w-32`}
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => setActiveTab(i)}
                                                    onDoubleClick={() => {
                                                        setEditingTabIndex(i);
                                                        setEditingTabValue(name);
                                                    }}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === i
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                                                        : `${colors.textMuted} hover:${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-white'}`
                                                        }`}
                                                >
                                                    <span>{name}</span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === i
                                                        ? 'bg-white/20 text-white'
                                                        : `${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`
                                                        }`}>
                                                        {sections[i]?.length}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className={`text-[10px] ${colors.textMuted} mt-1.5 ml-1`}>Double-click a tab to rename it</p>
                            </div>
                        )}

                        {/* Charts Grid - shows only active section */}
                        {sections.length > 0 ? (
                            <div key={activeTab} className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 animate-fade-in">
                                {activeSection.map(chart => {
                                    const isXDate = (dataModel.columnMetadata?.[chart.xAxisKey])
                                        ? (dataModel.columnMetadata[chart.xAxisKey].finalType || dataModel.columnMetadata[chart.xAxisKey].detectedType) === 'DATE'
                                        : isDateTimeColumn(chart.xAxisKey);
                                        
                                    // Base data: ignoring global filters if configured to do so
                                    const baseData = chart.ignoreGlobalFilters ? dataModel.data : filteredData;

                                    // Apply Page Filters (only for charts in this section)
                                    let pageFilteredData = baseData;
                                    const activePageFilters = pageFilters[activeTab];
                                    if (activePageFilters && Object.keys(activePageFilters).length > 0) {
                                        pageFilteredData = pageFilteredData.filter(row => {
                                            if (!row) return false;
                                            return Object.entries(activePageFilters).every(([col, vals]) => {
                                                if (!Array.isArray(vals) || vals.length === 0) return true;
                                                return vals.some(v => String(row[col]) === String(v));
                                            });
                                        });
                                    }

                                    // Apply per-chart filters BEFORE aggregation for proper filtering
                                    const chartPreFilteredData = applyChartFilters(pageFilteredData, chart.id);
                                    const aggregatedData = isXDate 
                                        ? getDrillDownData(chart, chartPreFilteredData)
                                        : aggregateData(chartPreFilteredData, chart);
                                    const hasChartFilters = chartFilters[chart.id] && Object.keys(chartFilters[chart.id]).length > 0;
                                    const drillState = chartDrillStates[chart.id];
                                    const isDrilled = drillState && drillState.level !== 'year' && (drillState.level !== 'month' || drillState.year !== null);
                                    return (
                                        <div 
                                            key={chart.id}
                                            onMouseEnter={() => { hoveredChartRef.current = chart.id; }}
                                            onMouseLeave={() => { hoveredChartRef.current = null; }}
                                            className={`${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} p-6 shadow-lg h-[420px] print:h-[380px] flex flex-col hover:${colors.borderHover} transition-all print:shadow-none ${theme === 'dark' ? 'print:border-slate-600' : 'print:border-slate-300'} print:break-inside-avoid print:p-4 relative elevation-md overflow-hidden group`}>
                                            <div className="mb-6 pr-20">
                                                <h3 className={`font-bold text-lg ${colors.textSecondary} truncate`}>{chart.title}</h3>
                                                <p className={`text-xs ${colors.textMuted} mt-1 truncate`}>{chart.description}</p>
                                                {isDrilled && (
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
                                                            {drillState.level === 'month' ? `Year: ${drillState.year}` : `Month: ${getMonthName(drillState.month!)} ${drillState.year}`}
                                                        </span>
                                                        <button 
                                                            onClick={() => resetDrillDown(chart.id)}
                                                            className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
                                                        >
                                                            Reset View
                                                        </button>
                                                    </div>
                                                )}
                                                {hasChartFilters && (
                                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                        {Object.entries(chartFilters[chart.id] || {}).map(([col, vals]) => {
                                                            const valArray = Array.isArray(vals) ? vals : [vals];
                                                            return valArray.map((val, idx) => (
                                                                <span key={`${col}-${idx}`} className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                                                    {col}: <span className="font-bold">{String(val).slice(0, 12)}</span>
                                                                </span>
                                                            ));
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <div className={`absolute top-4 right-4 z-20 chart-controls no-print flex gap-2 items-center transition-opacity duration-200 opacity-0 group-hover:opacity-100 ${chartFilterMenuOpen === chart.id || topBottomMenuOpen === chart.id ? 'opacity-100' : ''}`}>
                                                {hasChartFilters && (
                                                    <button
                                                        onClick={() => clearChartFilters(chart.id)}
                                                        className={`p-2 ${colors.bgTertiary} hover:bg-red-600/20 ${colors.textMuted} hover:text-red-400 rounded-lg transition-all shadow-lg active-press`}
                                                        title="Clear Chart Filters"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {/* Top N / Bottom N Button — only for eligible chart types */}
                                                {TOPBOTTOM_ELIGIBLE_TYPES.has(chart.type) && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => {
                                                                setTopBottomMenuOpen(topBottomMenuOpen === chart.id ? null : chart.id);
                                                                setChartFilterMenuOpen(null);
                                                            }}
                                                            className={`p-2 rounded-lg transition-all shadow-lg active-press ${topBottomMenuOpen === chart.id ? 'bg-indigo-600 text-white' : (chart.topN ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : `${colors.bgTertiary} ${colors.textMuted} hover:bg-indigo-600/20 hover:text-indigo-400`)}`}
                                                            title={chart.topN ? `${chart.sortOrder === 'DESC' ? 'Top' : 'Bottom'} ${chart.topN}` : 'Top / Bottom N'}
                                                        >
                                                            <TrendingUp className="w-4 h-4" />
                                                        </button>

                                                        {topBottomMenuOpen === chart.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={() => setTopBottomMenuOpen(null)}></div>
                                                                <div
                                                                    className={`absolute top-full right-0 mt-2 w-56 ${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 flex flex-col overflow-hidden pointer-events-auto`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <div className={`p-3 border-b ${colors.borderPrimary} ${colors.bgTertiary}/30`}>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.textMuted}`}>Top / Bottom N</span>
                                                                            <X className="w-3.5 h-3.5 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setTopBottomMenuOpen(null)} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-3 space-y-3">
                                                                        {/* Radio Buttons */}
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => updateChartTopBottom(chart.id, 'DESC', chart.topN || 5)}
                                                                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                                                                    chart.sortOrder === 'DESC'
                                                                                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                                                                                        : `${colors.bgPrimary} ${colors.borderSecondary} ${colors.textMuted} hover:${colors.borderPrimary}`
                                                                                }`}
                                                                            >
                                                                                <span>▲</span> Top N
                                                                            </button>
                                                                            <button
                                                                                onClick={() => updateChartTopBottom(chart.id, 'ASC', chart.topN || 5)}
                                                                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                                                                    chart.sortOrder === 'ASC'
                                                                                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                                                                                        : `${colors.bgPrimary} ${colors.borderSecondary} ${colors.textMuted} hover:${colors.borderPrimary}`
                                                                                }`}
                                                                            >
                                                                                <span>▼</span> Bottom N
                                                                            </button>
                                                                        </div>
                                                                        {/* Numeric Input */}
                                                                        {chart.sortOrder && (
                                                                            <div>
                                                                                <label className={`text-[10px] font-bold uppercase ${colors.textMuted} mb-1 block`}>Number of items</label>
                                                                                <input
                                                                                    type="number"
                                                                                    min={1}
                                                                                    max={100}
                                                                                    value={chart.topN || ''}
                                                                                    onChange={(e) => {
                                                                                        const val = parseInt(e.target.value);
                                                                                        if (!isNaN(val) && val > 0) {
                                                                                            updateChartTopBottom(chart.id, chart.sortOrder, val);
                                                                                        } else if (e.target.value === '') {
                                                                                            updateChartTopBottom(chart.id, chart.sortOrder, undefined);
                                                                                        }
                                                                                    }}
                                                                                    placeholder="e.g. 5"
                                                                                    className={`w-full px-3 py-2 text-sm rounded-lg ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {/* Clear Button */}
                                                                        {(chart.sortOrder || chart.topN) && (
                                                                            <button
                                                                                onClick={() => clearChartTopBottom(chart.id)}
                                                                                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${colors.textMuted} hover:text-red-400 hover:bg-red-500/10 transition-all border ${colors.borderSecondary}`}
                                                                            >
                                                                                <Trash2 className="w-3 h-3" /> Clear
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => {
                                                            setChartFilterMenuOpen(chartFilterMenuOpen === chart.id ? null : chart.id);
                                                            setChartFilterColumn(prev => ({ ...prev, [chart.id]: null }));
                                                            setChartFilterSearch(prev => ({ ...prev, [chart.id]: '' }));
                                                            setTopBottomMenuOpen(null);
                                                        }}
                                                        className={`p-2 rounded-lg transition-all shadow-lg active-press ${chartFilterMenuOpen === chart.id ? 'bg-indigo-600 text-white' : `${colors.bgTertiary} ${colors.textMuted} hover:bg-indigo-600/20 hover:text-indigo-400`}`}
                                                        title="Add Chart Filter"
                                                    >
                                                        <Filter className="w-4 h-4" />
                                                    </button>

                                                    {chartFilterMenuOpen === chart.id && (
                                                        <>
                                                            <div 
                                                                className="fixed inset-0 z-40 pointer-events-none"
                                                            ></div>
                                                            <div 
                                                                className={`absolute top-full right-0 mt-2 w-72 max-h-[400px] overflow-hidden ${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 flex flex-col pointer-events-auto`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                }}
                                                            >
                                                                {!chartFilterColumn[chart.id] ? (
                                                                    // STEP 1: Select Column
                                                                    <>
                                                                        <div className={`p-3 border-b ${colors.borderPrimary} ${colors.bgTertiary}/30`}>
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.textMuted}`}>Filter by Column</span>
                                                                                <X className="w-3.5 h-3.5 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setChartFilterMenuOpen(null)} />
                                                                            </div>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Search columns..."
                                                                                autoFocus
                                                                                className={`w-full px-3 py-2 text-xs rounded-lg ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                                                                                value={chartFilterSearch[chart.id] || ''}
                                                                                onChange={(e) => setChartFilterSearch(prev => ({ ...prev, [chart.id]: e.target.value }))}
                                                                            />
                                                                        </div>
                                                                        <div className="overflow-y-auto p-1.5 no-scrollbar max-h-80 pointer-events-auto">
                                                                            {filterableColumns
                                                                                .filter(c => c.toLowerCase().includes((chartFilterSearch[chart.id] || '').toLowerCase()))
                                                                                .map(col => (
                                                                                    <button
                                                                                        type="button"
                                                                                        key={col}
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            setChartFilterColumn(prev => ({ ...prev, [chart.id]: col }));
                                                                                        }}
                                                                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all mb-0.5 ${(chartFilters[chart.id]?.[col]) ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                                                                    >
                                                                                        <div className="flex flex-col items-start truncate mr-2">
                                                                                            {col.includes('.') && <span className="text-[9px] opacity-50 block">{col.split('.')[0]}</span>}
                                                                                            <span className="truncate">{col.includes('.') ? col.split('.').pop() : col}</span>
                                                                                        </div>
                                                                                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-30" />
                                                                                    </button>
                                                                                ))}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    // STEP 2: Select Value
                                                                    <>
                                                                        <div className={`p-3 border-b ${colors.borderPrimary} ${colors.bgTertiary}/30`}>
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <button
                                                                                    onClick={() => setChartFilterColumn(prev => ({ ...prev, [chart.id]: null }))}
                                                                                    className="p-1 rounded-md hover:bg-slate-700/50 transition"
                                                                                >
                                                                                    <Home className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 truncate">
                                                                                    {chartFilterColumn[chart.id]?.includes('.') ? chartFilterColumn[chart.id]?.split('.').pop() : chartFilterColumn[chart.id]}
                                                                                </span>
                                                                            </div>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Search values..."
                                                                                autoFocus
                                                                                className={`w-full px-3 py-2 text-xs rounded-lg ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                                                                                value={chartFilterSearch[chart.id] || ''}
                                                                                onChange={(e) => setChartFilterSearch(prev => ({ ...prev, [chart.id]: e.target.value }))}
                                                                            />
                                                                        </div>
                                                                        <div className="overflow-y-auto p-1.5 no-scrollbar max-h-80 pointer-events-auto">
                                                                            {getUniqueValues(chartFilterColumn[chart.id] || '')
                                                                                .filter(v => String(v).toLowerCase().includes((chartFilterSearch[chart.id] || '').toLowerCase()))
                                                                                .map(val => {
                                                                                    const valueStr = String(val);
                                                                                    const actualVal = valueStr === '(Empty)' ? '' : valueStr;
                                                                                    const col = chartFilterColumn[chart.id] || '';
                                                                                    const selectedValues = chartFilters[chart.id]?.[col] || [];
                                                                                    const isSelected = selectedValues.some((v: any) => String(v) === String(actualVal));
                                                                                    return (
                                                                                        <button
                                                                                            type="button"
                                                                                            key={`${col}-${valueStr}`}
                                                                                            onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                console.log('Button clicked:', valueStr, 'for column:', col);
                                                                                                toggleChartFilter(chart.id, col, actualVal);
                                                                                            }}
                                                                                            onMouseDown={(e) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                            }}
                                                                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all mb-0.5 ${isSelected ? 'bg-indigo-500/20 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                                                                        >
                                                                                            <span className="truncate mr-4">{valueStr}</span>
                                                                                            {isSelected && <Check className="w-4 h-4 shrink-0 text-indigo-400" />}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                {/* Bar Chart Orientation Toggle */}
                                                {(chart.type === ChartType.BAR || chart.type === ChartType.HORIZONTAL_BAR) && (
                                                    <button
                                                        onClick={() => toggleChartOrientation(chart.id)}
                                                        className={`p-2 ${colors.bgTertiary} hover:bg-emerald-600/20 ${colors.textMuted} hover:text-emerald-400 rounded-lg transition-all shadow-lg active-press`}
                                                        title={chart.type === ChartType.BAR ? "Switch to Horizontal Bar" : "Switch to Vertical Bar"}
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setExpandedChartId(chart.id)}
                                                    className={`p-2 ${colors.bgTertiary} hover:bg-indigo-600 ${colors.textMuted} hover:text-white rounded-lg transition-all shadow-lg active-press`}
                                                    title="Maximize Chart"
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex-1 w-full min-h-0 min-w-0 overflow-hidden">
                                                <RenderChart
                                                    config={chart}
                                                    data={aggregatedData}
                                                    theme={theme}
                                                    isAnimationActive={!isExporting}
                                                    onItemClick={(val) => {
                                                        const drilled = handleDrillDown(chart.id, chart, val);
                                                        if (!drilled) toggleFilter(chart.xAxisKey, val);
                                                    }}
                                                    activeFilterValue={chartFilters[chart.id]?.[chart.xAxisKey]}
                                                    columnMetadata={dataModel.columnMetadata}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null}

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
                </div>

                {/* --- PDF EXPORT VIEW (Hidden Off-screen) --- */}
                {isExportingPDF && (
                    <div id="pdf-export-view" style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '1200px', background: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
                        {pdfExportPages.map((page, pIdx) => (
                            <div key={pIdx} data-pdf-page style={{ width: '1200px', height: '1696px', padding: '60px', position: 'relative', overflow: 'hidden', background: theme === 'dark' ? '#0f172a' : '#f8fafc', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                                {/* Top Gradient Bar */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, #6366f1, #a855f7)' }}></div>

                                {/* Page Header */}
                                {page.isFirstPageOfPDF && (
                                    <div style={{ marginBottom: '32px', borderBottom: `2px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`, paddingBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h1 style={{ fontSize: '32px', fontWeight: '800', color: theme === 'dark' ? '#f8fafc' : '#0f172a', margin: '0', letterSpacing: '-1px' }}>{dataModel.name}</h1>
                                                <p style={{ fontSize: '14px', color: theme === 'dark' ? '#94a3b8' : '#64748b', margin: '4px 0 0 0', fontWeight: '500' }}>InsightAI Analysis Report • Professional Edition</p>
                                            </div>
                                            <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                                                <p style={{ fontSize: '12px', color: theme === 'dark' ? '#6366f1' : '#4f46e5', fontWeight: 'bold', margin: '0' }}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                                <p style={{ fontSize: '10px', color: theme === 'dark' ? '#475569' : '#94a3b8', margin: '2px 0 0 0' }}>Ref: {dataModel.data.length.toLocaleString()} Records</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!page.isFirstPageOfPDF && (
                                    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`, paddingBottom: '12px' }}>
                                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: theme === 'dark' ? '#f8fafc' : '#0f172a', margin: 0 }}>
                                            {page.tabName} {page.isFirstPageOfTab ? '' : '(Continued)'}
                                        </h2>
                                        <span style={{ fontSize: '11px', color: theme === 'dark' ? '#475569' : '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {dataModel.name} • Page {pIdx + 1}
                                        </span>
                                    </div>
                                )}

                                {/* KPIs Section (Only on first page) */}
                                {page.pageKPIs && page.pageKPIs.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '32px', width: '100%' }}>
                                        {page.pageKPIs.map((kpi, kIdx) => {
                                            const baseData = kpi.ignoreGlobalFilters ? dataModel.data : filteredData;
                                            const data = aggregateData(applyChartFilters(baseData, kpi.id), kpi);
                                            const value = data[0]?.value || 0;
                                            const displayValue = smartFormat(value, kpi.dataKey, dataModel.columnMetadata);
                                            return (
                                                <div key={kpi.id} style={{ 
                                                    flex: '1 1 calc(25% - 15px)', 
                                                    minWidth: '220px',
                                                    minHeight: '90px', 
                                                    background: theme === 'dark' ? '#1e293b' : '#ffffff', 
                                                    border: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`, 
                                                    padding: '16px 20px 20px 20px', 
                                                    borderRadius: '14px', 
                                                    textAlign: 'center', 
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    justifyContent: 'center',
                                                    boxSizing: 'border-box'
                                                }}>
                                                    <p style={{ fontSize: '11px', color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.5px', lineHeight: '1.2' }}>{kpi.title}</p>
                                                    <p style={{ fontSize: '24px', fontWeight: '800', color: theme === 'dark' ? '#f8fafc' : '#0f172a', margin: '0', lineHeight: '1.3' }}>{displayValue}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Tab Title if first page of tab (but not first page of PDF which already has header) */}
                                {page.isFirstPageOfTab && !page.isFirstPageOfPDF && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: theme === 'dark' ? '#6366f1' : '#4f46e5', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{page.tabName}</h3>
                                        <p style={{ fontSize: '11px', color: theme === 'dark' ? '#64748b' : '#94a3b8', margin: 0 }}>Section overview and key performance metrics.</p>
                                    </div>
                                )}

                                {/* Charts Grid */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', flex: 1, width: '100%', alignContent: 'flex-start' }}>
                                    {page.charts.map((chart, cIdx) => (
                                        <div key={chart.id} style={{ width: 'calc(50% - 15px)', background: theme === 'dark' ? '#1e293b' : '#ffffff', border: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}`, padding: '24px 24px 20px 24px', borderRadius: '16px', height: '420px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden', boxShadow: 'none' }}>
                                            <div style={{ marginBottom: '12px', flexShrink: 0, overflow: 'visible' }}>
                                                <h4 style={{ fontSize: '15px', fontWeight: '700', color: theme === 'dark' ? '#f1f5f9' : '#1e293b', margin: '0 0 2px 0', lineHeight: '1.4', overflow: 'visible', wordBreak: 'break-word' }}>{chart.title}</h4>
                                                <p style={{ fontSize: '11px', color: theme === 'dark' ? '#64748b' : '#94a3b8', margin: '0', lineHeight: '1.3', overflow: 'visible', wordBreak: 'break-word' }}>{chart.description}</p>
                                            </div>
                                            <div style={{ flex: 1, minHeight: 0, width: '100%', position: 'relative', overflow: 'hidden' }}>
                                                <RenderChart
                                                    config={chart}
                                                    data={(() => {
                                                        const baseData = chart.ignoreGlobalFilters ? dataModel.data : filteredData;
                                                        return isDateTimeColumn(chart.xAxisKey)
                                                            ? getDrillDownData(chart, applyChartFilters(baseData, chart.id))
                                                            : aggregateData(applyChartFilters(baseData, chart.id), chart);
                                                    })()}
                                                    theme={theme}
                                                    isAnimationActive={false}
                                                    columnMetadata={dataModel.columnMetadata}
                                                    isExporting={true}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Page Footer */}
                                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${theme === 'dark' ? '#1e293b' : '#f1f5f9'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ fontSize: '9px', color: theme === 'dark' ? '#475569' : '#94a3b8', margin: 0 }}>© {new Date().getFullYear()} InsightAI Analytics Engine • Confidental Report</p>
                                    <p style={{ fontSize: '10px', fontWeight: 'bold', color: theme === 'dark' ? '#6366f1' : '#4f46e5', margin: 0 }}>Page {pIdx + 1}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    } catch (error: any) {
        console.error("Dashboard Render Error:", error);
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
                <div className="bg-red-500/20 border border-red-500 p-8 rounded-2xl max-w-lg w-full text-center">
                    <LayoutDashboard className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-400">Dashboard Render Error</h2>
                    <p className="text-slate-300 mt-4 text-left p-4 bg-black/40 rounded-lg font-mono text-xs overflow-auto max-h-40">
                        {error?.message || String(error)}
                    </p>
                    <div className="flex gap-4 mt-8">
                        <button onClick={onHome} className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition">Return Home</button>
                        <button onClick={() => window.location.reload()} className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition">Reload App</button>
                    </div>
                </div>
            </div>
        );
    }
};