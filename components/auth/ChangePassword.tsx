import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { ShieldCheck, Lock, Unlock, AlertCircle, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';

interface ChangePasswordProps {
    userId: number;
    userName: string;
    tempPassword: string;
    onPasswordChanged: () => void;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ userId, userName, tempPassword, onPasswordChanged }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isDark = theme === 'dark';

    const passwordStrength = (): { label: string; color: string; width: string } => {
        if (newPassword.length === 0) return { label: '', color: '', width: '0%' };
        if (newPassword.length < 8) return { label: 'Too short', color: 'bg-red-500', width: '25%' };
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSpecial = /[!@#$%^&*]/.test(newPassword);
        const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
        if (strength <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
        if (strength === 2) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
        if (strength === 3) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
        return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
    };

    const strength = passwordStrength();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword(userId, tempPassword, newPassword);
            onPasswordChanged();
        } catch (err: any) {
            setError(err.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center mesh-gradient p-4 relative overflow-hidden font-jakarta w-full`}>
            <div className="noise-bg"></div>

            <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${isDark ? 'bg-emerald-600/20' : 'bg-emerald-400/20'} blur-[140px] rounded-full animate-pulse-glow`}></div>
            <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/20'} blur-[140px] rounded-full animate-pulse-glow delay-700`}></div>

            <div className={`max-w-[420px] w-full auth-glass-card rounded-[32px] p-6 sm:p-8 relative z-10 animate-fade-in-up mx-4 overflow-hidden`}>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                <div className="text-center mb-10 relative">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-emerald-500 blur-[30px] opacity-20"></div>
                        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 w-14 h-14 rounded-[18px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                            <ShieldCheck className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h2 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight mb-2 font-poppins`}>
                        Set Your Password
                    </h2>
                    <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} text-base font-medium opacity-90`}>
                        Welcome, <span className="text-emerald-400 font-bold">{userName}</span>! Create a secure password for your account.
                    </p>
                </div>

                {error && (
                    <div className={`mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 animate-shake`}>
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-7 relative">
                    <div className="space-y-2.5">
                        <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                            New Password
                        </label>
                        <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors duration-300">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={`w-full bg-transparent border-none py-5 pl-12 pr-14 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                placeholder="Enter new password"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-all duration-300 p-1.5 rounded-lg hover:bg-white/5"
                            >
                                {showNew ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                            </button>
                        </div>
                        {/* Password strength meter */}
                        {newPassword.length > 0 && (
                            <div className="px-1 space-y-1.5">
                                <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                    <div className={`h-full rounded-full transition-all duration-500 ${strength.color}`} style={{ width: strength.width }}></div>
                                </div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {strength.label}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                            Confirm Password
                        </label>
                        <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors duration-300">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full bg-transparent border-none py-5 pl-12 pr-14 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                placeholder="Confirm new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-all duration-300 p-1.5 rounded-lg hover:bg-white/5"
                            >
                                {showConfirm ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                            </button>
                        </div>
                        {confirmPassword.length > 0 && (
                            <div className="flex items-center gap-2 px-1">
                                {newPassword === confirmPassword ? (
                                    <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Passwords match</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Passwords don't match</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                        className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-2xl transition-all duration-500 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 active-press disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none"></div>
                        <div className="relative flex items-center justify-center gap-3">
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="text-base tracking-wide">Set Password & Continue</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                                </>
                            )}
                        </div>
                    </button>
                </form>
            </div>
        </div>
    );
};
