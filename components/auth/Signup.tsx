import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { UserPlus, Mail, User, AlertCircle, X, ArrowRight, Phone, Building, Briefcase, Globe, CheckCircle2, Send } from 'lucide-react';

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
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [domain, setDomain] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [signupComplete, setSignupComplete] = useState(false);

    const isDark = theme === 'dark';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.signup(name, email, phone, company, jobTitle, domain);
            setSignupComplete(true);
        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    // Success screen after signup
    if (signupComplete) {
        return (
            <div className={`min-h-screen flex items-center justify-center mesh-gradient p-4 relative overflow-hidden font-jakarta w-full`}>
                <div className="noise-bg"></div>
                <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${isDark ? 'bg-emerald-600/20' : 'bg-emerald-400/20'} blur-[140px] rounded-full animate-pulse-glow`}></div>
                <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/20'} blur-[140px] rounded-full animate-pulse-glow delay-700`}></div>

                <div className={`max-w-[420px] w-full auth-glass-card rounded-[32px] p-8 sm:p-10 relative z-10 animate-fade-in-up mx-4 overflow-hidden text-center`}>
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                    
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-emerald-500 blur-[30px] opacity-30"></div>
                        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                            <Send className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <h2 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight mb-3 font-poppins`}>
                        Check Your Email!
                    </h2>
                    <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} text-base font-medium mb-6 leading-relaxed`}>
                        We've sent a temporary password to<br />
                        <span className="text-indigo-400 font-bold">{email}</span>
                    </p>

                    <div className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                        <p className={`text-sm font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'} leading-relaxed`}>
                            Use the temporary password from your email to log in. You'll be prompted to set a new password on first login.
                        </p>
                    </div>

                    <button
                        onClick={onNavigateToLogin}
                        className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-2xl transition-all duration-500 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 active-press"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none"></div>
                        <div className="relative flex items-center justify-center gap-3">
                            <span className="text-base tracking-wide">Go to Login</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex items-center justify-center mesh-gradient p-4 relative overflow-hidden font-jakarta w-full`}>
            <div className="noise-bg"></div>

            {/* Animated Light Blobs */}
            <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/20'} blur-[140px] rounded-full animate-pulse-glow`}></div>
            <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${isDark ? 'bg-violet-600/20' : 'bg-violet-400/20'} blur-[140px] rounded-full animate-pulse-glow delay-700`}></div>

            <div className={`max-w-[400px] w-full max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar auth-glass-card rounded-[32px] p-6 sm:p-8 relative z-10 animate-fade-in-up mx-4`}>
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

                    {/* Info: Password will be emailed */}
                    <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                            <p className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'} leading-relaxed`}>
                                A temporary password will be sent to your email. Use it to log in and set your own password.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                            Phone Number
                        </label>
                        <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300">
                                <Phone className="w-5 h-5" />
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={`w-full bg-transparent border-none py-5 pl-12 pr-4 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                            Business
                        </label>
                        <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300">
                                <Building className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className={`w-full bg-transparent border-none py-5 pl-12 pr-4 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                placeholder="InsightAI Corp"
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                            Domain
                        </label>
                        <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300">
                                <Globe className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                className={`w-full bg-transparent border-none py-5 pl-12 pr-4 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                placeholder="Technology"
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                            Job Title
                        </label>
                        <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                className={`w-full bg-transparent border-none py-5 pl-12 pr-4 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                placeholder="Data Analyst"
                            />
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
