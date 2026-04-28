import React, { useState, useMemo, useEffect } from 'react';
import {
    ArrowLeft, Loader2, Upload, AlertCircle, Download, Sparkles, Target,
    Table, BarChart3, FileSpreadsheet, Database, Globe, CheckCircle2,
    AlertTriangle, Scissors, TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { mlService } from '../../services/mlService';
import { MLModel, MLPredictionResponse, User } from '../../types';
import { GoogleSheetsImportModal } from '../modals/GoogleSheetsImportModal';
import { SqlDatabaseImportModal } from '../modals/SqlDatabaseImportModal';
import { SharePointImportModal } from '../modals/SharePointImportModal';

interface Props {
    user: User;
    model: MLModel;
    onBack: () => void;
}

/**
 * Upload a new CSV and get predictions from a trained model.
 */
export const MLPredictor: React.FC<Props> = ({ user, model, onBack }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [file, setFile] = useState<File | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isRetraining, setIsRetraining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<MLPredictionResponse | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'candlestick'>('table');

    // Target column detection
    const [fileHeaders, setFileHeaders] = useState<string[] | null>(null);
    const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

    // Modal States
    const [showGSModal, setShowGSModal] = useState(false);
    const [showSqlDbModal, setShowSqlDbModal] = useState(false);
    const [showSPModal, setShowSPModal] = useState(false);

    // Detect if file contains the target column
    const hasTargetColumn = useMemo(() => {
        if (!fileHeaders) return false;
        const target = model.target_column.toLowerCase().trim();
        return fileHeaders.some(h => h.toLowerCase().trim() === target);
    }, [fileHeaders, model.target_column]);

    // Parse file headers whenever file changes
    useEffect(() => {
        if (!file) {
            setFileHeaders(null);
            return;
        }
        (async () => {
            try {
                const headers = await parseFileHeaders(file);
                setFileHeaders(headers);
            } catch (e) {
                console.error('Failed to parse file headers:', e);
                setFileHeaders(null);
            }
        })();
    }, [file]);

    // Parse headers from CSV or XLSX file
    const parseFileHeaders = async (f: File): Promise<string[]> => {
        const name = f.name.toLowerCase();
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            const buf = await f.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const sheetName = wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            return (rows[0] || []).map((h: any) => String(h || '').trim());
        }
        // CSV - read first line only
        const text = await f.text();
        const firstLine = text.split(/\r?\n/)[0] || '';
        return parseCsvLine(firstLine);
    };

    // Simple CSV line parser that handles quoted values
    const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
                else inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current.trim());
        return result;
    };

    // Strip target column from file and return a new File
    const stripTargetColumn = async (f: File): Promise<File> => {
        const name = f.name.toLowerCase();
        const targetLower = model.target_column.toLowerCase().trim();

        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            const buf = await f.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const sheetName = wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (rows.length === 0) return f;
            const headers = (rows[0] || []).map((h: any) => String(h || '').trim());
            const targetIdx = headers.findIndex(h => h.toLowerCase() === targetLower);
            if (targetIdx < 0) return f;
            const filtered = rows.map(r => r.filter((_: any, i: number) => i !== targetIdx));
            return arrayToCsvFile(filtered, f.name.replace(/\.(xlsx|xls)$/i, '.csv'));
        }

        // CSV path
        const text = await f.text();
        const lines = text.split(/\r?\n/);
        if (lines.length === 0) return f;
        const headers = parseCsvLine(lines[0]);
        const targetIdx = headers.findIndex(h => h.toLowerCase() === targetLower);
        if (targetIdx < 0) return f;
        const newLines = lines.map(line => {
            if (line.trim() === '') return line;
            const cells = parseCsvLine(line);
            cells.splice(targetIdx, 1);
            return cells.map(c => {
                const s = String(c);
                return (s.includes(',') || s.includes('"') || s.includes('\n'))
                    ? `"${s.replace(/"/g, '""')}"`
                    : s;
            }).join(',');
        });
        const blob = new Blob([newLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        return new File([blob], f.name, { type: 'text/csv' });
    };

    const handleRun = async () => {
        if (!file) return setError('Please upload a file first.');
        setIsRunning(true);
        setError(null);
        setResult(null);
        setRetrainSuccess(null);
        try {
            // Auto-strip target column if present (safety net)
            const fileToUse = hasTargetColumn ? await stripTargetColumn(file) : file;
            const res = await mlService.predict({
                userId: user.id,
                modelId: model.id,
                file: fileToUse,
                includeProbabilities: model.problem_type === 'classification',
            });
            setResult(res);
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            const msg = typeof detail === 'object'
                ? (detail.message || JSON.stringify(detail))
                : (detail || e.message);
            setError(msg || 'Prediction failed.');
        } finally {
            setIsRunning(false);
        }
    };

    const handleRemoveTargetAndPredict = async () => {
        if (!file) return;
        try {
            const stripped = await stripTargetColumn(file);
            setFile(stripped);
            // handleRun will be called automatically via user clicking Run Predictions
            // but we call it directly for smoother UX
            setIsRunning(true);
            setError(null);
            setResult(null);
            setRetrainSuccess(null);
            const res = await mlService.predict({
                userId: user.id,
                modelId: model.id,
                file: stripped,
                includeProbabilities: model.problem_type === 'classification',
            });
            setResult(res);
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            const msg = typeof detail === 'object'
                ? (detail.message || JSON.stringify(detail))
                : (detail || e.message);
            setError(msg || 'Prediction failed.');
        } finally {
            setIsRunning(false);
        }
    };

    const handleRetrainWithData = async () => {
        if (!file) return;
        setIsRetraining(true);
        setError(null);
        setRetrainSuccess(null);
        try {
            await mlService.retrainModel({
                userId: user.id,
                modelId: model.id,
                name: model.name,
                description: model.description || undefined,
                targetColumn: model.target_column,
                algorithm: model.algorithm,
                featureColumns: model.feature_columns,
                problemType: model.problem_type,
                file,
            });
            setRetrainSuccess(`Model "${model.name}" has been retrained with the new data. You can now upload a different file (without the target column) to run predictions.`);
            setFile(null);
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            const msg = typeof detail === 'object'
                ? (detail.message || JSON.stringify(detail))
                : (detail || e.message);
            setError(msg || 'Retraining failed.');
        } finally {
            setIsRetraining(false);
        }
    };

    const arrayToCsvFile = (data: any[][], filename: string): File => {
        const csvContent = data.map(row => row.map(cell => {
            if (cell === null || cell === undefined) return '';
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        }).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        return new File([blob], filename, { type: 'text/csv' });
    };

    const handleGSImport = (sheets: { id: number, name: string, data: any[][], fileId: number }[], title: string) => {
        if (sheets.length > 0) {
            const firstSheet = sheets[0];
            const newFile = arrayToCsvFile(firstSheet.data, `${firstSheet.name}.csv`);
            setFile(newFile);
            setResult(null);
            setError(null);
        }
    };

    const handleSqlImport = (tables: { id: number, name: string, data: any[][], fileId: number }[], title: string) => {
        if (tables.length > 0) {
            const firstTable = tables[0];
            const newFile = arrayToCsvFile(firstTable.data, `${firstTable.name}.csv`);
            setFile(newFile);
            setResult(null);
            setError(null);
        }
    };

    const handleSPImport = (siteId: string, listId: string, listName: string, data: any[][]) => {
        const newFile = arrayToCsvFile(data, `${listName}.csv`);
        setFile(newFile);
        setResult(null);
        setError(null);
    };

    // Detect if data has stock/OHLC-like columns
    const ohlcInfo = useMemo(() => {
        if (!result || !result.input_data || result.input_data.length === 0) return null;
        const keys = Object.keys(result.input_data[0]).map(k => k.toLowerCase());
        const allKeys = Object.keys(result.input_data[0]);

        const findCol = (candidates: string[]) => {
            for (const c of candidates) {
                const idx = keys.findIndex(k => k === c || k.includes(c));
                if (idx >= 0) return allKeys[idx];
            }
            return null;
        };

        const openCol = findCol(['open']);
        const highCol = findCol(['high']);
        const lowCol = findCol(['low']);
        const closeCol = findCol(['close']);
        const dateCol = findCol(['date', 'time', 'timestamp', 'datetime', 'period']);

        // Also check if the predicted column is price-like
        const targetLower = model.target_column.toLowerCase();
        const isStockTarget = ['price', 'close', 'open', 'high', 'low', 'value', 'stock'].some(k => targetLower.includes(k));

        if ((openCol && highCol && lowCol && closeCol) || isStockTarget) {
            return {
                open: openCol || 'Open',
                high: highCol || 'High',
                low: lowCol || 'Low',
                close: closeCol || 'Close',
                date: dateCol,
                hasOHLC: !!(openCol && highCol && lowCol && closeCol),
                isStockLike: isStockTarget,
            };
        }
        return null;
    }, [result, model.target_column]);

    const downloadResults = () => {
        if (!result) return;
        
        const rows: string[] = [];
        const hasInputData = result.input_data && result.input_data.length > 0;
        const inputKeys = hasInputData ? Object.keys(result.input_data![0]) : [];
        
        // Header
        const header = [...inputKeys, `Predicted ${model.target_column}`];
        if (result.probabilities) header.push('Confidence');
        rows.push(header.join(','));

        // Rows
        for (let i = 0; i < result.predictions.length; i++) {
            const row: string[] = [];
            if (hasInputData) {
                for (const key of inputKeys) {
                    const val = String(result.input_data![i][key]);
                    // Simple escape for CSV
                    row.push(val.includes(',') ? `"${val}"` : val);
                }
            }
            row.push(String(result.predictions[i]));
            if (result.probabilities) {
                row.push((Math.max(...(result.probabilities[i] || [0])) * 100).toFixed(1) + '%');
            }
            rows.push(row.join(','));
        }

        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${model.name.replace(/\\W+/g, '_')}_predictions.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className={`${colors.bgPrimary} ${colors.textPrimary} min-h-screen p-6 sm:p-10`}>
                <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={onBack}
                        className={`flex items-center justify-center w-10 h-10 rounded-xl ${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-indigo-400" />
                            Run Predictions
                        </h1>
                        <p className={`text-xs ${colors.textMuted} mt-1`}>
                            Using model <span className={`font-semibold ${colors.textPrimary}`}>{model.name}</span> — predicting <span className="text-indigo-400 font-semibold">{model.target_column}</span>.
                        </p>
                    </div>
                </div>

                {/* Model summary */}
                <div className={`${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl p-4 mb-5`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <Info colors={colors} label="Algorithm" value={prettyAlgorithm(model.algorithm)} />
                        <Info colors={colors} label="Problem" value={model.problem_type} />
                        <Info colors={colors} label="Features" value={`${(model.raw_feature_columns || model.feature_columns).length} columns`} />
                        <Info colors={colors} label="Trained on" value={`${model.sample_size.toLocaleString()} rows`} />
                    </div>
                    {(model.raw_feature_columns || model.feature_columns).length > 0 && (
                        <div className="mt-3 space-y-1">
                            <p className={`text-[11px] ${colors.textMuted}`}>
                                <Target className="w-3 h-3 inline mr-1" /> Required columns: {(model.raw_feature_columns || model.feature_columns).join(', ')}
                            </p>
                            <p className={`text-[10px] text-amber-500/80 font-medium italic`}>
                                <AlertCircle className="w-3 h-3 inline mr-1" /> Note: Do NOT include the target column <span className="font-bold">"{model.target_column}"</span> in your upload.
                            </p>
                        </div>
                    )}
                </div>

                {/* Upload */}
                        <div className="space-y-6">
                            <div className="grid sm:grid-cols-4 gap-4">
                                <label className={`col-span-1 sm:col-span-1 cursor-pointer border-2 border-dashed ${colors.borderPrimary} rounded-2xl p-6 text-center hover:border-indigo-500/60 transition flex flex-col items-center justify-center`}>
                                    <input
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        className="hidden"
                                        onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); setError(null); }}
                                    />
                                    <Upload className="w-6 h-6 text-indigo-400 mb-2" />
                                    <p className={`text-xs font-bold ${colors.textPrimary}`}>Upload File</p>
                                </label>

                                <button
                                    onClick={() => setShowGSModal(true)}
                                    className={`p-6 rounded-2xl border-2 border-dashed ${colors.borderPrimary} hover:border-green-500/60 transition flex flex-col items-center justify-center`}
                                >
                                    <FileSpreadsheet className="w-6 h-6 text-green-500 mb-2" />
                                    <p className={`text-xs font-bold ${colors.textPrimary}`}>Google Sheets</p>
                                </button>

                                <button
                                    onClick={() => setShowSqlDbModal(true)}
                                    className={`p-6 rounded-2xl border-2 border-dashed ${colors.borderPrimary} hover:border-blue-500/60 transition flex flex-col items-center justify-center`}
                                >
                                    <Database className="w-6 h-6 text-blue-500 mb-2" />
                                    <p className={`text-xs font-bold ${colors.textPrimary}`}>SQL Database</p>
                                </button>

                                <button
                                    onClick={() => setShowSPModal(true)}
                                    className={`p-6 rounded-2xl border-2 border-dashed ${colors.borderPrimary} hover:border-orange-500/60 transition flex flex-col items-center justify-center`}
                                >
                                    <Globe className="w-6 h-6 text-orange-500 mb-2" />
                                    <p className={`text-xs font-bold ${colors.textPrimary}`}>SharePoint</p>
                                </button>
                            </div>

                            {file && (
                                <div className={`p-4 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} flex items-center justify-between animate-fade-in`}>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                        <div>
                                            <p className={`text-sm font-bold ${colors.textPrimary}`}>{file.name}</p>
                                            <p className={`text-[10px] ${colors.textMuted}`}>{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFile(null)}
                                        className={`text-[10px] uppercase tracking-wider font-bold text-red-400 hover:text-red-300 transition`}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                {/* Target Column Warning Card */}
                {file && hasTargetColumn && !result && (
                    <div className="mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-bold ${colors.textPrimary} mb-1`}>
                                    Target column <span className="text-amber-400">"{model.target_column}"</span> detected in your file
                                </h3>
                                <p className={`text-xs ${colors.textMuted} leading-relaxed`}>
                                    Your uploaded file contains the target column. You can either remove it and run predictions on the rest of the data, or use this file to retrain the model and improve its accuracy.
                                </p>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <button
                                onClick={handleRemoveTargetAndPredict}
                                disabled={isRunning || isRetraining}
                                className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Scissors className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className={`text-xs font-bold ${colors.textPrimary} mb-1`}>
                                        {isRunning ? 'Running predictions…' : 'Remove & Predict'}
                                    </p>
                                    <p className={`text-[10px] ${colors.textMuted} leading-relaxed`}>
                                        Strip the target column and run predictions on the remaining data.
                                    </p>
                                </div>
                            </button>
                            <button
                                onClick={handleRetrainWithData}
                                disabled={isRunning || isRetraining}
                                className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRetraining
                                    ? <Loader2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-spin" />
                                    : <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                                <div className="min-w-0">
                                    <p className={`text-xs font-bold ${colors.textPrimary} mb-1`}>
                                        {isRetraining ? 'Retraining model…' : 'Retrain Model'}
                                    </p>
                                    <p className={`text-[10px] ${colors.textMuted} leading-relaxed`}>
                                        Use this file (with target values) to improve the model's accuracy.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {retrainSuccess && (
                    <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{retrainSuccess}</span>
                    </div>
                )}

                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 mb-6">
                    <button
                        onClick={onBack}
                        className={`px-5 py-2.5 rounded-xl ${colors.textMuted} hover:${colors.bgTertiary} transition font-semibold`}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleRun}
                        disabled={isRunning || isRetraining || !file}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                    >
                        {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isRunning ? 'Running…' : 'Run Predictions'}
                    </button>
                </div>

                {result && (() => {
                    const input_data = result.input_data || [];
                    const inputKeys = input_data.length > 0 ? Object.keys(input_data[0]) : [];
                    return (
                    <div className={`${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl p-5`}>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                            <div>
                                <h2 className={`text-lg font-bold ${colors.textPrimary}`}>
                                    {result.row_count} predictions generated
                                </h2>
                                <p className={`text-xs ${colors.textMuted}`}>Showing first 20 rows</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* View toggle - only show if stock-like data detected */}
                                {ohlcInfo && (
                                    <div className={`flex rounded-xl overflow-hidden border ${colors.borderPrimary}`}>
                                        <button
                                            onClick={() => setViewMode('table')}
                                            className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 transition ${viewMode === 'table' ? 'bg-indigo-600 text-white' : `${colors.bgTertiary} ${colors.textMuted}`}`}
                                        >
                                            <Table className="w-3.5 h-3.5" /> Table
                                        </button>
                                        <button
                                            onClick={() => setViewMode('candlestick')}
                                            className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 transition ${viewMode === 'candlestick' ? 'bg-indigo-600 text-white' : `${colors.bgTertiary} ${colors.textMuted}`}`}
                                        >
                                            <BarChart3 className="w-3.5 h-3.5" /> Candlestick
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={downloadResults}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                                >
                                    <Download className="w-4 h-4" /> Download CSV
                                </button>
                            </div>
                        </div>

                        {viewMode === 'candlestick' && ohlcInfo ? (
                            <CandlestickChart
                                data={input_data}
                                predictions={result.predictions}
                                ohlcInfo={ohlcInfo}
                                targetColumn={model.target_column}
                                colors={colors}
                            />
                        ) : (
                            <div className={`overflow-x-auto rounded-xl border ${colors.borderPrimary}`}>
                                <table className="w-full text-sm">
                                    <thead className={colors.bgTertiary}>
                                        <tr>
                                            <th className={`px-4 py-2 text-left ${colors.textPrimary} font-semibold whitespace-nowrap`}>#</th>
                                            {inputKeys.map(k => (
                                                <th key={k} className={`px-4 py-2 text-left ${colors.textPrimary} font-semibold whitespace-nowrap`}>{k}</th>
                                            ))}
                                            <th className={`px-4 py-2 text-left text-emerald-400 font-bold whitespace-nowrap`}>Predicted {model.target_column}</th>
                                            {result.probabilities && (
                                                <th className={`px-4 py-2 text-left ${colors.textPrimary} font-semibold whitespace-nowrap`}>Confidence</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.predictions.slice(0, 20).map((p, i) => (
                                            <tr key={i} className={i % 2 ? colors.bgSecondary : ''}>
                                                <td className={`px-4 py-2 ${colors.textMuted}`}>{i + 1}</td>
                                                {inputKeys.map(k => (
                                                    <td key={k} className={`px-4 py-2 ${colors.textMuted} whitespace-nowrap`}>{String(result.input_data![i][k])}</td>
                                                ))}
                                                <td className={`px-4 py-2 text-emerald-400 font-bold bg-emerald-500/10 whitespace-nowrap`}>{String(p)}</td>
                                                {result.probabilities && (
                                                    <td className={`px-4 py-2 ${colors.textSecondary} whitespace-nowrap`}>
                                                        {(Math.max(...(result.probabilities[i] || [0])) * 100).toFixed(1)}%
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );})()}
                </div>
            
        
            {/* Modals */}
            {showGSModal && (
                <GoogleSheetsImportModal
                    user={user}
                    onClose={() => setShowGSModal(false)}
                    onImport={handleGSImport}
                    singleSelection={true}
                />
            )}

            {showSqlDbModal && (
                <SqlDatabaseImportModal
                    user={user}
                    onClose={() => setShowSqlDbModal(false)}
                    onImport={handleSqlImport}
                    singleSelection={true}
                />
            )}

            {showSPModal && (
                <SharePointImportModal
                    user={user}
                    onClose={() => setShowSPModal(false)}
                    onImport={handleSPImport}
                />
            )}
        </div>
        </>
    );
};

// ─── Candlestick Chart Component ──────────────────────────────────────────────

interface OHLCInfo {
    open: string;
    high: string;
    low: string;
    close: string;
    date: string | null;
    hasOHLC: boolean;
    isStockLike: boolean;
}

interface CandlestickChartProps {
    data: Record<string, any>[];
    predictions: (string | number | boolean)[];
    ohlcInfo: OHLCInfo;
    targetColumn: string;
    colors: any;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
    data, predictions, ohlcInfo, targetColumn, colors
}) => {
    const chartData = useMemo(() => {
        const items: {
            idx: number;
            label: string;
            open: number;
            high: number;
            low: number;
            close: number;
            predicted: number;
            isBullish: boolean;
        }[] = [];

        const limit = Math.min(data.length, 40); // show max 40 candles

        for (let i = 0; i < limit; i++) {
            const row = data[i];
            const predicted = Number(predictions[i]) || 0;

            let open: number, high: number, low: number, close: number;

            if (ohlcInfo.hasOHLC) {
                open = Number(row[ohlcInfo.open]) || 0;
                high = Number(row[ohlcInfo.high]) || 0;
                low = Number(row[ohlcInfo.low]) || 0;
                close = Number(row[ohlcInfo.close]) || 0;
            } else {
                // If we don't have OHLC columns, synthesize from predicted values
                const prev = i > 0 ? Number(predictions[i - 1]) || predicted : predicted * 0.98;
                open = prev;
                close = predicted;
                high = Math.max(open, close) * (1 + Math.random() * 0.02);
                low = Math.min(open, close) * (1 - Math.random() * 0.02);
            }

            const label = ohlcInfo.date && row[ohlcInfo.date]
                ? String(row[ohlcInfo.date])
                : `#${i + 1}`;

            items.push({
                idx: i,
                label,
                open,
                high,
                low,
                close,
                predicted,
                isBullish: close >= open,
            });
        }
        return items;
    }, [data, predictions, ohlcInfo]);

    if (chartData.length === 0) {
        return <p className={`text-sm ${colors.textMuted}`}>No data to display in chart.</p>;
    }

    // Calculate chart dimensions
    const chartWidth = Math.max(chartData.length * 24, 600);
    const chartHeight = 400;
    const padding = { top: 20, right: 60, bottom: 40, left: 70 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const allValues = chartData.flatMap(d => [d.high, d.low, d.predicted]);
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = maxVal - minVal || 1;
    const yMin = minVal - range * 0.05;
    const yMax = maxVal + range * 0.05;

    const yScale = (v: number) => padding.top + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;
    const candleWidth = Math.max(6, Math.min(18, plotWidth / chartData.length * 0.6));
    const xStep = plotWidth / chartData.length;

    // Y-axis ticks
    const yTicks: number[] = [];
    const tickCount = 8;
    for (let i = 0; i <= tickCount; i++) {
        yTicks.push(yMin + (yMax - yMin) * (i / tickCount));
    }

    // Prediction line points
    const predictionLine = chartData.map((d, i) => {
        const x = padding.left + i * xStep + xStep / 2;
        const y = yScale(d.predicted);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="relative">
            <div className="overflow-x-auto rounded-xl" style={{ background: 'linear-gradient(180deg, #0a0e17 0%, #111827 100%)' }}>
                <svg width={chartWidth} height={chartHeight} className="block">
                    {/* Grid lines */}
                    {yTicks.map((tick, i) => (
                        <g key={i}>
                            <line
                                x1={padding.left}
                                y1={yScale(tick)}
                                x2={chartWidth - padding.right}
                                y2={yScale(tick)}
                                stroke="#1e293b"
                                strokeWidth={1}
                            />
                            <text
                                x={padding.left - 8}
                                y={yScale(tick) + 4}
                                textAnchor="end"
                                fill="#64748b"
                                fontSize={10}
                                fontFamily="monospace"
                            >
                                {tick.toFixed(tick > 1000 ? 0 : 2)}
                            </text>
                        </g>
                    ))}

                    {/* Vertical axis line */}
                    <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={chartHeight - padding.bottom}
                        stroke="#334155"
                        strokeWidth={1}
                    />

                    {/* Candlesticks */}
                    {chartData.map((d, i) => {
                        const x = padding.left + i * xStep + xStep / 2;
                        const bodyTop = yScale(Math.max(d.open, d.close));
                        const bodyBottom = yScale(Math.min(d.open, d.close));
                        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
                        const wickTop = yScale(d.high);
                        const wickBottom = yScale(d.low);
                        const bullColor = '#22c55e';
                        const bearColor = '#ef4444';
                        const color = d.isBullish ? bullColor : bearColor;

                        return (
                            <g key={i}>
                                {/* Wick */}
                                <line
                                    x1={x}
                                    y1={wickTop}
                                    x2={x}
                                    y2={wickBottom}
                                    stroke={color}
                                    strokeWidth={1.5}
                                />
                                {/* Body */}
                                <rect
                                    x={x - candleWidth / 2}
                                    y={bodyTop}
                                    width={candleWidth}
                                    height={bodyHeight}
                                    fill={d.isBullish ? color : color}
                                    stroke={color}
                                    strokeWidth={1}
                                    rx={1}
                                />
                                {/* X-axis labels (show every Nth) */}
                                {(chartData.length <= 20 || i % Math.ceil(chartData.length / 15) === 0) && (
                                    <text
                                        x={x}
                                        y={chartHeight - padding.bottom + 16}
                                        textAnchor="middle"
                                        fill="#64748b"
                                        fontSize={9}
                                        fontFamily="monospace"
                                    >
                                        {d.label.length > 10 ? d.label.slice(0, 10) : d.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Prediction line overlay */}
                    <polyline
                        points={predictionLine}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth={2}
                        strokeDasharray="6,3"
                        opacity={0.8}
                    />
                    {/* Prediction dots */}
                    {chartData.map((d, i) => {
                        const x = padding.left + i * xStep + xStep / 2;
                        const y = yScale(d.predicted);
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={3}
                                fill="#818cf8"
                                stroke="#312e81"
                                strokeWidth={1}
                            />
                        );
                    })}

                    {/* Current price indicator on right side */}
                    {chartData.length > 0 && (() => {
                        const last = chartData[chartData.length - 1];
                        const y = yScale(last.predicted);
                        return (
                            <g>
                                <rect
                                    x={chartWidth - padding.right + 4}
                                    y={y - 10}
                                    width={52}
                                    height={20}
                                    rx={4}
                                    fill="#818cf8"
                                />
                                <text
                                    x={chartWidth - padding.right + 30}
                                    y={y + 4}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize={10}
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                >
                                    {last.predicted.toFixed(last.predicted > 1000 ? 0 : 2)}
                                </text>
                                <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={chartWidth - padding.right}
                                    y2={y}
                                    stroke="#818cf8"
                                    strokeWidth={1}
                                    strokeDasharray="3,3"
                                    opacity={0.5}
                                />
                            </g>
                        );
                    })()}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-3 px-2">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-[#22c55e]" />
                    <span className={`text-[11px] ${colors.textMuted}`}>Bullish (Close ≥ Open)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-[#ef4444]" />
                    <span className={`text-[11px] ${colors.textMuted}`}>Bearish (Close &lt; Open)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-indigo-400" style={{ borderTop: '2px dashed #818cf8' }} />
                    <span className={`text-[11px] ${colors.textMuted}`}>Predicted {targetColumn}</span>
                </div>
            </div>
        </div>
    );
};

function Info({ colors, label, value }: { colors: any; label: string; value: string }) {
    return (
        <div>
            <p className={`uppercase tracking-wider font-bold ${colors.textMuted} text-[10px] mb-1`}>{label}</p>
            <p className={`font-semibold ${colors.textPrimary} capitalize`}>{value}</p>
        </div>
    );
}

function prettyAlgorithm(id: string) {
    return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
