import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Settings, ChevronDown, User as UserIcon, Info, HelpCircle, X, ArrowRight, Sparkles } from 'lucide-react';
import { User as UserType } from '../../types';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';

interface ProfileMenuProps {
    user: UserType | null;
    onLogout: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ user, onLogout }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    // Close on ESC
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsDropdownOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    if (!user) return null;

    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : 'U';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Collapsed State: Avatar */}
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2.5 p-1 sm:p-1.5 rounded-full transition-all duration-300 group ${isDropdownOpen
                    ? `${colors.bgTertiary} ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20`
                    : `hover:${colors.bgTertiary} hover:shadow-md`
                    }`}
            >
                <div className="relative">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-inner transform group-hover:scale-105 transition-transform duration-300`}>
                        {initials}
                    </div>
                    {/* Status Dot */}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                <ChevronDown className={`w-4 h-4 ${colors.textMuted} transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div className={`absolute right-0 mt-3 w-72 origin-top-right z-[100] animate-fade-in-up`}>
                    <div className={`auth-glass-card rounded-2xl overflow-hidden shadow-2xl border ${colors.borderPrimary} relative`}>
                        {/* Internal Glossy Reflection */}
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

                        {/* Header/User Info */}
                        <div className="p-6 text-center relative">
                            <button
                                onClick={() => { setIsDropdownOpen(false); }}
                                className={`absolute top-4 right-4 p-2 rounded-lg ${colors.textMuted} hover:${colors.textPrimary} hover:${colors.bgTertiary} transition-all hover:rotate-90 duration-500`}
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>

                            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-2xl ring-4 ring-indigo-500/20 mb-4 transform hover:scale-110 transition-transform duration-500 cursor-default">
                                {initials}
                            </div>

                            <div className="space-y-1">
                                <p className={`text-xs font-bold uppercase tracking-[2px] ${colors.textMuted} opacity-60`}>Welcome,</p>
                                <h3 className={`text-xl font-bold ${colors.textPrimary} leading-tight truncate px-2`}>
                                    {user.name}
                                </h3>
                                <p className={`text-xs ${colors.textMuted} truncate`}>{user.email}</p>
                            </div>
                        </div>

                        {/* Menu Actions */}
                        <div className={`p-2 border-t ${colors.borderPrimary}`}>
                            <button
                                onClick={() => { setShowAbout(true); setIsDropdownOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${colors.textSecondary} hover:${colors.textPrimary} hover:${colors.bgTertiary}`}
                            >
                                <div className={`p-2 rounded-lg ${colors.bgPrimary} group-hover:bg-indigo-500/10 transition-colors`}>
                                    <Info className="w-4 h-4 text-indigo-400" />
                                </div>
                                <span className="font-semibold text-sm">About AnalyticCore</span>
                            </button>

                            <button
                                onClick={() => { setShowHelp(true); setIsDropdownOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${colors.textSecondary} hover:${colors.textPrimary} hover:${colors.bgTertiary}`}
                            >
                                <div className={`p-2 rounded-lg ${colors.bgPrimary} group-hover:bg-indigo-500/10 transition-colors`}>
                                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                                </div>
                                <span className="font-semibold text-sm">Help & Resources</span>
                            </button>
                        </div>

                        {/* Footer/Logout */}
                        <div className={`p-4 bg-black/5 dark:bg-white/5 flex flex-col gap-2`}>
                            <button
                                onClick={() => { onLogout(); setIsDropdownOpen(false); }}
                                className="w-full relative group overflow-hidden bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold py-3 rounded-xl transition-all duration-500 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 active-press"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm">Log Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showAbout && (
                <Modal
                    title="About AnalyticCore"
                    onClose={() => setShowAbout(false)}
                    colors={colors}
                    theme={theme}
                >
                    <div className="space-y-4">
                        <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-500 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="font-bold text-indigo-400">Version 1.0 (Nitro)</h4>
                            </div>
                            <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                                AnalyticCore is a premium AI-powered analytics platform designed to turn raw data into actionable insights instantly using Gemini 2.0 Flash models.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pb-2">
                            <div className={`p-3 rounded-xl border ${colors.borderPrimary} ${colors.bgTertiary}`}>
                                <p className={`text-[10px] font-bold uppercase ${colors.textMuted} mb-1`}>Engineer</p>
                                <p className={`text-sm font-bold ${colors.textPrimary}`}>VTAB Square Team</p>
                            </div>
                            <div className={`p-3 rounded-xl border ${colors.borderPrimary} ${colors.bgTertiary}`}>
                                <p className={`text-[10px] font-bold uppercase ${colors.textMuted} mb-1`}>Status</p>
                                <p className={`text-sm font-bold text-green-500 flex items-center gap-1`}>
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Production Ready
                                </p>
                            </div>
                        </div>
                        <p className={`text-xs ${colors.textMuted} italic text-center text-balance`}>
                            © 2025 Vtab Square Technologies. All rights reserved.
                        </p>
                    </div>
                </Modal>
            )}

            {showHelp && (
                <Modal
                    title="User Manual & Help"
                    onClose={() => setShowHelp(false)}
                    colors={colors}
                    theme={theme}
                >
                    <div className="space-y-5">
                        {[
                            { title: "Uploading Data", desc: "Drag and drop your CSV or Excel files directly onto the landing page." },
                            { title: "AI Generation", desc: "Our AI automatically suggests the best visualizations for your data type." },
                            { title: "Live Sync", desc: "Connect Google Sheets for real-time dashboard updates." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className={`mt-1 w-6 h-6 rounded-full border-2 border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-400 group-hover:border-indigo-500 transition-colors shrink-0`}>
                                    {i + 1}
                                </div>
                                <div>
                                    <h5 className={`font-bold ${colors.textPrimary} text-sm mb-1`}>{item.title}</h5>
                                    <p className={`text-xs ${colors.textMuted} leading-relaxed`}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                        <button className="w-full mt-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-sm hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2">
                            Download Full PDF Guide
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    colors: any;
    theme: any;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, colors, theme }) => {
    return createPortal(
        <div className="fixed inset-0 z-[110] backdrop-blur-md bg-black/40 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div
                className={`${theme === 'dark' ? 'bg-slate-900/95' : 'bg-white/95'} border ${colors.borderPrimary} rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fade-in-up relative`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold ${colors.textPrimary}`}>{title}</h3>
                    <button onClick={onClose} className={`p-2 rounded-xl hover:${colors.bgTertiary} transition-colors ${colors.textMuted} hover:${colors.textPrimary}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
};
