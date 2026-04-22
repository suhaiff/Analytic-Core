import React, { useState } from 'react';
import {
    ArrowLeft, Loader2, Upload, AlertCircle, Download, Sparkles, Target,
} from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { mlService } from '../../services/mlService';
import { MLModel, MLPredictionResponse, User } from '../../types';

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
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<MLPredictionResponse | null>(null);

    const handleRun = async () => {
        if (!file) return setError('Please upload a file first.');
        setIsRunning(true);
        setError(null);
        setResult(null);
        try {
            const res = await mlService.predict({
                userId: user.id,
                modelId: model.id,
                file,
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

    const downloadResults = () => {
        if (!result) return;
        const rows = ['prediction'];
        for (const p of result.predictions) rows.push(String(p));
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${model.name.replace(/\W+/g, '_')}_predictions.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
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
                        <Info colors={colors} label="Features" value={`${model.feature_columns.length} columns`} />
                        <Info colors={colors} label="Trained on" value={`${model.sample_size.toLocaleString()} rows`} />
                    </div>
                    {model.feature_columns.length > 0 && (
                        <p className={`mt-3 text-[11px] ${colors.textMuted}`}>
                            <Target className="w-3 h-3 inline mr-1" /> Required columns: {model.feature_columns.join(', ')}
                        </p>
                    )}
                </div>

                {/* Upload */}
                <div className={`${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl p-5 mb-4`}>
                    <label className={`block cursor-pointer border-2 border-dashed ${colors.borderPrimary} rounded-2xl p-6 text-center hover:border-indigo-500/60 transition`}>
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); setError(null); }}
                        />
                        <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                        {file ? (
                            <>
                                <p className={`font-semibold ${colors.textPrimary}`}>{file.name}</p>
                                <p className={`text-xs ${colors.textMuted}`}>{(file.size / 1024).toFixed(1)} KB</p>
                            </>
                        ) : (
                            <>
                                <p className={`font-semibold ${colors.textPrimary}`}>Upload CSV/Excel with new records</p>
                                <p className={`text-xs ${colors.textMuted} mt-1`}>Columns must match the training data.</p>
                            </>
                        )}
                    </label>
                </div>

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
                        disabled={isRunning || !file}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                    >
                        {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isRunning ? 'Running…' : 'Run Predictions'}
                    </button>
                </div>

                {result && (
                    <div className={`${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl p-5`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className={`text-lg font-bold ${colors.textPrimary}`}>
                                    {result.row_count} predictions generated
                                </h2>
                                <p className={`text-xs ${colors.textMuted}`}>Showing first 20 rows</p>
                            </div>
                            <button
                                onClick={downloadResults}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                            >
                                <Download className="w-4 h-4" /> Download CSV
                            </button>
                        </div>

                        <div className={`overflow-x-auto rounded-xl border ${colors.borderPrimary}`}>
                            <table className="w-full text-sm">
                                <thead className={colors.bgTertiary}>
                                    <tr>
                                        <th className={`px-4 py-2 text-left ${colors.textPrimary} font-semibold`}>#</th>
                                        <th className={`px-4 py-2 text-left ${colors.textPrimary} font-semibold`}>Prediction</th>
                                        {result.probabilities && (
                                            <th className={`px-4 py-2 text-left ${colors.textPrimary} font-semibold`}>Confidence</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.predictions.slice(0, 20).map((p, i) => (
                                        <tr key={i} className={i % 2 ? colors.bgSecondary : ''}>
                                            <td className={`px-4 py-2 ${colors.textMuted}`}>{i + 1}</td>
                                            <td className={`px-4 py-2 ${colors.textPrimary} font-semibold`}>{String(p)}</td>
                                            {result.probabilities && (
                                                <td className={`px-4 py-2 ${colors.textSecondary}`}>
                                                    {(Math.max(...(result.probabilities[i] || [0])) * 100).toFixed(1)}%
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
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
