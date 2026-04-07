import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from '../types';
import { processFile } from '../utils/fileParser';
import { profileDataWithGemini, DataProfilingResult, TableProfile, ColumnProfile, JoinSuggestion, TableInput } from '../services/geminiService';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import {
    Home, Plus, ArrowRight, Loader2, Table, Key, Link as LinkIcon,
    AlertCircle, Hash, Type as TypeIcon, BarChart3, Sparkles,
    Percent, Calendar, ToggleLeft, AtSign, Phone, Globe, HelpCircle, X, RefreshCw, FileText, Database, Cpu
} from 'lucide-react';

interface DataProfilingProps {
    initialTables: DataTable[];
    fileName: string;
    uploadedFileId?: number;
    sourceType?: string;
    onProceed: (tables: DataTable[]) => void;
    onHome: () => void;
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
    initialTables, fileName, uploadedFileId, sourceType, onProceed, onHome
}) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tables, setTables] = useState<DataTable[]>(initialTables);
    const [profilingResult, setProfilingResult] = useState<DataProfilingResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [usedFallback, setUsedFallback] = useState(false);
    const [expandedTable, setExpandedTable] = useState<string | null>(null);

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

    return (
        <div className={`flex flex-col h-screen ${colors.bgPrimary} ${colors.textSecondary}`}>
            {/* Header */}
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

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 space-y-6">



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
                    <div className="flex items-center justify-between">
                        <h2 className={`text-xs sm:text-sm font-bold ${colors.textMuted} uppercase tracking-wider flex items-center gap-2`}>
                            <Database className={`w-4 h-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                            Uploaded Tables ({tables.length})
                        </h2>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 transition"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Table
                        </button>
                        <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputRef} className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleAddTable(e.target.files[0])} />
                    </div>

                    {/* Table Profile Cards */}
                    {profilingResult && !isLoading && profilingResult.tables.map((tp, tIdx) => {
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
                                                    {tp.columns.map((col, cIdx) => (
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
                                    </div>
                                )}
                            </div>
                        );
                    })}

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
