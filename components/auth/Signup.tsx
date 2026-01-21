import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { UserPlus, Mail, Lock, Unlock, User, AlertCircle, X, ArrowRight } from 'lucide-react';

interface SignupProps {
    onSignupSuccess: () => void;
    onNavigateToLogin: () => void;
    onBack: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSignupSuccess, onNavigateToLogin, onBack }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isDark = theme === 'dark';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.signup(name, email, password);
            onSignupSuccess();
        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center mesh-gradient p-4 relative overflow-hidden font-jakarta w-full`}>
            <div className="noise-bg"></div>

            {/* Animated Light Blobs */}
            <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/20'} blur-[140px] rounded-full animate-pulse-glow`}></div>
            <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${isDark ? 'bg-violet-600/20' : 'bg-violet-400/20'} blur-[140px] rounded-full animate-pulse-glow delay-700`}></div>

            <div className={`max-w-[400px] w-full auth-glass-card rounded-[32px] p-6 sm:p-8 relative z-10 animate-fade-in-up mx-4 overflow-hidden`}>
                {/* Glossy Reflection Overlay */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                <button
                    onClick={onBack}
                    className={`absolute top-6 right-6 p-2 rounded-full hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition-all duration-300 z-20 active-press`}
                    title="Go back"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-10 relative">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-indigo-500 blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                        <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 w-14 h-14 rounded-[18px] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/40 transform group-hover:scale-110 transition-transform duration-700">
                            <UserPlus className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h2 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight mb-2 font-poppins`}>
                        Create Account
                    </h2>
                    <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} text-base font-medium opacity-90`}>
                        Join InsightAI today
                    </p>
                </div>

                {error && (
                    <div className={`mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 animate-shake`}>
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="space-y-2.5">
                        <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                            Full Name
                        </label>
                        <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300">
                                <User className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={`w-full bg-transparent border-none py-5 pl-12 pr-4 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                            Email Address
                        </label>
                        <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full bg-transparent border-none py-5 pl-12 pr-4 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                            Password
                        </label>
                        <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full bg-transparent border-none py-5 pl-12 pr-14 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition-all duration-300 p-1.5 rounded-lg hover:bg-white/5"
                            >
                                {showPassword ? (
                                    <Unlock className="w-5 h-5 animate-lock-bounce" />
                                ) : (
                                    <Lock className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-2xl transition-all duration-500 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 active-press disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none"></div>
                        <div className="relative flex items-center justify-center gap-3">
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="text-base tracking-wide">Create Account</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                                </>
                            )}
                        </div>
                    </button>
                </form>

                <div className={`mt-10 text-center text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Already have an account?{' '}
                    <button onClick={onNavigateToLogin} className="text-indigo-400 hover:text-indigo-300 font-black hover:underline underline-offset-8 transition-all px-1">
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};
