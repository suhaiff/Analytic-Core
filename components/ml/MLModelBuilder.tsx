import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft, Brain, CheckCircle2, Loader2, Upload, AlertCircle,
    Sparkles, Target, Database, Cpu, Settings, FileSpreadsheet, Globe
} from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { mlService, MLAlgorithmDescriptor } from '../../services/mlService';
import { MLAlgorithm, MLProblemType, MLTrainResponse, User } from '../../types';
import { GoogleSheetsImportModal } from '../modals/GoogleSheetsImportModal';
import { SqlDatabaseImportModal } from '../modals/SqlDatabaseImportModal';
import { SharePointImportModal } from '../modals/SharePointImportModal';

interface Props {
    user: User;
    onCancel: () => void;
    onTrained: (result: MLTrainResponse) => void;
}

/**
 * Step-by-step UI to create a new prediction model:
 *   1. Upload training data
 *   2. Pick target column + features
 *   3. Pick algorithm
 *   4. Train
 */
export const MLModelBuilder: React.FC<Props> = ({ user, onCancel, onTrained }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [file, setFile] = useState<File | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [preview, setPreview] = useState<Record<string, any>[]>([]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [targetColumn, setTargetColumn] = useState<string>('');
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [algorithm, setAlgorithm] = useState<MLAlgorithm>('random_forest_classifier');
    const [problemType, setProblemType] = useState<MLProblemType | undefined>(undefined);
    const [testSize, setTestSize] = useState<number>(0.2);

    const [algorithms, setAlgorithms] = useState<MLAlgorithmDescriptor[]>([]);
    const [isTraining, setIsTraining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsing, setParsing] = useState(false);

    // Modal States
    const [showGSModal, setShowGSModal] = useState(false);
    const [showSqlDbModal, setShowSqlDbModal] = useState(false);
    const [showSPModal, setShowSPModal] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const list = await mlService.listAlgorithms();
                if (list.length > 0) setAlgorithms(list);
            } catch (_e) {
                // silent fallback — defaults still work
            }
        })();
    }, []);

    const filteredAlgorithms = useMemo(() => {
        if (!problemType) return algorithms;
        return algorithms.filter(a => a.type === problemType);
    }, [algorithms, problemType]);

    const handleFileChange = async (f: File | null) => {
        setError(null);
        setFile(f);
        setColumns([]);
        setPreview([]);
        setTargetColumn('');
        setSelectedFeatures([]);
        if (!f) return;

        setParsing(true);
        try {
            const text = await readFileAsText(f);
            const { headers, rows } = parseDelimited(text);
            setColumns(headers);
            setPreview(rows.slice(0, 5));
        } catch (e: any) {
            setError(`Could not read file: ${e.message || e}`);
        } finally {
            setParsing(false);
        }
    };

    const toggleFeature = (col: string) => {
        setSelectedFeatures(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col],
        );
    };

    const handleTrain = async () => {
        if (!file) return setError('Please upload a training file.');
        if (!name.trim()) return setError('Please name your model.');
        if (!targetColumn) return setError('Please choose the target column.');
        const features = selectedFeatures.length > 0
            ? selectedFeatures
            : columns.filter(c => c !== targetColumn);
        if (features.length === 0) return setError('Select at least one feature column.');

        setIsTraining(true);
        setError(null);
        try {
            const result = await mlService.trainModel({
                userId: user.id,
                name: name.trim(),
                description: description.trim() || undefined,
                targetColumn,
                algorithm,
                featureColumns: features,
                problemType,
                testSize,
                file,
            });
            onTrained(result);
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            const msg = typeof detail === 'object' ? (detail.message || JSON.stringify(detail)) : (detail || e.message);
            setError(msg || 'Training failed.');
        } finally {
            setIsTraining(false);
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
            handleFileChange(newFile);
        }
    };

    const handleSqlImport = (tables: { id: number, name: string, data: any[][], fileId: number }[], title: string) => {
        if (tables.length > 0) {
            const firstTable = tables[0];
            const newFile = arrayToCsvFile(firstTable.data, `${firstTable.name}.csv`);
            handleFileChange(newFile);
        }
    };

    const handleSPImport = (siteId: string, listId: string, listName: string, data: any[][]) => {
        const newFile = arrayToCsvFile(data, `${listName}.csv`);
        handleFileChange(newFile);
    };

    return (
        <>
            <div className={`${colors.bgPrimary} ${colors.textPrimary} min-h-screen p-6 sm:p-10`}>
                <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onCancel}
                            className={`flex items-center justify-center w-10 h-10 rounded-xl ${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition`}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
                                <Brain className="w-7 h-7 text-indigo-400" />
                                Build Prediction Model
                            </h1>
                            <p className={`text-xs ${colors.textMuted} mt-1`}>
                                Train a model from historical data to predict outcomes on new records.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 1 — Upload */}
                <Section title="1. Training Data" icon={<Upload className="w-4 h-4" />} colors={colors}>
                    <div className="grid sm:grid-cols-4 gap-4">
                        <label className={`col-span-1 sm:col-span-1 cursor-pointer border-2 border-dashed ${colors.borderPrimary} rounded-2xl p-6 text-center hover:border-indigo-500/60 transition flex flex-col items-center justify-center`}>
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
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
                        <div className={`mt-4 p-4 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} flex items-center justify-between animate-fade-in`}>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                <div>
                                    <p className={`text-sm font-bold ${colors.textPrimary}`}>{file.name}</p>
                                    <p className={`text-[10px] ${colors.textMuted}`}>{(file.size / 1024).toFixed(1)} KB · {columns.length} columns</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleFileChange(null)}
                                className={`text-[10px] uppercase tracking-wider font-bold text-red-400 hover:text-red-300 transition`}
                            >
                                Remove
                            </button>
                        </div>
                    )}

                    {parsing && <p className={`text-xs ${colors.textMuted} mt-2 flex items-center gap-1.5`}><Loader2 className="w-3 h-3 animate-spin" /> Reading file…</p>}
                </Section>

                {/* Step 2 — Basic info */}
                {columns.length > 0 && (
                    <Section title="2. Model Info" icon={<Sparkles className="w-4 h-4" />} colors={colors}>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Model Name</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Churn Predictor"
                                    className={`w-full ${colors.bgPrimary} border ${colors.borderSecondary} rounded-xl px-4 py-2.5 ${colors.textPrimary} outline-none focus:ring-2 focus:ring-indigo-500`}
                                />
                            </div>
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Description (optional)</label>
                                <input
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Short description"
                                    className={`w-full ${colors.bgPrimary} border ${colors.borderSecondary} rounded-xl px-4 py-2.5 ${colors.textPrimary} outline-none focus:ring-2 focus:ring-indigo-500`}
                                />
                            </div>
                        </div>
                    </Section>
                )}

                {/* Step 3 — Target & Features */}
                {columns.length > 0 && (
                    <Section title="3. Target & Features" icon={<Target className="w-4 h-4" />} colors={colors}>
                        <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>
                            Target column <span className="text-indigo-400">(what you want to predict)</span>
                        </label>
                        <select
                            value={targetColumn}
                            onChange={e => setTargetColumn(e.target.value)}
                            className={`w-full ${colors.bgPrimary} border ${colors.borderSecondary} rounded-xl px-4 py-2.5 ${colors.textPrimary} outline-none focus:ring-2 focus:ring-indigo-500`}
                        >
                            <option value="">— select target column —</option>
                            {columns.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        {targetColumn && (
                            <div className="mt-5">
                                <div className="flex items-center justify-between mb-2">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${colors.textMuted}`}>Feature columns (inputs)</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const all = columns.filter(c => c !== targetColumn);
                                            setSelectedFeatures(selectedFeatures.length === all.length ? [] : all);
                                        }}
                                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                                    >
                                        {selectedFeatures.length === columns.length - 1 ? 'Clear all' : 'Select all'}
                                    </button>
                                </div>
                                <div className={`max-h-48 overflow-y-auto rounded-xl border ${colors.borderPrimary} ${colors.bgSecondary} p-2 grid sm:grid-cols-2 gap-1`}>
                                    {columns.filter(c => c !== targetColumn).map(c => {
                                        const active = selectedFeatures.includes(c);
                                        return (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => toggleFeature(c)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition text-left ${active ? 'bg-indigo-500/20 text-indigo-300' : `${colors.textSecondary} hover:${colors.bgTertiary}`}`}
                                            >
                                                <span className={`w-4 h-4 rounded flex items-center justify-center border ${active ? 'bg-indigo-500 border-indigo-400' : colors.borderPrimary}`}>
                                                    {active && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                </span>
                                                <span className="truncate">{c}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className={`text-[11px] ${colors.textMuted} mt-1`}>Leave empty to use all non-target columns.</p>
                            </div>
                        )}
                    </Section>
                )}

                {/* Step 4 — Algorithm */}
                {targetColumn && (
                    <Section title="4. Algorithm" icon={<Cpu className="w-4 h-4" />} colors={colors}>
                        <div className="grid sm:grid-cols-3 gap-3 mb-4">
                            {(['classification', 'regression'] as MLProblemType[]).map(pt => (
                                <button
                                    key={pt}
                                    type="button"
                                    onClick={() => {
                                        setProblemType(pt);
                                        const defaults: Record<MLProblemType, MLAlgorithm> = {
                                            classification: 'random_forest_classifier',
                                            regression: 'random_forest_regressor',
                                        };
                                        setAlgorithm(defaults[pt]);
                                    }}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold capitalize border transition ${problemType === pt ? 'bg-indigo-500 text-white border-indigo-400' : `${colors.bgTertiary} ${colors.textSecondary} ${colors.borderPrimary}`}`}
                                >
                                    {pt}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setProblemType(undefined)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${!problemType ? 'bg-indigo-500 text-white border-indigo-400' : `${colors.bgTertiary} ${colors.textSecondary} ${colors.borderPrimary}`}`}
                            >
                                Auto-detect
                            </button>
                        </div>

                        <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Algorithm</label>
                        <select
                            value={algorithm}
                            onChange={e => setAlgorithm(e.target.value as MLAlgorithm)}
                            className={`w-full ${colors.bgPrimary} border ${colors.borderSecondary} rounded-xl px-4 py-2.5 ${colors.textPrimary} outline-none focus:ring-2 focus:ring-indigo-500`}
                        >
                            {(filteredAlgorithms.length > 0 ? filteredAlgorithms : DEFAULT_ALGOS).map(a => (
                                <option key={a.id} value={a.id}>{prettyAlgorithm(a.id)}</option>
                            ))}
                        </select>

                        <div className="mt-4 flex items-center gap-3">
                            <label className={`text-xs ${colors.textMuted}`}>Test size: {(testSize * 100).toFixed(0)}%</label>
                            <input
                                type="range"
                                min={0.1}
                                max={0.4}
                                step={0.05}
                                value={testSize}
                                onChange={e => setTestSize(Number(e.target.value))}
                                className="flex-1 accent-indigo-500"
                            />
                        </div>
                    </Section>
                )}

                {/* Preview */}
                {preview.length > 0 && (
                    <Section title="Data Preview" icon={<Database className="w-4 h-4" />} colors={colors}>
                        <div className={`overflow-x-auto rounded-xl border ${colors.borderPrimary}`}>
                            <table className="w-full text-xs">
                                <thead className={colors.bgTertiary}>
                                    <tr>
                                        {columns.map(c => (
                                            <th key={c} className={`px-3 py-2 text-left ${colors.textPrimary} font-semibold`}>{c}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((row, i) => (
                                        <tr key={i} className={i % 2 ? colors.bgSecondary : ''}>
                                            {columns.map(c => (
                                                <td key={c} className={`px-3 py-2 ${colors.textSecondary}`}>{String(row[c] ?? '')}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                {/* CTA */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        disabled={isTraining}
                        className={`px-5 py-2.5 rounded-xl ${colors.textMuted} hover:${colors.bgTertiary} transition font-semibold`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTrain}
                        disabled={isTraining || !file || !name || !targetColumn}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                    >
                        {isTraining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                        {isTraining ? 'Training…' : 'Train Model'}
                    </button>
                </div>
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

// ─── helpers ────────────────────────────────────────────────────────────
function Section({ title, icon, colors, children }: {
    title: string, icon: React.ReactNode, colors: any, children: React.ReactNode
}) {
    return (
        <section className={`${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl p-5 mb-4`}>
            <h2 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${colors.textMuted} mb-4`}>
                {icon}
                {title}
            </h2>
            {children}
        </section>
    );
}

function prettyAlgorithm(id: string) {
    return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const DEFAULT_ALGOS: MLAlgorithmDescriptor[] = [
    { id: 'random_forest_classifier', type: 'classification' },
    { id: 'random_forest_regressor', type: 'regression' },
    { id: 'logistic_regression', type: 'classification' },
    { id: 'linear_regression', type: 'regression' },
    { id: 'decision_tree_classifier', type: 'classification' },
    { id: 'decision_tree_regressor', type: 'regression' },
];

async function readFileAsText(file: File): Promise<string> {
    // For .xlsx we can't easily parse in the browser without a library — fall back to
    // asking the server for columns only if needed. For CSV this works everywhere.
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

function parseDelimited(text: string): { headers: string[]; rows: Record<string, any>[] } {
    const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!clean) return { headers: [], rows: [] };
    const lines = clean.split('\n');
    const delim = detectDelimiter(lines[0]);
    const headers = splitLine(lines[0], delim).map(h => h.trim());
    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = splitLine(lines[i], delim);
        if (cols.length === 1 && cols[0] === '') continue;
        const row: Record<string, any> = {};
        headers.forEach((h, idx) => (row[h] = cols[idx] ?? ''));
        rows.push(row);
    }
    return { headers, rows };
}

function detectDelimiter(firstLine: string): string {
    const candidates = [',', ';', '\t', '|'];
    let best = ',';
    let bestCount = -1;
    for (const d of candidates) {
        const c = firstLine.split(d).length;
        if (c > bestCount) {
            bestCount = c;
            best = d;
        }
    }
    return best;
}

function splitLine(line: string, delim: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === delim && !inQuotes) {
            out.push(cur);
            cur = '';
        } else {
            cur += ch;
        }
    }
    out.push(cur);
    return out;
}
