import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { Sparkles, Database, LayoutDashboard, TrendingUp } from 'lucide-react';

interface DashboardLoaderProps {
    message?: string;
}

export const DashboardLoader: React.FC<DashboardLoaderProps> = ({ message }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const [statusIndex, setStatusIndex] = useState(0);

    const statuses = [
        "Ingesting data...",
        "Reading the file structure...",
        "Validating data integrity...",
        "Preparing data..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % statuses.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`fixed inset-0 z-[200] ${colors.overlayBg} glass-effect flex flex-col items-center justify-center p-8 animate-fade-in`}>
            <div className="relative w-full max-w-md">
                {/* Central Building Animation */}
                <div className="relative h-64 mb-12 flex items-center justify-center">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] animate-pulse-glow rounded-full"></div>

                    {/* Skeleton Dashboard Construction */}
                    <div className="relative z-10 w-full grid grid-cols-2 gap-4">
                        {/* KPI Skeleton 1 */}
                        <div className={`${colors.bgSecondary} border ${colors.borderPrimary} rounded-xl p-4 elevation-md animate-fade-in-up`}>
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 mb-3 animate-pulse"></div>
                            <div className="h-2 w-2/3 bg-slate-700/30 rounded mb-2 animate-pulse"></div>
                            <div className="h-4 w-1/2 bg-indigo-500/30 rounded animate-pulse"></div>
                        </div>

                        {/* KPI Skeleton 2 */}
                        <div className={`${colors.bgSecondary} border ${colors.borderPrimary} rounded-xl p-4 elevation-md animate-fade-in-up delay-100`}>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 mb-3 animate-pulse"></div>
                            <div className="h-2 w-2/3 bg-slate-700/30 rounded mb-2 animate-pulse"></div>
                            <div className="h-4 w-1/2 bg-emerald-500/30 rounded animate-pulse"></div>
                        </div>

                        {/* Chart Skeleton */}
                        <div className={`${colors.bgSecondary} border ${colors.borderPrimary} rounded-xl p-4 col-span-2 elevation-lg animate-fade-in-up delay-200 h-32 flex flex-col`}>
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-3 w-1/3 bg-slate-700/30 rounded animate-pulse"></div>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500/40"></div>
                                    <div className="w-2 h-2 rounded-full bg-violet-500/40"></div>
                                </div>
                            </div>
                            <div className="flex-1 flex items-end gap-2 px-2">
                                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-gradient-to-t from-indigo-500/20 to-indigo-500/40 rounded-t-sm animate-bar-grow"
                                        style={{ animationDelay: `${i * 0.1}s`, height: `${h}%` }}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    
                </div>

                {/* Status Text */}
                <div className="text-center">
                    <h2 className={`text-xl font-bold ${colors.textPrimary} mb-2 tracking-tight`}>
                        {message || "Preparing Dashboard"}
                    </h2>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-400"></div>
                        <span className={`${colors.textMuted} text-sm font-medium min-w-[180px]`}>
                            {statuses[statusIndex]}
                        </span>
                    </div>
                </div>
            </div>

            {/* Decorative Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full -z-10"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/5 blur-[120px] rounded-full -z-10"></div>
        </div>
    );
};
