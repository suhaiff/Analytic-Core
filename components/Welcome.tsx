import React from 'react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { Sparkles, ArrowRight, BarChart3, Shield, Zap } from 'lucide-react';
import { Footer } from './Footer';

interface WelcomeProps {
    onNavigateToLogin: () => void;
    onNavigateToSignup: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNavigateToLogin, onNavigateToSignup }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    return (
        <div className={`min-h-screen flex flex-col relative overflow-hidden ${colors.bgPrimary}`}>
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className={`absolute top-0 left-0 w-full h-full ${colors.gradientTop} blur-[80px] sm:blur-[120px] opacity-40`}></div>
                <div className={`absolute bottom-0 right-0 w-full h-full ${colors.gradientBottom} blur-[80px] sm:blur-[120px] opacity-40`}></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg shadow-indigo-500/20">
                        <Sparkles className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h1 className={`text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'}`}>
                        AnalyticCore
                    </h1>
                </div>
                <div className="flex gap-2 sm:gap-4">
                    <button
                        onClick={onNavigateToLogin}
                        className={`px-3 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg sm:rounded-xl font-medium transition-all ${colors.textMuted} hover:${colors.textPrimary} hover:${colors.bgTertiary}`}
                    >
                        Log In
                    </button>
                    <button
                        onClick={onNavigateToSignup}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5"
                    >
                        Sign Up
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-5xl mx-auto w-full pb-12 sm:pb-20 pt-8 sm:pt-0">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    AI-Powered Analytics Platform
                </div>

                <h1 className={`text-4xl sm:text-6xl md:text-7xl font-extrabold ${colors.textPrimary} tracking-tight mb-6 sm:mb-8 leading-[1.1] sm:leading-tight animate-fade-in-up delay-100`}>
                    Turn Data into <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 block sm:inline mt-2 sm:mt-0">
                        Actionable Insights
                    </span>
                </h1>

                <p className={`text-base sm:text-xl ${colors.textMuted} max-w-2xl mb-8 sm:mb-12 leading-relaxed animate-fade-in-up delay-200 px-2`}>
                    Upload your data, ask questions, and get professional dashboards in seconds.
                    Powered by advanced AI to help you make smarter decisions faster.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto animate-fade-in-up delay-300 px-2 sm:px-0">
                    <button
                        onClick={onNavigateToSignup}
                        className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base sm:text-lg transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                        Get Started for Free
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onNavigateToLogin}
                        className={`w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl ${colors.bgSecondary} border ${colors.borderPrimary} ${colors.textPrimary} font-bold text-base sm:text-lg hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-xl`}
                    >
                        Existing User?
                    </button>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 mt-16 sm:mt-24 w-full animate-fade-in-up delay-500">
                    {[
                        { icon: Zap, title: "Instant Analysis", desc: "Upload CSV/Excel and get charts instantly." },
                        { icon: BarChart3, title: "Smart Dashboards", desc: "AI builds the perfect visualization for you." },
                        { icon: Shield, title: "Secure Storage", desc: "Your data is encrypted and safe with us." }
                    ].map((feature, idx) => (
                        <div key={idx} className={`p-5 sm:p-6 rounded-xl sm:rounded-2xl ${colors.bgSecondary} border ${colors.borderPrimary} text-left hover:border-indigo-500/30 transition-colors group`}>
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${colors.bgTertiary} flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-indigo-500/10 transition-colors`}>
                                <feature.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.textMuted} group-hover:text-indigo-400 transition-colors`} />
                            </div>
                            <h3 className={`text-base sm:text-lg font-bold ${colors.textPrimary} mb-1 sm:mb-2`}>{feature.title}</h3>
                            <p className={`text-sm sm:text-base ${colors.textMuted}`}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </main>
            
            <Footer />
        </div>
    );
};
