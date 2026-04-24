import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Minus, Maximize2, Minimize2, Sparkles, ChevronDown } from 'lucide-react';
import {
    ChartConfig,
    AnalyticsLinesConfig,
    AnalyticsLineStyle,
    ForecastOptions,
    ForecastUnits,
    AnalyticsLineStyleKind,
} from '../types';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';

interface Props {
    chart: ChartConfig;
    onClose: () => void;
    onSave: (analytics: AnalyticsLinesConfig, shouldSpawnForecastChart: boolean) => void;
}

const DEFAULTS: Required<AnalyticsLinesConfig> = {
    trendline: { enabled: false, color: '#6366f1', transparency: 0, lineStyle: 'dashed', dataLabels: false },
    min:       { enabled: false, color: '#22c55e', transparency: 0, lineStyle: 'dashed', dataLabels: true },
    max:       { enabled: false, color: '#ef4444', transparency: 0, lineStyle: 'dashed', dataLabels: true },
    average:   { enabled: false, color: '#f59e0b', transparency: 0, lineStyle: 'dashed', dataLabels: true },
    forecast:  {
        enabled: false,
        color: '#8b5cf6',
        transparency: 0,
        lineStyle: 'dashed',
        dataLabels: false,
        length: 10,
        ignoreLast: 0,
        units: 'points',
        confidenceLevel: 95,
        bandColor: '#8b5cf6',
        bandTransparency: 80,
        showConfidenceBand: true,
    },
};

const mergeStyle = (base: AnalyticsLineStyle, override?: AnalyticsLineStyle): AnalyticsLineStyle => ({
    ...base,
    ...(override || {}),
});

const mergeForecast = (base: ForecastOptions, override?: ForecastOptions): ForecastOptions => ({
    ...base,
    ...(override || {}),
});

export const ChartAnalyticsModal: React.FC<Props> = ({ chart, onClose, onSave }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const initial: Required<AnalyticsLinesConfig> = useMemo(() => ({
        trendline: mergeStyle(DEFAULTS.trendline, chart.analytics?.trendline),
        min:       mergeStyle(DEFAULTS.min,       chart.analytics?.min),
        max:       mergeStyle(DEFAULTS.max,       chart.analytics?.max),
        average:   mergeStyle(DEFAULTS.average,   chart.analytics?.average),
        forecast:  mergeForecast(DEFAULTS.forecast, chart.analytics?.forecast),
    }), [chart.analytics]);

    const [state, setState] = useState<Required<AnalyticsLinesConfig>>(initial);

    const updateStyle = (
        key: 'trendline' | 'min' | 'max' | 'average',
        patch: Partial<AnalyticsLineStyle>,
    ) => {
        setState(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    };

    const updateForecast = (patch: Partial<ForecastOptions>) => {
        setState(prev => ({ ...prev, forecast: { ...prev.forecast, ...patch } }));
    };

    // Detect if forecast is being newly enabled (wasn't enabled before, now is)
    const wasForecastEnabled = !!chart.analytics?.forecast?.enabled;

    const handleApply = () => {
        const isNowEnabled = !!state.forecast.enabled;
        const shouldSpawn = isNowEnabled && !wasForecastEnabled && !chart.isForecastChart;
        onSave(state, shouldSpawn);
        onClose();
    };

    const handleReset = () => {
        setState({
            trendline: { ...DEFAULTS.trendline },
            min: { ...DEFAULTS.min },
            max: { ...DEFAULTS.max },
            average: { ...DEFAULTS.average },
            forecast: { ...DEFAULTS.forecast },
        });
    };

    return (
        <div className={`fixed inset-0 z-[60] ${colors.overlayBg} glass-effect flex items-center justify-center p-4 animate-fade-in no-print`}>
            <div className={`${colors.bgSecondary} w-full max-w-2xl max-h-[90vh] rounded-2xl border ${colors.borderPrimary} shadow-2xl flex flex-col`}>
                {/* Header */}
                <div className={`px-6 py-4 border-b ${colors.borderPrimary} flex items-start justify-between`}>
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <h2 className={`text-lg font-bold ${colors.textPrimary}`}>Line Chart Analytics</h2>
                        </div>
                        <p className={`text-xs ${colors.textMuted} mt-0.5`}>
                            Add trendlines, reference lines and forecasts to <span className="font-semibold">{chart.title}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg ${colors.bgTertiary} hover:bg-red-500/20 hover:text-red-500 ${colors.textMuted} transition-colors`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    <LineStyleSection
                        title="Trend line"
                        icon={<TrendingUp className="w-4 h-4" />}
                        style={state.trendline}
                        onChange={(patch) => updateStyle('trendline', patch)}
                        colors={colors}
                    />
                    <LineStyleSection
                        title="Min line"
                        icon={<Minimize2 className="w-4 h-4" />}
                        style={state.min}
                        onChange={(patch) => updateStyle('min', patch)}
                        colors={colors}
                    />
                    <LineStyleSection
                        title="Max line"
                        icon={<Maximize2 className="w-4 h-4" />}
                        style={state.max}
                        onChange={(patch) => updateStyle('max', patch)}
                        colors={colors}
                    />
                    <LineStyleSection
                        title="Average line"
                        icon={<Minus className="w-4 h-4" />}
                        style={state.average}
                        onChange={(patch) => updateStyle('average', patch)}
                        colors={colors}
                    />
                    <ForecastSection
                        forecast={state.forecast}
                        onChange={updateForecast}
                        colors={colors}
                    />
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t ${colors.borderPrimary} flex items-center justify-between gap-2`}>
                    <button
                        onClick={handleReset}
                        className={`text-xs font-semibold px-3 py-2 rounded-lg ${colors.textMuted} hover:${colors.textPrimary} hover:${colors.bgTertiary} transition-colors`}
                    >
                        Reset to defaults
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className={`text-xs font-semibold px-4 py-2 rounded-lg ${colors.bgTertiary} ${colors.textSecondary} hover:${colors.textPrimary} transition-colors`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            className="text-xs font-bold px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ----- Sub-components -----

interface StyleRowProps {
    title: string;
    icon: React.ReactNode;
    style: AnalyticsLineStyle;
    onChange: (patch: Partial<AnalyticsLineStyle>) => void;
    colors: ReturnType<typeof getThemeClasses>;
}

const LineStyleSection: React.FC<StyleRowProps> = ({ title, icon, style, onChange, colors }) => {
    const enabled = !!style.enabled;
    return (
        <div className={`border ${colors.borderPrimary} rounded-xl p-4 ${enabled ? colors.bgTertiary + '/30' : ''} transition-colors`}>
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => onChange({ enabled: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600"
                    />
                    <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${colors.textPrimary}`}>
                        {icon}
                        {title}
                    </span>
                </label>
            </div>
            {enabled && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                    <ColorField
                        label="Color"
                        value={style.color || '#6366f1'}
                        onChange={(v) => onChange({ color: v })}
                        colors={colors}
                    />
                    <SelectField
                        label="Line style"
                        value={style.lineStyle || 'dashed'}
                        onChange={(v) => onChange({ lineStyle: v as AnalyticsLineStyleKind })}
                        options={[
                            { label: 'Solid', value: 'solid' },
                            { label: 'Dashed', value: 'dashed' },
                            { label: 'Dotted', value: 'dotted' },
                        ]}
                        colors={colors}
                    />
                    <SliderField
                        label="Transparency"
                        value={style.transparency ?? 0}
                        onChange={(v) => onChange({ transparency: v })}
                        colors={colors}
                    />
                    <ToggleField
                        label="Data labels"
                        value={!!style.dataLabels}
                        onChange={(v) => onChange({ dataLabels: v })}
                        colors={colors}
                    />
                </div>
            )}
        </div>
    );
};

interface ForecastSectionProps {
    forecast: ForecastOptions;
    onChange: (patch: Partial<ForecastOptions>) => void;
    colors: ReturnType<typeof getThemeClasses>;
}

const ForecastSection: React.FC<ForecastSectionProps> = ({ forecast, onChange, colors }) => {
    const enabled = !!forecast.enabled;
    return (
        <div className={`border ${colors.borderPrimary} rounded-xl p-4 ${enabled ? colors.bgTertiary + '/30' : ''} transition-colors`}>
            <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => onChange({ enabled: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600"
                />
                <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${colors.textPrimary}`}>
                    <Sparkles className="w-4 h-4" />
                    Forecast
                </span>
            </label>

            {enabled && (
                <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <SelectField
                            label="Units"
                            value={forecast.units || 'points'}
                            onChange={(v) => onChange({ units: v as ForecastUnits })}
                            options={[
                                { label: 'Points', value: 'points' },
                                { label: 'Days', value: 'days' },
                                { label: 'Months', value: 'months' },
                                { label: 'Years', value: 'years' },
                            ]}
                            colors={colors}
                        />
                        <NumberField
                            label="Forecast length"
                            value={forecast.length ?? 10}
                            min={1}
                            max={500}
                            onChange={(v) => onChange({ length: v })}
                            colors={colors}
                        />
                        <SelectField
                            label="Confidence interval"
                            value={String(forecast.confidenceLevel ?? 95)}
                            onChange={(v) => onChange({ confidenceLevel: Number(v) })}
                            options={[
                                { label: '50%', value: '50' },
                                { label: '75%', value: '75' },
                                { label: '85%', value: '85' },
                                { label: '90%', value: '90' },
                                { label: '95%', value: '95' },
                                { label: '99%', value: '99' },
                            ]}
                            colors={colors}
                        />
                    </div>

                    <div className={`border-t ${colors.borderPrimary} pt-3`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${colors.textMuted} mb-2`}>Forecast Line</p>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorField
                                label="Color"
                                value={forecast.color || '#8b5cf6'}
                                onChange={(v) => onChange({ color: v })}
                                colors={colors}
                            />
                            <SelectField
                                label="Line style"
                                value={forecast.lineStyle || 'dashed'}
                                onChange={(v) => onChange({ lineStyle: v as AnalyticsLineStyleKind })}
                                options={[
                                    { label: 'Solid', value: 'solid' },
                                    { label: 'Dashed', value: 'dashed' },
                                    { label: 'Dotted', value: 'dotted' },
                                ]}
                                colors={colors}
                            />
                            <SliderField
                                label="Transparency"
                                value={forecast.transparency ?? 0}
                                onChange={(v) => onChange({ transparency: v })}
                                colors={colors}
                            />
                            <ToggleField
                                label="Data labels"
                                value={!!forecast.dataLabels}
                                onChange={(v) => onChange({ dataLabels: v })}
                                colors={colors}
                            />
                        </div>
                    </div>

                    <div className={`border-t ${colors.borderPrimary} pt-3`}>
                        <div className="flex items-center justify-between mb-2">
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${colors.textMuted}`}>Confidence Band</p>
                            <ToggleField
                                label="Show band"
                                value={forecast.showConfidenceBand !== false}
                                onChange={(v) => onChange({ showConfidenceBand: v })}
                                colors={colors}
                                inline
                            />
                        </div>
                        {forecast.showConfidenceBand !== false && (
                            <div className="grid grid-cols-2 gap-3">
                                <ColorField
                                    label="Band color"
                                    value={forecast.bandColor || forecast.color || '#8b5cf6'}
                                    onChange={(v) => onChange({ bandColor: v })}
                                    colors={colors}
                                />
                                <SliderField
                                    label="Band transparency"
                                    value={forecast.bandTransparency ?? 80}
                                    onChange={(v) => onChange({ bandTransparency: v })}
                                    colors={colors}
                                />
                            </div>
                        )}
                    </div>

                    <div className={`border-t ${colors.borderPrimary} pt-3`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${colors.textMuted} mb-2`}>Data Filtering</p>
                        <div className="grid grid-cols-2 gap-3">
                            <NumberField
                                label="Old data filter (Years)"
                                value={forecast.oldDataFilterYears ?? 0}
                                min={0}
                                max={50}
                                onChange={(v) => onChange({ oldDataFilterYears: v })}
                                colors={colors}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Form controls ---

interface FieldProps { label: string; colors: ReturnType<typeof getThemeClasses>; }

const ColorField: React.FC<FieldProps & { value: string; onChange: (v: string) => void }> = ({ label, value, onChange, colors }) => (
    <div>
        <label className={`block text-[10px] font-bold uppercase tracking-widest ${colors.textMuted} mb-1`}>{label}</label>
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${colors.bgPrimary} border ${colors.borderSecondary}`}>
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
            />
            <span className={`text-xs font-mono ${colors.textSecondary}`}>{value.toUpperCase()}</span>
        </div>
    </div>
);

const SliderField: React.FC<FieldProps & { value: number; onChange: (v: number) => void }> = ({ label, value, onChange, colors }) => (
    <div>
        <div className="flex items-center justify-between">
            <label className={`block text-[10px] font-bold uppercase tracking-widest ${colors.textMuted} mb-1`}>{label}</label>
            <span className={`text-[10px] font-mono ${colors.textSecondary}`}>{value}%</span>
        </div>
        <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-indigo-600"
        />
    </div>
);

const NumberField: React.FC<FieldProps & { value: number; onChange: (v: number) => void; min?: number; max?: number }> = ({ label, value, onChange, colors, min, max }) => (
    <div>
        <label className={`block text-[10px] font-bold uppercase tracking-widest ${colors.textMuted} mb-1`}>{label}</label>
        <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isNaN(v)) return;
                let next = v;
                if (min !== undefined && next < min) next = min;
                if (max !== undefined && next > max) next = max;
                onChange(next);
            }}
            className={`w-full px-3 py-1.5 text-xs rounded-lg ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none`}
        />
    </div>
);

const SelectField: React.FC<FieldProps & { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }> = ({ label, value, onChange, options, colors }) => (
    <div>
        <label className={`block text-[10px] font-bold uppercase tracking-widest ${colors.textMuted} mb-1`}>{label}</label>
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full appearance-none px-3 py-1.5 pr-8 text-xs rounded-lg ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none`}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            <ChevronDown className={`w-3.5 h-3.5 ${colors.textMuted} absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none`} />
        </div>
    </div>
);

const ToggleField: React.FC<FieldProps & { value: boolean; onChange: (v: boolean) => void; inline?: boolean }> = ({ label, value, onChange, colors, inline }) => (
    <div className={inline ? 'flex items-center gap-2' : ''}>
        {!inline && (
            <label className={`block text-[10px] font-bold uppercase tracking-widest ${colors.textMuted} mb-1`}>{label}</label>
        )}
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : `${colors.bgPrimary} ${colors.textSecondary} ${colors.borderSecondary}`
            }`}
        >
            <span className={`w-2 h-2 rounded-full ${value ? 'bg-white' : colors.textMuted.replace('text-', 'bg-')}`} />
            {value ? 'On' : 'Off'}
            {inline && <span className="ml-1">{label}</span>}
        </button>
    </div>
);

export default ChartAnalyticsModal;
