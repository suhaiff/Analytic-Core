import { Theme } from './ThemeContext';
export type { Theme };

export interface ThemeColors {
    // Backgrounds
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;

    // Borders
    borderPrimary: string;
    borderSecondary: string;
    borderHover: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textMuted: string;

    // Accents
    accentPrimary: string;
    accentPrimaryHover: string;
    accentSecondary: string;

    // Status colors
    success: string;
    successBorder: string;
    error: string;
    errorBorder: string;

    // Chart specific
    chartGrid: string;
    chartAxisText: string;
    chartTooltipBg: string;
    chartTooltipBorder: string;
    chartTooltipText: string;
    chartCursor: string;
    chartLegendText: string;
    chartLabelText: string;

    // Overlays
    overlayBg: string;
    modalBg: string;

    // Gradients (background ambience)
    gradientTop: string;
    gradientBottom: string;
}

export const themeConfig: Record<Theme, ThemeColors> = {
    dark: {
        // Backgrounds
        bgPrimary: 'bg-slate-950',
        bgSecondary: 'bg-[#0b0f1a]', // Deep rich Navy/Slate
        bgTertiary: 'bg-slate-900',

        // Borders
        borderPrimary: 'border-slate-800/60',
        borderSecondary: 'border-slate-800',
        borderHover: 'border-indigo-500/30',

        // Text
        textPrimary: 'text-white',
        textSecondary: 'text-slate-300',
        textTertiary: 'text-slate-400',
        textMuted: 'text-slate-500',

        // Accents
        accentPrimary: 'bg-indigo-600',
        accentPrimaryHover: 'hover:bg-indigo-500',
        accentSecondary: 'bg-violet-600',

        // Status colors
        success: 'text-emerald-400',
        successBorder: 'border-emerald-500/50',
        error: 'text-red-400',
        errorBorder: 'border-red-500/50',

        // Chart specific
        chartGrid: '#1e293b',
        chartAxisText: '#64748b',
        chartTooltipBg: '#0f172a',
        chartTooltipBorder: '#334155',
        chartTooltipText: '#f1f5f9',
        chartCursor: '#334155',
        chartLegendText: '#94a3b8',
        chartLabelText: '#cbd5e1',

        // Overlays
        overlayBg: 'bg-slate-950/80',
        modalBg: 'bg-slate-900',

        // Gradients
        gradientTop: 'bg-indigo-500/10',
        gradientBottom: 'bg-violet-500/10',
    },
    light: {
        // Backgrounds
        bgPrimary: 'bg-slate-50',
        bgSecondary: 'bg-white',
        bgTertiary: 'bg-slate-100',

        // Borders
        borderPrimary: 'border-slate-200',
        borderSecondary: 'border-slate-300',
        borderHover: 'border-slate-200',

        // Text
        textPrimary: 'text-slate-900',
        textSecondary: 'text-slate-600',
        textTertiary: 'text-slate-500',
        textMuted: 'text-slate-400',

        // Accents
        accentPrimary: 'bg-indigo-600',
        accentPrimaryHover: 'hover:bg-indigo-700',
        accentSecondary: 'bg-violet-600',

        // Status colors
        success: 'text-emerald-600',
        successBorder: 'border-emerald-600/50',
        error: 'text-red-600',
        errorBorder: 'border-red-600/50',

        // Chart specific
        chartGrid: '#e2e8f0',
        chartAxisText: '#64748b',
        chartTooltipBg: '#ffffff',
        chartTooltipBorder: '#e2e8f0',
        chartTooltipText: '#0f172a',
        chartCursor: '#f1f5f9',
        chartLegendText: '#64748b',
        chartLabelText: '#475569',

        // Overlays
        overlayBg: 'bg-slate-900/10',
        modalBg: 'bg-white',

        // Gradients
        gradientTop: 'bg-indigo-50/50',
        gradientBottom: 'bg-violet-50/50',
    }
};

export const getThemeClasses = (theme: Theme) => themeConfig[theme];
