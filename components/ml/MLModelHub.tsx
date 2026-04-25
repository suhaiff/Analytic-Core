import React, { useEffect, useState, useRef } from 'react';
import {
    Brain, Plus, Sparkles, Trash2, Play, Loader2, AlertCircle,
    ArrowLeft, BarChart3, Calendar, Target as TargetIcon,
    RefreshCw, CheckCircle2, Upload, TrendingUp,
} from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { mlService } from '../../services/mlService';
import { MLModel, User } from '../../types';
import { MLModelBuilder } from './MLModelBuilder';
import { MLPredictor } from './MLPredictor';

type Mode = 'list' | 'build' | 'predict';

interface Props {
    user: User;
    onHome: () => void;
}

export const MLModelHub: React.FC<Props> = ({ user, onHome }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [mode, setMode] = useState<Mode>('list');
    const [models, setModels] = useState<MLModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeModel, setActiveModel] = useState<MLModel | null>(null);
    const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);

    useEffect(() => {
        loadModels();
        checkService();
    }, []);

    const checkService = async () => {
        try {
            const health = await mlService.health();
            setServiceAvailable(!!health.ok);
        } catch {
            setServiceAvailable(false);
        }
    };

    const loadModels = async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await mlService.listModels(user.id);
            setModels(list);
        } catch (e: any) {
            setError(e?.response?.data?.error || e.message || 'Failed to load models.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (model: MLModel) => {
        if (!window.confirm(`Delete model "${model.name}"? This cannot be undone.`)) return;
        try {
            await mlService.deleteModel(user.id, model.id);
            setModels(prev => prev.filter(m => m.id !== model.id));
        } catch (e: any) {
            alert(e?.response?.data?.error || e.message || 'Delete failed.');
        }
    };

    const handleRetrain = async (model: MLModel, file: File) => {
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
            await loadModels();
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            const msg = typeof detail === 'object'
                ? (detail.message || JSON.stringify(detail))
                : (detail || e.message);
            alert(msg || 'Retraining failed.');
        }
    };

    if (mode === 'build') {
        return (
            <MLModelBuilder
                user={user}
                onCancel={() => setMode('list')}
                onTrained={async () => {
                    await loadModels();
                    setMode('list');
                }}
            />
        );
    }

    if (mode === 'predict' && activeModel) {
        return (
            <MLPredictor
                user={user}
                model={activeModel}
                onBack={() => { setActiveModel(null); setMode('list'); }}
            />
        );
    }

    return (
        <div className={`${colors.bgPrimary} ${colors.textPrimary} min-h-screen p-6 sm:p-10`}>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onHome}
                            className={`flex items-center justify-center w-10 h-10 rounded-xl ${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition`}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
                                <Brain className="w-7 h-7 text-indigo-400" />
                                Prediction Models
                            </h1>
                            <p className={`text-xs ${colors.textMuted} mt-1`}>
                                Train models on your historical data and run predictions on new records.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setMode('build')}
                        disabled={serviceAvailable === false}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-900/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" /> New Model
                    </button>
                </div>

                {serviceAvailable === false && (
                    <div className="mb-5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">ML service is not running.</p>
                            <p className="text-xs mt-0.5">
                                Start the Python service and ensure <code className="mx-1">ML_SERVICE_URL</code> is set on the server.
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                {loading ? (
                    <div className={`${colors.textMuted} flex items-center gap-2 text-sm`}>
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading models…
                    </div>
                ) : models.length === 0 ? (
                    <div className={`${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl p-10 text-center`}>
                        <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                        <h3 className={`text-lg font-bold ${colors.textPrimary} mb-1`}>No models yet</h3>
                        <p className={`text-sm ${colors.textMuted} mb-5`}>
                            Upload historical data and train your first prediction model.
                        </p>
                        <button
                            onClick={() => setMode('build')}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Create Model
                        </button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {models.map(m => (
                            <ModelCard
                                key={m.id}
                                model={m}
                                colors={colors}
                                onPredict={() => { setActiveModel(m); setMode('predict'); }}
                                onDelete={() => handleDelete(m)}
                                onRetrain={handleRetrain}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

interface ModelCardProps {
    model: MLModel;
    colors: any;
    onPredict: () => void;
    onDelete: () => void;
    onRetrain: (model: MLModel, file: File) => Promise<void>;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, colors, onPredict, onDelete, onRetrain }) => {
    const main = pickMainMetric(model);
    const accuracy = getAccuracyPercent(model);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRetraining, setIsRetraining] = useState(false);

    const handleRetrainClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsRetraining(true);
        try {
            await onRetrain(model, file);
        } finally {
            setIsRetraining(false);
            // Reset file input so the same file can be reselected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const lastTrainedDate = model.updated_at || model.created_at;

    return (
        <div className={`${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl p-5 flex flex-col gap-3 hover:border-indigo-500/40 transition`}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wider ${colors.textMuted}`}>{prettyProblem(model.problem_type)}</p>
                    <h3 className={`text-lg font-bold ${colors.textPrimary} truncate`}>{model.name}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {prettyAlgorithm(model.algorithm)}
                </span>
            </div>

            {model.description && (
                <p className={`text-xs ${colors.textMuted} line-clamp-2`}>{model.description}</p>
            )}

            {/* Accuracy Bar */}
            {accuracy !== null && (
                <div className="mt-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} flex items-center gap-1`}>
                            <TrendingUp className="w-3 h-3" />
                            Model Accuracy
                        </span>
                        <span className={`text-xs font-bold ${accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                            {accuracy.toFixed(1)}%
                        </span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${colors.bgTertiary} overflow-hidden`}>
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${accuracy >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : accuracy >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                            style={{ width: `${Math.min(accuracy, 100)}%` }}
                        />
                    </div>
                    <p className={`text-[9px] ${colors.textMuted} mt-1`}>
                        Trained on {model.sample_size.toLocaleString()} rows · Feed more data to improve accuracy
                    </p>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-[11px]">
                <Stat colors={colors} icon={<TargetIcon className="w-3 h-3" />} label="Target" value={model.target_column} />
                <Stat colors={colors} icon={<BarChart3 className="w-3 h-3" />} label={main.label} value={main.value} />
                <Stat colors={colors} icon={<Calendar className="w-3 h-3" />} label="Last Trained" value={formatDate(lastTrainedDate)} />
            </div>

            <div className="flex items-center gap-2 mt-2">
                <button
                    onClick={onPredict}
                    className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                    <Play className="w-3.5 h-3.5" /> Predict
                </button>
                <button
                    onClick={handleRetrainClick}
                    disabled={isRetraining}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${isRetraining ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-500/20'} bg-emerald-500/10 text-emerald-400 border-emerald-500/30`}
                    title="Retrain with additional data"
                >
                    {isRetraining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {isRetraining ? 'Training…' : 'Retrain'}
                </button>
                <button
                    onClick={onDelete}
                    className={`p-2 rounded-xl ${colors.bgTertiary} ${colors.textMuted} hover:text-red-400 transition`}
                    title="Delete model"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Hidden file input for retrain */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileSelected}
            />
        </div>
    );
};

function Stat({ colors, icon, label, value }: { colors: any; icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className={`${colors.bgTertiary} rounded-lg px-2 py-1.5`}>
            <p className={`flex items-center gap-1 uppercase tracking-wider font-bold ${colors.textMuted} text-[9px] mb-0.5`}>
                {icon} {label}
            </p>
            <p className={`truncate font-semibold ${colors.textPrimary}`}>{value}</p>
        </div>
    );
}

function getAccuracyPercent(model: MLModel): number | null {
    const m = model.metrics || {};
    if (model.problem_type === 'classification') {
        if (typeof m.accuracy === 'number') return m.accuracy * 100;
        if (typeof m.f1_weighted === 'number') return m.f1_weighted * 100;
    } else {
        // For regression, R² can be used as accuracy (clamped to 0-100%)
        if (typeof m.r2 === 'number') return Math.max(0, m.r2) * 100;
    }
    return null;
}

function pickMainMetric(model: MLModel): { label: string; value: string } {
    const m = model.metrics || {};
    if (model.problem_type === 'classification') {
        if (typeof m.accuracy === 'number') return { label: 'Accuracy', value: `${(m.accuracy * 100).toFixed(1)}%` };
        if (typeof m.f1_weighted === 'number') return { label: 'F1', value: m.f1_weighted.toFixed(3) };
    } else {
        if (typeof m.r2 === 'number') return { label: 'R²', value: m.r2.toFixed(3) };
        if (typeof m.rmse === 'number') return { label: 'RMSE', value: m.rmse.toFixed(3) };
    }
    return { label: 'Metric', value: '—' };
}

function prettyAlgorithm(id: string) {
    return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function prettyProblem(p: string) {
    return p.charAt(0).toUpperCase() + p.slice(1);
}

function formatDate(iso: string) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString();
    } catch {
        return iso;
    }
}
