import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from '../types';
import { processFile } from '../utils/fileParser';
import { profileDataWithGemini, DataProfilingResult, TableProfile, ColumnProfile, JoinSuggestion, TableInput } from '../services/geminiService';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    Home, Plus, ArrowRight, Loader2, Table, Key, Link as LinkIcon,
    AlertCircle, Hash, Type as TypeIcon, BarChart3, Sparkles,
    Percent, Calendar, ToggleLeft, AtSign, Phone, Globe, HelpCircle, X, RefreshCw, FileText, Database, Cpu,
    Download, ChevronLeft, ChevronRight
} from 'lucide-react';

interface DataProfilingProps {
    initialTables: DataTable[];
    fileName: string;
    uploadedFileId?: number;
    sourceType?: string;
    onProceed: (tables: DataTable[]) => void;
    onHome: () => void;
    isEmbedded?: boolean;
}

// ── Local Rule-Based Fallback Profiler ────────────────────────────────────────
const inferTypeLocal = (colName: string, values: string[]): string => {
    const name = colName.toLowerCase();
    const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
    if (nonEmpty.length === 0) return 'UNKNOWN';

    // Name-based heuristics
    if (/\b(id|key|code|uuid|guid)\b/.test(name)) return 'ID';
    if (/\b(email|mail)\b/.test(name)) return 'EMAIL';
    if (/\b(phone|mobile|tel|fax)\b/.test(name)) return 'PHONE';
    if (/\b(url|link|website|href)\b/.test(name)) return 'URL';
    if (/\b(date|time|day|month|year|timestamp|created|updated|at)\b/.test(name)) return 'DATE';
    if (/\b(price|cost|revenue|sales|amount|salary|fee|charge|pay|earn|income|profit|loss|total|value|rate|tax|discount)\b/.test(name)) return 'CURRENCY';
    if (/\b(pct|percent|ratio|rate|share)\b/.test(name)) return 'PERCENT';
    if (/\b(count|qty|quantity|num|number|age|rank|seq)\b/.test(name)) return 'INTEGER';
    if (/\b(is_|has_|flag|active|enabled|bool)\b/.test(name)) return 'BOOLEAN';

    // Value-based detection
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dateRe = /^\d{4}[-/]\d{2}[-/]\d{2}|^\d{2}[-/]\d{2}[-/]\d{4}/;
    const boolRe = /^(true|false|yes|no|1|0|y|n)$/i;

    let numericCount = 0, dateCount = 0, emailCount = 0, boolCount = 0;
    const sample = nonEmpty.slice(0, 20);
    for (const v of sample) {
        if (!isNaN(Number(v)) && v.trim() !== '') numericCount++;
        if (dateRe.test(v)) dateCount++;
        if (emailRe.test(v)) emailCount++;
        if (boolRe.test(v)) boolCount++;
    }
    const ratio = (n: number) => n / sample.length;
    if (ratio(emailCount) > 0.6) return 'EMAIL';
    if (ratio(dateCount) > 0.6) return 'DATE';
    if (ratio(boolCount) > 0.6) return 'BOOLEAN';
    if (ratio(numericCount) > 0.7) {
        // Distinguish DECIMAL vs INTEGER
        const hasDecimal = sample.some(v => v.includes('.'));
        return hasDecimal ? 'DECIMAL' : 'INTEGER';
    }
    return 'TEXT';
};

const looksLikePK = (colName: string, values: string[], type: string): boolean => {
    if (!['ID', 'INTEGER', 'TEXT'].includes(type)) return false;
    const nonEmpty = values.filter(v => v !== '');
    if (nonEmpty.length < 2) return false;
    const unique = new Set(nonEmpty).size;
    // Must be 100% unique to qualify as PK
    if (unique !== nonEmpty.length) return false;
    // Normalise: remove spaces, underscores, lowercase
    const norm = colName.toLowerCase().replace(/[\s_-]/g, '');
    // Matches: "id", "orderid", "productid", "pk", "primarykey", "orderno", "rowid"
    return /^(id|.*id|.*key|pk|primarykey|.*no|.*rowid|.*seq)$/.test(norm);
};

const looksLikeFK = (colName: string, type: string, allColumnNames: string[]): boolean => {
    if (!['ID', 'INTEGER', 'TEXT'].includes(type)) return false;
    // Normalise: lowercase, no spaces/underscores
    const norm = colName.toLowerCase().replace(/[\s_-]/g, '');
    // Must end with 'id', 'key', 'fk', 'ref' AND not be a standalone 'id'
    if (norm === 'id') return false;
    if (!/((id|key|fk|ref)$)/.test(norm)) return false;
    // It's a FK candidate — additionally check it's NOT also a PK in this table
    // (PK check handled by caller via !isPrimaryKey)
    return true;
};

const runLocalProfiling = (tables: DataTable[]): DataProfilingResult => {
    const tableProfiles: TableProfile[] = tables.map(t => {
        const headerRow = t.rawData.rows[0] || t.rawData.headers || [];
        const dataRows = t.rawData.rows.slice(1);
        const totalRows = dataRows.length;

        const columns: ColumnProfile[] = headerRow.map((colName, colIdx) => {
            const values = dataRows.map(row => (row[colIdx] ?? '').toString().trim());
            const nulls = values.filter(v => v === '' || v === 'null' || v === 'NULL' || v === 'N/A');
            const nullCount = nulls.length;
            const nullPercent = totalRows > 0 ? (nullCount / totalRows) * 100 : 0;
            const nonEmpty = values.filter(v => v !== '');
            const unique = new Set(nonEmpty).size;
            const uniquePercent = totalRows > 0 ? (unique / totalRows) * 100 : 0;
            const sampleValues = Array.from(new Set(nonEmpty)).slice(0, 5);
            const inferredType = inferTypeLocal(colName, nonEmpty);
            const isPrimaryKey = looksLikePK(colName, nonEmpty, inferredType);
            const isForeignKey = !isPrimaryKey && looksLikeFK(colName, inferredType, headerRow);

            return {
                name: colName,
                inferredType,
                isPrimaryKey,
                isForeignKey,
                nullCount,
                nullPercent: Math.round(nullPercent * 10) / 10,
                uniqueCount: unique,
                uniquePercent: Math.round(uniquePercent * 10) / 10,
                sampleValues,
                description: `${inferredType.toLowerCase()} column with ${unique} unique values and ${Math.round(nullPercent)}% null rate.`
            };
        });

        return {
            tableName: t.name,
            totalRows,
            totalColumns: headerRow.length,
            columns,
            tableDescription: `Table with ${headerRow.length} columns and ${totalRows.toLocaleString()} rows.`
        };
    });

    // Simple join suggestions based on matching column names
    const joinSuggestions: JoinSuggestion[] = [];
    for (let i = 0; i < tables.length; i++) {
        for (let j = i + 1; j < tables.length; j++) {
            const leftCols = tableProfiles[i].columns;
            const rightCols = tableProfiles[j].columns;
            for (const lc of leftCols) {
                for (const rc of rightCols) {
                    const ln = lc.name.toLowerCase().replace(/\s/g, '_');
                    const rn = rc.name.toLowerCase().replace(/\s/g, '_');
                    if (ln === rn && (lc.isPrimaryKey || lc.isForeignKey || rc.isPrimaryKey || rc.isForeignKey)) {
                        joinSuggestions.push({
                            leftTable: tables[i].name,
                            rightTable: tables[j].name,
                            leftColumn: lc.name,
                            rightColumn: rc.name,
                            joinType: 'INNER',
                            confidence: 0.75,
                            reasoning: `Column "${lc.name}" appears in both tables with matching name and key-like characteristics.`
                        });
                    }
                }
            }
        }
    }

    return {
        tables: tableProfiles,
        joinSuggestions,
        overallSummary: `Local analysis of ${tables.length} table(s) completed. ${tableProfiles.reduce((s, t) => s + t.totalRows, 0).toLocaleString()} total rows, ${tableProfiles.reduce((s, t) => s + t.totalColumns, 0)} total columns analyzed.`
    };
};

// ── Type Rendering Helpers ─────────────────────────────────────────────────────
const TYPE_ICON_MAP: { [key: string]: React.ReactNode } = {
    'TEXT': <TypeIcon className="w-3 h-3" />,
    'INTEGER': <Hash className="w-3 h-3" />,
    'DECIMAL': <Hash className="w-3 h-3" />,
    'CURRENCY': <span className="text-[10px] font-bold">$</span>,
    'PERCENT': <Percent className="w-3 h-3" />,
    'DATE': <Calendar className="w-3 h-3" />,
    'BOOLEAN': <ToggleLeft className="w-3 h-3" />,
    'ID': <Key className="w-3 h-3" />,
    'EMAIL': <AtSign className="w-3 h-3" />,
    'PHONE': <Phone className="w-3 h-3" />,
    'URL': <Globe className="w-3 h-3" />,
    'UNKNOWN': <HelpCircle className="w-3 h-3" />,
};

const getTypeColor = (type: string, theme: string) => {
    const d = theme === 'dark';
    const map: { [key: string]: string } = {
        'TEXT':     d ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'       : 'text-sky-600 bg-sky-50 border-sky-200',
        'INTEGER':  d ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-amber-600 bg-amber-50 border-amber-200',
        'DECIMAL':  d ? 'text-orange-400 bg-orange-500/10 border-orange-500/30':'text-orange-600 bg-orange-50 border-orange-200',
        'CURRENCY': d ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30':'text-emerald-600 bg-emerald-50 border-emerald-200',
        'PERCENT':  d ? 'text-violet-400 bg-violet-500/10 border-violet-500/30':'text-violet-600 bg-violet-50 border-violet-200',
        'DATE':     d ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'    : 'text-blue-600 bg-blue-50 border-blue-200',
        'BOOLEAN':  d ? 'text-pink-400 bg-pink-500/10 border-pink-500/30'    : 'text-pink-600 bg-pink-50 border-pink-200',
        'ID':       d ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30':'text-indigo-600 bg-indigo-50 border-indigo-200',
        'EMAIL':    d ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'    : 'text-cyan-600 bg-cyan-50 border-cyan-200',
        'PHONE':    d ? 'text-teal-400 bg-teal-500/10 border-teal-500/30'    : 'text-teal-600 bg-teal-50 border-teal-200',
        'URL':      d ? 'text-lime-400 bg-lime-500/10 border-lime-500/30'    : 'text-lime-600 bg-lime-50 border-lime-200',
        'UNKNOWN':  d ? 'text-slate-400 bg-slate-500/10 border-slate-500/30' : 'text-slate-600 bg-slate-50 border-slate-200',
    };
    return map[type] || map['UNKNOWN'];
};

// ── Component ─────────────────────────────────────────────────────────────────
export const DataProfiling: React.FC<DataProfilingProps> = ({
    initialTables, fileName, uploadedFileId, sourceType, onProceed, onHome, isEmbedded = false
}) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tables, setTables] = useState<DataTable[]>(initialTables);
    const [profilingResult, setProfilingResult] = useState<DataProfilingResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [usedFallback, setUsedFallback] = useState(false);
    const [expandedTable, setExpandedTable] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('card'); // User wants card view by default often, but left it originally as card? Wait, it was table in line 220. I will leave it as whatever it is and just add pageMap.
    const [pageMap, setPageMap] = useState<Record<string, number>>({});
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const cardViewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tables.length === 0) return;
        runProfiling();
    }, [tables]);

    const runProfiling = async () => {
        setIsLoading(true);
        setUsedFallback(false);
        try {
            const tableInputs: TableInput[] = tables.map(t => {
                const headerRow = t.rawData.rows[0] || t.rawData.headers || [];
                const dataRows = t.rawData.rows.slice(1);
                return {
                    name: t.name,
                    headers: headerRow,
                    sampleRows: dataRows.slice(0, 15),
                    totalRows: dataRows.length
                };
            });

            const result = await profileDataWithGemini(tableInputs);
            setProfilingResult(result);
            if (result.tables.length > 0) setExpandedTable(result.tables[0].tableName);
        } catch (err: any) {
            // Always fall back to local profiling — never block the user
            console.warn("Gemini profiling failed, using local fallback:", err?.message);
            const fallback = runLocalProfiling(tables);
            setProfilingResult(fallback);
            setUsedFallback(true);
            if (fallback.tables.length > 0) setExpandedTable(fallback.tables[0].tableName);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTable = async (file: File) => {
        try {
            const newTables = await processFile(file);
            setTables(prev => [...prev, ...newTables]);
        } catch (err) {
            console.error("Failed to add table", err);
            alert("Could not process file.");
        }
    };

    const getNullBarColor = (percent: number) => {
        if (percent === 0)  return theme === 'dark' ? 'bg-emerald-500' : 'bg-emerald-400';
        if (percent < 10)   return theme === 'dark' ? 'bg-yellow-500'  : 'bg-yellow-400';
        if (percent < 50)   return theme === 'dark' ? 'bg-orange-500'  : 'bg-orange-400';
        return theme === 'dark' ? 'bg-red-500' : 'bg-red-400';
    };

    const getConfidenceColor = (c: number) =>
        c >= 0.8 ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600')
        : c >= 0.5 ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-600')
        : (theme === 'dark' ? 'text-red-400' : 'text-red-600');

    const CHART_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

    const computeNumericStats = (colName: string, tp: TableProfile) => {
        const table = tables.find(t => t.name === tp.tableName);
        if (!table) return null;
        const headerRow = table.rawData.rows[0] || table.rawData.headers || [];
        const colIdx = headerRow.findIndex((h: string) => h === colName);
        if (colIdx === -1) return null;
        const dataRows = table.rawData.rows.slice(1);
        const nums = dataRows.map(row => parseFloat(row[colIdx])).filter(n => !isNaN(n));
        if (nums.length === 0) return null;
        const sorted = [...nums].sort((a, b) => a - b);
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: nums.reduce((a, b) => a + b, 0) / nums.length,
            median: sorted[Math.floor(sorted.length / 2)]
        };
    };

    const getTopValues = (colName: string, tp: TableProfile) => {
        const table = tables.find(t => t.name === tp.tableName);
        if (!table) return [];
        const headerRow = table.rawData.rows[0] || table.rawData.headers || [];
        const colIdx = headerRow.findIndex((h: string) => h === colName);
        if (colIdx === -1) return [];
        const dataRows = table.rawData.rows.slice(1);
        const counts: Record<string, number> = {};
        dataRows.forEach(row => {
            const val = (row[colIdx] ?? '').toString().trim();
            if (val !== '' && val.toLowerCase() !== 'null' && val !== 'N/A') {
                counts[val] = (counts[val] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([value, count]) => ({ value: value.length > 12 ? value.slice(0, 12) + '…' : value, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    };

    const renderPagination = (tp: TableProfile) => {
        const itemsPerPage = 5;
        const totalPages = Math.ceil(tp.columns.length / itemsPerPage);
        if (totalPages <= 1) return null;

        const currentPage = pageMap[tp.tableName] || 1;

        const handleNext = () => setPageMap(prev => ({ ...prev, [tp.tableName]: Math.min(currentPage + 1, totalPages) }));
        const handlePrev = () => setPageMap(prev => ({ ...prev, [tp.tableName]: Math.max(currentPage - 1, 1) }));

        return (
            <div className={`flex items-center justify-between py-3 px-4 sm:px-6 border-t ${colors.borderPrimary}`}>
                <span className={`text-xs ${colors.textMuted}`}>
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, tp.columns.length)} to {Math.min(currentPage * itemsPerPage, tp.columns.length)} of {tp.columns.length} columns
                </span>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrev} disabled={currentPage === 1} 
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${colors.borderPrimary} disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'} transition`}>
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <div className={`text-xs font-semibold ${colors.textPrimary} px-2`}>
                        {currentPage} / {totalPages}
                    </div>
                    <button onClick={handleNext} disabled={currentPage === totalPages} 
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${colors.borderPrimary} disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'} transition`}>
                        Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    };

    const exportCSV = () => {
        if (!profilingResult) return;
        const headers = ['Column', 'Type', 'Count', 'Unique', 'Nulls', 'Null Rate %', 'Mean', 'Min', 'Max'];
        const rows: string[][] = [];
        profilingResult.tables.forEach(tp => {
            tp.columns.forEach(col => {
                const ns = ['INTEGER', 'DECIMAL', 'CURRENCY', 'PERCENT'].includes(col.inferredType)
                    ? computeNumericStats(col.name, tp) : null;
                rows.push([
                    col.name, col.inferredType.toLowerCase(), tp.totalRows.toString(),
                    col.uniqueCount.toString(), col.nullCount.toString(),
                    col.nullPercent.toFixed(1),
                    ns ? ns.mean.toFixed(3) : 'N/A',
                    ns ? String(ns.min) : 'N/A',
                    ns ? String(ns.max) : 'N/A'
                ]);
            });
        });
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profiling_summary_${fileName.replace(/\.[^.]+$/, '')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportPDF = async () => {
        if (isExportingPDF) return;
        setIsExportingPDF(true);
        const prevMode = viewMode;
        if (prevMode !== 'card') setViewMode('card');
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 800)));
        const el = cardViewRef.current;
        if (!el) { if (prevMode !== 'card') setViewMode(prevMode); setIsExportingPDF(false); return; }
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pw = pdf.internal.pageSize.getWidth();
            const ph = pdf.internal.pageSize.getHeight();
            const canvasOpts = {
                scale: 1.5, useCORS: true, logging: false,
                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff'
            };
            const imgQuality = 0.75;
            
            const sections = el.querySelectorAll('.pdf-export-section');
            if (sections.length > 0) {
                let currentY = 10;
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i] as HTMLElement;
                    const canvas = await html2canvas(section, canvasOpts);
                    const imgData = canvas.toDataURL('image/jpeg', imgQuality);
                    const iw = pw - 20;
                    const ih = (canvas.height * iw) / canvas.width;
                    
                    if (i > 0 && currentY + ih > ph - 10) {
                        pdf.addPage();
                        currentY = 10;
                    }
                    
                    pdf.addImage(imgData, 'JPEG', 10, currentY, iw, ih, undefined, 'FAST');
                    currentY += ih + 5;
                }
            } else {
                const canvas = await html2canvas(el, canvasOpts);
                const imgData = canvas.toDataURL('image/jpeg', imgQuality);
                const iw = pw - 20;
                const ih = (canvas.height * iw) / canvas.width;
                let left = ih;
                let pos = 10;
                pdf.addImage(imgData, 'JPEG', 10, pos, iw, ih, undefined, 'FAST');
                left -= (ph - 20);
                while (left > 0) {
                    pdf.addPage();
                    pos = 10 - (ih - left);
                    pdf.addImage(imgData, 'JPEG', 10, pos, iw, ih, undefined, 'FAST');
                    left -= (ph - 20);
                }
            }
            pdf.save(`profiling_report_${fileName.replace(/\.[^.]+$/, '')}.pdf`);
        } catch (err) {
            console.error('PDF export failed:', err);
        }
        if (prevMode !== 'card') setViewMode(prevMode);
        setIsExportingPDF(false);
    };

    return (
        <div className={`flex flex-col ${isEmbedded ? 'h-full' : 'h-screen'} ${colors.bgPrimary} ${colors.textSecondary}`}>
            {/* Header - Only show if not embedded */}
            {!isEmbedded && (
                <header className={`${theme === 'dark' ? 'bg-slate-900/50' : 'bg-white/80'} glass-effect border-b ${colors.borderPrimary} px-3 sm:px-5 md:px-8 py-2 sm:py-3 md:py-4 flex justify-between items-center sticky top-0 z-20`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button onClick={onHome} className={`p-1.5 sm:p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition active-press`} title="Go Home">
                            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <div className={`w-px h-6 ${colors.borderPrimary} hidden sm:block`}></div>
                        <div className="bg-violet-500/20 p-1.5 sm:p-2 rounded-lg border border-violet-500/30">
                            <Sparkles className="text-violet-400 w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className={`text-sm sm:text-base md:text-lg font-bold ${colors.textPrimary} flex items-center gap-2`}>
                                <span className="sm:hidden">Profiling</span>
                                <span className="hidden sm:inline">Data Profiling</span>
                                {isLoading && <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />}
                            </h1>
                            <p className={`hidden sm:block text-xs ${colors.textMuted}`}>AI-powered analysis of your data structure</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {/* View Toggle */}
                        {profilingResult && !isLoading && (
                            <div className={`flex items-center rounded-lg border ${colors.borderPrimary} overflow-hidden`}>
                                <button onClick={() => setViewMode('table')}
                                    className={`px-2.5 py-1.5 text-[10px] sm:text-xs font-medium flex items-center gap-1 transition ${viewMode === 'table' ? 'bg-indigo-600 text-white' : `${colors.textMuted}`}`}>
                                    <Table className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Table</span>
                                </button>
                                <button onClick={() => setViewMode('card')}
                                    className={`px-2.5 py-1.5 text-[10px] sm:text-xs font-medium flex items-center gap-1 transition ${viewMode === 'card' ? 'bg-indigo-600 text-white' : `${colors.textMuted}`}`}>
                                    <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Cards</span>
                                </button>
                            </div>
                        )}
                        {/* Export Buttons */}
                        {profilingResult && !isLoading && (
                            <>
                                <button onClick={exportCSV} title="Export CSV"
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium flex items-center gap-1 transition border ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}>
                                    <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">CSV</span>
                                </button>
                                <button onClick={exportPDF} title="Export PDF (Card View)" disabled={isExportingPDF}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium flex items-center gap-1 transition border ${theme === 'dark' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'} ${isExportingPDF ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                    {isExportingPDF ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} <span className="hidden sm:inline">{isExportingPDF ? 'Exporting…' : 'PDF'}</span>
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => onProceed(tables)}
                            disabled={isLoading}
                            className="px-3 sm:px-5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 shadow-lg shadow-indigo-900/20 active-press disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="hidden sm:inline">Data Relationships</span>
                            <span className="sm:hidden">Next</span>
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar ${isEmbedded ? '' : 'overflow-y-auto'}`}>
                <div className={`mx-auto w-full ${isEmbedded ? 'px-0 pt-0 pb-6' : 'max-w-7xl px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8'} space-y-6`}>



                    {/* Summary Banner */}
                    {profilingResult && !isLoading && (
                        <div className={`rounded-2xl p-4 sm:p-6 border ${theme === 'dark' ? 'bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border-violet-500/20' : 'bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200'}`}>
                            <div className="flex items-start gap-3">
                                <Sparkles className={`w-5 h-5 mt-0.5 flex-shrink-0 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-500'}`} />
                                <div className="flex-1 min-w-0">
                                    <h2 className={`text-sm sm:text-base font-bold ${colors.textPrimary} mb-1`}>Profiling Summary</h2>
                                    <p className={`text-xs sm:text-sm ${colors.textMuted} leading-relaxed`}>{profilingResult.overallSummary}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
                                {[
                                    { icon: <Table className="w-3.5 h-3.5" />, label: `${profilingResult.tables.length} Table${profilingResult.tables.length !== 1 ? 's' : ''}`, color: 'text-indigo-400' },
                                    { icon: <BarChart3 className="w-3.5 h-3.5" />, label: `${profilingResult.tables.reduce((s, t) => s + t.totalColumns, 0)} Columns`, color: 'text-emerald-400' },
                                    { icon: <FileText className="w-3.5 h-3.5" />, label: `${profilingResult.tables.reduce((s, t) => s + t.totalRows, 0).toLocaleString()} Rows`, color: 'text-amber-400' },
                                    ...(profilingResult.joinSuggestions.length > 0 ? [{ icon: <LinkIcon className="w-3.5 h-3.5" />, label: `${profilingResult.joinSuggestions.length} Join Suggestion${profilingResult.joinSuggestions.length !== 1 ? 's' : ''}`, color: 'text-violet-400' }] : [])
                                ].map((stat, i) => (
                                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white/70'}`}>
                                        <span className={stat.color}>{stat.icon}</span>
                                        <span className={`text-xs font-bold ${colors.textPrimary}`}>{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className={`${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} p-12 sm:p-16 flex flex-col items-center gap-4`}>
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
                                </div>
                                <Loader2 className="absolute -top-1 -right-1 w-6 h-6 text-violet-400 animate-spin" />
                            </div>
                            <div className="text-center">
                                <h3 className={`text-base sm:text-lg font-bold ${colors.textPrimary} mb-1`}>Analyzing Your Data</h3>
                                <p className={`text-xs sm:text-sm ${colors.textMuted}`}>Profiling {tables.length} table{tables.length !== 1 ? 's' : ''} — identifying column types, keys, and relationships...</p>
                            </div>
                        </div>
                    )}

                    {/* Tables Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className={`text-xs sm:text-sm font-bold ${colors.textMuted} uppercase tracking-wider flex items-center gap-2`}>
                                <Database className={`w-4 h-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                Uploaded Tables ({tables.length})
                            </h2>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition"
                            >
                                <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add Table</span>
                            </button>
                        </div>
                        
                        {/* Render Toggles if Embedded */}
                        {isEmbedded && profilingResult && !isLoading && (
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <div className={`flex items-center rounded-lg border ${colors.borderPrimary} overflow-hidden`}>
                                    <button onClick={() => setViewMode('table')}
                                        className={`px-2.5 py-1.5 text-[10px] sm:text-xs font-medium flex items-center gap-1 transition ${viewMode === 'table' ? 'bg-indigo-600 text-white' : `${colors.textMuted}`}`}>
                                        <Table className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Table</span>
                                    </button>
                                    <button onClick={() => setViewMode('card')}
                                        className={`px-2.5 py-1.5 text-[10px] sm:text-xs font-medium flex items-center gap-1 transition ${viewMode === 'card' ? 'bg-indigo-600 text-white' : `${colors.textMuted}`}`}>
                                        <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Cards</span>
                                    </button>
                                </div>
                                <button onClick={exportCSV} title="Export CSV"
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium flex items-center gap-1 transition border ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}>
                                    <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">CSV</span>
                                </button>
                                <button onClick={exportPDF} title="Export PDF (Card View)" disabled={isExportingPDF}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium flex items-center gap-1 transition border ${theme === 'dark' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'} ${isExportingPDF ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                    {isExportingPDF ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} <span className="hidden sm:inline">{isExportingPDF ? 'Exporting…' : 'PDF'}</span>
                                </button>
                            </div>
                        )}
                        <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputRef} className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleAddTable(e.target.files[0])} />
                    </div>

                    {/* Table Profile Cards — Table View */}
                    {viewMode === 'table' && profilingResult && !isLoading && profilingResult.tables.map((tp, tIdx) => {
                        const isExpanded = expandedTable === tp.tableName;
                        const pkCols = tp.columns.filter(c => c.isPrimaryKey);
                        const fkCols = tp.columns.filter(c => c.isForeignKey);

                        return (
                            <div key={`${tp.tableName}-${tIdx}`} className={`${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} overflow-hidden elevation-md`}>
                                {/* Card Header */}
                                <button
                                    onClick={() => setExpandedTable(isExpanded ? null : tp.tableName)}
                                    className={`w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 transition hover:${colors.bgTertiary}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200'}`}>
                                            <Table className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <h3 className={`text-sm sm:text-base font-bold ${colors.textPrimary} truncate`}>{tp.tableName}</h3>
                                            <p className={`text-[10px] sm:text-xs ${colors.textMuted} truncate`}>{tp.tableDescription}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                        <div className={`hidden sm:flex items-center gap-4 text-xs ${colors.textMuted}`}>
                                            <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {tp.totalColumns} cols</span>
                                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {tp.totalRows.toLocaleString()} rows</span>
                                            {pkCols.length > 0 && <span className={`flex items-center gap-1 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}><Key className="w-3 h-3" /> {pkCols.length} PK</span>}
                                            {fkCols.length > 0 && <span className={`flex items-center gap-1 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}><LinkIcon className="w-3 h-3" /> {fkCols.length} FK</span>}
                                        </div>
                                        <svg className={`w-4 h-4 transition-transform duration-300 ${colors.textMuted} ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </button>

                                {/* Expanded Column Table */}
                                {isExpanded && (
                                    <div className={`border-t ${colors.borderPrimary}`}>
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[700px]">
                                                <thead>
                                                    <tr className={`text-left text-[10px] sm:text-xs font-bold ${colors.textMuted} uppercase tracking-wider ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                                        <th className="px-4 sm:px-6 py-2.5">Column</th>
                                                        <th className="px-3 py-2.5">Type</th>
                                                        <th className="px-3 py-2.5 text-center">Keys</th>
                                                        <th className="px-3 py-2.5">Null %</th>
                                                        <th className="px-3 py-2.5">Unique</th>
                                                        <th className="px-3 py-2.5">Sample Values</th>
                                                        <th className="px-4 sm:px-6 py-2.5">Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tp.columns.slice(((pageMap[tp.tableName] || 1) - 1) * 5, (pageMap[tp.tableName] || 1) * 5).map((col, cIdx) => (
                                                        <tr key={`${col.name}-${cIdx}`} className={`border-t ${colors.borderPrimary} transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                                                            <td className="px-4 sm:px-6 py-3">
                                                                <span className={`text-xs sm:text-sm font-semibold ${colors.textPrimary}`}>{col.name}</span>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider border ${getTypeColor(col.inferredType, theme)}`}>
                                                                    {TYPE_ICON_MAP[col.inferredType] || TYPE_ICON_MAP['UNKNOWN']}
                                                                    {col.inferredType}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    {col.isPrimaryKey && (
                                                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${theme === 'dark' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}><Key className="w-2.5 h-2.5" /> PK</span>
                                                                    )}
                                                                    {col.isForeignKey && (
                                                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${theme === 'dark' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : 'bg-violet-50 text-violet-600 border border-violet-200'}`}><LinkIcon className="w-2.5 h-2.5" /> FK</span>
                                                                    )}
                                                                    {!col.isPrimaryKey && !col.isForeignKey && <span className={`text-[10px] ${colors.textMuted}`}>—</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-16 h-1.5 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} overflow-hidden`}>
                                                                        <div className={`h-full rounded-full transition-all ${getNullBarColor(col.nullPercent)}`} style={{ width: `${Math.max(col.nullPercent, 1)}%` }} />
                                                                    </div>
                                                                    <span className={`text-[10px] sm:text-xs font-mono ${col.nullPercent === 0 ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : colors.textMuted}`}>
                                                                        {col.nullPercent.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex flex-col">
                                                                    <span className={`text-xs font-mono ${colors.textPrimary}`}>{col.uniqueCount.toLocaleString()}</span>
                                                                    <span className={`text-[9px] ${colors.textMuted}`}>{col.uniquePercent.toFixed(1)}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                    {col.sampleValues.slice(0, 3).map((sv, svIdx) => (
                                                                        <span key={svIdx} className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'} truncate max-w-[80px]`} title={sv}>{sv}</span>
                                                                    ))}
                                                                    {col.sampleValues.length > 3 && <span className={`text-[9px] ${colors.textMuted}`}>+{col.sampleValues.length - 3}</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3">
                                                                <span className={`text-[10px] sm:text-xs ${colors.textMuted} leading-tight line-clamp-2`}>{col.description}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPagination(tp)}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Card View */}
                    {viewMode === 'card' && profilingResult && !isLoading && (
                        <div ref={cardViewRef} className="space-y-6">
                            {profilingResult.tables.map((tp, tIdx) => (
                                <div key={`cv-${tp.tableName}-${tIdx}`} className="space-y-5">
                                    {/* Table info header */}
                                    <div className="flex items-center gap-3 px-1 pdf-export-section">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200'}`}>
                                            <Table className={`w-4 h-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                        </div>
                                        <div>
                                            <h3 className={`text-sm font-bold ${colors.textPrimary}`}>{tp.tableName}</h3>
                                            <p className={`text-[10px] ${colors.textMuted}`}>{tp.tableDescription}</p>
                                        </div>
                                        <div className={`ml-auto flex items-center gap-3 text-xs ${colors.textMuted}`}>
                                            <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {tp.totalColumns} cols</span>
                                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {tp.totalRows.toLocaleString()} rows</span>
                                        </div>
                                    </div>

                                    {/* Column Cards */}
                                    <div className="space-y-6">
                                    {tp.columns.slice(((pageMap[tp.tableName] || 1) - 1) * 5, (pageMap[tp.tableName] || 1) * 5).map((col, cIdx) => {
                                        const numStats = computeNumericStats(col.name, tp);
                                        const topVals = getTopValues(col.name, tp);
                                        const isNumeric = ['INTEGER', 'DECIMAL', 'CURRENCY', 'PERCENT'].includes(col.inferredType);

                                        return (
                                            <div key={`cc-${col.name}-${cIdx}`}
                                                className={`pdf-export-section ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} p-6 sm:p-8 overflow-hidden elevation-md transition-all ${theme === 'dark' ? 'hover:border-slate-600' : 'hover:border-slate-300 hover:shadow-lg'}`}>
                                                <div className="flex flex-col xl:flex-row gap-8">
                                                    {/* Left: Column info + stats */}
                                                    <div className="xl:w-1/3 space-y-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200'}`}>
                                                                <FileText className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                                            </div>
                                                            <div>
                                                                <h4 className={`text-lg font-bold ${colors.textPrimary} truncate max-w-[200px]`} title={col.name}>{col.name}</h4>
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${getTypeColor(col.inferredType, theme)}`}>
                                                                    {TYPE_ICON_MAP[col.inferredType] || TYPE_ICON_MAP['UNKNOWN']}
                                                                    {col.inferredType}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {(col.isPrimaryKey || col.isForeignKey) && (
                                                            <div className="flex gap-2">
                                                                {col.isPrimaryKey && <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${theme === 'dark' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}><Key className="w-3 h-3" /> Primary Key</span>}
                                                                {col.isForeignKey && <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${theme === 'dark' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : 'bg-violet-50 text-violet-600 border border-violet-200'}`}><LinkIcon className="w-3 h-3" /> Foreign Key</span>}
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                                                                <span className={`block text-[10px] font-bold ${colors.textMuted} uppercase mb-1`}>Uniqueness</span>
                                                                <span className={`text-lg font-bold ${colors.textPrimary}`}>{col.uniquePercent.toFixed(1)}%</span>
                                                            </div>
                                                            <div className={`p-4 rounded-xl border ${col.nullPercent > 0 ? (theme === 'dark' ? 'bg-amber-950/20 border-amber-900/50' : 'bg-amber-50 border-amber-100') : (theme === 'dark' ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50 border-emerald-100')}`}>
                                                                <span className={`block text-[10px] font-bold ${colors.textMuted} uppercase mb-1`}>Null Rate</span>
                                                                <span className={`text-lg font-bold ${col.nullPercent > 0 ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-600') : (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600')}`}>{col.nullPercent.toFixed(1)}%</span>
                                                            </div>
                                                        </div>

                                                        {isNumeric && numStats && (
                                                            <div className={`p-5 rounded-2xl space-y-3 bg-slate-900`}>
                                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2">Distribution Summary</span>
                                                                <div className="grid grid-cols-2 gap-y-3">
                                                                    <div><span className="text-[10px] text-slate-500 uppercase font-bold">Min</span><p className="font-bold text-white">{numStats.min.toLocaleString(undefined, {maximumFractionDigits: 2})}</p></div>
                                                                    <div><span className="text-[10px] text-slate-500 uppercase font-bold">Max</span><p className="font-bold text-white">{numStats.max.toLocaleString(undefined, {maximumFractionDigits: 2})}</p></div>
                                                                    <div><span className="text-[10px] text-slate-500 uppercase font-bold">Mean</span><p className="font-bold text-indigo-400">{numStats.mean.toLocaleString(undefined, {maximumFractionDigits: 2})}</p></div>
                                                                    <div><span className="text-[10px] text-slate-500 uppercase font-bold">Median</span><p className="font-bold text-white">{numStats.median.toLocaleString(undefined, {maximumFractionDigits: 2})}</p></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right: Charts */}
                                                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <h5 className={`text-[10px] font-bold ${colors.textMuted} uppercase tracking-widest flex items-center gap-2`}>
                                                                <BarChart3 className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} /> Top Values Breakdown
                                                            </h5>
                                                            <div className="h-[200px] w-full">
                                                                {topVals.length > 0 ? (
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <BarChart data={topVals} layout="vertical" margin={{ left: 10, right: 30 }}>
                                                                            <XAxis type="number" hide />
                                                                            <YAxis dataKey="value" type="category" width={80} axisLine={false} tickLine={false}
                                                                                tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700 }} />
                                                                            <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#e2e8f0' : '#1e293b' }} />
                                                                            <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20}>
                                                                                {topVals.map((_, index) => (
                                                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                                                ))}
                                                                            </Bar>
                                                                        </BarChart>
                                                                    </ResponsiveContainer>
                                                                ) : (
                                                                    <div className={`h-full flex items-center justify-center text-xs ${colors.textMuted}`}>No data available</div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className={`flex flex-col items-center justify-center p-6 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/20' : 'bg-slate-50'}`}>
                                                            <div className="w-full h-[180px] relative">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <PieChart>
                                                                        <Pie
                                                                            data={[
                                                                                { name: 'Valid', value: Math.max(tp.totalRows - col.nullCount, 0) },
                                                                                { name: 'Null', value: col.nullCount }
                                                                            ]}
                                                                            innerRadius={55} outerRadius={75}
                                                                            paddingAngle={col.nullCount > 0 ? 10 : 0}
                                                                            dataKey="value" stroke="none">
                                                                            <Cell fill="#6366f1" />
                                                                            <Cell fill={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                                                        </Pie>
                                                                        <Tooltip />
                                                                    </PieChart>
                                                                </ResponsiveContainer>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                                    <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{(100 - col.nullPercent).toFixed(0)}%</span>
                                                                    <span className={`text-[8px] font-bold ${colors.textMuted} uppercase tracking-tighter`}>Density</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-4 mt-2">
                                                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> <span className={`text-[10px] font-bold ${colors.textMuted} uppercase`}>Valid</span></div>
                                                                <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'}`}></div> <span className={`text-[10px] font-bold ${colors.textMuted} uppercase`}>Null</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`mt-4 pt-4 border-t ${colors.borderPrimary}`}>
                                                    <p className={`text-xs ${colors.textMuted} leading-relaxed`}>{col.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    </div>
                                    {renderPagination(tp)}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Join Suggestions */}
                    {profilingResult && !isLoading && profilingResult.joinSuggestions.length > 0 && (
                        <div className={`${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} overflow-hidden elevation-md`}>
                            <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${colors.borderPrimary} flex items-center gap-2`}>
                                <LinkIcon className={`w-4 h-4 ${theme === 'dark' ? 'text-violet-400' : 'text-violet-500'}`} />
                                <h3 className={`text-sm sm:text-base font-bold ${colors.textPrimary}`}>Join Suggestions</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${theme === 'dark' ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                                    {profilingResult.joinSuggestions.length}
                                </span>
                            </div>
                            <div className={`divide-y ${theme === 'dark' ? 'divide-slate-700/30' : 'divide-slate-100'}`}>
                                {profilingResult.joinSuggestions.map((js, jsIdx) => (
                                    <div key={jsIdx} className={`px-4 sm:px-6 py-3 sm:py-4 transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-xs sm:text-sm font-bold ${colors.textPrimary} px-2 py-1 rounded-lg ${theme === 'dark' ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>{js.leftTable}</span>
                                                <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`}>{js.leftColumn}</span>
                                                <div className="flex items-center gap-1">
                                                    <div className={`h-px w-4 ${theme === 'dark' ? 'bg-violet-500/50' : 'bg-violet-300'}`} />
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' : 'bg-violet-50 text-violet-600 border border-violet-200'}`}>{js.joinType}</span>
                                                    <div className={`h-px w-4 ${theme === 'dark' ? 'bg-violet-500/50' : 'bg-violet-300'}`} />
                                                </div>
                                                <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`}>{js.rightColumn}</span>
                                                <span className={`text-xs sm:text-sm font-bold ${colors.textPrimary} px-2 py-1 rounded-lg ${theme === 'dark' ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>{js.rightTable}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold ml-auto ${getConfidenceColor(js.confidence)}`}>{Math.round(js.confidence * 100)}% match</span>
                                        </div>
                                        <p className={`text-[10px] sm:text-xs ${colors.textMuted} mt-2 leading-relaxed`}>{js.reasoning}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="h-8" />
                </div>
            </div>
        </div>
    );
};
