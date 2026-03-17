import React, { useState, useEffect, useRef } from 'react';
import { DataModel, ProcessedRow, DataTable, JoinConfig, JoinType, ColumnType, ColumnMetadata, AggregationType, AggregatedColumnDefinition } from '../types';
import { ArrowRight, Table, CheckSquare, Square, Database, Columns, Plus, Link as LinkIcon, Trash2, Upload, Settings2, Home, Eye, X, FileText, Loader2, Activity, ChevronDown } from 'lucide-react';
import { processFile } from '../utils/fileParser';
import { performJoins, processRawData } from '../utils/dataProcessing';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import { fileService, FileContent } from '../services/fileService';
import { smartFormat } from '../utils/formatters';
import { performSchemaAudit } from '../services/schemaService';

interface DataConfigProps {
    initialTables: DataTable[];
    fileName: string;
    onFinalize: (model: DataModel) => void;
    onHome: () => void;
    uploadedFileId?: number; // Optional: ID of uploaded file for viewing
    sourceType?: 'file' | 'google_sheet' | 'sharepoint' | 'sql_dump' | 'sql_database';
}

export const DataConfig: React.FC<DataConfigProps> = ({ initialTables, fileName, onFinalize, onHome, uploadedFileId, sourceType = 'file' }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    // Tables State
    const [tables, setTables] = useState<DataTable[]>(initialTables);

    // Dashboard Title State
    const [dashboardTitle, setDashboardTitle] = useState('');

    // Configuration State
    const [activeTab, setActiveTab] = useState<'JOIN' | 'COLUMNS'>('JOIN');
    const [joins, setJoins] = useState<JoinConfig[]>([]);
    const [headerIndices, setHeaderIndices] = useState<{ [key: string]: number }>({});

    // File Viewer State
    const [viewingFile, setViewingFile] = useState<FileContent | null>(null);
    const [loadingFile, setLoadingFile] = useState(false);
    const [activeSheet, setActiveSheet] = useState(0);

    // Table Viewer State
    const [viewingTable, setViewingTable] = useState<DataTable | null>(null);

    // Initialize header indices for all tables
    useEffect(() => {
        const indices: { [key: string]: number } = {};
        tables.forEach(t => {
            // Preserve existing indices if table already existed
            if (headerIndices[t.id] === undefined) {
                indices[t.id] = 0;
            } else {
                indices[t.id] = headerIndices[t.id];
            }
        });
        setHeaderIndices(indices);
    }, [tables]);

    // Result State
    const [mergedData, setMergedData] = useState<any[]>([]);
    const [mergedColumns, setMergedColumns] = useState<string[]>([]);
    const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
    const [columnMetadata, setColumnMetadata] = useState<{ [key: string]: ColumnMetadata }>({});
    const [isAuditing, setIsAuditing] = useState(false);
    const [showAggregationModal, setShowAggregationModal] = useState(false);
    const [columnAggregations, setColumnAggregations] = useState<Record<string, AggregationType>>({});

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Helper: Get columns for a specific table ---
    const getTableColumns = (tableId: string): string[] => {
        const table = tables.find(t => t.id === tableId);
        if (!table || !table.rawData || !table.rawData.rows) return [];
        const idx = headerIndices[tableId] || 0;
        return table.rawData.rows[idx] || [];
    };

    const handleAddTable = async (file: File) => {
        try {
            const newTables = await processFile(file);
            setTables(prev => [...prev, ...newTables]);
        } catch (error) {
            console.error("Failed to add table", error);
            alert("Could not process file.");
        }
    };

    const addJoin = () => {
        if (tables.length < 2) return;
        // Default to joining the first two available tables
        const leftId = tables[0].id;
        const rightId = tables[1].id;

        const newJoin: JoinConfig = {
            id: String(Date.now()),
            leftTableId: leftId,
            rightTableId: rightId,
            leftKey: '',
            rightKey: '',
            type: JoinType.INNER
        };
        setJoins([...joins, newJoin]);
    };

    const removeJoin = (id: string) => {
        setJoins(joins.filter(j => j.id !== id));
    };

    const updateJoin = (id: string, field: keyof JoinConfig, value: string) => {
        setJoins(joins.map(j => j.id === id ? { ...j, [field]: value } : j));
    };

    // --- Effect: Calculate Merged Data ---
    useEffect(() => {
        // If no joins, just process the first table
        if (tables.length === 0) return;

        if (tables.length === 1 || joins.length === 0) {
            const t = tables[0];
            const res = processRawData(t.rawData, headerIndices[t.id] || 0);
            setMergedData(res.rows);
            setMergedColumns(res.headers);
        } else {
            // Perform Joins
            const result = performJoins(tables, joins, headerIndices);
            setMergedData(result.data);
            setMergedColumns(result.columns);
        }
    }, [tables, joins, headerIndices]);

    // --- Effect: Validate and Auto-Select Columns ---
    useEffect(() => {
        if (mergedColumns.length === 0) return;

        // Check if current selection is valid against new merged columns
        const currentSelection = Array.from(selectedColumns);
        const validSelection = currentSelection.filter(col => mergedColumns.includes(col));

        // If the data structure changed significantly (e.g. adding a join prefixes columns), 
        // and we lost selections, reset to Select All to prevent empty data.
        if (validSelection.length === 0 && mergedColumns.length > 0) {
            setSelectedColumns(new Set(mergedColumns));
        } else if (selectedColumns.size === 0) {
            // Initial selection
            setSelectedColumns(new Set(mergedColumns));
        }
    }, [mergedColumns]);

    // --- Effect: Run Schema Audit when data changes ---
    useEffect(() => {
        if (mergedColumns.length === 0 || mergedData.length === 0) return;

        const runAudit = async () => {
            setIsAuditing(true);
            try {
                const sampleRows = mergedData.slice(0, 5);
                const result = await performSchemaAudit(
                    dashboardTitle || fileName,
                    mergedColumns,
                    sampleRows
                );
                setColumnMetadata(result);
            } catch (error) {
                console.error("Audit effect error:", error);
            } finally {
                setIsAuditing(false);
            }
        };

        runAudit();
    }, [mergedColumns, mergedData.slice(0, 5).map(r => JSON.stringify(r)).join('')]);


    const toggleColumn = (col: string) => {
        const newSet = new Set(selectedColumns);
        if (newSet.has(col)) {
            newSet.delete(col);
        } else {
            newSet.add(col);
        }
        setSelectedColumns(newSet);
    };

    const aggregationOptions: { value: AggregationType; label: string }[] = [
        { value: AggregationType.NONE, label: 'None' },
        { value: AggregationType.SUM, label: 'Sum' },
        { value: AggregationType.COUNT, label: 'Count' },
        { value: AggregationType.DISTINCT, label: 'Distinct' },
        { value: AggregationType.AVERAGE, label: 'Average' },
        { value: AggregationType.MINIMUM, label: 'Minimum' },
        { value: AggregationType.MAXIMUM, label: 'Maximum' }
    ];

    const getValidColumns = () => [...selectedColumns].filter(col => mergedColumns.includes(col));

    const getAggregationLabel = (aggregation: AggregationType, column: string) => {
        switch (aggregation) {
            case AggregationType.SUM:
                return `Sum of ${column}`;
            case AggregationType.COUNT:
                return `Count of ${column}`;
            case AggregationType.DISTINCT:
                return `Distinct ${column}`;
            case AggregationType.AVERAGE:
                return `Average of ${column}`;
            case AggregationType.MINIMUM:
                return `Minimum of ${column}`;
            case AggregationType.MAXIMUM:
                return `Maximum of ${column}`;
            default:
                return column;
        }
    };

    const buildAggregatedColumns = (validColumns: string[]): AggregatedColumnDefinition[] => {
        return validColumns
            .map(col => {
                const aggregation = columnAggregations[col] || AggregationType.NONE;
                if (aggregation === AggregationType.NONE) {
                    return null;
                }

                return {
                    id: `${col}-${aggregation}`,
                    sourceColumn: col,
                    label: getAggregationLabel(aggregation, col),
                    aggregation
                };
            })
            .filter((value): value is AggregatedColumnDefinition => value !== null);
    };

    const handleViewFile = async () => {
        if (!uploadedFileId) return;
        setLoadingFile(true);
        setActiveSheet(0);
        try {
            const content = await fileService.getFileContent(uploadedFileId);
            setViewingFile(content);
        } catch (error) {
            console.error("Failed to load file content", error);
            alert("Failed to load file content");
        } finally {
            setLoadingFile(false);
        }
    };

    const finalizeWithAggregations = async () => {
        const validColumns = getValidColumns();

        if (validColumns.length === 0) {
            alert("Please select at least one column.");
            return;
        }

        const processedData: ProcessedRow[] = [];
        const numericCols = new Set<string>();
        const categoricalCols = new Set<string>();

        // Sample first 100 rows to determine type
        const sampleSize = Math.min(mergedData.length, 100);
        const typeMap: { [key: string]: 'number' | 'string' } = {};

        validColumns.forEach(col => {
            let numericCount = 0;
            for (let i = 0; i < sampleSize; i++) {
                const val = mergedData[i][col];
                if (val !== '' && val !== null && !isNaN(Number(val))) {
                    numericCount++;
                }
            }
            // If > 80% are numbers, treat as number
            typeMap[col] = (numericCount / sampleSize) > 0.8 ? 'number' : 'string';
            if (typeMap[col] === 'number') numericCols.add(col);
            else categoricalCols.add(col);
        });

        mergedData.forEach(row => {
            const rowObj: ProcessedRow = {};
            validColumns.forEach(col => {
                const val = row[col];
                if (typeMap[col] === 'number') {
                    rowObj[col] = val === '' || val === null ? 0 : Number(val);
                } else {
                    rowObj[col] = val === null || val === undefined ? '' : String(val);
                }
            });
            processedData.push(rowObj);
        });

        // --- Filter column metadata for selected columns only ---
        const finalMetadata: { [key: string]: ColumnMetadata } = {};
        validColumns.forEach(col => {
            if (columnMetadata[col]) {
                finalMetadata[col] = columnMetadata[col];
            }
        });

        const aggregatedColumns = buildAggregatedColumns(validColumns);

        const tableConfigs: { [tableId: string]: { headerIndex: number; name: string } } = {};
        tables.forEach(t => {
            tableConfigs[t.id] = {
                headerIndex: headerIndices[t.id] || 0,
                name: t.name
            };
        });

        const model: DataModel = {
            name: dashboardTitle.trim() || tables.map(t => t.name).join(' + '),
            data: processedData,
            columns: validColumns,
            numericColumns: [...numericCols],
            categoricalColumns: [...categoricalCols],
            columnMetadata: finalMetadata,
            aggregatedColumns,
            fileId: uploadedFileId,
            sourceType: sourceType as 'file' | 'google_sheet' | 'sharepoint' | 'sql_dump' | 'sql_database',
            headerIndex: tables.length === 1 ? (headerIndices[tables[0].id] || 0) : undefined,
            joinConfigs: joins,
            tableConfigs: tableConfigs
        };

        // Log configuration to server
        try {
            await fileService.logConfiguration(fileName, validColumns, joins);
        } catch (error) {
            console.error("Failed to log configuration", error);
        }

        onFinalize(model);
    };

    const handleFinalize = () => {
        const validColumns = getValidColumns();

        if (validColumns.length === 0) {
            alert("Please select at least one column.");
            return;
        }

        setShowAggregationModal(true);
    };

    // Sidebar state for mobile
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className={`flex flex-col h-screen ${colors.bgPrimary} ${colors.textSecondary}`}>
            {/* Header - Fully Responsive */}
            <header className={`${theme === 'dark' ? 'bg-slate-900/50' : 'bg-white/80'} glass-effect border-b ${colors.borderPrimary} px-2 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2.5 md:py-3.5 lg:py-4 flex justify-between items-center sticky top-0 z-20 gap-1.5 sm:gap-2.5 md:gap-3`}>
                {/* Left Section - Title Area */}
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0 flex-shrink">
                    <button onClick={onHome} className={`p-1 sm:p-1.5 md:p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition flex-shrink-0 active-press`} title="Go Home">
                        <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className={`w-px h-6 ${colors.borderPrimary} hidden sm:block flex-shrink-0`}></div>
                    <div className="bg-indigo-500/20 p-1 sm:p-1.5 md:p-2 rounded-lg border border-indigo-500/30 flex-shrink-0">
                        <Database className="text-indigo-400 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold ${colors.textPrimary} flex items-center gap-2 truncate`}>
                            <span className="sm:hidden">Config</span>
                            <span className="hidden sm:inline">Data Configuration</span>
                            {isAuditing && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400 animate-spin" />}
                        </h1>
                        <p className={`hidden sm:block text-xs ${colors.textMuted} truncate`}>Configure tables, joins, and columns</p>
                    </div>
                </div>

                {/* Center Section - Tab Switcher */}
                <div className={`flex ${colors.bgSecondary} p-0.5 rounded-lg border ${colors.borderPrimary} flex-shrink-0`}>
                    <button
                        onClick={() => setActiveTab('JOIN')}
                        className={`px-1.5 sm:px-2.5 md:px-3 lg:px-4 py-0.5 sm:py-1 md:py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-all flex items-center gap-0.5 sm:gap-1 md:gap-1.5 whitespace-nowrap
                    ${activeTab === 'JOIN' ? 'bg-indigo-600 text-white shadow-lg' : `${colors.textMuted} hover:${colors.textPrimary}`}
                `}
                        title="Data Relationships"
                    >
                        <LinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                        <span className="hidden sm:inline lg:hidden">Joins</span>
                        <span className="hidden lg:inline">Data Relationships</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('COLUMNS')}
                        className={`px-1.5 sm:px-2.5 md:px-3 lg:px-4 py-0.5 sm:py-1 md:py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-all flex items-center gap-0.5 sm:gap-1 md:gap-1.5 whitespace-nowrap
                    ${activeTab === 'COLUMNS' ? 'bg-indigo-600 text-white shadow-lg' : `${colors.textMuted} hover:${colors.textPrimary}`}
                `}
                        title="Select Columns"
                    >
                        <Columns className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                        <span className="hidden sm:inline">Select Columns</span>
                    </button>
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
                    {/* Mobile: Show sidebar toggle */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`md:hidden p-1 sm:p-1.5 rounded-lg ${colors.bgSecondary} border ${colors.borderPrimary} ${colors.textMuted} transition hover:${colors.textPrimary} active-press`}
                        title="Settings"
                    >
                        <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="flex-shrink-0">
                        <ThemeToggle />
                    </div>
                    <button
                        onClick={handleFinalize}
                        className="px-1.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] sm:text-xs md:text-sm font-medium transition flex items-center gap-0.5 sm:gap-1 md:gap-1.5 shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/20 active-press flex-shrink-0 whitespace-nowrap"
                    >
                        <span className="hidden xs:inline">Finalize</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-30 animate-fade-in"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar: Tables & Settings - Responsive */}
                <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative w-80 max-w-[85vw] sm:max-w-md md:w-80 ${colors.bgSecondary} border-r ${colors.borderPrimary} overflow-y-auto flex flex-col z-40 md:z-10 shadow-xl transition-transform duration-300 h-full glass-effect`}>
                    {/* Mobile: Close button */}
                    <div className={`md:hidden flex justify-between items-center p-4 border-b ${colors.borderPrimary}`}>
                        <h3 className={`font-bold ${colors.textPrimary}`}>Settings</h3>
                        <button onClick={() => setSidebarOpen(false)} className={`p-1.5 rounded-lg hover:${colors.bgTertiary}`}>
                            <X className={`w-5 h-5 ${colors.textMuted}`} />
                        </button>
                    </div>

                    <div className={`p-4 sm:p-6 border-b ${colors.borderPrimary}`}>
                        <label className={`responsive-text-xs font-bold ${colors.textMuted} uppercase tracking-wider mb-2 block`}>
                            Dashboard Title
                        </label>
                        <input
                            type="text"
                            value={dashboardTitle}
                            onChange={(e) => setDashboardTitle(e.target.value)}
                            placeholder="Enter title (Optional)"
                            className={`responsive-input w-full ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} border ${colors.borderSecondary} rounded-lg responsive-text-sm ${colors.textPrimary} focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition placeholder:text-slate-500`}
                        />
                    </div>

                    <div className={`p-4 sm:p-6 border-b ${colors.borderPrimary}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-xs font-bold ${colors.textMuted} uppercase tracking-wider flex items-center gap-2`}>
                                <Table className="w-4 h-4 text-indigo-500" />
                                Tables ({tables.length})
                            </h3>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-indigo-400 hover:text-indigo-300 p-1 rounded hover:bg-indigo-500/10 transition"
                                title="Add another file (CSV/Excel)"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleAddTable(e.target.files[0])}
                            />
                        </div>

                        <div className="space-y-3">
                            {tables.map(table => (
                                <div key={table.id} className={`${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'} rounded-lg p-3 border ${colors.borderSecondary} elevation-low`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm font-bold ${colors.textSecondary} truncate w-32`} title={table.name}>{table.name}</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setViewingTable(table)}
                                                className={`${colors.textMuted} hover:text-indigo-400 p-1 rounded hover:bg-indigo-500/10 transition`}
                                                title="View table data"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>
                                            {tables.length > 1 && (
                                                <button onClick={() => setTables(tables.filter(t => t.id !== table.id))} className={`${colors.textMuted} hover:text-red-400 p-1`}>
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-white'} p-1.5 rounded border ${colors.borderPrimary}`}>
                                        <span className={`text-[10px] ${colors.textMuted} uppercase whitespace-nowrap`}>Header Row:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={headerIndices[table.id] ?? 0}
                                            onChange={(e) => setHeaderIndices({ ...headerIndices, [table.id]: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-transparent text-right text-xs text-indigo-300 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'COLUMNS' && (
                        <div className="flex-1 p-4 sm:p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`text-xs font-bold ${colors.textMuted} uppercase tracking-wider flex items-center gap-2`}>
                                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                                    Selected ({selectedColumns.size})
                                </h3>
                                {(() => {
                                    const allSelected = mergedColumns.length > 0 && mergedColumns.every(col => selectedColumns.has(col));
                                    const needsReviewCount = Array.from(selectedColumns).some(col =>
                                        columnMetadata[col]?.requiresConfirmation || (columnMetadata[col]?.confidence || 1) < 0.7
                                    );
                                    return (
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <button
                                                onClick={() => allSelected
                                                    ? setSelectedColumns(new Set())
                                                    : setSelectedColumns(new Set(mergedColumns))
                                                }
                                                className={`text-[9px] font-bold uppercase tracking-wider py-1 px-2 rounded-md transition-all ${allSelected
                                                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                                    : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'}`}
                                            >
                                                {allSelected ? 'Unselect All' : 'Select All'}
                                            </button>
                                            {needsReviewCount && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                                    </span>
                                                    <span className="text-[8px] text-amber-500 font-bold uppercase tracking-tight">Review Required</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="space-y-1.5">
                                {mergedColumns.map((col, idx) => {
                                    const isSelected = selectedColumns.has(col);
                                    const meta = columnMetadata[col];
                                    const isReviewNeeded = meta?.requiresConfirmation || (meta?.confidence && meta.confidence < 0.7);

                                    const getTypeClasses = (type?: string) => {
                                        switch (type) {
                                            case 'CURRENCY': return 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
                                            case 'DATE': return 'text-blue-400 bg-blue-500/5 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]';
                                            case 'INTEGER':
                                            case 'DECIMAL': return 'text-amber-400 bg-amber-500/5 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
                                            case 'PERCENT': return 'text-violet-400 bg-violet-500/5 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.1)]';
                                            case 'TEXT': return 'text-slate-400 bg-slate-500/5 border-slate-500/20';
                                            default: return 'text-slate-500 bg-slate-500/5 border-slate-500/10';
                                        }
                                    };

                                    return (
                                        <div
                                            key={`${col}-${idx}`}
                                            className={`group flex items-center gap-2 p-2 sm:p-2.5 rounded-xl transition-all duration-300 select-none border
                                                ${isSelected
                                                    ? 'bg-indigo-500/[0.04] border-indigo-500/30'
                                                    : `bg-transparent border-transparent hover:${colors.bgTertiary}/40 hover:border-slate-700/50`
                                                }
                                                ${isReviewNeeded && isSelected ? 'ring-1 ring-amber-500/20 bg-amber-500/[0.02]' : ''}
                                            `}
                                        >
                                            <div
                                                className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer p-1"
                                                onClick={() => toggleColumn(col)}
                                            >
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${isSelected
                                                    ? 'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                    : `${theme === 'dark' ? 'bg-slate-800 border-slate-700 group-hover:border-slate-500' : 'bg-white border-slate-200 group-hover:border-slate-400'}`
                                                    }`}>
                                                    {isSelected && <CheckSquare className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>

                                            <div
                                                className="flex-1 min-w-0 cursor-pointer"
                                                onClick={() => toggleColumn(col)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[13px] font-semibold truncate ${isSelected ? colors.textPrimary : colors.textMuted}`} title={col}>
                                                        {col}
                                                    </span>
                                                    {isReviewNeeded && (
                                                        <Activity className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />
                                                    )}
                                                </div>

                                                {meta && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className={`text-[8.5px] px-1.5 py-0.5 rounded-md border font-bold tracking-tight ${getTypeClasses(meta.finalType || meta.detectedType)}`}>
                                                            {meta.finalType || meta.detectedType}
                                                        </div>
                                                        {meta.confidence < 0.85 && (
                                                            <span className={`text-[8px] font-bold uppercase tracking-wider ${meta.confidence < 0.6 ? 'text-rose-400' : 'text-amber-400/80'}`}>
                                                                {Math.round(meta.confidence * 100)}% confidence
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Advanced Type Override Select */}
                                            {meta && (
                                                <div className={`relative isolate ${isReviewNeeded ? 'block' : 'hidden group-hover:block transition-all duration-300'}`}>
                                                    <select
                                                        value={meta.finalType || meta.detectedType}
                                                        onChange={(e) => {
                                                            const newType = e.target.value as ColumnType;
                                                            setColumnMetadata({
                                                                ...columnMetadata,
                                                                [col]: {
                                                                    ...meta,
                                                                    finalType: newType,
                                                                    source: 'USER',
                                                                    requiresConfirmation: false
                                                                }
                                                            });
                                                        }}
                                                        className={`appearance-none bg-slate-900 border pointer-events-auto text-[10px] font-bold py-1 pl-2 pr-6 rounded-lg ${isReviewNeeded ? 'border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10' : 'border-slate-700 text-slate-400'} outline-none transition-all hover:border-indigo-500/50 hover:text-indigo-400`}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {Object.values(ColumnType).map(t => (
                                                            <option key={t} value={t} className="bg-slate-900">{t}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none opacity-50" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content Area - Responsive */}
                <main className={`flex-1 responsive-container overflow-hidden flex flex-col ${colors.bgPrimary}`}>

                    {activeTab === 'JOIN' && (
                        <div className="flex-1 flex flex-col gap-4 sm:gap-6 md:gap-8 overflow-y-auto custom-scrollbar pb-20">
                            <div className={`responsive-card ${colors.bgSecondary} rounded-xl border ${colors.borderPrimary} elevation-md`}>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                                    <div>
                                        <h2 className={`responsive-text-lg font-bold ${colors.textPrimary}`}>Join Configuration</h2>
                                        <p className={`sm:block responsive-text-sm ${colors.textMuted}`}>Connect multiple tables to create a unified dataset.</p>
                                    </div>
                                    <button
                                        onClick={addJoin}
                                        disabled={tables.length < 2}
                                        className="responsive-button bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-1 sm:gap-1.5 md:gap-2 transition w-full sm:w-auto justify-center"
                                    >
                                        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                                        <span className="text-[10px] sm:text-xs md:text-sm">Add Join</span>
                                    </button>
                                </div>

                                {tables.length < 2 && (
                                    <div className={`p-6 sm:p-8 md:p-12 border-2 border-dashed ${colors.borderPrimary} rounded-xl ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} text-center`}>
                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${colors.bgTertiary} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-pulse`}>
                                            <Settings2 className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${colors.textMuted}`} />
                                        </div>
                                        <h3 className={`${colors.textSecondary} font-medium responsive-text-base md:text-lg`}>Single Table Mode</h3>
                                        <p className={`${colors.textMuted} responsive-text-sm mt-2 max-w-md mx-auto px-4`}>
                                            You currently have one table. The entire dataset will be used.
                                            To merge data, upload another CSV or Excel file using the <span className="text-indigo-400">+</span> button in the sidebar.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3 sm:space-y-4">
                                    {joins.map((join, index) => {
                                        const leftTable = tables.find(t => t.id === join.leftTableId);
                                        const rightTable = tables.find(t => t.id === join.rightTableId);
                                        const leftCols = leftTable ? getTableColumns(leftTable.id) : [];
                                        const rightCols = rightTable ? getTableColumns(rightTable.id) : [];

                                        return (
                                            <div key={join.id} className={`responsive-card ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-100'} border ${colors.borderSecondary} rounded-lg animate-fade-in-up`}>
                                                <div className="flex justify-between items-center mb-3 sm:mb-4">
                                                    <span className={`responsive-text-xs font-bold ${colors.textMuted} uppercase`}>Join #{index + 1}</span>
                                                    <button onClick={() => removeJoin(join.id)} className={`${colors.textMuted} hover:text-red-400 p-1`}>
                                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    </button>
                                                </div>
                                                {/* Responsive: Stack on mobile, grid on desktop */}
                                                <div className="flex flex-col lg:grid lg:grid-cols-5 gap-3 sm:gap-4">
                                                    {/* Left Table Config */}
                                                    <div className="lg:col-span-2 space-y-2">
                                                        <div className={`${colors.bgSecondary} p-2.5 sm:p-3 rounded border ${colors.borderPrimary}`}>
                                                            <label className={`responsive-text-xs ${colors.textMuted} uppercase font-bold mb-1 block`}>Left Table</label>
                                                            <select
                                                                value={join.leftTableId}
                                                                onChange={(e) => updateJoin(join.id, 'leftTableId', e.target.value)}
                                                                className={`w-full bg-transparent responsive-text-sm ${colors.textPrimary} outline-none cursor-pointer`}
                                                            >
                                                                {tables.map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className={`${colors.bgSecondary} p-2.5 sm:p-3 rounded border ${colors.borderPrimary}`}>
                                                            <label className={`responsive-text-xs ${colors.textMuted} uppercase font-bold mb-1 block`}>Key Column</label>
                                                            <select
                                                                value={join.leftKey}
                                                                onChange={(e) => updateJoin(join.id, 'leftKey', e.target.value)}
                                                                className="w-full bg-transparent responsive-text-sm text-indigo-300 outline-none cursor-pointer"
                                                            >
                                                                <option value="" className="text-slate-900">Select Column...</option>
                                                                {leftCols.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Join Type */}
                                                    <div className="flex justify-center lg:justify-center items-center">
                                                        <div className={`${colors.bgSecondary} p-2 rounded-full border ${colors.borderSecondary}`}>
                                                            <select
                                                                value={join.type}
                                                                onChange={(e) => updateJoin(join.id, 'type', e.target.value)}
                                                                className={`bg-transparent responsive-text-xs font-bold ${colors.textPrimary} outline-none text-center cursor-pointer appearance-none w-16 sm:w-20`}
                                                            >
                                                                <option value={JoinType.INNER} className="text-slate-900">INNER</option>
                                                                <option value={JoinType.LEFT} className="text-slate-900">LEFT</option>
                                                                <option value={JoinType.RIGHT} className="text-slate-900">RIGHT</option>
                                                                <option value={JoinType.FULL} className="text-slate-900">FULL</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Right Table Config */}
                                                    <div className="lg:col-span-2 space-y-2">
                                                        <div className={`${colors.bgSecondary} p-2.5 sm:p-3 rounded border ${colors.borderPrimary}`}>
                                                            <label className={`responsive-text-xs ${colors.textMuted} uppercase font-bold mb-1 block`}>Right Table</label>
                                                            <select
                                                                value={join.rightTableId}
                                                                onChange={(e) => updateJoin(join.id, 'rightTableId', e.target.value)}
                                                                className={`w-full bg-transparent responsive-text-sm ${colors.textPrimary} outline-none cursor-pointer`}
                                                            >
                                                                {tables.map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className={`${colors.bgSecondary} p-2.5 sm:p-3 rounded border ${colors.borderPrimary}`}>
                                                            <label className={`responsive-text-xs ${colors.textMuted} uppercase font-bold mb-1 block`}>Key Column</label>
                                                            <select
                                                                value={join.rightKey}
                                                                onChange={(e) => updateJoin(join.id, 'rightKey', e.target.value)}
                                                                className="w-full bg-transparent responsive-text-sm text-indigo-300 outline-none cursor-pointer"
                                                            >
                                                                <option value="" className="text-slate-900">Select Column...</option>
                                                                {rightCols.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Preview Section for Joined Data */}
                            {mergedData.length > 0 && (
                                <div className={`responsive-card ${colors.bgSecondary} rounded-xl border ${colors.borderPrimary}`}>
                                    <h2 className={`responsive-text-lg font-bold ${colors.textPrimary} mb-3 sm:mb-4`}>Merged Data Preview</h2>
                                    <div className="data-table-container">
                                        <table className={`responsive-table w-full text-left responsive-text-sm ${colors.textMuted}`}>
                                            <thead className={`${colors.bgPrimary} uppercase responsive-text-xs font-semibold ${colors.textMuted}`}>
                                                <tr>
                                                    {mergedColumns.slice(0, 8).map((col, i) => (
                                                        <th key={i} className="px-4 py-3 whitespace-nowrap">{col}</th>
                                                    ))}
                                                    {mergedColumns.length > 8 && <th className="px-4 py-3">...</th>}
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${colors.borderPrimary}`}>
                                                {mergedData.slice(0, 100).map((row, i) => (
                                                    <tr key={i} className={`hover:${colors.bgTertiary}/50`}>
                                                        {mergedColumns.slice(0, 8).map((col, j) => {
                                                            const cellValue = row[col];
                                                            const displayValue = cellValue !== null && cellValue !== undefined
                                                                ? smartFormat(cellValue, col, columnMetadata)
                                                                : <span className="text-slate-600 italic">null</span>;
                                                            return (
                                                                <td key={j} className="px-4 py-3 whitespace-nowrap overflow-hidden max-w-[150px] truncate">
                                                                    {displayValue}
                                                                </td>
                                                            );
                                                        })}
                                                        {mergedColumns.length > 8 && <td className="px-4 py-3 text-slate-600">...</td>}
                                                    </tr>
                                                ))}
                                                {mergedData.length > 100 && (
                                                    <tr className={`${colors.bgTertiary}/30`}>
                                                        <td colSpan={Math.min(mergedColumns.length, 9)} className="px-4 py-4 text-center italic text-sm">
                                                            Previewing first 100 of {mergedData.length.toLocaleString()} rows...
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'COLUMNS' && (
                        <div className={`flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 md:p-12 ${colors.textMuted}`}>
                            <CheckSquare className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${theme === 'dark' ? 'text-slate-700' : 'text-slate-300'} mb-3 sm:mb-4`} />
                            <h3 className={`responsive-text-lg md:text-xl font-bold ${colors.textTertiary}`}>Review Your Selection</h3>
                            <p className="max-w-md mt-2 responsive-text-sm sm:text-base px-4">
                                Use the sidebar to check or uncheck specific columns.
                                Only selected columns will be analyzed by the AI for chart recommendations.
                            </p>
                            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left max-w-2xl w-full px-4">
                                <div className={`responsive-card ${colors.bgSecondary} rounded border ${colors.borderPrimary}`}>
                                    <div className={`responsive-text-xs ${colors.textMuted} uppercase mb-1`}>Total Rows</div>
                                    <div className={`responsive-text-xl md:text-2xl font-bold ${colors.textPrimary}`}>{mergedData.length.toLocaleString()}</div>
                                </div>
                                <div className={`responsive-card ${colors.bgSecondary} rounded border ${colors.borderPrimary}`}>
                                    <div className={`responsive-text-xs ${colors.textMuted} uppercase mb-1`}>Selected Columns</div>
                                    <div className="responsive-text-xl md:text-2xl font-bold text-indigo-400">{selectedColumns.size} <span className={`responsive-text-sm ${colors.textMuted} font-normal`}>/ {mergedColumns.length}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* File Viewer Modal */}
            {viewingFile && (
                <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in`}>
                    <div className={`responsive-modal ${colors.modalBg} border ${colors.borderPrimary} rounded-xl sm:rounded-2xl w-full max-w-6xl h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl`}>
                        <div className={`flex justify-between items-center p-3 sm:p-4 md:p-6 border-b ${colors.borderPrimary} shrink-0`}>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                                <h3 className={`responsive-text-base sm:text-lg md:text-xl font-bold ${colors.textPrimary} truncate`}>{viewingFile.fileName}</h3>
                            </div>
                            <button
                                onClick={() => setViewingFile(null)}
                                className={`p-1.5 sm:p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:text-red-400 transition shrink-0`}
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Sheet Tabs */}
                        {viewingFile.sheets.length > 1 && (
                            <div className={`flex gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 border-b ${colors.borderPrimary} overflow-x-auto shrink-0`}>
                                {viewingFile.sheets.map((sheet, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveSheet(idx)}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-t-lg font-medium responsive-text-xs sm:text-sm transition-all whitespace-nowrap ${activeSheet === idx
                                            ? `${colors.bgSecondary} ${colors.textPrimary} border-b-2 border-indigo-500`
                                            : `${colors.textMuted} hover:${colors.textPrimary} hover:${colors.bgTertiary}`
                                            }`}
                                    >
                                        {sheet.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Table Container with proper scrolling */}
                        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
                            <div className="min-w-full overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 z-10">
                                        <tr className={`${colors.bgTertiary}`}>
                                            {viewingFile.sheets[activeSheet]?.data[0]?.map((header: any, idx: number) => (
                                                <th key={idx} className={`px-3 sm:px-4 py-2 sm:py-3 responsive-text-xs font-bold uppercase ${colors.textMuted} border-b ${colors.borderSecondary} border-r last:border-r-0 whitespace-nowrap`}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingFile.sheets[activeSheet]?.data.slice(1, 101).map((row: any[], rIdx: number) => (
                                            <tr key={rIdx} className={`hover:${colors.bgPrimary} transition-colors border-b ${colors.borderSecondary} last:border-b-0`}>
                                                {row.map((cell: any, cIdx: number) => {
                                                    const header = viewingFile.sheets[activeSheet]?.data[0][cIdx];
                                                    const displayValue = cell !== null && cell !== undefined && header
                                                        ? smartFormat(cell, header, columnMetadata)
                                                        : (cell || '');
                                                    return (
                                                        <td key={cIdx} className={`px-3 sm:px-4 py-1.5 sm:py-2 responsive-text-xs sm:text-sm ${colors.textSecondary} border-r ${colors.borderSecondary} last:border-r-0 whitespace-nowrap`}>
                                                            {displayValue}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                        {viewingFile.sheets[activeSheet]?.data.length > 101 && (
                                            <tr className={`${colors.bgTertiary}/30`}>
                                                <td colSpan={viewingFile.sheets[activeSheet]?.data[0]?.length || 1} className="px-4 py-4 text-center italic text-sm">
                                                    Previewing first 100 rows...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table Viewer Modal - Fixed overflow */}
            {viewingTable && (
                <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in`}>
                    <div className={`responsive-modal ${colors.modalBg} border ${colors.borderPrimary} rounded-xl sm:rounded-2xl w-full max-w-6xl h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl`}>
                        <div className={`flex justify-between items-center p-3 sm:p-4 md:p-6 border-b ${colors.borderPrimary} shrink-0`}>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Table className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                                <h3 className={`responsive-text-base sm:text-lg md:text-xl font-bold ${colors.textPrimary} truncate`}>{viewingTable.name}</h3>
                            </div>
                            <button
                                onClick={() => setViewingTable(null)}
                                className={`p-1.5 sm:p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:text-red-400 transition shrink-0`}
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Table Container with proper scrolling */}
                        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
                            <div className="min-w-full overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 z-10">
                                        <tr className={`${colors.bgTertiary}`}>
                                            {viewingTable.rawData.rows[headerIndices[viewingTable.id] || 0]?.map((header: any, idx: number) => (
                                                <th key={idx} className={`px-3 sm:px-4 py-2 sm:py-3 responsive-text-xs font-bold uppercase ${colors.textMuted} border-b ${colors.borderSecondary} border-r last:border-r-0 whitespace-nowrap`}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingTable.rawData.rows.slice((headerIndices[viewingTable.id] || 0) + 1, (headerIndices[viewingTable.id] || 0) + 101).map((row: any[], rIdx: number) => (
                                            <tr key={rIdx} className={`hover:${colors.bgPrimary} transition-colors border-b ${colors.borderSecondary} last:border-b-0`}>
                                                {row.map((cell: any, cIdx: number) => {
                                                    const header = viewingTable.rawData.rows[headerIndices[viewingTable.id] || 0]?.[cIdx];
                                                    const displayValue = cell !== null && cell !== undefined && header
                                                        ? smartFormat(cell, header, columnMetadata)
                                                        : (cell || '');
                                                    return (
                                                        <td key={cIdx} className={`px-3 sm:px-4 py-1.5 sm:py-2 responsive-text-xs sm:text-sm ${colors.textSecondary} border-r ${colors.borderSecondary} last:border-r-0 whitespace-nowrap`}>
                                                            {displayValue}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                        {viewingTable.rawData.rows.length > (headerIndices[viewingTable.id] || 0) + 101 && (
                                            <tr className={`${colors.bgTertiary}/30`}>
                                                <td colSpan={viewingTable.rawData.rows[headerIndices[viewingTable.id] || 0]?.length || 1} className="px-4 py-4 text-center italic text-sm">
                                                    Previewing first 100 rows...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showAggregationModal && (
                <div className={`fixed inset-0 z-[110] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in`}>
                    <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col`}>
                        <div className={`flex items-start justify-between gap-4 p-4 sm:p-6 border-b ${colors.borderPrimary}`}>
                            <div>
                                <h3 className={`text-lg sm:text-xl font-bold ${colors.textPrimary}`}>Aggregation Setup</h3>
                                <p className={`text-sm ${colors.textMuted} mt-1`}>
                                    Choose optional aggregate functions for your selected columns before continuing to visualization.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAggregationModal(false)}
                                className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-4 sm:p-6">
                            <div className={`grid gap-3 sm:gap-4`}>
                                {getValidColumns().map((col) => {
                                    const meta = columnMetadata[col];
                                    const selectedAggregation = columnAggregations[col] || AggregationType.NONE;

                                    return (
                                        <div
                                            key={col}
                                            className={`grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3 items-center p-3 sm:p-4 rounded-xl border ${colors.borderPrimary} ${colors.bgSecondary}`}
                                        >
                                            <div className="min-w-0">
                                                <div className={`font-semibold ${colors.textPrimary} truncate`}>{col}</div>
                                                <div className={`flex items-center gap-2 mt-1 flex-wrap`}>
                                                    {meta && (
                                                        <span className={`text-[10px] px-2 py-1 rounded-md border ${colors.borderSecondary} ${colors.textMuted}`}>
                                                            {meta.finalType || meta.detectedType}
                                                        </span>
                                                    )}
                                                    {selectedAggregation !== AggregationType.NONE && (
                                                        <span className="text-[10px] px-2 py-1 rounded-md border border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                                                            {getAggregationLabel(selectedAggregation, col)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <select
                                                    value={selectedAggregation}
                                                    onChange={(e) => setColumnAggregations(prev => ({
                                                        ...prev,
                                                        [col]: e.target.value as AggregationType
                                                    }))}
                                                    className={`w-full appearance-none border ${colors.borderPrimary} ${colors.bgPrimary} ${colors.textPrimary} rounded-xl px-3 py-2.5 pr-9 outline-none focus:border-indigo-500 transition`}
                                                >
                                                    {aggregationOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6 border-t ${colors.borderPrimary}`}>
                            <p className={`text-xs sm:text-sm ${colors.textMuted}`}>
                                Columns left as <span className={`${colors.textPrimary} font-semibold`}>None</span> will continue to work exactly as they do today.
                            </p>
                            <div className="flex items-center gap-3 justify-end">
                                <button
                                    onClick={() => setShowAggregationModal(false)}
                                    className={`px-4 py-2 rounded-lg ${colors.textMuted} hover:${colors.bgTertiary} transition`}
                                >
                                    Back
                                </button>
                                <button
                                    onClick={async () => {
                                        setShowAggregationModal(false);
                                        await finalizeWithAggregations();
                                    }}
                                    className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition flex items-center gap-2"
                                >
                                    Continue to Visualization
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};