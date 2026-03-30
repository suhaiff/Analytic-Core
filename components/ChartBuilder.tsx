import React, { useState, useEffect, useRef } from 'react';
import { DataModel, ChartConfig, DashboardSection, ChartType, AggregationType } from '../types';
import { analyzeDataAndSuggestKPIs, generateChartFromPrompt } from '../services/geminiService';
import { Plus, Sparkles, X, BarChart3, PieChart, LineChart, Activity, Send, Loader2, ArrowRight, ArrowLeft, Table as TableIcon, Mic, MicOff, Home, Save, RefreshCw, Filter, Check, ChevronDown, Palette, GitBranch, Layers, BarChartHorizontal, ScatterChart as ScatterChartIcon, Droplets, Grid3x3, Edit2, Settings2 } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import { smartFormat } from '../utils/formatters';

// 10 theme-safe colors that look good on both light and dark backgrounds
const CHART_COLOR_OPTIONS: { label: string; value: string }[] = [
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Cyan', value: '#06b6d4' },
    { label: 'Pink', value: '#ec4899' },
    { label: 'Orange', value: '#f97316' },
    { label: 'Teal', value: '#14b8a6' },
    { label: 'Sky', value: '#38bdf8' },
];

const ALL_CHART_TYPES: { type: ChartType; label: string }[] = [
    { type: ChartType.BAR, label: 'Bar Chart' },
    { type: ChartType.HORIZONTAL_BAR, label: 'Horizontal Bar' },
    { type: ChartType.LINE, label: 'Line Chart' },
    { type: ChartType.AREA, label: 'Area Chart' },
    { type: ChartType.PIE, label: 'Pie Chart' },
    { type: ChartType.KPI, label: 'KPI Card' },
    { type: ChartType.GROUPED_BAR, label: 'Grouped Bar' },
    { type: ChartType.STACKED_BAR, label: 'Stacked Bar' },
    { type: ChartType.COMBO, label: 'Combo Chart' },
    { type: ChartType.SCATTER, label: 'Scatter Plot' },
    { type: ChartType.WATERFALL, label: 'Waterfall' },
    { type: ChartType.HEATMAP, label: 'Heatmap' },
    { type: ChartType.TABLE, label: 'Table' },
    { type: ChartType.MATRIX, label: 'Matrix' },
];

const getChartIcon = (type: string) => {
    switch (type) {
        case 'BAR': return <BarChart3 className="w-5 h-5" />;
        case 'HORIZONTAL_BAR': return <BarChartHorizontal className="w-5 h-5" />;
        case 'GROUPED_BAR': return <GitBranch className="w-5 h-5" />;
        case 'STACKED_BAR': return <Layers className="w-5 h-5" />;
        case 'COMBO': return <Activity className="w-5 h-5" />;
        case 'PIE': return <PieChart className="w-5 h-5" />;
        case 'LINE': return <LineChart className="w-5 h-5" />;
        case 'AREA': return <Activity className="w-5 h-5" />;
        case 'SCATTER': return <ScatterChartIcon className="w-5 h-5" />;
        case 'WATERFALL': return <Droplets className="w-5 h-5" />;
        case 'HEATMAP': return <Grid3x3 className="w-5 h-5" />;
        case 'MATRIX': return <Grid3x3 className="w-5 h-5" />;
        case 'TABLE': return <TableIcon className="w-5 h-5" />;
        case 'KPI': return <div className="text-xs font-bold border border-current px-1 rounded leading-none min-w-[20px] text-center">123</div>;
        default: return <BarChart3 className="w-5 h-5" />;
    }
};

// ---- BucketChartCard ----
interface BucketChartCardProps {
    chart: ChartConfig;
    index: number;
    theme: string;
    colors: any;
    onRemove: (id: string) => void;
    onTypeChange: (id: string, type: ChartType) => void;
    onColorChange: (id: string, color: string) => void;
    onColor2Change: (id: string, color2: string) => void;
    onMulticolorChange: (id: string, multicolor: boolean) => void;
    onTitleChange: (id: string, title: string) => void;
    onDragStart: (e: React.DragEvent, id: string) => void;
    sections: DashboardSection[];
    currentSectionId?: string;
    onMoveToSection: (id: string, sectionId: string) => void;
    allColumns: string[];
    onXAxisChange: (id: string, key: string) => void;
    onMetricChange: (id: string, key: string) => void;
    onAggregationChange: (id: string, agg: AggregationType) => void;
    onYAxisChange: (id: string, key: string) => void;
    onFontFamilyChange: (id: string, fontFamily: string) => void;
    onFontSizeChange: (id: string, fontSize: number) => void;
}

const BucketChartCard: React.FC<BucketChartCardProps> = ({
    chart, index, theme, colors, onRemove, onTypeChange, onColorChange, onColor2Change, onMulticolorChange, onTitleChange, onDragStart, sections, currentSectionId, onMoveToSection, allColumns, onXAxisChange, onMetricChange, onAggregationChange, onYAxisChange, onFontFamilyChange, onFontSizeChange
}) => {
    const [showTypeMenu, setShowTypeMenu] = useState(false);
    const typeMenuRef = useRef<HTMLDivElement>(null);
    const [showColorMenu, setShowColorMenu] = useState(false);
    const colorMenuRef = useRef<HTMLDivElement>(null);
    const [showColor2Menu, setShowColor2Menu] = useState(false);
    const color2MenuRef = useRef<HTMLDivElement>(null);
    const [showSectionMenu, setShowSectionMenu] = useState(false);
    const sectionMenuRef = useRef<HTMLDivElement>(null);
    const [showXAxisMenu, setShowXAxisMenu] = useState(false);
    const xAxisMenuRef = useRef<HTMLDivElement>(null);
    const [showMetricMenu, setShowMetricMenu] = useState(false);
    const metricMenuRef = useRef<HTMLDivElement>(null);
    const [showAggMenu, setShowAggMenu] = useState(false);
    const aggMenuRef = useRef<HTMLDivElement>(null);
    const [showYAxisMenu, setShowYAxisMenu] = useState(false);
    const yAxisMenuRef = useRef<HTMLDivElement>(null);
    const [showFontFamilyMenu, setShowFontFamilyMenu] = useState(false);
    const fontFamilyMenuRef = useRef<HTMLDivElement>(null);
    const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
    const fontSizeMenuRef = useRef<HTMLDivElement>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(chart.title);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Close menus on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (colorMenuRef.current && !colorMenuRef.current.contains(e.target as Node)) {
                setShowColorMenu(false);
            }
            if (color2MenuRef.current && !color2MenuRef.current.contains(e.target as Node)) {
                setShowColor2Menu(false);
            }
            if (sectionMenuRef.current && !sectionMenuRef.current.contains(e.target as Node)) {
                setShowSectionMenu(false);
            }
            if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
                setShowTypeMenu(false);
            }
            if (xAxisMenuRef.current && !xAxisMenuRef.current.contains(e.target as Node)) {
                setShowXAxisMenu(false);
            }
            if (metricMenuRef.current && !metricMenuRef.current.contains(e.target as Node)) {
                setShowMetricMenu(false);
            }
            if (aggMenuRef.current && !aggMenuRef.current.contains(e.target as Node)) {
                setShowAggMenu(false);
            }
            if (yAxisMenuRef.current && !yAxisMenuRef.current.contains(e.target as Node)) {
                setShowYAxisMenu(false);
            }
            if (fontFamilyMenuRef.current && !fontFamilyMenuRef.current.contains(e.target as Node)) {
                setShowFontFamilyMenu(false);
            }
            if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(e.target as Node)) {
                setShowFontSizeMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus title input when editing starts
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    const handleTitleSave = () => {
        if (editedTitle.trim() && editedTitle !== chart.title) {
            onTitleChange(chart.id, editedTitle.trim());
        } else {
            setEditedTitle(chart.title);
        }
        setIsEditingTitle(false);
    };

    const isBAR = chart.type === 'BAR' || chart.type === 'HORIZONTAL_BAR' || chart.type === 'GROUPED_BAR' || chart.type === 'STACKED_BAR';
    const isLINE = chart.type === 'LINE' || chart.type === 'AREA' || chart.type === 'COMBO';
    const hasSecondMetric = !!chart.dataKey2;
    const showColorOption = isBAR || isLINE;
    const activeColor = chart.color || CHART_COLOR_OPTIONS[0].value;
    const activeColor2 = chart.color2 || CHART_COLOR_OPTIONS[1].value;

    const anyMenuOpen = showColorMenu || showColor2Menu || showSectionMenu || showTypeMenu || showXAxisMenu || showMetricMenu || showAggMenu || showYAxisMenu;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, chart.id)}
            className={`responsive-card p-3 sm:p-4 ${colors.bgSecondary} border ${colors.borderPrimary} rounded-lg sm:rounded-xl relative group hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-900/10 transition-all duration-300 animate-fade-in-up flex flex-col h-full hover-lift elevation-md cursor-grab active:cursor-grabbing ${anyMenuOpen ? 'z-50' : 'z-auto'}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <button
                onClick={() => onRemove(chart.id)}
                className={`absolute top-2 right-2 sm:top-3 sm:right-3 ${colors.textMuted} hover:text-red-400 hover:bg-red-400/10 p-1 sm:p-1.5 rounded-md transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10 active-press`}
            >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <div className="flex items-start gap-2 mb-2 sm:mb-3 flex-1">
                <div className="relative" ref={typeMenuRef}>
                    <button 
                        onClick={() => setShowTypeMenu(v => !v)}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${showTypeMenu ? 'ring-2 ring-indigo-500 ring-offset-2' : ''} ${chart.id.startsWith('custom') ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'}`}
                        title="Change chart type"
                    >
                        {React.cloneElement(getChartIcon(chart.type) as React.ReactElement, { className: "w-3.5 h-3.5 sm:w-5 sm:h-5" })}
                    </button>
                    
                    {showTypeMenu && (
                        <div className={`absolute left-0 top-full mt-2 w-48 max-h-[400px] overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-50 p-1.5 animate-fade-in custom-scrollbar`}>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 pt-1 ${colors.textMuted}`}>Change Chart Type</p>
                            {ALL_CHART_TYPES.map(opt => {
                                const active = chart.type === opt.type;
                                return (
                                    <button
                                        key={opt.type}
                                        onClick={() => { onTypeChange(chart.id, opt.type); setShowTypeMenu(false); }}
                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all mb-0.5 text-left ${active ? 'bg-indigo-500/10 text-indigo-400' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                    >
                                        <div className={`shrink-0 ${active ? 'text-indigo-400' : colors.textMuted}`}>
                                            {React.cloneElement(getChartIcon(opt.type) as React.ReactElement, { className: "w-3.5 h-3.5" })}
                                        </div>
                                        <span className={`font-medium ${active ? 'font-bold' : ''}`}>{opt.label}</span>
                                        {active && <Check className="w-3 h-3 ml-auto text-indigo-400" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1 pr-6">
                    <div className={`text-[9px] sm:text-[10px] ${colors.textMuted} font-bold uppercase tracking-wider`}>
                        {chart.id.startsWith('custom') ? 'Custom Request' : 'AI Insight'}
                    </div>
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            className={`w-full bg-transparent border-b border-indigo-500 outline-none font-bold ${colors.textSecondary} text-xs sm:text-sm py-0.5`}
                        />
                    ) : (
                        <div className="flex items-start gap-1 group/title cursor-text" onClick={() => setIsEditingTitle(true)}>
                            <h4 className={`font-bold ${colors.textSecondary} text-xs sm:text-sm line-clamp-2 flex-1`}>{chart.title}</h4>
                            <Edit2 className={`w-3 h-3 mt-1 ${colors.textMuted} opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0`} />
                        </div>
                    )}
                </div>
            </div>

            {/* Section Move Dropdown */}
            {sections.length > 0 && (
                <div className="relative mb-2 flex-shrink-0" ref={sectionMenuRef}>
                    <button
                        onClick={() => setShowSectionMenu(v => !v)}
                        className={`w-full flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-md text-[10px] sm:text-xs font-semibold transition border ${theme === 'dark'
                            ? 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        title="Move to section"
                    >
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <Layers className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="truncate">
                                {sections.find(s => s.id === currentSectionId)?.name || 'Uncategorized Charts'}
                            </span>
                        </div>
                        <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${showSectionMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showSectionMenu && (
                        <div className={`absolute left-0 top-full mt-1 w-full max-h-48 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700 shadow-slate-900' : 'bg-white border-slate-200 shadow-slate-200'} border rounded-xl shadow-2xl z-50 p-1.5 animate-fade-in`}>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-1.5 pt-1 ${colors.textMuted}`}>Move to Section</p>
                            
                            {!currentSectionId && (
                                <button
                                    disabled
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-400 mb-0.5`}
                                >
                                    <Check className="w-3 h-3 shrink-0" />
                                    <span className="truncate flex-1 text-left">Uncategorized Charts</span>
                                </button>
                            )}
                            {currentSectionId && (
                                <button
                                    onClick={() => { onMoveToSection(chart.id, ''); setShowSectionMenu(false); }}
                                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all mb-0.5 ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <div className="w-3 h-3 shrink-0" />
                                    <span className="truncate flex-1 text-left italic">Uncategorized Charts</span>
                                </button>
                            )}
                            {sections.map(sec => {
                                const active = currentSectionId === sec.id;
                                return (
                                    <button
                                        key={sec.id}
                                        onClick={() => { onMoveToSection(chart.id, sec.id); setShowSectionMenu(false); }}
                                        className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all mb-0.5 flex-1 ${active ? 'bg-indigo-500/10 text-indigo-400' : theme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        {active ? <Check className="w-3 h-3 shrink-0" /> : <div className="w-3 h-3 shrink-0" />}
                                        <span className="truncate flex-1 text-left">{sec.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Color Controls */}
            {showColorOption && (
                <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'}`}>
                    {/* Single Color Dropdown */}
                    <div className="relative flex-1" ref={colorMenuRef}>
                        <button
                            onClick={() => setShowColorMenu(v => !v)}
                            title="Pick primary color"
                            className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition border ${theme === 'dark'
                                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                                : 'bg-slate-100 border-slate-300 text-slate-600 hover:border-slate-400'
                                }`}
                        >
                            <span
                                className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/20"
                                style={{ backgroundColor: activeColor }}
                            />
                            <Palette className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">
                                {CHART_COLOR_OPTIONS.find(c => c.value === activeColor)?.label ?? 'Color 1'}
                            </span>
                            <ChevronDown className={`w-2.5 h-2.5 ml-auto transition-transform ${showColorMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showColorMenu && (
                            <div className={`absolute left-0 bottom-full mb-1 w-40 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                                } border rounded-xl shadow-2xl z-50 p-2 animate-fade-in`}>
                                <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-1 ${colors.textMuted}`}>Primary Color</p>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {CHART_COLOR_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            title={opt.label}
                                            onClick={() => { onColorChange(chart.id, opt.value); setShowColorMenu(false); }}
                                            className="relative w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
                                            style={{ backgroundColor: opt.value }}
                                        >
                                            {activeColor === opt.value && (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white drop-shadow" />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Color 2 Dropdown (for dual metric charts) */}
                    {hasSecondMetric && (
                        <div className="relative flex-1" ref={color2MenuRef}>
                            <button
                                onClick={() => setShowColor2Menu(v => !v)}
                                title="Pick secondary color"
                                className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition border ${theme === 'dark'
                                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:border-slate-400'
                                    }`}
                            >
                                <span
                                    className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/20"
                                    style={{ backgroundColor: activeColor2 }}
                                />
                                <Palette className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">
                                    {CHART_COLOR_OPTIONS.find(c => c.value === activeColor2)?.label ?? 'Color 2'}
                                </span>
                                <ChevronDown className={`w-2.5 h-2.5 ml-auto transition-transform ${showColor2Menu ? 'rotate-180' : ''}`} />
                            </button>

                            {showColor2Menu && (
                                <div className={`absolute left-0 bottom-full mb-1 w-40 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                                    } border rounded-xl shadow-2xl z-50 p-2 animate-fade-in`}>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-1 ${colors.textMuted}`}>Secondary Color</p>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {CHART_COLOR_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                title={opt.label}
                                                onClick={() => { onColor2Change(chart.id, opt.value); setShowColor2Menu(false); }}
                                                className="relative w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
                                                style={{ backgroundColor: opt.value }}
                                            >
                                                {activeColor2 === opt.value && (
                                                    <span className="absolute inset-0 flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-white drop-shadow" />
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Multicolor Checkbox — BAR only (hide if dual metric as it gets messy) */}
                    {isBAR && !hasSecondMetric && (
                        <label
                            onClick={() => onMulticolorChange(chart.id, !chart.multicolor)}
                            className={`flex items-center gap-1 cursor-pointer select-none text-[10px] font-medium shrink-0 ${chart.multicolor
                                ? 'text-indigo-400'
                                : colors.textMuted
                                }`}
                            title="Apply distinct colors to each bar"
                        >
                            <div
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${chart.multicolor
                                    ? 'bg-indigo-500 border-indigo-500'
                                    : `${theme === 'dark' ? 'border-slate-600' : 'border-slate-400'}`
                                    }`}
                            >
                                {chart.multicolor && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            Multicolor
                        </label>
                    )}
                </div>
            )}

            {/* Font Customization Controls */}
            <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'}`}>
                {/* Font Family Dropdown */}
                <div className="relative flex-1" ref={fontFamilyMenuRef}>
                    <button
                        onClick={() => setShowFontFamilyMenu(v => !v)}
                        title="Select font family"
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition border ${theme === 'dark'
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                            : 'bg-slate-100 border-slate-300 text-slate-600 hover:border-slate-400'
                            }`}
                    >
                        <Settings2 className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">
                            {chart.fontFamily || 'Arial'}
                        </span>
                        <ChevronDown className={`w-2.5 h-2.5 ml-auto transition-transform ${showFontFamilyMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showFontFamilyMenu && (
                        <div className={`absolute left-0 bottom-full mb-1 w-40 max-h-64 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                            } border rounded-xl shadow-2xl z-50 p-1.5 animate-fade-in custom-scrollbar`}>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-1 ${colors.textMuted}`}>Font Family</p>
                            {['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 'Trebuchet MS', 'Comic Sans MS', 'Impact', 'Palatino'].map(font => (
                                <button
                                    key={font}
                                    onClick={() => { onFontFamilyChange(chart.id, font); setShowFontFamilyMenu(false); }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all mb-0.5 ${(chart.fontFamily || 'Arial') === font ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                    style={{ fontFamily: font }}
                                >
                                    {font}
                                    {(chart.fontFamily || 'Arial') === font && <Check className="w-3 h-3 ml-1 inline text-indigo-400" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Font Size Dropdown */}
                <div className="relative flex-1" ref={fontSizeMenuRef}>
                    <button
                        onClick={() => setShowFontSizeMenu(v => !v)}
                        title="Select font size"
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition border ${theme === 'dark'
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                            : 'bg-slate-100 border-slate-300 text-slate-600 hover:border-slate-400'
                            }`}
                    >
                        <span className="truncate">
                            Size: {chart.fontSize || 12}px
                        </span>
                        <ChevronDown className={`w-2.5 h-2.5 ml-auto transition-transform ${showFontSizeMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showFontSizeMenu && (
                        <div className={`absolute right-0 bottom-full mb-1 w-32 max-h-64 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                            } border rounded-xl shadow-2xl z-50 p-1.5 animate-fade-in custom-scrollbar`}>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-1 ${colors.textMuted}`}>Font Size</p>
                            {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32].map(size => (
                                <button
                                    key={size}
                                    onClick={() => { onFontSizeChange(chart.id, size); setShowFontSizeMenu(false); }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all mb-0.5 ${(chart.fontSize || 12) === size ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                >
                                    {size}px
                                    {(chart.fontSize || 12) === size && <Check className="w-3 h-3 ml-1 inline text-indigo-400" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={`grid grid-cols-3 gap-1.5 sm:gap-2 py-2 sm:py-3 border-t ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'} mt-auto`}>
                {/* X-Axis / Dimension 1 */}
                <div className="relative" ref={xAxisMenuRef}>
                    <button
                        onClick={() => setShowXAxisMenu(!showXAxisMenu)}
                        className={`w-full text-center p-1.5 sm:p-2 rounded-md sm:rounded-lg overflow-hidden transition-all ${showXAxisMenu ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : `${theme === 'dark' ? 'bg-slate-950/50 hover:bg-slate-900' : 'bg-slate-100 hover:bg-slate-200'}`}`}
                    >
                        <div className={`text-[9px] sm:text-[10px] ${colors.textMuted} uppercase`}>X-Axis</div>
                        <div className={`text-[10px] sm:text-xs ${colors.textTertiary} font-mono mt-0.5 sm:mt-1 truncate`} title={chart.xAxisKey || "-"}>{chart.xAxisKey || "-"}</div>
                    </button>
                    {showXAxisMenu && (
                        <div className={`absolute left-0 bottom-full mb-2 w-48 max-h-64 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-[60] p-1.5 animate-fade-in custom-scrollbar`}>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 pt-1 ${colors.textMuted}`}>Change X-Axis</p>
                            {allColumns.map(col => (
                                <button
                                    key={col}
                                    onClick={() => { onXAxisChange(chart.id, col); setShowXAxisMenu(false); }}
                                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all mb-0.5 ${chart.xAxisKey === col ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                >
                                    {col}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Metric / DataKey */}
                <div className="relative" ref={metricMenuRef}>
                    <button
                        onClick={() => setShowMetricMenu(!showMetricMenu)}
                        className={`w-full text-center p-1.5 sm:p-2 rounded-md sm:rounded-lg overflow-hidden transition-all ${showMetricMenu ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : `${theme === 'dark' ? 'bg-slate-950/50 hover:bg-slate-900' : 'bg-slate-100 hover:bg-slate-200'}`}`}
                    >
                        <div className={`text-[9px] sm:text-[10px] ${colors.textMuted} uppercase`}>Metric</div>
                        <div className={`text-[10px] sm:text-xs ${colors.textTertiary} font-mono mt-0.5 sm:mt-1 truncate`} title={chart.dataKey}>{chart.dataKey}</div>
                    </button>
                    {showMetricMenu && (
                        <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 max-h-64 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-[60] p-1.5 animate-fade-in custom-scrollbar`}>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 pt-1 ${colors.textMuted}`}>Change Metric</p>
                            {allColumns.map(col => (
                                <button
                                    key={col}
                                    onClick={() => { onMetricChange(chart.id, col); setShowMetricMenu(false); }}
                                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all mb-0.5 ${chart.dataKey === col ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                >
                                    {col}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Aggregation / Y-Axis */}
                <div className="relative" ref={(chart.type === 'HEATMAP' || chart.type === 'MATRIX') ? yAxisMenuRef : aggMenuRef}>
                    <button
                        onClick={() => (chart.type === 'HEATMAP' || chart.type === 'MATRIX') ? setShowYAxisMenu(!showYAxisMenu) : setShowAggMenu(!showAggMenu)}
                        className={`w-full text-center p-1.5 sm:p-2 rounded-md sm:rounded-lg overflow-hidden transition-all ${((chart.type === 'HEATMAP' || chart.type === 'MATRIX') ? showYAxisMenu : showAggMenu) ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : `${theme === 'dark' ? 'bg-slate-950/50 hover:bg-slate-900' : 'bg-slate-100 hover:bg-slate-200'}`}`}
                    >
                        <div className={`text-[9px] sm:text-[10px] ${colors.textMuted} uppercase`}>
                            {(chart.type === 'HEATMAP' || chart.type === 'MATRIX') ? 'Y-Axis' : 'Agg'}
                        </div>
                        <div className={`text-[10px] sm:text-xs ${colors.textTertiary} font-mono mt-0.5 sm:mt-1 truncate`} title={(chart.type === 'HEATMAP' || chart.type === 'MATRIX') ? chart.yAxisKey : chart.aggregation}>
                            {(chart.type === 'HEATMAP' || chart.type === 'MATRIX') ? (chart.yAxisKey || "-") : chart.aggregation}
                        </div>
                    </button>
                    
                    {showAggMenu && !(chart.type === 'HEATMAP' || chart.type === 'MATRIX') && (
                        <div className={`absolute right-0 bottom-full mb-2 w-40 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-[60] p-1.5 animate-fade-in`}>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 pt-1 ${colors.textMuted}`}>Change Aggregation</p>
                            {Object.values(AggregationType).map(agg => (
                                <button
                                    key={agg}
                                    onClick={() => { onAggregationChange(chart.id, agg); setShowAggMenu(false); }}
                                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all mb-0.5 ${chart.aggregation === agg ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                >
                                    {agg}
                                </button>
                            ))}
                        </div>
                    )}

                    {showYAxisMenu && (chart.type === 'HEATMAP' || chart.type === 'MATRIX') && (
                        <div className={`absolute right-0 bottom-full mb-2 w-48 max-h-64 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-[60] p-1.5 animate-fade-in custom-scrollbar`}>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 pt-1 ${colors.textMuted}`}>Change Y-Axis</p>
                            {allColumns.map(col => (
                                <button
                                    key={col}
                                    onClick={() => { onYAxisChange(chart.id, col); setShowYAxisMenu(false); }}
                                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all mb-0.5 ${chart.yAxisKey === col ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                >
                                    {col}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ChartBuilderProps {
    dataModel: DataModel;
    onGenerateReport: (charts: ChartConfig[], filterColumns: string[], sections?: DashboardSection[]) => void;
    onHome: () => void;
    onBack?: () => void;
    initialBucket?: ChartConfig[];
    initialFilterColumns?: string[];
    sections?: DashboardSection[];
    mode?: 'create' | 'update';
}

export const ChartBuilder: React.FC<ChartBuilderProps> = ({
    dataModel,
    onGenerateReport,
    onHome,
    onBack,
    initialBucket = [],
    initialFilterColumns = [],
    sections: initialSections = [],
    mode = 'create'
}) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [suggestedCharts, setSuggestedCharts] = useState<ChartConfig[]>([]);
    const [bucket, setBucket] = useState<ChartConfig[]>(initialBucket);
    const [sections, setSections] = useState<DashboardSection[]>(initialSections);
    const [loading, setLoading] = useState(true);
    const [lastVoiceResult, setLastVoiceResult] = useState('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showData, setShowData] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSuggestionTypeMenuId, setActiveSuggestionTypeMenuId] = useState<string | null>(null);
    const suggestionTypeMenuRef = useRef<HTMLDivElement>(null);
    const [activeSuggestionXAxisMenuId, setActiveSuggestionXAxisMenuId] = useState<string | null>(null);
    const suggestionXAxisMenuRef = useRef<HTMLDivElement>(null);
    const [activeSuggestionMetricMenuId, setActiveSuggestionMetricMenuId] = useState<string | null>(null);
    const suggestionMetricMenuRef = useRef<HTMLDivElement>(null);
    const [activeSuggestionAggMenuId, setActiveSuggestionAggMenuId] = useState<string | null>(null);
    const suggestionAggMenuRef = useRef<HTMLDivElement>(null);
    const [activeSuggestionYAxisMenuId, setActiveSuggestionYAxisMenuId] = useState<string | null>(null);
    const suggestionYAxisMenuRef = useRef<HTMLDivElement>(null);

    // Manual Chart Builder State
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [manualConfig, setManualConfig] = useState<ChartConfig>({
        id: `custom-manual-${Date.now()}`,
        title: '',
        description: 'Manually created chart',
        type: ChartType.BAR,
        xAxisKey: '',
        dataKey: '',
        aggregation: AggregationType.SUM,
        color: CHART_COLOR_OPTIONS[0].value,
        multicolor: false
    });

    // Filter Columns state
    const [selectedFilterCols, setSelectedFilterCols] = useState<Set<string>>(
        new Set(initialFilterColumns.length > 0 ? initialFilterColumns : [])
    );
    const [openFilterColMenu, setOpenFilterColMenu] = useState(false);
    const [filterColSearch, setFilterColSearch] = useState('');
    const filterColMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (filterColMenuRef.current && !filterColMenuRef.current.contains(e.target as Node)) {
                setOpenFilterColMenu(false);
            }
            if (suggestionTypeMenuRef.current && !suggestionTypeMenuRef.current.contains(e.target as Node)) {
                setActiveSuggestionTypeMenuId(null);
            }
            if (suggestionXAxisMenuRef.current && !suggestionXAxisMenuRef.current.contains(e.target as Node)) {
                setActiveSuggestionXAxisMenuId(null);
            }
            if (suggestionMetricMenuRef.current && !suggestionMetricMenuRef.current.contains(e.target as Node)) {
                setActiveSuggestionMetricMenuId(null);
            }
            if (suggestionAggMenuRef.current && !suggestionAggMenuRef.current.contains(e.target as Node)) {
                setActiveSuggestionAggMenuId(null);
            }
            if (suggestionYAxisMenuRef.current && !suggestionYAxisMenuRef.current.contains(e.target as Node)) {
                setActiveSuggestionYAxisMenuId(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const allColumns = dataModel.columns || [];
    const filteredColList = allColumns.filter(c =>
        c.toLowerCase().includes(filterColSearch.toLowerCase())
    );
    const allFilterColsSelected = allColumns.length > 0 && allColumns.every(c => selectedFilterCols.has(c));

    const toggleFilterCol = (col: string) => {
        setSelectedFilterCols(prev => {
            const next = new Set(prev);
            if (next.has(col)) next.delete(col);
            else next.add(col);
            return next;
        });
    };

    const toggleAllFilterCols = () => {
        if (allFilterColsSelected) {
            setSelectedFilterCols(new Set());
        } else {
            setSelectedFilterCols(new Set(allColumns));
        }
    };

    useEffect(() => {
        if (initialBucket && initialBucket.length > 0) {
            setBucket(initialBucket);
        }
    }, [initialBucket]);

    const fetchSuggestions = async () => {
        setLoading(true);
        const suggestions = await analyzeDataAndSuggestKPIs(dataModel);
        setSuggestedCharts(suggestions);
        setLoading(false);
    };

    useEffect(() => {
        fetchSuggestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataModel.name]);

    // Returns true if a chart with the same visual config already exists in the bucket.
    // For KPI charts: xAxisKey is irrelevant (they show a single metric value),
    // so we only compare type + dataKey + aggregation — preventing duplicates even
    // when the AI fills xAxisKey with a different column name across calls.
    // For all other chart types: we also compare xAxisKey (case-insensitive, trimmed).
    const isAlreadyInBucket = (chart: ChartConfig): boolean => {
        const normalize = (s: string | undefined | null) => (s ?? '').trim().toLowerCase();
        return bucket.some(c => {
            if (c.type !== chart.type) return false;
            if (normalize(c.dataKey) !== normalize(chart.dataKey)) return false;
            if (normalize(c.aggregation) !== normalize(chart.aggregation)) return false;
            // For KPI charts, xAxisKey doesn't affect the output — skip it
            if (chart.type === 'KPI') return true;

            // For Heatmap and Matrix, also compare yAxisKey
            if (chart.type === 'HEATMAP' || chart.type === 'MATRIX') {
                return normalize(c.xAxisKey) === normalize(chart.xAxisKey) &&
                    normalize(c.yAxisKey) === normalize(chart.yAxisKey);
            }

            return normalize(c.xAxisKey) === normalize(chart.xAxisKey);
        });
    };

    const addToBucket = (chart: ChartConfig) => {
        if (!isAlreadyInBucket(chart)) {
            // Assign to the first section if it exists
            const sectionId = sections.length > 0 ? sections[0].id : undefined;
            setBucket(prev => [...prev, { ...chart, sectionId }]);
        }
    };

    const addAllToBucket = () => {
        const newCharts = suggestedCharts.filter(chart => !isAlreadyInBucket(chart));
        if (newCharts.length > 0) {
            const sectionId = sections.length > 0 ? sections[0].id : undefined;
            const withSection = newCharts.map(c => ({ ...c, sectionId }));
            setBucket(prev => [...prev, ...withSection]);
        }
    };

    const removeFromBucket = (id: string) => {
        setBucket(bucket.filter(c => c.id !== id));
    };
    
    const onTypeChangeSuggested = (id: string, type: ChartType) => {
        setSuggestedCharts(prev => prev.map(c => c.id === id ? { ...c, type } : c));
    };

    const onTypeChangeBucket = (id: string, type: ChartType) => {
        setBucket(prev => prev.map(c => c.id === id ? { ...c, type } : c));
    };

    const onXAxisChangeSuggested = (id: string, xAxisKey: string) => {
        setSuggestedCharts(prev => prev.map(c => c.id === id ? { ...c, xAxisKey } : c));
    };
    const onMetricChangeSuggested = (id: string, dataKey: string) => {
        setSuggestedCharts(prev => prev.map(c => c.id === id ? { ...c, dataKey } : c));
    };
    const onAggregationChangeSuggested = (id: string, aggregation: AggregationType) => {
        setSuggestedCharts(prev => prev.map(c => c.id === id ? { ...c, aggregation } : c));
    };
    const onYAxisChangeSuggested = (id: string, yAxisKey: string) => {
        setSuggestedCharts(prev => prev.map(c => c.id === id ? { ...c, yAxisKey } : c));
    };

    const onXAxisChangeBucket = (id: string, xAxisKey: string) => {
        setBucket(prev => prev.map(c => c.id === id ? { ...c, xAxisKey } : c));
    };
    const onMetricChangeBucket = (id: string, dataKey: string) => {
        setBucket(prev => prev.map(c => c.id === id ? { ...c, dataKey } : c));
    };
    const onAggregationChangeBucket = (id: string, aggregation: AggregationType) => {
        setBucket(prev => prev.map(c => c.id === id ? { ...c, aggregation } : c));
    };
    const onYAxisChangeBucket = (id: string, yAxisKey: string) => {
        setBucket(prev => prev.map(c => c.id === id ? { ...c, yAxisKey } : c));
    };

    const onFontFamilyChangeBucket = (id: string, fontFamily: string) => {
        setBucket(prev => prev.map(c => c.id === id ? { ...c, fontFamily } : c));
    };

    const onFontSizeChangeBucket = (id: string, fontSize: number) => {
        setBucket(prev => prev.map(c => c.id === id ? { ...c, fontSize } : c));
    };

    const handleCustomChart = async () => {
        if (!customPrompt.trim()) return;
        setIsGeneratingCustom(true);
        const newChart = await generateChartFromPrompt(dataModel, customPrompt);
        if (newChart) {
            const sectionId = sections.length > 0 ? sections[0].id : undefined;
            setBucket([{ ...newChart, sectionId }, ...bucket]);
            setCustomPrompt('');
        }
        setIsGeneratingCustom(false);
    };

    const toggleVoiceInput = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Voice recognition is not supported in this browser. Please use Chrome.");
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setCustomPrompt(prev => (prev ? prev + ' ' + transcript : transcript));
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const handleAddManualChart = () => {
        if (!manualConfig.title || !manualConfig.dataKey) return;
        
        const chartToAdd = {
            ...manualConfig,
            id: `custom-manual-${Date.now()}`
        };
        addToBucket(chartToAdd);
        setIsManualOpen(false);
        // Reset for next use
        setManualConfig({
            id: `custom-manual-${Date.now()}`,
            title: '',
            description: 'Manually created chart',
            type: ChartType.BAR,
            xAxisKey: '',
            dataKey: '',
            aggregation: AggregationType.SUM,
            color: CHART_COLOR_OPTIONS[0].value,
            multicolor: false
        });
    };

    const isManualConfigValid = () => {
        if (!manualConfig.title.trim() || !manualConfig.dataKey) return false;
        if (manualConfig.type !== ChartType.KPI && !manualConfig.xAxisKey) return false;
        if ((manualConfig.type === ChartType.HEATMAP || manualConfig.type === ChartType.MATRIX) && !manualConfig.yAxisKey) return false;
        return true;
    };

    const addSection = () => {
        const newId = `section-${Date.now()}`;
        setSections([...sections, { id: newId, name: `New Section ${sections.length + 1}` }]);
    };

    const renameSection = (id: string, name: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, name } : s));
    };

    const removeSection = (id: string) => {
        if (sections.length <= 1) {
            // Keep at least one section if user wants them?
            // Actually, if they remove all, we can fallback to index-based tabs in Dashboard
        }
        setSections(sections.filter(s => s.id !== id));
        // Clear sectionId for charts in this section
        setBucket(bucket.map(c => c.sectionId === id ? { ...c, sectionId: undefined } : c));
    };

    // Drag and Drop handlers
    const onDragStart = (e: React.DragEvent, chartId: string) => {
        e.dataTransfer.setData('chartId', chartId);
    };

    const onDropToSection = (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        const chartId = e.dataTransfer.getData('chartId');
        if (chartId) {
            setBucket(prev => prev.map(c => c.id === chartId ? { ...c, sectionId: sectionId || undefined } : c));
        }
    };

    const onDragOverSection = (e: React.DragEvent) => {
        e.preventDefault();
        handleDragOverScroll(e);
    };

    const handleDragOverScroll = (e: React.DragEvent) => {
        if (!scrollContainerRef.current) return;
        const rect = scrollContainerRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const threshold = 100; // Increase threshold for better feel
        const scrollAmount = 15;

        if (y < threshold) {
            scrollContainerRef.current.scrollTop -= scrollAmount;
        } else if (y > rect.height - threshold) {
            scrollContainerRef.current.scrollTop += scrollAmount;
        }
    };

    const onGenerate = () => {
        onGenerateReport(bucket, Array.from(selectedFilterCols), sections);
    };


    return (
        <div className={`flex h-screen ${colors.bgPrimary} ${colors.textSecondary} overflow-hidden relative`}>
            {/* Manual Chart Builder Modal */}
            {isManualOpen && (
                <div className={`fixed inset-0 z-[100] ${colors.overlayBg} glass-effect flex items-center justify-center p-2 sm:p-4 animate-fade-in`}>
                    <div className={`w-full max-w-2xl ${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
                        {/* Header */}
                        <div className={`p-4 sm:p-6 border-b ${colors.borderPrimary} flex justify-between items-center`}>
                            <h2 className={`font-bold ${colors.textPrimary} text-lg sm:text-xl flex items-center gap-2`}>
                                <Plus className="w-5 h-5 text-indigo-400" />
                                Manual Chart Builder
                            </h2>
                            <button onClick={() => setIsManualOpen(false)} className={`p-2 hover:${colors.bgTertiary} rounded-full ${colors.textMuted} transition`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
                            {/* Title */}
                            <div>
                                <label className={`block text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Chart Title</label>
                                <input
                                    type="text"
                                    value={manualConfig.title}
                                    onChange={e => setManualConfig({...manualConfig, title: e.target.value})}
                                    placeholder="e.g., Sales by Region"
                                    className={`w-full px-4 py-2.5 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                                />
                            </div>

                            {/* Chart Type Selection */}
                            <div>
                                <label className={`block text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Chart Type</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {ALL_CHART_TYPES.map(opt => (
                                        <button
                                            key={opt.type}
                                            onClick={() => setManualConfig({...manualConfig, type: opt.type})}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 ${manualConfig.type === opt.type 
                                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10' 
                                                : `${colors.bgPrimary} border-transparent ${colors.textSecondary} hover:border-indigo-500/30`}`}
                                        >
                                            <div className={manualConfig.type === opt.type ? 'text-indigo-400' : colors.textMuted}>
                                                {getChartIcon(opt.type)}
                                            </div>
                                            <span className="text-[10px] font-bold text-center">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Column Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Dimension / X-Axis */}
                                {manualConfig.type !== ChartType.KPI && (
                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>
                                            {manualConfig.type === ChartType.HORIZONTAL_BAR ? 'Y-Axis (Category)' : 'X-Axis (Dimension)'}
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={manualConfig.xAxisKey}
                                                onChange={e => setManualConfig({...manualConfig, xAxisKey: e.target.value})}
                                                className={`w-full px-4 py-2.5 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer`}
                                            >
                                                <option value="">Select a column...</option>
                                                {allColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {/* Metric / Data Key */}
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>
                                        {manualConfig.type === ChartType.HORIZONTAL_BAR ? 'X-Axis (Metric)' : 'Metric (Value)'}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={manualConfig.dataKey}
                                            onChange={e => setManualConfig({...manualConfig, dataKey: e.target.value})}
                                            className={`w-full px-4 py-2.5 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer`}
                                        >
                                            <option value="">Select a column...</option>
                                            {allColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Aggregation */}
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Aggregation</label>
                                    <div className="relative">
                                        <select
                                            value={manualConfig.aggregation}
                                            onChange={e => setManualConfig({...manualConfig, aggregation: e.target.value as AggregationType})}
                                            className={`w-full px-4 py-2.5 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer`}
                                        >
                                            {Object.values(AggregationType).map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Heatmap / Matrix Y-Axis */}
                                {(manualConfig.type === ChartType.HEATMAP || manualConfig.type === ChartType.MATRIX) && (
                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Y-Axis (Dimension 2)</label>
                                        <div className="relative">
                                            <select
                                                value={manualConfig.yAxisKey || ''}
                                                onChange={e => setManualConfig({...manualConfig, yAxisKey: e.target.value})}
                                                className={`w-full px-4 py-2.5 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer`}
                                            >
                                                <option value="">Select a column...</option>
                                                {allColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {/* Secondary Metric for Combo/Grouped/Stacked */}
                                {(manualConfig.type === ChartType.COMBO || manualConfig.type === ChartType.GROUPED_BAR || manualConfig.type === ChartType.STACKED_BAR) && (
                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Secondary Metric (Optional)</label>
                                        <div className="relative">
                                            <select
                                                value={manualConfig.dataKey2 || ''}
                                                onChange={e => setManualConfig({...manualConfig, dataKey2: e.target.value})}
                                                className={`w-full px-4 py-2.5 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer`}
                                            >
                                                <option value="">None</option>
                                                {allColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className={`p-4 sm:p-6 border-t ${colors.borderPrimary} flex justify-end gap-3`}>
                            <button
                                onClick={() => setIsManualOpen(false)}
                                className={`px-5 py-2 rounded-xl border ${colors.borderSecondary} ${colors.textSecondary} hover:${colors.bgTertiary} transition-all font-bold text-sm`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddManualChart}
                                disabled={!isManualConfigValid()}
                                title={!isManualConfigValid() ? "Please fill in all required fields" : "Add to Dashboard"}
                                className={`px-8 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-bold text-sm shadow-lg shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Add Chart
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Data Preview Modal - Responsive */}
            {showData && (
                <div className={`fixed inset-0 z-50 ${colors.overlayBg} glass-effect flex items-center justify-center p-2 sm:p-4 lg:p-8 animate-fade-in`}>
                    <div className={`responsive-modal ${colors.bgSecondary} border ${colors.borderPrimary} w-full h-full rounded-xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden`}>
                        <div className={`p-3 sm:p-4 md:p-6 border-b ${colors.borderPrimary} flex justify-between items-center ${colors.bgSecondary} shrink-0`}>
                            <div>
                                <h2 className={`font-bold ${colors.textPrimary} responsive-text-lg sm:text-xl`}>Dataset Preview</h2>
                                <p className={` colors.textMuted} responsive-text-xs sm:text-sm`}>{dataModel.data.length} rows found</p>
                            </div>
                            <button onClick={() => setShowData(false)} className={`p-1.5 sm:p-2 hover:${colors.bgTertiary} rounded-full ${colors.textMuted} hover:${colors.textPrimary} transition shrink-0`}>
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <table className={`responsive-table w-full text-left responsive-text-sm ${colors.textMuted}`}>
                                <thead className={`${theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-200/80'} sticky top-0 z-10 backdrop-blur-sm`}>
                                    <tr>{dataModel.columns.map(c => <th key={c} className={`px-3 sm:px-6 py-2 sm:py-3 font-semibold ${colors.textPrimary} border-b ${colors.borderSecondary} whitespace-nowrap responsive-text-xs sm:text-sm`}>{c}</th>)}</tr>
                                </thead>
                                <tbody className={`divide-y ${colors.borderPrimary}`}>
                                    {dataModel.data.slice(0, 200).map((row, i) => (
                                        <tr key={i} className={`hover:${colors.bgTertiary}/50 transition-colors`}>
                                            {dataModel.columns.map(c => {
                                                const cellValue = row[c];
                                                const displayValue = cellValue !== null && cellValue !== undefined
                                                    ? smartFormat(cellValue, c)
                                                    : <span className="text-slate-700 italic">null</span>;
                                                return (
                                                    <td key={c} className="px-3 sm:px-6 py-2 sm:py-3 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis responsive-text-xs sm:text-sm">
                                                        {displayValue}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={`p-2 sm:p-3 md:p-4 border-t ${colors.borderPrimary} ${colors.bgSecondary} text-center responsive-text-xs ${colors.textMuted} shrink-0`}>
                            Showing first 200 rows for preview
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Left: AI Suggestions - Responsive Sidebar */}
            <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative w-80 sm:w-[350px] lg:w-[400px] max-w-[85vw] border-r ${colors.borderPrimary} ${colors.bgSecondary} flex flex-col z-50 md:z-10 shadow-2xl transition-transform duration-300 h-full glass-effect`}>
                {/* Mobile: Close button */}
                <div className={`md:hidden flex justify-between items-center p-4 border-b ${colors.borderPrimary}`}>
                    <h3 className={`font-bold ${colors.textPrimary}`}>AI Insights</h3>
                    <button onClick={() => setSidebarOpen(false)} className={`p-1.5 rounded-lg hover:${colors.bgTertiary}`}>
                        <X className={`w-5 h-5 ${colors.textMuted}`} />
                    </button>
                </div>

                <div className={`p-4 sm:p-6 border-b ${colors.borderPrimary} ${colors.bgSecondary}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <button onClick={onHome} className={`p-1.5 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition active-press`} title={mode === 'update' ? "Cancel" : "Go Home"}>
                            {mode === 'update' ? <X className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                        </button>
                        <h2 className={`responsive-text-base sm:text-lg font-bold ${colors.textPrimary} flex items-center gap-2 flex-1`}>
                            <Sparkles className="text-indigo-400 w-4 h-4 sm:w-5 sm:h-5" />
                            Insights
                        </h2>
                        {suggestedCharts.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchSuggestions}
                                    disabled={loading}
                                    className={`p-1.5 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:text-indigo-400 transition active-press disabled:opacity-50`}
                                    title="Refresh suggestions"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
                                </button>
                                {!loading && (
                                    <button
                                        onClick={addAllToBucket}
                                        disabled={suggestedCharts.every(c => isAlreadyInBucket(c))}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white transition active-press whitespace-nowrap"
                                        title="Add all recommendations to bucket"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add All
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <p className={`responsive-text-xs ${colors.textMuted} ml-8`}>
                        AI suggestions based on <span className={`${colors.textTertiary} font-medium`}>{dataModel.name}</span>
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 relative overflow-hidden rounded-xl">
                            <div className="absolute inset-0 animate-shimmer -z-10"></div>
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <p className={`${colors.textMuted} text-xs animate-pulse`}>Consulting Gemini...</p>
                        </div>
                    ) : (
                        suggestedCharts.map(chart => {
                            const inBucket = isAlreadyInBucket(chart);
                            return (
                                <div
                                    key={chart.id}
                                    className={`group relative rounded-lg sm:rounded-xl p-4 sm:p-5 transition-all duration-300 border hover-lift elevation-md ${activeSuggestionTypeMenuId === chart.id ? 'z-50' : 'z-auto'}
                                    ${inBucket
                                            ? 'bg-indigo-900/10 border-indigo-500/30 opacity-60'
                                            : `${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} hover:border-indigo-500/50 hover:${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'} hover:shadow-lg hover:shadow-indigo-500/10`
                                        }
                                `}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="relative" ref={activeSuggestionTypeMenuId === chart.id ? suggestionTypeMenuRef : null}>
                                            <button 
                                                onClick={() => setActiveSuggestionTypeMenuId(activeSuggestionTypeMenuId === chart.id ? null : chart.id)}
                                                className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${activeSuggestionTypeMenuId === chart.id ? 'bg-indigo-500/20 ring-1 ring-indigo-500/50' : 'hover:bg-indigo-500/10'}`}
                                                title="Change chart type"
                                            >
                                                <div className="text-indigo-400">
                                                    {getChartIcon(chart.type)}
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                                                    {chart.type}
                                                </span>
                                                <ChevronDown className={`w-3 h-3 text-indigo-400 transition-transform ${activeSuggestionTypeMenuId === chart.id ? 'rotate-180' : ''}`} />
                                            </button>

                                            {activeSuggestionTypeMenuId === chart.id && (
                                                <div className={`absolute left-0 top-full mt-1 w-48 max-h-64 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-50 p-1.5 animate-fade-in custom-scrollbar`}>
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 pt-1 ${colors.textMuted}`}>Suggested Type</p>
                                                    {ALL_CHART_TYPES.map(opt => {
                                                        const active = chart.type === opt.type;
                                                        return (
                                                            <button
                                                                key={opt.type}
                                                                onClick={() => { onTypeChangeSuggested(chart.id, opt.type); setActiveSuggestionTypeMenuId(null); }}
                                                                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all mb-0.5 text-left ${active ? 'bg-indigo-500/10 text-indigo-400' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                                            >
                                                                <div className={`shrink-0 ${active ? 'text-indigo-400' : colors.textMuted}`}>
                                                                    {React.cloneElement(getChartIcon(opt.type) as React.ReactElement, { className: "w-3.5 h-3.5" })}
                                                                </div>
                                                                <span className={`font-medium ${active ? 'font-bold' : ''}`}>{opt.label}</span>
                                                                {active && <Check className="w-3 h-3 ml-auto text-indigo-400" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        {!inBucket && (
                                            <button
                                                onClick={() => addToBucket(chart)}
                                                className={`${colors.textMuted} hover:${colors.textPrimary} ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} hover:bg-indigo-500 p-1.5 rounded-lg transition-colors active-press`}
                                                title="Add to dashboard bucket"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className={`font-bold ${colors.textSecondary} responsive-text-sm leading-snug`}>{chart.title}</h3>
                                    <p className={`responsive-text-xs ${colors.textMuted} mt-2 leading-relaxed line-clamp-2 pb-3`}>{chart.description}</p>
                                    
                                    <div className={`grid grid-cols-3 gap-1 mt-auto pt-3 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'}`}>
                                        {/* X-Axis */}
                                        <div className="relative" ref={activeSuggestionXAxisMenuId === chart.id ? suggestionXAxisMenuRef : null}>
                                            <button 
                                                onClick={() => setActiveSuggestionXAxisMenuId(activeSuggestionXAxisMenuId === chart.id ? null : chart.id)}
                                                className={`w-full flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${activeSuggestionXAxisMenuId === chart.id ? 'bg-indigo-500/10 ring-1 ring-indigo-500/50' : `hover:bg-indigo-500/5 ${theme === 'dark' ? 'bg-slate-900/40' : 'bg-slate-50'}`}`}
                                            >
                                                <span className={`text-[8px] font-bold uppercase tracking-wider ${colors.textMuted}`}>X-Axis</span>
                                                <span className={`text-[10px] font-medium truncate w-full text-center ${colors.textTertiary}`}>{chart.xAxisKey || '-'}</span>
                                            </button>
                                            
                                            {activeSuggestionXAxisMenuId === chart.id && (
                                                <div className={`absolute left-0 bottom-full mb-1 w-48 max-h-48 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-50 p-1.5 animate-fade-in custom-scrollbar`}>
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 pt-1 ${colors.textMuted}`}>Change X-Axis</p>
                                                    {allColumns.map(col => (
                                                        <button
                                                            key={col}
                                                            onClick={() => { onXAxisChangeSuggested(chart.id, col); setActiveSuggestionXAxisMenuId(null); }}
                                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all mb-0.5 ${chart.xAxisKey === col ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                                        >
                                                            {col}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Metric */}
                                        <div className="relative" ref={activeSuggestionMetricMenuId === chart.id ? suggestionMetricMenuRef : null}>
                                            <button 
                                                onClick={() => setActiveSuggestionMetricMenuId(activeSuggestionMetricMenuId === chart.id ? null : chart.id)}
                                                className={`w-full flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${activeSuggestionMetricMenuId === chart.id ? 'bg-indigo-500/10 ring-1 ring-indigo-500/50' : `hover:bg-indigo-500/5 ${theme === 'dark' ? 'bg-slate-900/40' : 'bg-slate-50'}`}`}
                                            >
                                                <span className={`text-[8px] font-bold uppercase tracking-wider ${colors.textMuted}`}>Metric</span>
                                                <span className={`text-[10px] font-medium truncate w-full text-center ${colors.textTertiary}`}>{chart.dataKey}</span>
                                            </button>
                                            
                                            {activeSuggestionMetricMenuId === chart.id && (
                                                <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-48 max-h-48 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-50 p-1.5 animate-fade-in custom-scrollbar`}>
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 pt-1 ${colors.textMuted}`}>Change Metric</p>
                                                    {allColumns.map(col => (
                                                        <button
                                                            key={col}
                                                            onClick={() => { onMetricChangeSuggested(chart.id, col); setActiveSuggestionMetricMenuId(null); }}
                                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all mb-0.5 ${chart.dataKey === col ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                                        >
                                                            {col}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Agg / Y-Axis */}
                                        <div className="relative" ref={(chart.type === 'HEATMAP' || chart.type === 'MATRIX') ? (activeSuggestionYAxisMenuId === chart.id ? suggestionYAxisMenuRef : null) : (activeSuggestionAggMenuId === chart.id ? suggestionAggMenuRef : null)}>
                                            <button 
                                                onClick={() => {
                                                    if (chart.type === 'HEATMAP' || chart.type === 'MATRIX') {
                                                        setActiveSuggestionYAxisMenuId(activeSuggestionYAxisMenuId === chart.id ? null : chart.id);
                                                    } else {
                                                        setActiveSuggestionAggMenuId(activeSuggestionAggMenuId === chart.id ? null : chart.id);
                                                    }
                                                }}
                                                className={`w-full flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${((chart.type === 'HEATMAP' || chart.type === 'MATRIX') ? activeSuggestionYAxisMenuId === chart.id : activeSuggestionAggMenuId === chart.id) ? 'bg-indigo-500/10 ring-1 ring-indigo-500/50' : `hover:bg-indigo-500/5 ${theme === 'dark' ? 'bg-slate-900/40' : 'bg-slate-50'}`}`}
                                            >
                                                <span className={`text-[8px] font-bold uppercase tracking-wider ${colors.textMuted}`}>
                                                    {(chart.type === 'HEATMAP' || chart.type === 'MATRIX') ? 'Y-Axis' : 'Agg'}
                                                </span>
                                                <span className={`text-[10px] font-medium truncate w-full text-center ${colors.textTertiary}`}>
                                                    {(chart.type === 'HEATMAP' || chart.type === 'MATRIX') ? (chart.yAxisKey || '-') : chart.aggregation}
                                                </span>
                                            </button>
                                            
                                            {activeSuggestionAggMenuId === chart.id && !(chart.type === 'HEATMAP' || chart.type === 'MATRIX') && (
                                                <div className={`absolute right-0 bottom-full mb-1 w-40 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-50 p-1.5 animate-fade-in`}>
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 pt-1 ${colors.textMuted}`}>Change Aggregation</p>
                                                    {Object.values(AggregationType).map(agg => (
                                                        <button
                                                            key={agg}
                                                            onClick={() => { onAggregationChangeSuggested(chart.id, agg); setActiveSuggestionAggMenuId(null); }}
                                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all mb-0.5 ${chart.aggregation === agg ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                                        >
                                                            {agg}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {activeSuggestionYAxisMenuId === chart.id && (chart.type === 'HEATMAP' || chart.type === 'MATRIX') && (
                                                <div className={`absolute right-0 bottom-full mb-1 w-48 max-h-48 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-50 p-1.5 animate-fade-in custom-scrollbar`}>
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 pt-1 ${colors.textMuted}`}>Change Y-Axis</p>
                                                    {allColumns.map(col => (
                                                        <button
                                                            key={col}
                                                            onClick={() => { onYAxisChangeSuggested(chart.id, col); setActiveSuggestionYAxisMenuId(null); }}
                                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all mb-0.5 ${chart.yAxisKey === col ? 'bg-indigo-500/10 text-indigo-400 font-bold' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                                        >
                                                            {col}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Right: Workspace */}
            <div className="flex-1 flex flex-col relative">
                {/* Header - Responsive */}
                <header className={`px-3 sm:px-6 md:px-8 py-3 sm:py-5 md:py-6 flex justify-between items-center z-30 pointer-events-none bg-gradient-to-b ${theme === 'dark' ? 'from-slate-950 to-slate-950/0' : 'from-slate-50 to-slate-50/0'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 pointer-events-auto">
                        {/* Mobile: Sidebar toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`md:hidden p-1.5 rounded-lg ${colors.bgSecondary} border ${colors.borderPrimary} ${colors.textMuted}`}
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                        {/* Back to DataConfig button — only in create mode */}
                        {mode === 'create' && onBack && (
                            <button
                                onClick={onBack}
                                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 ${colors.bgTertiary} hover:${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} border ${colors.borderSecondary} rounded-md text-[10px] sm:text-xs font-medium ${colors.textTertiary} transition active-press`}
                                title="Back to Data Configuration"
                            >
                                <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        )}
                        <h1 className={`text-base sm:text-xl md:text-2xl font-bold ${colors.textPrimary}`}>
                            {mode === 'update' ? 'Edit Dashboard' : 'Chart Builder'}
                        </h1>
                        <button
                            onClick={() => setShowData(true)}
                            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 ${colors.bgTertiary} hover:${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} border ${colors.borderSecondary} rounded-md text-[10px] sm:text-xs font-medium ${colors.textTertiary} transition active-press`}
                            title="View Data"
                        >
                            <TableIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden md:inline">View Data</span>
                        </button>
                        <div className="scale-75 sm:scale-100 origin-left">
                            <ThemeToggle />
                        </div>
                        {/* Filter Columns Dropdown */}
                        <div className="relative" ref={filterColMenuRef}>
                            <button
                                onClick={() => { setOpenFilterColMenu(o => !o); setFilterColSearch(''); }}
                                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 ${selectedFilterCols.size > 0
                                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                    : `${colors.bgTertiary} border ${colors.borderSecondary} ${colors.textTertiary}`
                                    } rounded-md text-[10px] sm:text-xs font-medium transition active-press border`}
                                title="Choose which columns appear in dashboard filters"
                            >
                                <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden md:inline">Filter Columns</span>
                                {selectedFilterCols.size > 0 && (
                                    <span className="bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                        {selectedFilterCols.size}
                                    </span>
                                )}
                                <ChevronDown className={`w-3 h-3 transition-transform ${openFilterColMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {openFilterColMenu && (
                                <div className={`absolute left-0 top-full mt-2 w-64 ${colors.bgSecondary} border ${colors.borderPrimary} rounded-xl shadow-2xl z-50 overflow-hidden`}>
                                    {/* Header */}
                                    <div className={`px-3 py-2 border-b ${colors.borderPrimary} flex items-center justify-between`}>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Filter Columns</span>
                                        <button
                                            onClick={toggleAllFilterCols}
                                            className={`text-[10px] font-medium transition ${allFilterColsSelected
                                                ? 'text-rose-400 hover:text-rose-300'
                                                : 'text-indigo-400 hover:text-indigo-300'
                                                }`}
                                        >
                                            {allFilterColsSelected ? 'Unselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    {/* Search */}
                                    <div className={`px-2 py-2 border-b ${colors.borderPrimary}`}>
                                        <input
                                            type="text"
                                            placeholder="Search columns..."
                                            autoFocus
                                            value={filterColSearch}
                                            onChange={e => setFilterColSearch(e.target.value)}
                                            className={`w-full px-3 py-1.5 text-xs rounded-lg ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                                        />
                                    </div>
                                    {/* Column list */}
                                    <div className="max-h-64 overflow-y-auto p-1.5 no-scrollbar">
                                        {filteredColList.length === 0 ? (
                                            <p className={`text-center text-xs py-4 ${colors.textMuted}`}>No columns found</p>
                                        ) : filteredColList.map(col => {
                                            const checked = selectedFilterCols.has(col);
                                            return (
                                                <button
                                                    key={col}
                                                    onClick={() => toggleFilterCol(col)}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all mb-0.5 text-left ${checked
                                                        ? 'bg-indigo-500/20 text-indigo-300'
                                                        : `${colors.textSecondary} hover:${colors.bgTertiary}`
                                                        }`}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${checked
                                                        ? 'bg-indigo-500 border-indigo-500'
                                                        : `${colors.borderSecondary} border`
                                                        }`}>
                                                        {checked && <Check className="w-2.5 h-2.5 text-white" />}
                                                    </div>
                                                    <span className="truncate">{col}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onGenerate}
                        disabled={bucket.length === 0}
                        className="pointer-events-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-2.5 sm:px-4 md:px-6 py-1.5 sm:py-2.5 rounded-full font-bold text-[10px] sm:text-sm transition-all flex items-center gap-1 sm:gap-2 shadow-lg shadow-emerald-900/20 active-press"
                    >
                        {mode === 'update' ? (
                            <>
                                <span className="hidden sm:inline">Save Updates</span>
                                <span className="sm:hidden">Save</span>
                                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                            </>
                        ) : (
                            <>
                                <span className="hidden sm:inline">Generate Report</span>
                                <span className="sm:hidden">Generate</span>
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </>
                        )}
                    </button>
                </header>

                <div
                    ref={scrollContainerRef}
                    onDragOver={handleDragOverScroll}
                    className="flex-1 responsive-container pt-0 overflow-y-auto custom-scrollbar flex flex-col gap-6 sm:gap-8"
                >

                    {/* AI Chat Input - Responsive */}
                    <div className="w-full max-w-3xl mx-auto mt-2 sm:mt-4">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                            <div className={`relative ${colors.bgSecondary} rounded-xl sm:rounded-2xl p-1 flex items-center ring-1 ${theme === 'dark' ? 'ring-white/10' : 'ring-slate-300'} focus-within:ring-indigo-500/50 transition-all elevation-md`}>
                                <input
                                    type="text"
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="Ask for a custom chart..."
                                    className={`flex-1 bg-transparent border-none ${colors.textSecondary} ${theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-slate-400'} px-3 sm:px-5 py-1.5 sm:py-3 focus:ring-0 outline-none text-xs sm:text-sm`}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCustomChart()}
                                />
                                <div className="flex items-center gap-1 pr-1">
                                    <button
                                        onClick={toggleVoiceInput}
                                        className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition ${isListening ? 'bg-red-500 text-white animate-pulse' : `hover:${colors.bgTertiary} ${colors.textMuted}`}`}
                                        title="Use Voice Input"
                                    >
                                        {isListening ? <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setIsManualOpen(true)}
                                        className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition hover:${colors.bgTertiary} ${colors.textMuted}`}
                                        title="Manual Chart Builder"
                                    >
                                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                        onClick={handleCustomChart}
                                        disabled={isGeneratingCustom || !customPrompt.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition disabled:opacity-50 disabled:bg-slate-700"
                                    >
                                        {isGeneratingCustom ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {isListening && (
                            <p className="text-center responsive-text-xs text-indigo-400 mt-2 animate-pulse">Listening...</p>
                        )}
                    </div>

                    {/* The Bucket Area */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="responsive-text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                                {mode === 'update' ? 'Dashboard Layout' : 'Your Dashboard Sections'}
                            </h3>
                            <button
                                onClick={addSection}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Section</span>
                            </button>
                        </div>

                        {sections.length === 0 && bucket.length > 0 && (
                            <div className="mb-8 p-4 rounded-xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 text-center">
                                <p className="text-sm text-indigo-400 font-medium mb-3">Organize your dashboard by creating sections</p>
                                <button
                                    onClick={() => {
                                        const id = `section-${Date.now()}`;
                                        setSections([{ id, name: 'Main Overview' }]);
                                        // Move current bucket into this section
                                        setBucket(bucket.map(c => ({ ...c, sectionId: id })));
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-900/40"
                                >
                                    Create My First Section
                                </button>
                            </div>
                        )}

                        <div className="space-y-10 pb-20">
                            {sections.map((section, sIdx) => {
                                const sectionCharts = bucket.filter(c => c.sectionId === section.id);
                                return (
                                    <div
                                        key={section.id}
                                        onDrop={(e) => onDropToSection(e, section.id)}
                                        onDragOver={onDragOverSection}
                                        className={`p-4 sm:p-6 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'} hover:border-indigo-500/30`}
                                    >
                                        <div className="flex items-center justify-between mb-6 group/sec">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Layers className="w-5 h-5 text-indigo-400" />
                                                    <input
                                                        type="text"
                                                        value={section.name}
                                                        onChange={(e) => renameSection(section.id, e.target.value)}
                                                        className={`bg-transparent border-none text-base sm:text-lg font-bold ${colors.textPrimary} focus:ring-0 outline-none w-48 sm:w-64`}
                                                    />
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'} font-bold`}>
                                                    {sectionCharts.length} Charts
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removeSection(section.id)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition opacity-0 group-hover/sec:opacity-100"
                                                title="Remove section"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {sectionCharts.length === 0 ? (
                                            <div className={`py-12 flex flex-col items-center justify-center border-2 border-dashed ${colors.borderPrimary} rounded-xl ${theme === 'dark' ? 'bg-slate-950/20' : 'bg-slate-100/20'}`}>
                                                <p className={`text-xs ${colors.textMuted}`}>Drag and drop charts here</p>
                                            </div>
                                        ) : (
                                            <div className="suggestions-grid">
                                                {sectionCharts.map((chart, i) => (
                                                    <BucketChartCard
                                                        key={chart.id}
                                                        chart={chart}
                                                        index={i}
                                                        theme={theme}
                                                        colors={colors}
                                                        onRemove={removeFromBucket}
                                                        onTypeChange={onTypeChangeBucket}
                                                        onColorChange={(id, color) =>
                                                            setBucket(prev => prev.map(c => c.id === id ? { ...c, color } : c))
                                                        }
                                                        onColor2Change={(id, color2) =>
                                                            setBucket(prev => prev.map(c => c.id === id ? { ...c, color2 } : c))
                                                        }
                                                        onMulticolorChange={(id, multicolor) =>
                                                            setBucket(prev => prev.map(c => c.id === id ? { ...c, multicolor } : c))
                                                        }
                                                        onTitleChange={(id, title) =>
                                                            setBucket(prev => prev.map(c => c.id === id ? { ...c, title } : c))
                                                        }
                                                        onDragStart={onDragStart}
                                                        sections={sections}
                                                        currentSectionId={section.id}
                                                        onMoveToSection={(chartId, newSectionId) => setBucket(prev => prev.map(c => c.id === chartId ? { ...c, sectionId: newSectionId || undefined } : c))}
                                                        allColumns={allColumns}
                                                        onXAxisChange={onXAxisChangeBucket}
                                                        onMetricChange={onMetricChangeBucket}
                                                        onAggregationChange={onAggregationChangeBucket}
                                                        onYAxisChange={onYAxisChangeBucket}
                                                        onFontFamilyChange={onFontFamilyChangeBucket}
                                                        onFontSizeChange={onFontSizeChangeBucket}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Uncategorized Charts */}
                            {bucket.filter(c => !c.sectionId).length > 0 && (
                                <div
                                    onDrop={(e) => onDropToSection(e, '')}
                                    onDragOver={onDragOverSection}
                                    className={`p-4 sm:p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/20 border-slate-800 border-dashed' : 'bg-slate-100/50 border-slate-200 border-dashed'}`}
                                >
                                    <h4 className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-2">
                                        <Grid3x3 className="w-4 h-4" />
                                        Uncategorized Charts
                                    </h4>
                                    <div className="suggestions-grid">
                                        {bucket.filter(c => !c.sectionId).map((chart, i) => (
                                            <BucketChartCard
                                                key={chart.id}
                                                chart={chart}
                                                index={i}
                                                theme={theme}
                                                colors={colors}
                                                onRemove={removeFromBucket}
                                                onTypeChange={onTypeChangeBucket}
                                                onColorChange={(id, color) =>
                                                    setBucket(prev => prev.map(c => c.id === id ? { ...c, color } : c))
                                                }
                                                onColor2Change={(id, color2) =>
                                                    setBucket(prev => prev.map(c => c.id === id ? { ...c, color2 } : c))
                                                }
                                                onMulticolorChange={(id, multicolor) =>
                                                    setBucket(prev => prev.map(c => c.id === id ? { ...c, multicolor } : c))
                                                }
                                                onTitleChange={(id, title) =>
                                                    setBucket(prev => prev.map(c => c.id === id ? { ...c, title } : c))
                                                }
                                                onDragStart={onDragStart}
                                                sections={sections}
                                                currentSectionId={undefined}
                                                onMoveToSection={(chartId, newSectionId) => setBucket(prev => prev.map(c => c.id === chartId ? { ...c, sectionId: newSectionId || undefined } : c))}
                                                allColumns={allColumns}
                                                onXAxisChange={onXAxisChangeBucket}
                                                onMetricChange={onMetricChangeBucket}
                                                onAggregationChange={onAggregationChangeBucket}
                                                onYAxisChange={onYAxisChangeBucket}
                                                onFontFamilyChange={onFontFamilyChangeBucket}
                                                onFontSizeChange={onFontSizeChangeBucket}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};