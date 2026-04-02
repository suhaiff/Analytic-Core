import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Plus, X, Trash2, Wand2, Calculator, ChevronDown, ChevronLeft, ChevronRight, Eye, Pencil, Check, MoreHorizontal, Search, Scissors, Type, Copy, Calendar, ArrowDownAZ, Undo2, Sparkles, Send, Loader2, History } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { ColumnMetadata } from '../types';
import { smartFormat } from '../utils/formatters';
import { parseDataPreparationPrompt, DataPrepOperation, DataPrepAIResponse } from '../services/geminiService';

type ColumnMenuAction = 'find_replace' | 'remove' | 'split' | 'format' | 'trim' | 'duplicate' | 'datetime' | 'filter';

// ─── Filter Types ────────────────────────────────────────────────────────────
type NumberFilterOp = 'equals' | 'not_equals' | 'greater_than' | 'greater_than_or_equal' | 'less_than' | 'less_than_or_equal' | 'between';
type DateFilterOp = 'equals' | 'before' | 'after' | 'between' | 'is_earliest' | 'is_latest' | 'year' | 'quarter' | 'month' | 'week' | 'day';
type ColFilterType = 'number' | 'date' | 'text';

interface ColFilter {
    column: string;
    type: ColFilterType;
    numberOp?: NumberFilterOp;
    numberVal?: string;
    numberVal2?: string;
    dateOp?: DateFilterOp;
    dateVal?: string;
    dateVal2?: string;
    datePeriodVal?: string;
    checkedValues?: Set<string>;
    removeEmpty?: boolean;
}

// ─── Types ──────────────────────────────────────────────────────────────────────

interface DataPreparationProps {
    mergedData: any[];
    mergedColumns: string[];
    visibleColumns?: Set<string>;
    columnMetadata: { [key: string]: ColumnMetadata };
    columnCurrencies?: { [key: string]: string };
    onDataChange: (newData: any[], newColumns: string[]) => void;
}

type ConditionalOperator =
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'greater_than_or_equal'
    | 'less_than_or_equal'
    | 'contains'
    | 'begins_with'
    | 'ends_with';

interface ConditionalClause {
    id: string;
    column: string;
    operator: ConditionalOperator;
    value: string;
    valueType: 'text' | 'number';
    output: string;
    outputType: 'text' | 'number';
}

interface CustomColumnConfig {
    name: string;
    columnA: string;
    columnB: string;
    operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'concat';
    columnBMode: 'column' | 'manual';
    manualValue: string;
    // Optional Column C
    columnC?: string;
    columnCMode?: 'column' | 'manual';
    manualValueC?: string;
    operationC?: 'add' | 'subtract' | 'multiply' | 'divide';
    enableColumnC?: boolean;
}

const OPERATOR_LABELS: Record<ConditionalOperator, string> = {
    equals: 'equals',
    not_equals: 'does not equal',
    greater_than: 'is greater than',
    less_than: 'is less than',
    greater_than_or_equal: 'is greater than or...',
    less_than_or_equal: 'is less than or eq...',
    contains: 'contains',
    begins_with: 'begins with',
    ends_with: 'ends with',
};

const OPERATION_LABELS: Record<string, string> = {
    add: 'Add (+)',
    subtract: 'Subtract (−)',
    multiply: 'Multiply (×)',
    divide: 'Divide (÷)',
    concat: 'Concatenate Text',
};

const OPERATION_SYMBOLS: Record<string, string> = {
    add: '+',
    subtract: '−',
    multiply: '×',
    divide: '÷',
    concat: '&',
}; // ─── Helper: Evaluate a conditional clause against a row ────────────────────

function evaluateClause(clause: ConditionalClause, row: any): boolean {
    const cellValue = row[clause.column];
    const isNumericComparison = clause.valueType === 'number';
    const cellNum = Number(cellValue);
    const valNum = Number(clause.value);

    switch (clause.operator) {
        case 'equals':
            return isNumericComparison ? cellNum === valNum : String(cellValue) === clause.value;
        case 'not_equals':
            return isNumericComparison ? cellNum !== valNum : String(cellValue) !== clause.value;
        case 'greater_than':
            return cellNum > valNum;
        case 'less_than':
            return cellNum < valNum;
        case 'greater_than_or_equal':
            return cellNum >= valNum;
        case 'less_than_or_equal':
            return cellNum <= valNum;
        case 'contains':
            return String(cellValue).toLowerCase().includes(clause.value.toLowerCase());
        case 'begins_with':
            return String(cellValue).toLowerCase().startsWith(clause.value.toLowerCase());
        case 'ends_with':
            return String(cellValue).toLowerCase().endsWith(clause.value.toLowerCase());
        default:
            return false;
    }
}

// ─── Component ──────────────────────────────────────────────────────────────────

export const DataPreparation: React.FC<DataPreparationProps> = ({
    mergedData,
    mergedColumns,
    visibleColumns,
    columnMetadata,
    columnCurrencies,
    onDataChange,
}) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    // --- Visible Columns ---
    const displayColumns = useMemo(() => {
        if (!visibleColumns) return mergedColumns;
        return mergedColumns.filter(c => visibleColumns.has(c));
    }, [mergedColumns, visibleColumns]);

    // --- Editable Grid State ---
    const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [visibleRows, setVisibleRows] = useState(200);

    // --- Modal State ---
    const [showConditionalModal, setShowConditionalModal] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);

    // --- Conditional Column State ---
    const [condColName, setCondColName] = useState('');
    const [condClauses, setCondClauses] = useState<ConditionalClause[]>([
        { id: '1', column: mergedColumns[0] || '', operator: 'equals', value: '', valueType: 'text', output: '', outputType: 'text' },
    ]);
    const [condElseOutput, setCondElseOutput] = useState('');
    const [condElseType, setCondElseType] = useState<'text' | 'number'>('text');

    // --- Custom Column State ---
    const [customCol, setCustomCol] = useState<CustomColumnConfig>({
        name: '',
        columnA: mergedColumns[0] || '',
        columnB: mergedColumns[0] || '',
        operation: 'multiply',
        columnBMode: 'column',
        manualValue: '',
        columnC: mergedColumns[0] || '',
        columnCMode: 'column',
        manualValueC: '',
        operationC: 'add',
        enableColumnC: false,
    });

    // --- Added Columns Tracking ---
    const [addedColumns, setAddedColumns] = useState<string[]>([]);

    // --- Column Header Menu State ---
    const [menuColumn, setMenuColumn] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);
    const [formatSubMenuOpen, setFormatSubMenuOpen] = useState(false);

    // --- Find & Replace State ---
    const [showFindReplace, setShowFindReplace] = useState(false);
    const [frColumn, setFrColumn] = useState('');
    const [frFind, setFrFind] = useState('');
    const [frReplace, setFrReplace] = useState('');

    // --- Split Column State ---
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitColumn, setSplitColumn] = useState('');
    const [splitDelimiter, setSplitDelimiter] = useState(',');

    // --- Date/Time State ---
    const [showDateModal, setShowDateModal] = useState(false);
    const [dtColumn, setDtColumn] = useState('');
    const [dtExtract, setDtExtract] = useState<'year' | 'quarter' | 'month' | 'month_name' | 'day' | 'day_name' | 'hour'>('year');

    // --- Filter State ---
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterColumn, setFilterColumn] = useState('');
    const [filterType, setFilterType] = useState<ColFilterType>('text');
    const [numberFilterOp, setNumberFilterOp] = useState<NumberFilterOp>('equals');
    const [numberFilterVal, setNumberFilterVal] = useState('');
    const [numberFilterVal2, setNumberFilterVal2] = useState('');
    const [dateFilterOp, setDateFilterOp] = useState<DateFilterOp>('equals');
    const [dateFilterVal, setDateFilterVal] = useState('');
    const [dateFilterVal2, setDateFilterVal2] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [filterChecked, setFilterChecked] = useState<Set<string>>(new Set());
    const [filterRemoveEmpty, setFilterRemoveEmpty] = useState(false);
    const [activeFilters, setActiveFilters] = useState<ColFilter[]>([]);
    const [sortConfig, setSortConfig] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);

    // --- Delete Rows State ---
    const [deletedRowIndices, setDeletedRowIndices] = useState<Set<number>>(new Set());
    const [deleteHistory, setDeleteHistory] = useState<{ data: any[]; columns: string[] }[]>([]);

    // --- Action History (for revertible data transformations) ---
    const [actionHistory, setActionHistory] = useState<{ id: string; label: string; icon: string; data: any[]; columns: string[]; addedCols: string[] }[]>([]);

    // --- Header Editing State ---
    const [editingHeader, setEditingHeader] = useState<string | null>(null);
    const [headerEditValue, setHeaderEditValue] = useState('');

    // --- AI Prompt State ---
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState<DataPrepAIResponse | null>(null);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [actionSidebarOpen, setActionSidebarOpen] = useState(true);

    // --- Close menu on outside click ---
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuColumn(null);
        };
        if (menuColumn) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuColumn]);

    // ─── Column Header Menu Handlers ────────────────────────────────────────

    const openColumnMenu = (col: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenuPos({ x: rect.left, y: rect.bottom + 4 });
        setMenuColumn(prev => prev === col ? null : col);
        setFormatSubMenuOpen(false);
    };

    const handleColumnAction = (action: ColumnMenuAction, col: string) => {
        setMenuColumn(null);
        switch (action) {
            case 'find_replace':
                setFrColumn(col); setFrFind(''); setFrReplace('');
                setShowFindReplace(true);
                break;
            case 'remove': {
                // Save snapshot before removing column
                setActionHistory(prev => [...prev, { id: String(Date.now()), label: `Removed: ${col}`, icon: 'remove', data: [...mergedData], columns: [...mergedColumns], addedCols: [...addedColumns] }]);
                const newCols = mergedColumns.filter(c => c !== col);
                const newData = mergedData.map(r => { const rr = { ...r }; delete rr[col]; return rr; });
                setAddedColumns(prev => prev.filter(c => c !== col));
                onDataChange(newData, newCols);
                break;
            }
            case 'split':
                setSplitColumn(col); setSplitDelimiter(',');
                setShowSplitModal(true);
                break;
            case 'format': // handled inline via sub-menu, see applyFormat
                break;
            case 'trim': {
                // Save snapshot before trimming
                setActionHistory(prev => [...prev, { id: String(Date.now()), label: `Trim: ${col}`, icon: 'trim', data: [...mergedData], columns: [...mergedColumns], addedCols: [...addedColumns] }]);
                const newData = mergedData.map(r => ({ ...r, [col]: typeof r[col] === 'string' ? r[col].trim() : r[col] }));
                onDataChange(newData, mergedColumns);
                break;
            }
            case 'duplicate': {
                const newName = `Copy of ${col}`;
                let finalName = newName;
                let i = 2;
                while (mergedColumns.includes(finalName)) { finalName = `${newName} (${i})`; i++; }
                const newCols = [...mergedColumns, finalName];
                const newData = mergedData.map(r => ({ ...r, [finalName]: r[col] }));
                setAddedColumns(prev => [...prev, finalName]);
                onDataChange(newData, newCols);
                break;
            }
            case 'datetime':
                setDtColumn(col); setDtExtract('year');
                setShowDateModal(true);
                break;
        }
    };

    const applyFormat = (col: string, fmt: 'upper' | 'lower' | 'title' | 'capitalize') => {
        setMenuColumn(null);
        const fmtLabels: Record<string, string> = { upper: 'UPPER', lower: 'lower', title: 'Title', capitalize: 'Capitalize' };
        // Save snapshot before formatting
        setActionHistory(prev => [...prev, { id: String(Date.now()), label: `Format ${fmtLabels[fmt]}: ${col}`, icon: 'format', data: [...mergedData], columns: [...mergedColumns], addedCols: [...addedColumns] }]);
        const transform = (v: any): any => {
            if (typeof v !== 'string') return v;
            switch (fmt) {
                case 'upper': return v.toUpperCase();
                case 'lower': return v.toLowerCase();
                case 'title': return v.replace(/\b\w/g, c => c.toUpperCase());
                case 'capitalize': return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
                default: return v;
            }
        };
        onDataChange(mergedData.map(r => ({ ...r, [col]: transform(r[col]) })), mergedColumns);
    };

    const applyFindReplace = () => {
        if (!frFind) return;
        // Save snapshot before find & replace
        setActionHistory(prev => [...prev, { id: String(Date.now()), label: `Find & Replace: ${frColumn}`, icon: 'find_replace', data: [...mergedData], columns: [...mergedColumns], addedCols: [...addedColumns] }]);
        const newData = mergedData.map(r => {
            const val = r[frColumn];
            if (typeof val === 'string') return { ...r, [frColumn]: val.split(frFind).join(frReplace) };
            if (val !== null && val !== undefined && String(val) === frFind) return { ...r, [frColumn]: frReplace };
            return r;
        });
        onDataChange(newData, mergedColumns);
        setShowFindReplace(false);
    };

    const handleHeaderRename = (oldName: string, newName: string) => {
        const trimmedNewName = newName.trim();
        if (!trimmedNewName || trimmedNewName === oldName) {
            setEditingHeader(null);
            return;
        }

        if (mergedColumns.includes(trimmedNewName)) {
            alert('A column with this name already exists.');
            setEditingHeader(null);
            return;
        }

        // Save to action history
        setActionHistory(prev => [...prev, { 
            id: String(Date.now()), 
            label: `Renamed: ${oldName} to ${trimmedNewName}`, 
            icon: 'pencil', 
            data: [...mergedData], 
            columns: [...mergedColumns], 
            addedCols: [...addedColumns] 
        }]);

        // Update data keys
        const newData = mergedData.map(row => {
            const newRow = { ...row };
            newRow[trimmedNewName] = newRow[oldName];
            delete newRow[oldName];
            return newRow;
        });

        // Update columns list
        const newColumns = mergedColumns.map(c => c === oldName ? trimmedNewName : c);
        
        // Update addedColumns
        if (addedColumns.includes(oldName)) {
            setAddedColumns(prev => prev.map(c => c === oldName ? trimmedNewName : c));
        }

        // Update activeFilters
        setActiveFilters(prev => prev.map(f => f.column === oldName ? { ...f, column: trimmedNewName } : f));

        // Update sortConfig
        if (sortConfig?.col === oldName) {
            setSortConfig({ ...sortConfig, col: trimmedNewName });
        }

        onDataChange(newData, newColumns);
        setEditingHeader(null);
    };

    const applySplit = () => {
        if (!splitDelimiter) return;
        const maxParts = mergedData.reduce((max, r) => {
            const val = String(r[splitColumn] ?? '');
            return Math.max(max, val.split(splitDelimiter).length);
        }, 0);
        const newColNames = Array.from({ length: maxParts }, (_, i) => `${splitColumn}.${i + 1}`);
        const usedNames = newColNames.map(n => { let name = n; let j = 2; while (mergedColumns.includes(name)) { name = `${n} (${j})`; j++; } return name; });
        const newCols = [...mergedColumns, ...usedNames];
        const newData = mergedData.map(r => {
            const parts = String(r[splitColumn] ?? '').split(splitDelimiter);
            const extra: any = {};
            usedNames.forEach((name, i) => { extra[name] = parts[i] !== undefined ? parts[i].trim() : ''; });
            return { ...r, ...extra };
        });
        setAddedColumns(prev => [...prev, ...usedNames]);
        onDataChange(newData, newCols);
        setShowSplitModal(false);
    };

    const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    const applyDateExtract = () => {
        const newName = `${dtColumn} - ${dtExtract.charAt(0).toUpperCase() + dtExtract.slice(1).replace('_', ' ')}`;
        let finalName = newName; let i = 2;
        while (mergedColumns.includes(finalName)) { finalName = `${newName} (${i})`; i++; }
        const newCols = [...mergedColumns, finalName];
        const newData = mergedData.map(r => {
            const raw = r[dtColumn];
            const d = new Date(raw);
            let extracted: any = '';
            if (!isNaN(d.getTime())) {
                switch (dtExtract) {
                    case 'year': extracted = d.getFullYear(); break;
                    case 'quarter': extracted = `Q${Math.ceil((d.getMonth() + 1) / 3)}`; break;
                    case 'month': extracted = d.getMonth() + 1; break;
                    case 'month_name': extracted = MONTH_NAMES[d.getMonth()]; break;
                    case 'day': extracted = d.getDate(); break;
                    case 'day_name': extracted = DAY_NAMES[d.getDay()]; break;
                    case 'hour': extracted = d.getHours(); break;
                }
            }
            return { ...r, [finalName]: extracted };
        });
        setAddedColumns(prev => [...prev, finalName]);
        onDataChange(newData, newCols);
        setShowDateModal(false);
    };

    // ─── Cell Editing ───────────────────────────────────────────────────────

    const startEditing = useCallback((rowIdx: number, col: string, currentValue: any) => {
        setEditingCell({ row: rowIdx, col });
        setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
    }, []);

    const commitEdit = useCallback(() => {
        if (!editingCell) return;
        const { row, col } = editingCell;
        const newData = [...mergedData];
        newData[row] = { ...newData[row], [col]: editValue };
        onDataChange(newData, mergedColumns);
        setEditingCell(null);
    }, [editingCell, editValue, mergedData, mergedColumns, onDataChange]);

    const cancelEdit = useCallback(() => {
        setEditingCell(null);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') commitEdit();
        if (e.key === 'Escape') cancelEdit();
    }, [commitEdit, cancelEdit]);

    // ─── Conditional Column ─────────────────────────────────────────────────

    const openConditionalModal = () => {
        setCondColName('');
        setCondClauses([
            { id: String(Date.now()), column: mergedColumns[0] || '', operator: 'equals', value: '', valueType: 'text', output: '', outputType: 'text' },
        ]);
        setCondElseOutput('');
        setCondElseType('text');
        setShowConditionalModal(true);
    };

    const addClause = () => {
        setCondClauses(prev => [
            ...prev,
            { id: String(Date.now()), column: mergedColumns[0] || '', operator: 'equals', value: '', valueType: 'text', output: '', outputType: 'text' },
        ]);
    };

    const updateClause = (id: string, field: keyof ConditionalClause, value: any) => {
        setCondClauses(prev => prev.map(c => (c.id === id ? { ...c, [field]: value } : c)));
    };

    const removeClause = (id: string) => {
        if (condClauses.length <= 1) return;
        setCondClauses(prev => prev.filter(c => c.id !== id));
    };

    const applyConditionalColumn = () => {
        const trimmedName = condColName.trim();
        if (!trimmedName) {
            alert('Please enter a column name.');
            return;
        }
        if (mergedColumns.includes(trimmedName)) {
            alert('A column with this name already exists.');
            return;
        }

        const newData = mergedData.map(row => {
            let result: string | number = condElseType === 'number' ? Number(condElseOutput) || 0 : condElseOutput;
            for (const clause of condClauses) {
                if (evaluateClause(clause, row)) {
                    result = clause.outputType === 'number' ? Number(clause.output) || 0 : clause.output;
                    break;
                }
            }
            return { ...row, [trimmedName]: result };
        });

        const newColumns = [...mergedColumns, trimmedName];
        setAddedColumns(prev => [...prev, trimmedName]);
        onDataChange(newData, newColumns);
        setShowConditionalModal(false);
    };

    // ─── Filter Helpers ──────────────────────────────────────────────────────

    const detectColType = (col: string): ColFilterType => {
        const vals = mergedData.slice(0, 30).map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
        if (vals.length === 0) return 'text';
        
        // Remove currency symbols and formatting for number detection
        const cleanVals = vals.map(v => String(v).replace(/[$€£₹,]/g, '').trim());
        const numCount = cleanVals.filter(v => !isNaN(Number(v)) && v !== '').length;
        if (numCount >= vals.length * 0.7) return 'number';
        
        const dateCount = vals.filter(v => { const d = new Date(v); return !isNaN(d.getTime()) && String(v).match(/\d{4}[-/]\d{1,2}/); }).length;
        if (dateCount >= vals.length * 0.7) return 'date';
        return 'text';
    };

    // ─── Custom (Computed) Column ───────────────────────────────────────────

    const openCustomModal = () => {
        setCustomCol({
            name: '',
            columnA: mergedColumns[0] || '',
            columnB: mergedColumns[0] || '',
            operation: 'multiply',
            columnBMode: 'column',
            manualValue: '',
            columnC: mergedColumns[0] || '',
            columnCMode: 'column',
            manualValueC: '',
            operationC: 'add',
            enableColumnC: false,
        });
        setShowCustomModal(true);
    };

    const computeCustomValue = (a: any, b: any, op: string): any => {
        const cleanA = String(a ?? '').replace(/[$€£₹,]/g, '').trim();
        const cleanB = String(b ?? '').replace(/[$€£₹,]/g, '').trim();
        const numA = Number(cleanA) || 0;
        const numB = Number(cleanB) || 0;
        const strA = String(a ?? '');
        const strB = String(b ?? '');
        switch (op) {
            case 'add': return numA + numB;
            case 'subtract': return numA - numB;
            case 'multiply': return numA * numB;
            case 'divide': return numB !== 0 ? numA / numB : 0;
            case 'concat': return strA + strB;
            default: return 0;
        }
    };

    const customPreview = useMemo(() => {
        if (!customCol.columnA) return [];
        const isManual = customCol.columnBMode === 'manual';
        if (!isManual && !customCol.columnB) return [];
        const bVal = isManual ? (Number(customCol.manualValue) || 0) : null;
        
        return mergedData.slice(0, 5).map(row => {
            const b = isManual ? bVal : row[customCol.columnB];
            let result = computeCustomValue(row[customCol.columnA], b, customCol.operation);
            
            // If Column C is enabled, apply the second operation
            let c = null;
            if (customCol.enableColumnC) {
                const isManualC = customCol.columnCMode === 'manual';
                c = isManualC ? (Number(customCol.manualValueC) || 0) : row[customCol.columnC || ''];
                result = computeCustomValue(result, c, customCol.operationC || 'add');
            }
            
            return {
                a: row[customCol.columnA],
                b: b,
                c: c,
                result: result,
            };
        });
    }, [customCol.columnA, customCol.columnB, customCol.columnBMode, customCol.manualValue, customCol.operation, customCol.enableColumnC, customCol.columnC, customCol.columnCMode, customCol.manualValueC, customCol.operationC, mergedData]);

    const applyCustomColumn = () => {
        const trimmedName = customCol.name.trim();
        if (!trimmedName) {
            alert('Please enter a column name.');
            return;
        }
        if (mergedColumns.includes(trimmedName)) {
            alert('A column with this name already exists.');
            return;
        }

        const isManual = customCol.columnBMode === 'manual';
        const isArithmetic = ['add', 'subtract', 'multiply', 'divide'].includes(customCol.operation);

        // Validate manual value
        if (isManual && isArithmetic && (customCol.manualValue.trim() === '' || isNaN(Number(customCol.manualValue)))) {
            alert('Please enter a valid number for the manual value.');
            return;
        }

        // Validate types
        const typeA = detectColType(customCol.columnA);
        
        if (isArithmetic) {
            if (isManual) {
                if (typeA !== 'number') {
                    alert(`Cannot perform arithmetic operations on non-numeric column.\nColumn A (${customCol.columnA}) is ${typeA}.`);
                    return;
                }
            } else {
                const typeB = detectColType(customCol.columnB);
                if (typeA !== 'number' || typeB !== 'number') {
                    alert(`Cannot perform arithmetic operations on non-numeric columns.\nColumn A (${customCol.columnA}) is ${typeA}.\nColumn B (${customCol.columnB}) is ${typeB}.`);
                    return;
                }
            }
        } else if (customCol.operation === 'concat') {
            const typeB = isManual ? 'text' : detectColType(customCol.columnB);
            if (typeA !== 'text' || typeB !== 'text') {
                alert(`Concatenation is only allowed when both columns are text.\nColumn A (${customCol.columnA}) is ${typeA}.\nColumn B (${customCol.columnB}) is ${typeB}.`);
                return;
            }
        }

        const manualVal = isManual ? (Number(customCol.manualValue) || 0) : null;
        const newData = mergedData.map(row => {
            let result = computeCustomValue(
                row[customCol.columnA],
                isManual ? manualVal : row[customCol.columnB],
                customCol.operation
            );
            
            // Apply Column C operation if enabled
            if (customCol.enableColumnC) {
                const isManualC = customCol.columnCMode === 'manual';
                const cVal = isManualC ? (Number(customCol.manualValueC) || 0) : row[customCol.columnC || ''];
                result = computeCustomValue(result, cVal, customCol.operationC || 'add');
            }
            
            return {
                ...row,
                [trimmedName]: result,
            };
        });
        const newColumns = [...mergedColumns, trimmedName];
        setAddedColumns(prev => [...prev, trimmedName]);
        onDataChange(newData, newColumns);
        setShowCustomModal(false);
    };

    // ─── Remove an added column ─────────────────────────────────────────────

    const removeAddedColumn = (colName: string) => {
        const newColumns = mergedColumns.filter(c => c !== colName);
        const newData = mergedData.map(row => {
            const r = { ...row };
            delete r[colName];
            return r;
        });
        setAddedColumns(prev => prev.filter(c => c !== colName));
        onDataChange(newData, newColumns);
    };

    const openFilterModal = (col: string) => {
        setMenuColumn(null);
        const type = detectColType(col);
        setFilterColumn(col);
        setFilterType(type);
        setNumberFilterOp('equals');
        setNumberFilterVal('');
        setNumberFilterVal2('');
        setDateFilterOp('equals');
        setDateFilterVal('');
        setDateFilterVal2('');
        setFilterRemoveEmpty(false);
        setFilterSearch('');
        // pre-populate existing filter if any
        const existing = activeFilters.find(f => f.column === col);
        if (existing) {
            if (existing.numberOp) { setNumberFilterOp(existing.numberOp); setNumberFilterVal(existing.numberVal || ''); setNumberFilterVal2(existing.numberVal2 || ''); }
            if (existing.dateOp) { setDateFilterOp(existing.dateOp); setDateFilterVal(existing.dateVal || ''); setDateFilterVal2(existing.dateVal2 || ''); }
            setFilterRemoveEmpty(existing.removeEmpty || false);
            if (existing.checkedValues) setFilterChecked(new Set(existing.checkedValues));
            else setFilterChecked(new Set(mergedData.map(r => String(r[col] ?? ''))));
        } else {
            setFilterChecked(new Set(mergedData.map(r => String(r[col] ?? ''))));
        }
        setShowFilterModal(true);
    };

    const uniqueColValues = useMemo(() => {
        if (!filterColumn) return [];
        const seen = new Set<string>();
        return mergedData
            .map(r => String(r[filterColumn] ?? ''))
            .filter(v => { if (seen.has(v)) return false; seen.add(v); return true; })
            .sort();
    }, [mergedData, filterColumn]);

    const filteredUniqueValues = useMemo(() =>
        uniqueColValues.filter(v => v.toLowerCase().includes(filterSearch.toLowerCase())),
        [uniqueColValues, filterSearch]
    );

    const applyFilter = () => {
        const newFilter: ColFilter = {
            column: filterColumn,
            type: filterType,
            removeEmpty: filterRemoveEmpty,
            checkedValues: filterType === 'text' ? new Set(filterChecked) : undefined,
            numberOp: filterType === 'number' ? numberFilterOp : undefined,
            numberVal: filterType === 'number' ? numberFilterVal : undefined,
            numberVal2: filterType === 'number' ? numberFilterVal2 : undefined,
            dateOp: filterType === 'date' ? dateFilterOp : undefined,
            dateVal: filterType === 'date' ? dateFilterVal : undefined,
            dateVal2: filterType === 'date' ? dateFilterVal2 : undefined,
        };
        setActiveFilters(prev => {
            const rest = prev.filter(f => f.column !== filterColumn);
            return [...rest, newFilter];
        });
        setShowFilterModal(false);
    };

    const clearFilter = (col: string) => {
        setActiveFilters(prev => prev.filter(f => f.column !== col));
    };

    const rowPassesFilter = (row: any, filter: ColFilter): boolean => {
        const raw = row[filter.column];
        const strVal = String(raw ?? '');
        if (filter.removeEmpty && strVal.trim() === '') return false;
        if (filter.type === 'text' && filter.checkedValues) {
            return filter.checkedValues.has(strVal);
        }
        if (filter.type === 'number') {
            const n = Number(raw);
            const v1 = Number(filter.numberVal);
            const v2 = Number(filter.numberVal2);
            switch (filter.numberOp) {
                case 'equals': return n === v1;
                case 'not_equals': return n !== v1;
                case 'greater_than': return n > v1;
                case 'greater_than_or_equal': return n >= v1;
                case 'less_than': return n < v1;
                case 'less_than_or_equal': return n <= v1;
                case 'between': return n >= v1 && n <= v2;
                default: return true;
            }
        }
        if (filter.type === 'date') {
            const d = new Date(raw);
            if (isNaN(d.getTime())) return filter.dateOp === 'is_earliest' || filter.dateOp === 'is_latest' ? false : true;
            const d1 = filter.dateVal ? new Date(filter.dateVal) : null;
            const d2 = filter.dateVal2 ? new Date(filter.dateVal2) : null;
            const now = new Date();
            const getWeek = (dt: Date) => { const d2 = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate())); const dayNum = d2.getUTCDay() || 7; d2.setUTCDate(d2.getUTCDate() + 4 - dayNum); const yearStart = new Date(Date.UTC(d2.getUTCFullYear(),0,1)); return Math.ceil((((d2.getTime()-yearStart.getTime())/86400000)+1)/7); };
            switch (filter.dateOp) {
                case 'equals': return d1 ? d.toDateString() === d1.toDateString() : true;
                case 'before': return d1 ? d < d1 : true;
                case 'after': return d1 ? d > d1 : true;
                case 'between': return d1 && d2 ? d >= d1 && d <= d2 : true;
                case 'is_earliest': { const earliest = new Date(Math.min(...mergedData.map(r => new Date(r[filter.column]).getTime()).filter(t => !isNaN(t)))); return d.toDateString() === earliest.toDateString(); }
                case 'is_latest': { const latest = new Date(Math.max(...mergedData.map(r => new Date(r[filter.column]).getTime()).filter(t => !isNaN(t)))); return d.toDateString() === latest.toDateString(); }
                case 'year': return filter.dateVal ? d.getFullYear() === Number(filter.dateVal) : true;
                case 'quarter': return filter.dateVal ? Math.ceil((d.getMonth() + 1) / 3) === Number(filter.dateVal) : true;
                case 'month': return filter.dateVal ? d.getMonth() + 1 === Number(filter.dateVal) : true;
                case 'week': return filter.dateVal ? getWeek(d) === Number(filter.dateVal) : true;
                case 'day': return filter.dateVal ? d.getDate() === Number(filter.dateVal) : true;
                default: return true;
            }
        }
        return true;
    };

    // Apply all active filters + sort to the displayed data
    // Each item carries its original mergedData index for stable row-delete tracking
    const displayData = useMemo(() => {
        let data = mergedData.map((row, idx) => ({ ...row, __originalIndex: idx }));
        for (const filter of activeFilters) {
            data = data.filter(row => rowPassesFilter(row, filter));
        }
        if (sortConfig) {
            data = [...data].sort((a, b) => {
                const aVal = a[sortConfig.col];
                const bVal = b[sortConfig.col];
                const aNum = Number(aVal); const bNum = Number(bVal);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return sortConfig.dir === 'asc' ? aNum - bNum : bNum - aNum;
                }
                return sortConfig.dir === 'asc'
                    ? String(aVal ?? '').localeCompare(String(bVal ?? ''))
                    : String(bVal ?? '').localeCompare(String(aVal ?? ''));
            });
        }
        return data;
    }, [mergedData, activeFilters, sortConfig]);

    // ─── Delete Row Handlers ────────────────────────────────────────────────

    const toggleRowDelete = useCallback((originalIndex: number) => {
        setDeletedRowIndices(prev => {
            const next = new Set(prev);
            if (next.has(originalIndex)) {
                next.delete(originalIndex);
            } else {
                next.add(originalIndex);
            }
            return next;
        });
    }, []);

    const undoAllDeletes = useCallback(() => {
        setDeletedRowIndices(new Set());
    }, []);

    const applyDeletes = useCallback(() => {
        if (deletedRowIndices.size === 0) return;
        // Save snapshot before deleting so user can restore
        setDeleteHistory(prev => [...prev, { data: [...mergedData], columns: [...mergedColumns] }]);
        const newData = mergedData.filter((_, idx) => !deletedRowIndices.has(idx));
        setDeletedRowIndices(new Set());
        onDataChange(newData, mergedColumns);
    }, [deletedRowIndices, mergedData, mergedColumns, onDataChange]);

    const restoreLastDelete = useCallback(() => {
        if (deleteHistory.length === 0) return;
        const lastSnapshot = deleteHistory[deleteHistory.length - 1];
        setDeleteHistory(prev => prev.slice(0, -1));
        setDeletedRowIndices(new Set());
        onDataChange(lastSnapshot.data, lastSnapshot.columns);
    }, [deleteHistory, onDataChange]);

    // ─── Action History Undo ────────────────────────────────────────────────

    const undoAction = useCallback((actionId: string) => {
        const actionIdx = actionHistory.findIndex(a => a.id === actionId);
        if (actionIdx === -1) return;
        const action = actionHistory[actionIdx];
        // Restore data and columns from snapshot
        onDataChange(action.data, action.columns);
        // Restore addedColumns state
        setAddedColumns(action.addedCols);
        // Remove this action and all actions after it (they depend on this state)
        setActionHistory(prev => prev.slice(0, actionIdx));
    }, [actionHistory, onDataChange]);

    const undoLastAction = useCallback(() => {
        if (actionHistory.length === 0) return;
        const last = actionHistory[actionHistory.length - 1];
        undoAction(last.id);
    }, [actionHistory, undoAction]);

    const clearActionHistory = useCallback(() => {
        setActionHistory([]);
    }, []);

    // ─── AI Data Preparation ────────────────────────────────────────────────

    const detectNumericColumns = useCallback(() => {
        return mergedColumns.filter(col => {
            const vals = mergedData.slice(0, 30).map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
            const cleanVals = vals.map(v => String(v).replace(/[$€£₹,]/g, '').trim());
            const numCount = cleanVals.filter(v => !isNaN(Number(v)) && v !== '').length;
            return numCount >= vals.length * 0.7;
        });
    }, [mergedData, mergedColumns]);

    const detectCategoricalColumns = useCallback(() => {
        const numericCols = new Set(detectNumericColumns());
        return mergedColumns.filter(col => !numericCols.has(col));
    }, [mergedColumns, detectNumericColumns]);

    const handleAiSubmit = useCallback(async () => {
        if (!aiPrompt.trim() || aiLoading) return;
        
        setAiLoading(true);
        setAiResponse(null);
        
        try {
            const numericCols = detectNumericColumns();
            const categoricalCols = detectCategoricalColumns();
            
            const response = await parseDataPreparationPrompt(
                mergedColumns,
                numericCols,
                categoricalCols,
                mergedData,
                aiPrompt
            );
            
            setAiResponse(response);
        } catch (error) {
            console.error('AI Data Prep Error:', error);
            setAiResponse({
                operations: [],
                explanation: `Error: ${(error as Error).message}`
            });
        } finally {
            setAiLoading(false);
        }
    }, [aiPrompt, aiLoading, mergedColumns, mergedData, detectNumericColumns, detectCategoricalColumns]);

    const executeAiOperation = useCallback((op: DataPrepOperation) => {
        // Save snapshot before any operation
        setActionHistory(prev => [...prev, { 
            id: String(Date.now()), 
            label: `AI: ${op.operationType}`, 
            icon: 'ai', 
            data: [...mergedData], 
            columns: [...mergedColumns], 
            addedCols: [...addedColumns] 
        }]);

        let newData = [...mergedData];
        let newColumns = [...mergedColumns];

        switch (op.operationType) {
            case 'calculated_column': {
                const calc = op.calculatedColumn;
                if (!calc) break;
                
                let colName = calc.name;
                let i = 2;
                while (newColumns.includes(colName)) { colName = `${calc.name} (${i})`; i++; }
                
                newData = newData.map(row => {
                    const cleanA = String(row[calc.columnA] ?? '').replace(/[$€£₹,]/g, '').trim();
                    const numA = Number(cleanA) || 0;
                    
                    let numB: number;
                    if (calc.useManualValue && calc.manualValue !== undefined) {
                        numB = calc.manualValue;
                    } else {
                        const cleanB = String(row[calc.columnB || ''] ?? '').replace(/[$€£₹,]/g, '').trim();
                        numB = Number(cleanB) || 0;
                    }
                    
                    let result: any;
                    switch (calc.operation) {
                        case 'add': result = numA + numB; break;
                        case 'subtract': result = numA - numB; break;
                        case 'multiply': result = numA * numB; break;
                        case 'divide': result = numB !== 0 ? numA / numB : 0; break;
                        case 'concat': result = String(row[calc.columnA] ?? '') + String(calc.useManualValue ? calc.manualValue : row[calc.columnB || ''] ?? ''); break;
                        default: result = 0;
                    }
                    return { ...row, [colName]: result };
                });
                newColumns = [...newColumns, colName];
                setAddedColumns(prev => [...prev, colName]);
                break;
            }
            
            case 'conditional_column': {
                const cond = op.conditionalColumn;
                if (!cond) break;
                
                let colName = cond.name;
                let i = 2;
                while (newColumns.includes(colName)) { colName = `${cond.name} (${i})`; i++; }
                
                newData = newData.map(row => {
                    let result: string | number = cond.elseOutputType === 'number' ? Number(cond.elseOutput) || 0 : cond.elseOutput;
                    
                    for (const clause of cond.clauses) {
                        const cellValue = row[clause.column];
                        const isNumeric = clause.valueType === 'number';
                        const cellNum = Number(String(cellValue).replace(/[$€£₹,]/g, ''));
                        const valNum = Number(clause.value);
                        
                        let matches = false;
                        switch (clause.operator) {
                            case 'equals': matches = isNumeric ? cellNum === valNum : String(cellValue) === clause.value; break;
                            case 'not_equals': matches = isNumeric ? cellNum !== valNum : String(cellValue) !== clause.value; break;
                            case 'greater_than': matches = cellNum > valNum; break;
                            case 'less_than': matches = cellNum < valNum; break;
                            case 'greater_than_or_equal': matches = cellNum >= valNum; break;
                            case 'less_than_or_equal': matches = cellNum <= valNum; break;
                            case 'contains': matches = String(cellValue).toLowerCase().includes(clause.value.toLowerCase()); break;
                            case 'begins_with': matches = String(cellValue).toLowerCase().startsWith(clause.value.toLowerCase()); break;
                            case 'ends_with': matches = String(cellValue).toLowerCase().endsWith(clause.value.toLowerCase()); break;
                        }
                        
                        if (matches) {
                            result = clause.outputType === 'number' ? Number(clause.output) || 0 : clause.output;
                            break;
                        }
                    }
                    return { ...row, [colName]: result };
                });
                newColumns = [...newColumns, colName];
                setAddedColumns(prev => [...prev, colName]);
                break;
            }
            
            case 'filter': {
                const filter = op.filter;
                if (!filter) break;
                
                if (filter.filterType === 'text' && filter.textValues) {
                    const textSet = new Set(filter.textValues.map(v => v.toLowerCase()));
                    setActiveFilters(prev => {
                        const rest = prev.filter(f => f.column !== filter.column);
                        return [...rest, {
                            column: filter.column,
                            type: 'text',
                            checkedValues: new Set(mergedData.map(r => String(r[filter.column] ?? '')).filter(v => textSet.has(v.toLowerCase())))
                        }];
                    });
                } else if (filter.filterType === 'number' && filter.numberOp) {
                    setActiveFilters(prev => {
                        const rest = prev.filter(f => f.column !== filter.column);
                        return [...rest, {
                            column: filter.column,
                            type: 'number',
                            numberOp: filter.numberOp,
                            numberVal: String(filter.numberVal ?? ''),
                            numberVal2: String(filter.numberVal2 ?? '')
                        }];
                    });
                }
                return; // Don't update data directly for filters
            }
            
            case 'sort': {
                const sort = op.sort;
                if (!sort) break;
                setSortConfig({ col: sort.column, dir: sort.direction });
                return; // Don't update data directly for sort
            }
            
            case 'format': {
                const fmt = op.format;
                if (!fmt) break;
                
                const transform = (v: any): any => {
                    if (typeof v !== 'string') return v;
                    switch (fmt.formatType) {
                        case 'upper': return v.toUpperCase();
                        case 'lower': return v.toLowerCase();
                        case 'title': return v.replace(/\b\w/g, c => c.toUpperCase());
                        case 'capitalize': return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
                        default: return v;
                    }
                };
                newData = newData.map(r => ({ ...r, [fmt.column]: transform(r[fmt.column]) }));
                break;
            }
            
            case 'find_replace': {
                const fr = op.findReplace;
                if (!fr) break;
                
                newData = newData.map(r => {
                    const val = r[fr.column];
                    if (typeof val === 'string') return { ...r, [fr.column]: val.split(fr.find).join(fr.replace) };
                    if (val !== null && val !== undefined && String(val) === fr.find) return { ...r, [fr.column]: fr.replace };
                    return r;
                });
                break;
            }
            
            case 'split': {
                const split = op.split;
                if (!split) break;
                
                const maxParts = newData.reduce((max, r) => {
                    const val = String(r[split.column] ?? '');
                    return Math.max(max, val.split(split.delimiter).length);
                }, 0);
                
                const newColNames = Array.from({ length: maxParts }, (_, i) => `${split.column}.${i + 1}`);
                const usedNames = newColNames.map(n => { let name = n; let j = 2; while (newColumns.includes(name)) { name = `${n} (${j})`; j++; } return name; });
                
                newData = newData.map(r => {
                    const parts = String(r[split.column] ?? '').split(split.delimiter);
                    const extra: any = {};
                    usedNames.forEach((name, i) => { extra[name] = parts[i] !== undefined ? parts[i].trim() : ''; });
                    return { ...r, ...extra };
                });
                newColumns = [...newColumns, ...usedNames];
                setAddedColumns(prev => [...prev, ...usedNames]);
                break;
            }
            
            case 'duplicate': {
                const dup = op.duplicate;
                if (!dup) break;
                
                let newName = dup.newName || `Copy of ${dup.column}`;
                let i = 2;
                while (newColumns.includes(newName)) { newName = `${dup.newName || `Copy of ${dup.column}`} (${i})`; i++; }
                
                newData = newData.map(r => ({ ...r, [newName]: r[dup.column] }));
                newColumns = [...newColumns, newName];
                setAddedColumns(prev => [...prev, newName]);
                break;
            }
            
            case 'datetime_extract': {
                const dt = op.datetimeExtract;
                if (!dt) break;
                
                const extractLabel = dt.extract.charAt(0).toUpperCase() + dt.extract.slice(1).replace('_', ' ');
                let newName = `${dt.column} - ${extractLabel}`;
                let i = 2;
                while (newColumns.includes(newName)) { newName = `${dt.column} - ${extractLabel} (${i})`; i++; }
                
                const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                
                newData = newData.map(r => {
                    const d = new Date(r[dt.column]);
                    let extracted: any = '';
                    if (!isNaN(d.getTime())) {
                        switch (dt.extract) {
                            case 'year': extracted = d.getFullYear(); break;
                            case 'quarter': extracted = `Q${Math.ceil((d.getMonth() + 1) / 3)}`; break;
                            case 'month': extracted = d.getMonth() + 1; break;
                            case 'month_name': extracted = MONTH_NAMES[d.getMonth()]; break;
                            case 'day': extracted = d.getDate(); break;
                            case 'day_name': extracted = DAY_NAMES[d.getDay()]; break;
                            case 'hour': extracted = d.getHours(); break;
                        }
                    }
                    return { ...r, [newName]: extracted };
                });
                newColumns = [...newColumns, newName];
                setAddedColumns(prev => [...prev, newName]);
                break;
            }
            
            case 'trim': {
                const trim = op.trim;
                if (!trim) break;
                newData = newData.map(r => ({ ...r, [trim.column]: typeof r[trim.column] === 'string' ? r[trim.column].trim() : r[trim.column] }));
                break;
            }
            
            case 'rename': {
                const rename = op.rename;
                if (!rename || newColumns.includes(rename.newName)) break;
                
                newData = newData.map(row => {
                    const newRow = { ...row };
                    newRow[rename.newName] = newRow[rename.column];
                    delete newRow[rename.column];
                    return newRow;
                });
                newColumns = newColumns.map(c => c === rename.column ? rename.newName : c);
                if (addedColumns.includes(rename.column)) {
                    setAddedColumns(prev => prev.map(c => c === rename.column ? rename.newName : c));
                }
                break;
            }
            
            case 'remove': {
                const remove = op.remove;
                if (!remove) break;
                newColumns = newColumns.filter(c => c !== remove.column);
                newData = newData.map(r => { const rr = { ...r }; delete rr[remove.column]; return rr; });
                setAddedColumns(prev => prev.filter(c => c !== remove.column));
                break;
            }
        }
        
        onDataChange(newData, newColumns);
    }, [mergedData, mergedColumns, addedColumns, onDataChange]);

    const executeAllAiOperations = useCallback(() => {
        if (!aiResponse?.operations.length) return;
        aiResponse.operations.forEach(op => executeAiOperation(op));
        setAiResponse(null);
        setAiPrompt('');
        setShowAiPanel(false);
    }, [aiResponse, executeAiOperation]);

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className={`flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 border-b ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900/60' : 'bg-white/80'} backdrop-blur-sm`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
                    <h2 className={`text-sm sm:text-base font-bold ${colors.textPrimary} truncate`}>Data Preparation</h2>
                    <span className={`text-xs ${colors.textMuted} hidden sm:inline`}>
                        {mergedData.length.toLocaleString()} rows × {mergedColumns.length} columns
                    </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => setShowAiPanel(prev => !prev)}
                        className={`px-2.5 sm:px-3 py-1.5 sm:py-2 ${showAiPanel ? 'bg-pink-500' : 'bg-gradient-to-r from-pink-600 to-purple-600'} hover:from-pink-500 hover:to-purple-500 text-white rounded-lg text-[10px] sm:text-xs font-medium transition flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-pink-900/20 hover:shadow-pink-500/20 active:scale-[0.97] whitespace-nowrap`}
                    >
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>AI Assist</span>
                    </button>
                    <button
                        onClick={openConditionalModal}
                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[10px] sm:text-xs font-medium transition flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-violet-900/20 hover:shadow-violet-500/20 active:scale-[0.97] whitespace-nowrap"
                    >
                        <Wand2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>Conditional Columns</span>
                    </button>
                    <button
                        onClick={openCustomModal}
                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] sm:text-xs font-medium transition flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20 active:scale-[0.97] whitespace-nowrap"
                    >
                        <Calculator className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>Calculated Columns</span>
                    </button>
                </div>

                {/* AI Assist Panel */}
                {showAiPanel && (
                    <div className={`w-full mt-2 p-3 rounded-xl border ${theme === 'dark' ? 'bg-gradient-to-r from-pink-900/20 to-purple-900/20 border-pink-500/30' : 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-pink-400" />
                            <span className={`text-xs font-bold ${theme === 'dark' ? 'text-pink-300' : 'text-pink-600'}`}>AI Data Assistant</span>
                            <span className={`text-[10px] ${colors.textMuted}`}>Describe what you want to do with natural language</span>
                            <button onClick={() => { setShowAiPanel(false); setAiResponse(null); setAiPrompt(''); }} className={`ml-auto p-1 rounded hover:${colors.bgTertiary} transition`}>
                                <X className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAiSubmit(); }}
                                placeholder='Try: "multiply Sales by Quantity and name it Revenue" or "uppercase Region column" or "extract year from OrderDate"'
                                className={`flex-1 px-3 py-2 rounded-lg text-xs ${theme === 'dark' ? 'bg-slate-800/80 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'} border focus:outline-none focus:ring-2 focus:ring-pink-500/50`}
                                disabled={aiLoading}
                            />
                            <button
                                onClick={handleAiSubmit}
                                disabled={aiLoading || !aiPrompt.trim()}
                                className={`px-4 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${aiLoading || !aiPrompt.trim() ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg'}`}
                            >
                                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                {aiLoading ? 'Analyzing...' : 'Go'}
                            </button>
                        </div>

                        {/* AI Response */}
                        {aiResponse && (
                            <div className={`mt-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800/60' : 'bg-white'} border ${colors.borderPrimary}`}>
                                <div className={`text-xs ${colors.textSecondary} mb-2`}>{aiResponse.explanation}</div>
                                
                                {aiResponse.operations.length > 0 ? (
                                    <>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {aiResponse.operations.map((op, idx) => (
                                                <span key={idx} className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold ${theme === 'dark' ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30' : 'bg-pink-100 text-pink-700 border border-pink-300'}`}>
                                                    {op.operationType === 'calculated_column' && <Calculator className="w-3 h-3" />}
                                                    {op.operationType === 'conditional_column' && <Wand2 className="w-3 h-3" />}
                                                    {op.operationType === 'filter' && <Search className="w-3 h-3" />}
                                                    {op.operationType === 'sort' && <ArrowDownAZ className="w-3 h-3" />}
                                                    {op.operationType === 'format' && <Type className="w-3 h-3" />}
                                                    {op.operationType === 'find_replace' && <Search className="w-3 h-3" />}
                                                    {op.operationType === 'split' && <Scissors className="w-3 h-3" />}
                                                    {op.operationType === 'duplicate' && <Copy className="w-3 h-3" />}
                                                    {op.operationType === 'datetime_extract' && <Calendar className="w-3 h-3" />}
                                                    {op.operationType === 'trim' && <Type className="w-3 h-3" />}
                                                    {op.operationType === 'rename' && <Pencil className="w-3 h-3" />}
                                                    {op.operationType === 'remove' && <Trash2 className="w-3 h-3" />}
                                                    {op.operationType.replace('_', ' ')}
                                                    {op.calculatedColumn && `: ${op.calculatedColumn.name}`}
                                                    {op.conditionalColumn && `: ${op.conditionalColumn.name}`}
                                                    {op.format && `: ${op.format.column} → ${op.format.formatType}`}
                                                    {op.findReplace && `: ${op.findReplace.column}`}
                                                    {op.sort && `: ${op.sort.column} ${op.sort.direction}`}
                                                    {op.datetimeExtract && `: ${op.datetimeExtract.extract} from ${op.datetimeExtract.column}`}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={executeAllAiOperations}
                                                className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg text-xs font-medium transition shadow-lg flex items-center gap-1.5"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Apply All
                                            </button>
                                            <button
                                                onClick={() => setAiResponse(null)}
                                                className={`px-4 py-1.5 ${colors.textMuted} hover:${colors.bgTertiary} rounded-lg text-xs transition`}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className={`text-xs ${colors.textMuted} italic`}>No operations detected. Try rephrasing your request.</div>
                                )}
                            </div>
                        )}

                        {/* Example prompts */}
                        {!aiResponse && !aiLoading && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className={`text-[10px] ${colors.textMuted}`}>Examples:</span>
                                {[
                                    'multiply Sales by Quantity',
                                    'if Sales > 1000 then "High" else "Low"',
                                    'uppercase Region',
                                    'extract year from OrderDate',
                                    'sort by Sales descending'
                                ].map((ex, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setAiPrompt(ex)}
                                        className={`text-[10px] px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-300' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'} transition`}
                                    >
                                        {ex}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}


                {/* Deleted rows action bar */}
                {deletedRowIndices.size > 0 && (
                    <div className="w-full flex flex-wrap items-center gap-2 mt-1.5 pt-2 border-t border-dashed border-red-500/30">
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                            {deletedRowIndices.size} row{deletedRowIndices.size > 1 ? 's' : ''} marked for deletion
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                            <button
                                onClick={undoAllDeletes}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 border border-slate-500/30 transition active:scale-[0.97]"
                            >
                                <Undo2 className="w-3 h-3" /> Undo All
                            </button>
                            <button
                                onClick={applyDeletes}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-red-600/80 hover:bg-red-500 text-white border border-red-500/50 transition shadow-lg shadow-red-900/20 active:scale-[0.97]"
                            >
                                <Trash2 className="w-3 h-3" /> Apply Delete
                            </button>
                        </div>
                    </div>
                )}
                {/* Restore deleted rows bar - shown after rows have been permanently deleted */}
                {deleteHistory.length > 0 && deletedRowIndices.size === 0 && (
                    <div className="w-full flex flex-wrap items-center gap-2 mt-1.5 pt-2 border-t border-dashed border-amber-500/30">
                        <Undo2 className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                            {deleteHistory.length} delete action{deleteHistory.length > 1 ? 's' : ''} can be undone
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                            <button
                                onClick={restoreLastDelete}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-600/80 hover:bg-amber-500 text-white border border-amber-500/50 transition shadow-lg shadow-amber-900/20 active:scale-[0.97]"
                            >
                                <Undo2 className="w-3 h-3" /> Restore Deleted Rows
                            </button>
                            <button
                                onClick={() => setDeleteHistory([])}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 border border-slate-500/30 transition active:scale-[0.97]"
                            >
                                <X className="w-3 h-3" /> Dismiss
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content area: Data Grid + Action History Sidebar */}
            <div className="flex-1 flex overflow-hidden">
            {/* Editable Data Grid */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'}`}>
                        <tr>
                            <th className={`px-3 py-2.5 text-[10px] font-bold uppercase ${colors.textMuted} border-b ${colors.borderSecondary} w-12 text-center sticky left-0 z-20 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'}`}>
                                #
                            </th>
                            {displayColumns.map((col, idx) => {
                                const isAdded = addedColumns.includes(col);
                                const isMenuOpen = menuColumn === col;
                                const colType = detectColType(col);
                                return (
                                    <th
                                        key={`${col}-${idx}`}
                                        className={`px-3 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide border-b ${colors.borderSecondary} whitespace-nowrap ${isAdded ? 'text-violet-400' : colors.textMuted} relative`}
                                        onDoubleClick={(e) => {
                                            if (editingHeader) return;
                                            setEditingHeader(col);
                                            setHeaderEditValue(col);
                                        }}
                                    >
                                        {editingHeader === col ? (
                                            <input
                                                type="text"
                                                value={headerEditValue}
                                                onChange={(e) => setHeaderEditValue(e.target.value)}
                                                onBlur={() => handleHeaderRename(col, headerEditValue)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleHeaderRename(col, headerEditValue);
                                                    if (e.key === 'Escape') setEditingHeader(null);
                                                }}
                                                autoFocus
                                                className={`w-full px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500 text-indigo-400 outline-none text-[10px] font-bold uppercase`}
                                            />
                                        ) : (
                                            <div
                                                className={`flex items-center gap-1 cursor-pointer select-none rounded-md px-1 py-0.5 -mx-1 transition ${isMenuOpen ? (theme === 'dark' ? 'bg-slate-700/60' : 'bg-indigo-100') : `hover:${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}`}
                                                onClick={(e) => openColumnMenu(col, e)}
                                                title="Double click to rename"
                                            >
                                                {isAdded && <Wand2 className="w-3 h-3 text-violet-400 flex-shrink-0" />}
                                                {activeFilters.some(f => f.column === col) && <span title="Filter active" className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 inline-block" />}
                                                {sortConfig?.col === col && <span className={`text-[9px] font-bold ${sortConfig.dir === 'asc' ? 'text-green-400' : 'text-orange-400'}`}>{sortConfig.dir === 'asc' ? '▲' : '▼'}</span>}
                                                <span className="flex-1">{col}</span>
                                                <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                                            </div>
                                        )}
                                        {/* Column Context Menu */}
                                        {isMenuOpen && (
                                            <div
                                                ref={menuRef}
                                                className={`absolute left-0 top-full mt-1 z-50 w-52 rounded-xl border ${colors.borderPrimary} ${colors.modalBg} shadow-2xl py-1.5 animate-fade-in`}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                {/* Sort */}
                                                <button onClick={() => { setSortConfig({ col, dir: 'asc' }); setMenuColumn(null); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>
                                                    <span className="text-green-400 font-bold text-base leading-none">↑</span> Sort Ascending
                                                </button>
                                                <button onClick={() => { setSortConfig({ col, dir: 'desc' }); setMenuColumn(null); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>
                                                    <span className="text-orange-400 font-bold text-base leading-none">↓</span> Sort Descending
                                                </button>
                                                {sortConfig?.col === col && (
                                                    <button onClick={() => { setSortConfig(null); setMenuColumn(null); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-400 hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>
                                                        <X className="w-3.5 h-3.5" /> Clear Sort
                                                    </button>
                                                )}
                                                {/* Filter */}
                                                <button onClick={() => openFilterModal(col)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>
                                                    <Search className="w-3.5 h-3.5 text-indigo-400" />
                                                    Filter Rows…
                                                    {activeFilters.some(f => f.column === col) && <span className="ml-auto px-1.5 rounded-full text-[9px] bg-blue-500/20 text-blue-400 font-bold">ON</span>}
                                                </button>
                                                {activeFilters.some(f => f.column === col) && (
                                                    <button onClick={() => { clearFilter(col); setMenuColumn(null); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>
                                                        <X className="w-3.5 h-3.5" /> Clear Filter
                                                    </button>
                                                )}
                                                <div className={`my-1 border-t ${colors.borderPrimary}`} />
                                                <button onClick={() => handleColumnAction('find_replace', col)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>
                                                    <Search className="w-3.5 h-3.5 text-blue-400" /> Find &amp; Replace
                                                </button>
                                                <button onClick={() => handleColumnAction('remove', col)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" /> Remove Column
                                                </button>
                                                <div className={`my-1 border-t ${colors.borderPrimary}`} />
                                                <button onClick={() => handleColumnAction('split', col)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>
                                                    <Scissors className="w-3.5 h-3.5 text-amber-400" /> Split Column
                                                </button>
                                                {/* Format sub-menu */}
                                                {colType === 'text' && (
                                                    <div className={`relative`}>
                                                    <div
                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition cursor-pointer ${formatSubMenuOpen ? (theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100') : ''}`}
                                                        onClick={(e) => { e.stopPropagation(); setFormatSubMenuOpen(prev => !prev); }}
                                                    >
                                                        <Type className="w-3.5 h-3.5 text-emerald-400" /> Format
                                                        <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${formatSubMenuOpen ? 'rotate-180' : '-rotate-90'} opacity-50`} />
                                                    </div>
                                                    {formatSubMenuOpen && (
                                                        <div className={`ml-4 border-l-2 ${theme === 'dark' ? 'border-emerald-500/30' : 'border-emerald-300'} animate-fade-in`}>
                                                            <button onClick={() => applyFormat(col, 'upper')} className={`block w-full px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>UPPER CASE</button>
                                                            <button onClick={() => applyFormat(col, 'lower')} className={`block w-full px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>lower case</button>
                                                            <button onClick={() => applyFormat(col, 'title')} className={`block w-full px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>Title Case</button>
                                                            <button onClick={() => applyFormat(col, 'capitalize')} className={`block w-full px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>Capitalize</button>
                                                        </div>
                                                        )}
                                                    </div>
                                                )}
                                                {colType === 'text' && (
                                                    <button onClick={() => handleColumnAction('trim', col)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>
                                                        <ArrowDownAZ className="w-3.5 h-3.5 text-cyan-400" /> Trim Whitespace
                                                    </button>
                                                )}
                                                <div className={`my-1 border-t ${colors.borderPrimary}`} />
                                                <button onClick={() => handleColumnAction('duplicate', col)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>
                                                    <Copy className="w-3.5 h-3.5 text-violet-400" /> Duplicate Column
                                                </button>
                                                {colType === 'date' && (
                                                    <button onClick={() => handleColumnAction('datetime', col)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-700/60' : 'bg-slate-100'} transition text-left`}>
                                                        <Calendar className="w-3.5 h-3.5 text-orange-400" /> Date / Time
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.slice(0, visibleRows).map((row, rIdx) => {
                            const originalIndex = (row as any).__originalIndex as number;
                            const isMarkedForDelete = deletedRowIndices.has(originalIndex);
                            return (
                            <tr
                                key={rIdx}
                                onClick={() => toggleRowDelete(originalIndex)}
                                className={`transition-colors cursor-pointer select-none ${isMarkedForDelete
                                    ? (theme === 'dark' ? 'bg-red-950/40' : 'bg-red-50')
                                    : (rIdx % 2 === 0
                                        ? (theme === 'dark' ? 'bg-slate-950/30' : 'bg-white')
                                        : (theme === 'dark' ? 'bg-slate-900/30' : 'bg-slate-50/80'))
                                    } ${isMarkedForDelete
                                        ? (theme === 'dark' ? 'hover:bg-red-900/40' : 'hover:bg-red-100')
                                        : `hover:${theme === 'dark' ? 'bg-slate-800/50' : 'bg-indigo-50/50'}`
                                    }`}
                            >
                                <td className={`px-3 py-1.5 text-[10px] text-center border-r ${colors.borderPrimary} sticky left-0 z-[5] ${isMarkedForDelete
                                    ? (theme === 'dark' ? 'bg-red-950/90 text-red-400' : 'bg-red-50 text-red-500')
                                    : `${colors.textMuted} ${rIdx % 2 === 0
                                        ? (theme === 'dark' ? 'bg-slate-950/95' : 'bg-white')
                                        : (theme === 'dark' ? 'bg-slate-900/95' : 'bg-slate-50')}`
                                    }`}>
                                    {isMarkedForDelete
                                        ? <Trash2 className="w-3 h-3 mx-auto text-red-400" />
                                        : (rIdx + 1)
                                    }
                                </td>
                                {displayColumns.map((col, cIdx) => {
                                    const isEditing = editingCell?.row === rIdx && editingCell?.col === col;
                                    const cellValue = row[col];
                                    const displayValue = cellValue !== null && cellValue !== undefined
                                        ? smartFormat(cellValue, col, columnMetadata, columnCurrencies)
                                        : '';
                                    const isAdded = addedColumns.includes(col);

                                    return (
                                        <td
                                            key={`${col}-${cIdx}`}
                                            className={`px-3 py-1.5 text-xs sm:text-sm border-r ${colors.borderPrimary} max-w-[200px] ${isMarkedForDelete ? 'opacity-40' : ''} ${isAdded && !isMarkedForDelete ? (theme === 'dark' ? 'bg-violet-500/[0.03]' : 'bg-violet-50/50') : ''}`}
                                            onDoubleClick={(e) => { e.stopPropagation(); startEditing(rIdx, col, cellValue); }}
                                        >
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    onBlur={commitEdit}
                                                    onKeyDown={handleKeyDown}
                                                    onClick={e => e.stopPropagation()}
                                                    autoFocus
                                                    className={`w-full px-1.5 py-0.5 rounded text-xs border-2 border-indigo-500 outline-none ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
                                                />
                                            ) : (
                                                <span className={`truncate block ${isMarkedForDelete ? 'line-through text-red-400/70' : colors.textSecondary} cursor-default`} title={displayValue}>
                                                    {displayValue || <span className={`italic ${colors.textMuted}`}>empty</span>}
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Show more / count */}
                {mergedData.length > visibleRows && (
                    <div className={`p-4 text-center border-t ${colors.borderPrimary}`}>
                        <button
                            onClick={() => setVisibleRows(prev => prev + 200)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
                        >
                            Show more rows ({visibleRows.toLocaleString()} of {mergedData.length.toLocaleString()})
                        </button>
                    </div>
                )}
                {mergedData.length <= visibleRows && mergedData.length > 0 && (
                    <div className={`p-3 text-center text-xs ${colors.textMuted} border-t ${colors.borderPrimary}`}>
                        Showing all {mergedData.length.toLocaleString()} rows
                    </div>
                )}
            </div>

            {/* ─── Right Sidebar (Collapsible): Added Columns + Filters + Action History ── */}
            {(actionHistory.length > 0 || addedColumns.length > 0 || activeFilters.length > 0 || sortConfig) && (
                <aside
                    className={`relative flex-shrink-0 border-l ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/90'} backdrop-blur-sm transition-all duration-300 ease-in-out flex flex-col ${actionSidebarOpen ? 'w-64' : 'w-10'}`}
                >
                    {/* Collapse/Expand Toggle */}
                    <button
                        onClick={() => setActionSidebarOpen(prev => !prev)}
                        className={`absolute -left-3 top-4 z-10 w-6 h-6 rounded-full border ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-100'} shadow-md flex items-center justify-center transition active:scale-90`}
                        title={actionSidebarOpen ? 'Collapse panel' : 'Expand panel'}
                    >
                        {actionSidebarOpen ? <ChevronRight className="w-3.5 h-3.5 text-orange-400" /> : <ChevronLeft className="w-3.5 h-3.5 text-orange-400" />}
                    </button>

                    {/* Collapsed state: just show icons + counts */}
                    {!actionSidebarOpen && (
                        <div className="flex flex-col items-center pt-12 gap-3">
                            {addedColumns.length > 0 && (
                                <div className="flex flex-col items-center gap-1" title={`${addedColumns.length} added column${addedColumns.length > 1 ? 's' : ''}`}>
                                    <Plus className="w-3.5 h-3.5 text-violet-400" />
                                    <span className="text-[8px] text-violet-400 font-bold">{addedColumns.length}</span>
                                </div>
                            )}
                            {(activeFilters.length > 0 || sortConfig) && (
                                <div className="flex flex-col items-center gap-1" title={`${activeFilters.length} filter${activeFilters.length !== 1 ? 's' : ''}${sortConfig ? ' + sort' : ''}`}>
                                    <Search className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-[8px] text-blue-400 font-bold">{activeFilters.length + (sortConfig ? 1 : 0)}</span>
                                </div>
                            )}
                            {actionHistory.length > 0 && (
                                <div className="flex flex-col items-center gap-1" title={`${actionHistory.length} action${actionHistory.length > 1 ? 's' : ''}`}>
                                    <History className="w-3.5 h-3.5 text-orange-400" />
                                    <span className="text-[8px] text-orange-400 font-bold">{actionHistory.length}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Expanded state */}
                    {actionSidebarOpen && (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">

                                {/* ── Added Columns Section ── */}
                                {addedColumns.length > 0 && (
                                    <div className={`p-2.5 border-b ${colors.borderPrimary}`}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Plus className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
                                                Added ({addedColumns.length})
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {addedColumns.map(col => (
                                                <div
                                                    key={col}
                                                    className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${theme === 'dark'
                                                        ? 'bg-violet-500/5 border-violet-500/20 hover:bg-violet-500/10'
                                                        : 'bg-violet-50 border-violet-200 hover:bg-violet-100'
                                                    }`}
                                                >
                                                    <Wand2 className="w-3 h-3 text-violet-400 flex-shrink-0" />
                                                    <span className={`text-[10px] font-semibold truncate flex-1 ${theme === 'dark' ? 'text-violet-300' : 'text-violet-700'}`} title={col}>
                                                        {col}
                                                    </span>
                                                    <button
                                                        onClick={() => removeAddedColumn(col)}
                                                        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded transition ${theme === 'dark' ? 'hover:bg-violet-500/20 text-violet-400' : 'hover:bg-violet-200 text-violet-600'}`}
                                                        title={`Remove "${col}"`}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── Active Filters & Sort Section ── */}
                                {(activeFilters.length > 0 || sortConfig) && (
                                    <div className={`p-2.5 border-b ${colors.borderPrimary}`}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Search className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                                {displayData.length.toLocaleString()} of {mergedData.length.toLocaleString()} rows
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {activeFilters.map(f => (
                                                <div
                                                    key={f.column}
                                                    className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${theme === 'dark'
                                                        ? 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10'
                                                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                                    }`}
                                                >
                                                    <Search className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                                    <span className={`text-[10px] font-semibold truncate flex-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`} title={f.column}>
                                                        {f.column}
                                                    </span>
                                                    <button
                                                        onClick={() => clearFilter(f.column)}
                                                        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded transition ${theme === 'dark' ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-200 text-blue-600'}`}
                                                        title="Remove filter"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {sortConfig && (
                                                <div
                                                    className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${theme === 'dark'
                                                        ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                                                        : 'bg-green-50 border-green-200 hover:bg-green-100'
                                                    }`}
                                                >
                                                    <span className={`text-[10px] font-bold ${sortConfig.dir === 'asc' ? 'text-green-400' : 'text-orange-400'}`}>{sortConfig.dir === 'asc' ? '▲' : '▼'}</span>
                                                    <span className={`text-[10px] font-semibold truncate flex-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`} title={sortConfig.col}>
                                                        {sortConfig.col}
                                                    </span>
                                                    <button
                                                        onClick={() => setSortConfig(null)}
                                                        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded transition ${theme === 'dark' ? 'hover:bg-green-500/20 text-green-400' : 'hover:bg-green-200 text-green-600'}`}
                                                        title="Remove sort"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => { setActiveFilters([]); setSortConfig(null); }}
                                                className={`w-full text-[9px] font-semibold py-1 rounded transition ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
                                            >
                                                Clear All Filters
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── Action History Section ── */}
                                {actionHistory.length > 0 && (
                                    <div className="p-2.5">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <History className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                                            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider flex-1">
                                                {actionHistory.length} Action{actionHistory.length > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {actionHistory.map((action, idx) => (
                                                <div
                                                    key={action.id}
                                                    className={`group flex items-start gap-2 p-2 rounded-lg border transition-all ${theme === 'dark'
                                                        ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/30'
                                                        : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                                                    }`}
                                                >
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {action.icon === 'find_replace' && <Search className="w-3 h-3 text-orange-400" />}
                                                        {action.icon === 'remove' && <Trash2 className="w-3 h-3 text-orange-400" />}
                                                        {action.icon === 'format' && <Type className="w-3 h-3 text-orange-400" />}
                                                        {action.icon === 'trim' && <Scissors className="w-3 h-3 text-orange-400" />}
                                                        {action.icon === 'pencil' && <Pencil className="w-3 h-3 text-orange-400" />}
                                                        {action.icon === 'ai' && <Sparkles className="w-3 h-3 text-pink-400" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className={`text-[10px] font-semibold leading-tight block truncate ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`} title={action.label}>
                                                            {action.label}
                                                        </span>
                                                        <span className={`text-[9px] ${colors.textMuted}`}>Step {idx + 1}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => undoAction(action.id)}
                                                        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded transition ${theme === 'dark' ? 'hover:bg-orange-500/20 text-orange-400' : 'hover:bg-orange-200 text-orange-600'}`}
                                                        title={`Undo this and all later actions`}
                                                    >
                                                        <Undo2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions - only show if there are actions to undo */}
                            {actionHistory.length > 0 && (
                                <div className={`p-2 border-t ${colors.borderPrimary} space-y-1.5`}>
                                    <button
                                        onClick={undoLastAction}
                                        className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-orange-600/80 hover:bg-orange-500 text-white border border-orange-500/50 transition shadow-lg shadow-orange-900/20 active:scale-[0.97]"
                                    >
                                        <Undo2 className="w-3 h-3" /> Undo Last
                                    </button>
                                    <button
                                        onClick={clearActionHistory}
                                        className={`w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition active:scale-[0.97] ${theme === 'dark' ? 'bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 border border-slate-500/30' : 'bg-slate-200 hover:bg-slate-300 text-slate-600 border border-slate-300'}`}
                                    >
                                        <X className="w-3 h-3" /> Dismiss All
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </aside>
            )}
            </div>{/* End Content area flex wrapper */}

            {/* ─── Conditional Column Modal ─────────────────────────────────────── */}
            {showConditionalModal && (
                <div className={`fixed inset-0 z-[120] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in`}>
                    <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col`}>
                        {/* Header */}
                        <div className={`p-4 sm:p-6 border-b ${colors.borderPrimary}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className={`text-lg sm:text-xl font-bold ${colors.textPrimary} flex items-center gap-2`}>
                                        <Wand2 className="w-5 h-5 text-violet-400" />
                                        Add Conditional Column
                                    </h3>
                                    <p className={`text-sm ${colors.textMuted} mt-1`}>
                                        Add a conditional column that is computed from the other columns or values.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowConditionalModal(false)}
                                    className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {/* Column Name */}
                            <div className="mt-4">
                                <label className={`block text-xs font-semibold ${colors.textMuted} mb-1.5`}>New column name</label>
                                <input
                                    type="text"
                                    value={condColName}
                                    onChange={e => setCondColName(e.target.value)}
                                    placeholder="e.g. Sales Bucket"
                                    className={`w-full max-w-sm px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition`}
                                />
                            </div>
                        </div>

                        {/* Clauses */}
                        <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-3">
                            {/* Column header labels */}
                            <div className="hidden md:grid md:grid-cols-[60px_1fr_1fr_80px_1fr_50px_80px_1fr_40px] gap-2 items-center px-1">
                                <span className={`text-[10px] font-bold ${colors.textMuted} uppercase`}></span>
                                <span className={`text-[10px] font-bold ${colors.textMuted} uppercase`}>Column Name</span>
                                <span className={`text-[10px] font-bold ${colors.textMuted} uppercase`}>Operator</span>
                                <span className={`text-[10px] font-bold ${colors.textMuted} uppercase`}>Value <span className={`text-[8px] normal-case ${colors.textMuted}`}>ⓘ</span></span>
                                <span></span>
                                <span className={`text-[10px] font-bold ${colors.textMuted} uppercase`}>Then</span>
                                <span className={`text-[10px] font-bold ${colors.textMuted} uppercase`}>Output <span className={`text-[8px] normal-case ${colors.textMuted}`}>ⓘ</span></span>
                                <span></span>
                                <span></span>
                            </div>

                            {condClauses.map((clause, idx) => (
                                <div
                                    key={clause.id}
                                    className={`p-3 sm:p-4 rounded-xl border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'} animate-fade-in-up`}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-[60px_1fr_1fr_80px_1fr_50px_80px_1fr_40px] gap-2 items-center">
                                        {/* Label */}
                                        <span className={`text-xs font-bold ${idx === 0 ? 'text-indigo-400' : 'text-amber-400'}`}>
                                            {idx === 0 ? 'If' : 'Else If'}
                                        </span>

                                        {/* Column */}
                                        <div className="relative">
                                            <select
                                                value={clause.column}
                                                onChange={e => updateClause(clause.id, 'column', e.target.value)}
                                                className={`w-full appearance-none border ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} ${colors.textPrimary} rounded-lg px-2.5 py-2 pr-7 text-xs outline-none focus:border-indigo-500 transition cursor-pointer`}
                                            >
                                                {displayColumns.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                                        </div>

                                        {/* Operator */}
                                        <div className="relative">
                                            <select
                                                value={clause.operator}
                                                onChange={e => updateClause(clause.id, 'operator', e.target.value)}
                                                className={`w-full appearance-none border ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} ${colors.textPrimary} rounded-lg px-2.5 py-2 pr-7 text-xs outline-none focus:border-indigo-500 transition cursor-pointer`}
                                            >
                                                {Object.entries(OPERATOR_LABELS).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                                        </div>

                                        {/* Value Type Toggle */}
                                        <button
                                            onClick={() => updateClause(clause.id, 'valueType', clause.valueType === 'text' ? 'number' : 'text')}
                                            className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition ${clause.valueType === 'number'
                                                ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                                                : 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10'
                                                }`}
                                            title={`Switch to ${clause.valueType === 'text' ? 'number' : 'text'} mode`}
                                        >
                                            {clause.valueType === 'number' ? '123' : 'ABC'}
                                        </button>

                                        {/* Value */}
                                        <input
                                            type={clause.valueType === 'number' ? 'number' : 'text'}
                                            value={clause.value}
                                            onChange={e => updateClause(clause.id, 'value', e.target.value)}
                                            placeholder={clause.valueType === 'number' ? '0' : 'Value'}
                                            className={`w-full border ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} ${colors.textPrimary} rounded-lg px-2.5 py-2 text-xs outline-none focus:border-indigo-500 transition`}
                                        />

                                        {/* Then label */}
                                        <span className={`text-xs font-semibold ${colors.textMuted} text-center`}>Then</span>

                                        {/* Output Type Toggle */}
                                        <button
                                            onClick={() => updateClause(clause.id, 'outputType', clause.outputType === 'text' ? 'number' : 'text')}
                                            className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition ${clause.outputType === 'number'
                                                ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                                                : 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10'
                                                }`}
                                            title={`Switch to ${clause.outputType === 'text' ? 'number' : 'text'} mode`}
                                        >
                                            {clause.outputType === 'number' ? '123' : 'ABC'}
                                        </button>

                                        {/* Output */}
                                        <input
                                            type={clause.outputType === 'number' ? 'number' : 'text'}
                                            value={clause.output}
                                            onChange={e => updateClause(clause.id, 'output', e.target.value)}
                                            placeholder={clause.outputType === 'number' ? '0' : 'Output'}
                                            className={`w-full border ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} text-emerald-400 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-emerald-500 transition font-semibold`}
                                        />

                                        {/* Delete */}
                                        <button
                                            onClick={() => removeClause(clause.id)}
                                            disabled={condClauses.length <= 1}
                                            className={`p-1.5 rounded-lg transition ${condClauses.length <= 1 ? 'opacity-30 cursor-not-allowed' : `${colors.textMuted} hover:text-red-400 hover:bg-red-500/10`}`}
                                            title="Remove clause"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add Clause */}
                            <button
                                onClick={addClause}
                                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition ${theme === 'dark'
                                    ? 'text-indigo-400 hover:bg-indigo-500/10 border border-dashed border-indigo-500/30'
                                    : 'text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-300'
                                    }`}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Clause
                            </button>

                            {/* Else */}
                            <div className={`p-3 sm:p-4 rounded-xl border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800/20' : 'bg-slate-50/80'}`}>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                    <span className={`text-xs font-bold text-rose-400 w-[60px]`}>Else <span className={`text-[8px] normal-case ${colors.textMuted}`}>ⓘ</span></span>
                                    <button
                                        onClick={() => setCondElseType(prev => prev === 'text' ? 'number' : 'text')}
                                        className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition ${condElseType === 'number'
                                            ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                                            : 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10'
                                            }`}
                                    >
                                        {condElseType === 'number' ? '123' : 'ABC'}
                                    </button>
                                    <input
                                        type={condElseType === 'number' ? 'number' : 'text'}
                                        value={condElseOutput}
                                        onChange={e => setCondElseOutput(e.target.value)}
                                        placeholder="Default output"
                                        className={`w-full max-w-xs border ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} ${colors.textPrimary} rounded-lg px-2.5 py-2 text-xs outline-none focus:border-indigo-500 transition`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`flex items-center justify-end gap-3 p-4 sm:p-6 border-t ${colors.borderPrimary}`}>
                            <button
                                onClick={() => setShowConditionalModal(false)}
                                className={`px-4 py-2 rounded-lg ${colors.textMuted} hover:${colors.bgTertiary} transition text-sm`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyConditionalColumn}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Calculated Column Modal ─────────────────────────────────────────── */}
            {showCustomModal && (
                <div className={`fixed inset-0 z-[120] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in`}>
                    <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col`}>
                        {/* Header */}
                        <div className={`p-4 sm:p-6 border-b ${colors.borderPrimary}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className={`text-lg sm:text-xl font-bold ${colors.textPrimary} flex items-center gap-2`}>
                                        <Calculator className="w-5 h-5 text-emerald-400" />
                                        Add Calculated Column
                                    </h3>
                                    <p className={`text-sm ${colors.textMuted} mt-1`}>
                                        Create a new column from arithmetic operations on two existing columns.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCustomModal(false)}
                                    className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-5">
                            {/* Column Name */}
                            <div>
                                <label className={`block text-xs font-semibold ${colors.textMuted} mb-1.5`}>New column name</label>
                                <input
                                    type="text"
                                    value={customCol.name}
                                    onChange={e => setCustomCol(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Profit"
                                    className={`w-full px-3 py-2.5 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition`}
                                />
                            </div>

                            {/* Expression Builder */}
                            <div className={`p-4 rounded-xl border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                                <label className={`block text-xs font-semibold ${colors.textMuted} mb-3`}>Formula</label>
                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                                    {/* Column A */}
                                    <div className="relative">
                                        <label className={`block text-[10px] uppercase font-bold ${colors.textMuted} mb-1`}>Column A</label>
                                        <select
                                            value={customCol.columnA}
                                            onChange={e => setCustomCol(prev => ({ ...prev, columnA: e.target.value }))}
                                            className={`w-full appearance-none border ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} ${colors.textPrimary} rounded-lg px-3 py-2.5 pr-8 text-sm outline-none focus:border-indigo-500 transition cursor-pointer`}
                                        >
                                            {displayColumns.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 bottom-3 w-3.5 h-3.5 pointer-events-none opacity-50" />
                                    </div>

                                    {/* Operation */}
                                    <div className="flex justify-center flex-col items-center">
                                        <label className={`block text-[10px] uppercase font-bold ${colors.textMuted} mb-1 text-center`}>Operation</label>
                                        <div className="flex flex-wrap justify-center gap-1.5 max-w-[170px] sm:max-w-none">
                                            {(['add', 'subtract', 'multiply', 'divide', 'concat'] as const).map(op => (
                                                <button
                                                    key={op}
                                                    onClick={() => setCustomCol(prev => ({ ...prev, operation: op }))}
                                                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm sm:text-base font-bold transition flex items-center justify-center ${customCol.operation === op
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                        : `${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-100'} border ${colors.borderPrimary}`
                                                        }`}
                                                    title={OPERATION_LABELS[op]}
                                                >
                                                    {OPERATION_SYMBOLS[op]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Column B / Manual Value */}
                                    {['add', 'subtract', 'multiply', 'divide', 'concat'].includes(customCol.operation) ? (
                                        <div>
                                            {/* Toggle: Column vs Manual — only for arithmetic ops */}
                                            {['add', 'subtract', 'multiply', 'divide'].includes(customCol.operation) && (
                                                <div className="flex items-center gap-1 mb-1.5">
                                                    <button
                                                        onClick={() => setCustomCol(prev => ({ ...prev, columnBMode: 'column' }))}
                                                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition ${customCol.columnBMode === 'column'
                                                            ? 'bg-indigo-600 text-white shadow-md'
                                                            : `${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-100'} border ${colors.borderPrimary}`
                                                        }`}
                                                    >
                                                        Column
                                                    </button>
                                                    <button
                                                        onClick={() => setCustomCol(prev => ({ ...prev, columnBMode: 'manual' }))}
                                                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition ${customCol.columnBMode === 'manual'
                                                            ? 'bg-amber-600 text-white shadow-md'
                                                            : `${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-100'} border ${colors.borderPrimary}`
                                                        }`}
                                                    >
                                                        Manual
                                                    </button>
                                                </div>
                                            )}

                                            {/* Column B dropdown (default, or when concat) */}
                                            {(customCol.columnBMode === 'column' || customCol.operation === 'concat') ? (
                                                <div className="relative">
                                                    <label className={`block text-[10px] uppercase font-bold ${colors.textMuted} mb-1`}>Column B</label>
                                                    <select
                                                        value={customCol.columnB}
                                                        onChange={e => setCustomCol(prev => ({ ...prev, columnB: e.target.value }))}
                                                        className={`w-full appearance-none border ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} ${colors.textPrimary} rounded-lg px-3 py-2.5 pr-8 text-sm outline-none focus:border-indigo-500 transition cursor-pointer`}
                                                    >
                                                        {displayColumns.map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2.5 bottom-3 w-3.5 h-3.5 pointer-events-none opacity-50" />
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className={`block text-[10px] uppercase font-bold ${colors.textMuted} mb-1`}>Value</label>
                                                    <input
                                                        type="number"
                                                        value={customCol.manualValue}
                                                        onChange={e => setCustomCol(prev => ({ ...prev, manualValue: e.target.value }))}
                                                        placeholder="Enter a number"
                                                        className={`w-full border ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} ${colors.textPrimary} rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col justify-center h-full pt-4">
                                            <span className={`text-[11px] text-center ${colors.textMuted} italic opacity-60`}>Not needed for this operation</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Add Column C Toggle */}
                            {['add', 'subtract', 'multiply', 'divide'].includes(customCol.operation) && (
                                <div className={`p-4 rounded-xl border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className={`text-xs font-semibold ${colors.textMuted}`}>Add Column C (Optional)</label>
                                        <button
                                            onClick={() => setCustomCol(prev => ({ ...prev, enableColumnC: !prev.enableColumnC }))}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                                                customCol.enableColumnC
                                                    ? 'bg-indigo-600'
                                                    : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                                    customCol.enableColumnC ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {customCol.enableColumnC && (
                                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center animate-fade-in">
                                            {/* Operation C */}
                                            <div className="flex justify-center flex-col items-center">
                                                <label className={`block text-[10px] uppercase font-bold ${colors.textMuted} mb-1 text-center`}>Operation</label>
                                                <div className="flex flex-wrap justify-center gap-1.5">
                                                    {(['add', 'subtract', 'multiply', 'divide'] as const).map(op => (
                                                        <button
                                                            key={op}
                                                            onClick={() => setCustomCol(prev => ({ ...prev, operationC: op }))}
                                                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm sm:text-base font-bold transition flex items-center justify-center ${customCol.operationC === op
                                                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                                                                : `${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-100'} border ${colors.borderPrimary}`
                                                            }`}
                                                            title={OPERATION_LABELS[op]}
                                                        >
                                                            {OPERATION_SYMBOLS[op]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Column C / Manual Value */}
                                            <div className="sm:col-span-2">
                                                {/* Toggle: Column vs Manual */}
                                                <div className="flex items-center gap-1 mb-1.5">
                                                    <button
                                                        onClick={() => setCustomCol(prev => ({ ...prev, columnCMode: 'column' }))}
                                                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition ${customCol.columnCMode === 'column'
                                                            ? 'bg-indigo-600 text-white shadow-md'
                                                            : `${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-100'} border ${colors.borderPrimary}`
                                                        }`}
                                                    >
                                                        Column
                                                    </button>
                                                    <button
                                                        onClick={() => setCustomCol(prev => ({ ...prev, columnCMode: 'manual' }))}
                                                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition ${customCol.columnCMode === 'manual'
                                                            ? 'bg-amber-600 text-white shadow-md'
                                                            : `${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-100'} border ${colors.borderPrimary}`
                                                        }`}
                                                    >
                                                        Manual
                                                    </button>
                                                </div>

                                                {/* Column C dropdown or manual input */}
                                                {customCol.columnCMode === 'column' ? (
                                                    <div className="relative">
                                                        <label className={`block text-[10px] uppercase font-bold ${colors.textMuted} mb-1`}>Column C</label>
                                                        <select
                                                            value={customCol.columnC}
                                                            onChange={e => setCustomCol(prev => ({ ...prev, columnC: e.target.value }))}
                                                            className={`w-full appearance-none border ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} ${colors.textPrimary} rounded-lg px-3 py-2.5 pr-8 text-sm outline-none focus:border-indigo-500 transition cursor-pointer`}
                                                        >
                                                            {displayColumns.map(c => (
                                                                <option key={c} value={c}>{c}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-2.5 bottom-3 w-3.5 h-3.5 pointer-events-none opacity-50" />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className={`block text-[10px] uppercase font-bold ${colors.textMuted} mb-1`}>Value</label>
                                                        <input
                                                            type="number"
                                                            value={customCol.manualValueC}
                                                            onChange={e => setCustomCol(prev => ({ ...prev, manualValueC: e.target.value }))}
                                                            placeholder="Enter a number"
                                                            className={`w-full border ${colors.borderPrimary} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} ${colors.textPrimary} rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition`}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Preview */}
                            <div>
                                <h4 className={`text-xs font-bold ${colors.textMuted} uppercase tracking-wider mb-2 flex items-center gap-1.5`}>
                                    <Eye className="w-3.5 h-3.5" />
                                    Preview (first 5 rows)
                                </h4>
                                <div className={`rounded-xl border ${colors.borderSecondary} overflow-hidden`}>
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className={`${theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
                                                <th className={`px-3 py-2 font-bold ${colors.textMuted} border-r ${colors.borderPrimary} w-[20%]`}>{customCol.columnA || 'Column A'}</th>
                                                <th className={`px-3 py-2 font-bold text-center ${colors.textMuted} border-r ${colors.borderPrimary} w-10`}>{OPERATION_SYMBOLS[customCol.operation]}</th>
                                                {['add', 'subtract', 'multiply', 'divide', 'concat'].includes(customCol.operation) && (
                                                    <th className={`px-3 py-2 font-bold ${colors.textMuted} border-r ${colors.borderPrimary} w-[20%]`}>
                                                        {customCol.columnBMode === 'manual' && customCol.operation !== 'concat'
                                                            ? (customCol.manualValue || 'Value')
                                                            : (customCol.columnB || 'Column B')}
                                                    </th>
                                                )}
                                                {customCol.enableColumnC && (
                                                    <>
                                                        <th className={`px-3 py-2 font-bold text-center ${colors.textMuted} border-r ${colors.borderPrimary} w-10`}>{OPERATION_SYMBOLS[customCol.operationC || 'add']}</th>
                                                        <th className={`px-3 py-2 font-bold ${colors.textMuted} border-r ${colors.borderPrimary} w-[20%]`}>
                                                            {customCol.columnCMode === 'manual'
                                                                ? (customCol.manualValueC || 'Value')
                                                                : (customCol.columnC || 'Column C')}
                                                        </th>
                                                    </>
                                                )}
                                                <th className={`px-3 py-2 font-bold text-center ${colors.textMuted} border-r ${colors.borderPrimary} w-8`}>=</th>
                                                <th className={`px-3 py-2 font-bold text-emerald-400`}>{customCol.name || 'Result'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customPreview.map((row, i) => (
                                                <tr key={i} className={`border-t ${colors.borderPrimary}`}>
                                                    <td className={`px-3 py-1.5 ${colors.textSecondary} border-r ${colors.borderPrimary} truncate max-w-[100px]`}>
                                                        {typeof row.a === 'object' ? JSON.stringify(row.a) : String(row.a ?? '')}
                                                    </td>
                                                    <td className={`px-3 py-1.5 text-center ${colors.textMuted} border-r ${colors.borderPrimary}`}>{OPERATION_SYMBOLS[customCol.operation]}</td>
                                                    {['add', 'subtract', 'multiply', 'divide', 'concat'].includes(customCol.operation) && (
                                                        <td className={`px-3 py-1.5 ${colors.textSecondary} border-r ${colors.borderPrimary} truncate max-w-[100px]`}>
                                                            {typeof row.b === 'object' ? JSON.stringify(row.b) : String(row.b ?? '')}
                                                        </td>
                                                    )}
                                                    {customCol.enableColumnC && (
                                                        <>
                                                            <td className={`px-3 py-1.5 text-center ${colors.textMuted} border-r ${colors.borderPrimary}`}>{OPERATION_SYMBOLS[customCol.operationC || 'add']}</td>
                                                            <td className={`px-3 py-1.5 ${colors.textSecondary} border-r ${colors.borderPrimary} truncate max-w-[100px]`}>
                                                                {row.c !== null ? (typeof row.c === 'object' ? JSON.stringify(row.c) : String(row.c ?? '')) : ''}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className={`px-3 py-1.5 text-center ${colors.textMuted} border-r ${colors.borderPrimary}`}>=</td>
                                                    <td className="px-3 py-1.5 font-semibold text-emerald-400 truncate max-w-[120px]">
                                                        {typeof row.result === 'number' ? (Number.isInteger(row.result) ? row.result : row.result.toFixed(2)) : String(row.result ?? '')}
                                                    </td>
                                                </tr>
                                            ))}
                                            {customPreview.length === 0 && (
                                                <tr>
                                                    <td colSpan={customCol.enableColumnC ? 7 : (['add', 'subtract', 'multiply', 'divide', 'concat'].includes(customCol.operation) ? 5 : 4)} className={`px-3 py-4 text-center ${colors.textMuted} italic`}>Select columns to preview</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`flex items-center justify-end gap-3 p-4 sm:p-6 border-t ${colors.borderPrimary}`}>
                            <button
                                onClick={() => setShowCustomModal(false)}
                                className={`px-4 py-2 rounded-lg ${colors.textMuted} hover:${colors.bgTertiary} transition text-sm`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyCustomColumn}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Find & Replace Modal ──────────────────────────────────────── */}
            {showFindReplace && (
                <div className={`fixed inset-0 z-[120] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in`}>
                    <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl w-full max-w-md shadow-2xl flex flex-col`}>
                        <div className={`p-4 sm:p-5 border-b ${colors.borderPrimary}`}>
                            <div className="flex items-start justify-between gap-3">
                                <h3 className={`text-base sm:text-lg font-bold ${colors.textPrimary} flex items-center gap-2`}>
                                    <Search className="w-5 h-5 text-blue-400" />
                                    Find & Replace
                                </h3>
                                <button onClick={() => setShowFindReplace(false)} className={`p-1.5 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} transition`}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className={`text-xs ${colors.textMuted} mt-1`}>Column: <span className={`font-semibold ${colors.textPrimary}`}>{frColumn}</span></p>
                        </div>
                        <div className="p-4 sm:p-5 space-y-3">
                            <div>
                                <label className={`block text-xs font-semibold ${colors.textMuted} mb-1`}>Find</label>
                                <input type="text" value={frFind} onChange={e => setFrFind(e.target.value)} placeholder="Text to find..." className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`} autoFocus />
                            </div>
                            <div>
                                <label className={`block text-xs font-semibold ${colors.textMuted} mb-1`}>Replace with</label>
                                <input type="text" value={frReplace} onChange={e => setFrReplace(e.target.value)} placeholder="Replacement text..." className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`} />
                            </div>
                        </div>
                        <div className={`flex items-center justify-end gap-3 p-4 sm:p-5 border-t ${colors.borderPrimary}`}>
                            <button onClick={() => setShowFindReplace(false)} className={`px-4 py-2 rounded-lg ${colors.textMuted} hover:${colors.bgTertiary} transition text-sm`}>Cancel</button>
                            <button onClick={applyFindReplace} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition shadow-lg">Replace All</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Split Column Modal ────────────────────────────────────────── */}
            {showSplitModal && (
                <div className={`fixed inset-0 z-[120] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in`}>
                    <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl w-full max-w-md shadow-2xl flex flex-col`}>
                        <div className={`p-4 sm:p-5 border-b ${colors.borderPrimary}`}>
                            <div className="flex items-start justify-between gap-3">
                                <h3 className={`text-base sm:text-lg font-bold ${colors.textPrimary} flex items-center gap-2`}>
                                    <Scissors className="w-5 h-5 text-amber-400" />
                                    Split Column by Delimiter
                                </h3>
                                <button onClick={() => setShowSplitModal(false)} className={`p-1.5 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} transition`}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className={`text-xs ${colors.textMuted} mt-1`}>Column: <span className={`font-semibold ${colors.textPrimary}`}>{splitColumn}</span></p>
                        </div>
                        <div className="p-4 sm:p-5 space-y-3">
                            <div>
                                <label className={`block text-xs font-semibold ${colors.textMuted} mb-1`}>Delimiter</label>
                                <input type="text" value={splitDelimiter} onChange={e => setSplitDelimiter(e.target.value)} placeholder="e.g. , or - or |" className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`} autoFocus />
                            </div>
                            <p className={`text-[11px] ${colors.textMuted}`}>Each part will become a new column named <span className="font-semibold">{splitColumn}.1</span>, <span className="font-semibold">{splitColumn}.2</span>, etc.</p>
                        </div>
                        <div className={`flex items-center justify-end gap-3 p-4 sm:p-5 border-t ${colors.borderPrimary}`}>
                            <button onClick={() => setShowSplitModal(false)} className={`px-4 py-2 rounded-lg ${colors.textMuted} hover:${colors.bgTertiary} transition text-sm`}>Cancel</button>
                            <button onClick={applySplit} className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition shadow-lg">Split</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Date/Time Extract Modal ────────────────────────────────────── */}
            {showDateModal && (
                <div className={`fixed inset-0 z-[120] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in`}>
                    <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl w-full max-w-md shadow-2xl flex flex-col`}>
                        <div className={`p-4 sm:p-5 border-b ${colors.borderPrimary}`}>
                            <div className="flex items-start justify-between gap-3">
                                <h3 className={`text-base sm:text-lg font-bold ${colors.textPrimary} flex items-center gap-2`}>
                                    <Calendar className="w-5 h-5 text-orange-400" />
                                    Extract Date / Time Part
                                </h3>
                                <button onClick={() => setShowDateModal(false)} className={`p-1.5 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} transition`}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className={`text-xs ${colors.textMuted} mt-1`}>Column: <span className={`font-semibold ${colors.textPrimary}`}>{dtColumn}</span></p>
                        </div>
                        <div className="p-4 sm:p-5">
                            <label className={`block text-xs font-semibold ${colors.textMuted} mb-2`}>Extract</label>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { value: 'year', label: 'Year', desc: '2023' },
                                    { value: 'quarter', label: 'Quarter', desc: 'Q1' },
                                    { value: 'month', label: 'Month (Number)', desc: '3' },
                                    { value: 'month_name', label: 'Month Name', desc: 'March' },
                                    { value: 'day', label: 'Day', desc: '15' },
                                    { value: 'day_name', label: 'Day Name', desc: 'Wednesday' },
                                    { value: 'hour', label: 'Hour', desc: '14' },
                                ] as const).map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setDtExtract(opt.value)}
                                        className={`px-3 py-2.5 rounded-xl border text-left transition ${dtExtract === opt.value
                                            ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-500/10'
                                            : `${colors.borderPrimary} ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`
                                        }`}
                                    >
                                        <div className="text-xs font-semibold">{opt.label}</div>
                                        <div className={`text-[10px] mt-0.5 ${dtExtract === opt.value ? 'text-orange-400/70' : colors.textMuted}`}>e.g. {opt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={`flex items-center justify-end gap-3 p-4 sm:p-5 border-t ${colors.borderPrimary}`}>
                            <button onClick={() => setShowDateModal(false)} className={`px-4 py-2 rounded-lg ${colors.textMuted} hover:${colors.bgTertiary} transition text-sm`}>Cancel</button>
                            <button onClick={applyDateExtract} className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition shadow-lg">Extract</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Filter Modal ─────────────────────────────────────────────────── */}
            {showFilterModal && (
                <div className={`fixed inset-0 z-[120] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in`}>
                    <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]`}>
                        {/* Header */}
                        <div className={`p-4 sm:p-5 border-b ${colors.borderPrimary}`}>
                            <div className="flex items-start justify-between gap-3">
                                <h3 className={`text-base sm:text-lg font-bold ${colors.textPrimary} flex items-center gap-2`}>
                                    <Search className="w-5 h-5 text-indigo-400" />
                                    Filter: {filterColumn}
                                </h3>
                                <button onClick={() => setShowFilterModal(false)} className={`p-1.5 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} transition`}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <span className="px-3 py-1 rounded-lg text-xs font-semibold transition border bg-indigo-600 border-indigo-500 text-white">
                                    {filterType === 'text' ? 'Text / List' : filterType === 'number' ? '123 Number' : '📅 Date'}
                                </span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-auto">

                            {/* ── NUMBER FILTERS ── */}
                            {filterType === 'number' && (
                                <div className="p-4 space-y-3">
                                    <label className={`block text-xs font-bold ${colors.textMuted} uppercase mb-1`}>Number Filters</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {([
                                            { op: 'equals', label: 'Equals…' },
                                            { op: 'not_equals', label: 'Does Not Equal…' },
                                            { op: 'greater_than', label: 'Greater Than…' },
                                            { op: 'greater_than_or_equal', label: 'Greater Than Or Equal To…' },
                                            { op: 'less_than', label: 'Less Than…' },
                                            { op: 'less_than_or_equal', label: 'Less Than Or Equal To…' },
                                            { op: 'between', label: 'Between…' },
                                        ] as const).map(item => (
                                            <button key={item.op} onClick={() => setNumberFilterOp(item.op)}
                                                className={`px-3 py-2 rounded-lg border text-xs text-left transition ${
                                                    numberFilterOp === item.op
                                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                                        : `${colors.borderPrimary} ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`
                                                }`}>
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-2 mt-3">
                                        <input type="number" placeholder={numberFilterOp === 'between' ? 'Minimum value' : 'Value'}
                                            value={numberFilterVal} onChange={e => setNumberFilterVal(e.target.value)}
                                            className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`} />
                                        {numberFilterOp === 'between' && (
                                            <input type="number" placeholder="Maximum value"
                                                value={numberFilterVal2} onChange={e => setNumberFilterVal2(e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`} />
                                        )}
                                    </div>
                                    <label className={`flex items-center gap-2 text-xs ${colors.textMuted} cursor-pointer mt-2`}>
                                        <input type="checkbox" checked={filterRemoveEmpty} onChange={e => setFilterRemoveEmpty(e.target.checked)} className="rounded" />
                                        Remove Empty Rows
                                    </label>
                                </div>
                            )}

                            {/* ── DATE FILTERS ── */}
                            {filterType === 'date' && (
                                <div className="p-4 space-y-3">
                                    <label className={`block text-xs font-bold ${colors.textMuted} uppercase mb-1`}>Date Filters</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {([
                                            { op: 'equals', label: 'Equals…' },
                                            { op: 'before', label: 'Before…' },
                                            { op: 'after', label: 'After…' },
                                            { op: 'between', label: 'Between…' },
                                            { op: 'is_earliest', label: 'Is Earliest' },
                                            { op: 'is_latest', label: 'Is Latest' },
                                            { op: 'year', label: 'Year ▶' },
                                            { op: 'quarter', label: 'Quarter ▶' },
                                            { op: 'month', label: 'Month ▶' },
                                            { op: 'week', label: 'Week ▶' },
                                            { op: 'day', label: 'Day ▶' },
                                        ] as const).map(item => (
                                            <button key={item.op} onClick={() => { setDateFilterOp(item.op); setDateFilterVal(''); setDateFilterVal2(''); }}
                                                className={`px-3 py-2 rounded-lg border text-xs text-left transition ${
                                                    dateFilterOp === item.op
                                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                                        : `${colors.borderPrimary} ${colors.textSecondary} hover:${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`
                                                }`}>
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-2 mt-3">
                                        {['equals', 'before', 'after'].includes(dateFilterOp) && (
                                            <input type="date" value={dateFilterVal} onChange={e => setDateFilterVal(e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`} />
                                        )}
                                        {dateFilterOp === 'between' && (<>
                                            <input type="date" placeholder="Start date" value={dateFilterVal} onChange={e => setDateFilterVal(e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`} />
                                            <input type="date" placeholder="End date" value={dateFilterVal2} onChange={e => setDateFilterVal2(e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`} />
                                        </>)}
                                        {dateFilterOp === 'year' && (
                                            <input type="number" placeholder="e.g. 2023" min={1900} max={2100} value={dateFilterVal} onChange={e => setDateFilterVal(e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`} />
                                        )}
                                        {dateFilterOp === 'quarter' && (
                                            <select value={dateFilterVal} onChange={e => setDateFilterVal(e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`}>
                                                <option value="">Select Quarter</option>
                                                {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
                                            </select>
                                        )}
                                        {dateFilterOp === 'month' && (
                                            <select value={dateFilterVal} onChange={e => setDateFilterVal(e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`}>
                                                <option value="">Select Month</option>
                                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                                            </select>
                                        )}
                                        {dateFilterOp === 'week' && (
                                            <input type="number" placeholder="Week number (1-53)" min={1} max={53} value={dateFilterVal} onChange={e => setDateFilterVal(e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`} />
                                        )}
                                        {dateFilterOp === 'day' && (
                                            <input type="number" placeholder="Day of month (1-31)" min={1} max={31} value={dateFilterVal} onChange={e => setDateFilterVal(e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`} />
                                        )}
                                    </div>
                                    <label className={`flex items-center gap-2 text-xs ${colors.textMuted} cursor-pointer`}>
                                        <input type="checkbox" checked={filterRemoveEmpty} onChange={e => setFilterRemoveEmpty(e.target.checked)} className="rounded" />
                                        Remove Empty Rows
                                    </label>
                                </div>
                            )}

                            {/* ── TEXT / VALUE LIST ── */}
                            {filterType === 'text' && (
                                <div className="p-4 space-y-3">
                                    <label className={`flex items-center gap-2 text-xs ${colors.textMuted} cursor-pointer`}>
                                        <input type="checkbox" checked={filterRemoveEmpty} onChange={e => setFilterRemoveEmpty(e.target.checked)} className="rounded" />
                                        Remove Empty Rows
                                    </label>
                                    <input
                                        type="text" placeholder="Search values…"
                                        value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} text-sm outline-none focus:border-indigo-500 transition`}
                                    />
                                    <div className={`rounded-xl border ${colors.borderSecondary} overflow-hidden`}>
                                        {/* Select All */}
                                        <div className={`flex items-center gap-2 px-3 py-2 ${theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-100'} border-b ${colors.borderPrimary}`}>
                                            <input
                                                type="checkbox"
                                                checked={filteredUniqueValues.every(v => filterChecked.has(v))}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setFilterChecked(prev => new Set([...prev, ...filteredUniqueValues]));
                                                    } else {
                                                        setFilterChecked(prev => { const s = new Set(prev); filteredUniqueValues.forEach(v => s.delete(v)); return s; });
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <span className={`text-xs font-semibold ${colors.textSecondary}`}>(Select All)</span>
                                            <span className={`ml-auto text-[10px] ${colors.textMuted}`}>{filterChecked.size} / {uniqueColValues.length}</span>
                                        </div>
                                        {/* Value list */}
                                        <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                            {filteredUniqueValues.map(val => (
                                                <label key={val} className={`flex items-center gap-2.5 px-3 py-1.5 text-xs cursor-pointer hover:${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'} transition`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={filterChecked.has(val)}
                                                        onChange={e => {
                                                            setFilterChecked(prev => {
                                                                const s = new Set(prev);
                                                                if (e.target.checked) s.add(val); else s.delete(val);
                                                                return s;
                                                            });
                                                        }}
                                                        className="rounded"
                                                    />
                                                    <span className={`${colors.textSecondary} truncate`}>{val === '' ? <em className={colors.textMuted}>(blank)</em> : val}</span>
                                                </label>
                                            ))}
                                            {filteredUniqueValues.length === 0 && (
                                                <div className={`px-3 py-4 text-center text-xs ${colors.textMuted} italic`}>No matching values</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className={`flex items-center justify-end gap-3 p-4 sm:p-5 border-t ${colors.borderPrimary}`}>
                            {activeFilters.some(f => f.column === filterColumn) && (
                                <button onClick={() => { clearFilter(filterColumn); setShowFilterModal(false); }} className={`mr-auto text-xs text-red-400 hover:text-red-300 transition font-medium`}>Clear Filter</button>
                            )}
                            <button onClick={() => setShowFilterModal(false)} className={`px-4 py-2 rounded-lg ${colors.textMuted} hover:${colors.bgTertiary} transition text-sm`}>Cancel</button>
                            <button onClick={applyFilter} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg">OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
