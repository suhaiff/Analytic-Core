import React, { useEffect, useState } from 'react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { 
    Sparkles, 
    ArrowRight, 
    BarChart3, 
    Shield, 
    Database, 
    Brain, 
    Users, 
    Lock, 
    CheckCircle2, 
    Code,
    MessageSquare,
    Link as LinkIcon,
    Terminal,
    ChevronRight
} from 'lucide-react';
import { Footer } from './Footer';
import { motion, useScroll, useTransform } from 'framer-motion';
import welcomePageImage from './images/welcome_page_image.png';
import { ChartMarquee } from './ChartMarquee';
import { IntegrationMarquee } from './IntegrationMarquee';

interface WelcomeProps {
    onNavigateToLogin: () => void;
    onNavigateToSignup: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNavigateToLogin, onNavigateToSignup }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const { scrollYProgress } = useScroll();
    const [viewMode, setViewMode] = useState<'interactive' | 'visual'>('visual');
    
    // Parallax values
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen flex flex-col relative overflow-hidden ${isDark ? 'mesh-bg text-white' : 'mesh-bg-light text-slate-900'}`}>
            
            {/* Navbar */}
            <motion.nav 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center w-full backdrop-blur-md border-b border-white/10 bg-black/10"
            >
                <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={onNavigateToSignup}>
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                        <Sparkles className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                        AnalyticCore
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={onNavigateToLogin}
                        className={`hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                    >
                        Log In
                    </button>
                    <button
                        onClick={onNavigateToSignup}
                        className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/25"
                    >
                        Skip to Dashboard
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <main className="relative z-10 flex-1 flex flex-col items-center pt-32 sm:pt-40 pb-40 px-4 w-full overflow-hidden">
                {/* Floating Elements (Background) */}
                <motion.div style={{ y: y1 }} className="absolute top-40 left-[10%] opacity-20 hidden lg:block animate-float pointer-events-none">
                    <div className="w-64 h-64 bg-indigo-500 rounded-full blur-[100px]" />
                </motion.div>
                <motion.div style={{ y: y2 }} className="absolute top-60 right-[10%] opacity-20 hidden lg:block animate-float-delayed pointer-events-none">
                    <div className="w-72 h-72 bg-violet-500 rounded-full blur-[120px]" />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="flex flex-col items-center text-center max-w-5xl mx-auto w-full z-10 relative"
                >
                    <div className={`text-xs sm:text-sm font-semibold tracking-wide uppercase mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Deterministic KPI calculations • Zero hallucinations
                    </div>

                    <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter mb-6 leading-[1.05] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Agentic analytics for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500">growing businesses</span>
                    </h1>

                    <div className={`text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 flex flex-col gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <p>Automated dashboards and reports. No analyst needed</p>
                        <p>KPIs, insights, and recommended next steps in minutes, not days</p>
                    </div>

                    {/* Hero Dashboard Image */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="w-full max-w-6xl mx-auto mb-16 md:mb-20 relative px-4 sm:px-6"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent blur-[60px] md:blur-[100px] rounded-3xl" />
                        <div className={`relative rounded-xl md:rounded-2xl overflow-hidden border ${isDark ? 'border-white/10 shadow-[0_0_50px_-15px_rgba(99,102,241,0.5)]' : 'border-slate-200/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]'} z-20`}>
                            <img src={welcomePageImage} alt="AnalyticCore Dashboard Presentation" className="w-full h-auto object-cover" />
                            {/* Inner glass reflection effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                        </div>
                    </motion.div>

                    <button
                        onClick={onNavigateToSignup}
                        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-indigo-600 text-white font-bold text-lg overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(99,102,241,0.6)] mb-20 md:mb-28"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Enter Workspace
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </button>
                </motion.div>

                <ChartMarquee />

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="flex flex-col items-center text-center max-w-5xl mx-auto w-full z-10 relative"
                >
                    
                {/* View Toggle */}
                    <div className="flex items-center gap-2 p-1.5 rounded-full bg-slate-900/10 dark:bg-white/10 backdrop-blur-md mb-12 relative z-20 border border-slate-200 dark:border-white/10">
                        <button
                            onClick={() => setViewMode('visual')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${viewMode === 'visual' ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Visual Preview
                        </button>
                        <button
                            onClick={() => setViewMode('interactive')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${viewMode === 'interactive' ? 'bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Interactive Demo
                        </button>
                    </div>

                    {viewMode === 'visual' ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative w-full max-w-6xl mx-auto flex justify-center items-center h-[500px] md:h-[700px]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-fuchsia-500/20 blur-[100px] rounded-full" />
                            
                            {/* Main Background Image */}
                            <motion.div 
                                initial={{ y: 20 }}
                                animate={{ y: [-10, 10, -10] }}
                                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                className="absolute z-10 w-[80%] md:w-[70%] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20"
                            >
                                <img src="/images/mockups/design_dashboard_1783583201618.png" alt="Main Dashboard" className="w-full h-auto object-cover" />
                            </motion.div>

                            {/* Top Right Floating Image */}
                            <motion.div 
                                initial={{ y: 20 }}
                                animate={{ y: [15, -15, 15] }}
                                transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                                className="absolute z-20 w-[45%] md:w-[35%] -right-4 md:-right-12 top-10 md:top-20 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/20"
                            >
                                <img src="/images/mockups/marketing_dashboard_1783583189551.png" alt="Marketing View" className="w-full h-auto object-cover" />
                            </motion.div>

                            {/* Bottom Left Floating Image */}
                            <motion.div 
                                initial={{ y: 20 }}
                                animate={{ y: [-15, 15, -15] }}
                                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                                className="absolute z-30 w-[50%] md:w-[40%] -left-4 md:-left-12 bottom-10 md:bottom-20 rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.7)] border border-white/20"
                            >
                                <img src="/images/mockups/operations_dashboard_1783583249875.png" alt="Operations View" className="w-full h-auto object-cover" />
                            </motion.div>

                        </motion.div>
                    ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-5xl mx-auto"
                        style={{ perspective: '1200px' }}
                    >
                        {/* Main Window */}
                        <div 
                            className={`relative mx-auto w-full max-w-4xl rounded-2xl border overflow-hidden shadow-2xl ${isDark ? 'bg-slate-900 border-slate-700 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)]' : 'bg-white border-slate-200 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.2)]'} z-10`}
                            style={{ transform: 'rotateX(5deg) scale(0.95)' }}
                        >
                            {/* Browser Header */}
                            <div className={`h-10 w-full flex items-center px-4 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                </div>
                                <div className={`mx-auto px-6 py-1 rounded-full text-[0.65rem] font-medium ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                    analyticcore.com/report
                                </div>
                                <div className="w-12"></div>
                            </div>
                            {/* Main Body */}
                            <div className="p-6 md:p-8 pb-12 flex flex-col gap-6 md:gap-8">
                                <div className="flex justify-between items-end">
                                    <div className="text-left">
                                        <h3 className={`text-base md:text-lg font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>REVENUE BY CHANNEL</h3>
                                        <p className={`text-[0.65rem] md:text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Jan 2026 vs Dec 2025</p>
                                    </div>
                                    <button className={`px-3 md:px-4 py-1.5 text-[0.65rem] md:text-xs font-semibold rounded-md border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Export PPTX</button>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 md:w-20 text-xs font-medium text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Paid Search</div>
                                        <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800/80 relative">
                                            <div className="absolute top-0 left-0 h-full rounded-full bg-emerald-500 w-[85%]"></div>
                                        </div>
                                        <div className={`w-12 text-xs font-bold ${isDark ? 'text-white' : 'text-slate-700'} text-right`}>$890K</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 md:w-20 text-xs font-medium text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Organic</div>
                                        <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800/80 relative">
                                            <div className="absolute top-0 left-0 h-full rounded-full bg-slate-600 w-[65%]"></div>
                                        </div>
                                        <div className={`w-12 text-xs font-bold ${isDark ? 'text-white' : 'text-slate-700'} text-right`}>$715K</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 md:w-20 text-xs font-medium text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Social</div>
                                        <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800/80 relative">
                                            <div className="absolute top-0 left-0 h-full rounded-full bg-amber-500 w-[50%]"></div>
                                        </div>
                                        <div className={`w-12 text-xs font-bold ${isDark ? 'text-white' : 'text-slate-700'} text-right`}>$560K</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 md:w-20 text-xs font-medium text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email</div>
                                        <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800/80 relative">
                                            <div className="absolute top-0 left-0 h-full rounded-full bg-rose-400 w-[30%]"></div>
                                        </div>
                                        <div className={`w-12 text-xs font-bold ${isDark ? 'text-white' : 'text-slate-700'} text-right`}>$235K</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 md:gap-4 mt-2">
                                    <div className={`p-3 md:p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'} text-center flex flex-col justify-center`}>
                                        <div className={`text-[0.55rem] md:text-[0.65rem] font-bold tracking-widest uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>TOTAL REVENUE</div>
                                        <div className={`text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>$2.4M</div>
                                    </div>
                                    <div className={`p-3 md:p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'} text-center flex flex-col justify-center`}>
                                        <div className={`text-[0.55rem] md:text-[0.65rem] font-bold tracking-widest uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>ROAS</div>
                                        <div className={`text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>4.2x</div>
                                        <div className="text-emerald-500 text-[0.65rem] md:text-xs font-bold mt-1">+0.8x</div>
                                    </div>
                                    <div className={`p-3 md:p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'} text-center flex flex-col justify-center`}>
                                        <div className={`text-[0.55rem] md:text-[0.65rem] font-bold tracking-widest uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>CAC</div>
                                        <div className={`text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>$34.50</div>
                                        <div className="text-emerald-500 text-[0.65rem] md:text-xs font-bold mt-1">-8.1%</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Card 1: Monthly Trend */}
                        <motion.div 
                            initial={{ opacity: 0, x: 50, y: -20 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                            className={`absolute right-4 top-16 md:-right-8 md:top-12 lg:-right-16 w-48 md:w-64 p-4 md:p-5 rounded-2xl border shadow-2xl z-20 ${isDark ? 'bg-slate-800 border-slate-700 shadow-black/60' : 'bg-white border-slate-200 shadow-slate-300/60'}`}
                            style={{ transform: 'translateZ(50px)' }}
                        >
                            <h4 className={`text-[0.65rem] md:text-xs font-bold tracking-widest uppercase text-center mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>MONTHLY TREND</h4>
                            <p className={`text-[0.55rem] md:text-[0.65rem] text-center mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Revenue - 12 months</p>
                            <div className="h-12 md:h-16 w-full flex items-end justify-between gap-1">
                                {[3,5,4,7,6,9,8,12,14,11,15,18].map((val, i) => (
                                    <div key={i} className="w-full bg-emerald-400/50 rounded-t-sm" style={{ height: `${(val/18)*100}%` }}></div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Floating Card 2: AI Narrative */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50, y: 20 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.9 }}
                            className={`absolute -left-4 bottom-12 md:-left-12 lg:-left-24 md:bottom-16 w-60 md:w-72 p-4 md:p-5 rounded-2xl border shadow-2xl z-30 ${isDark ? 'bg-slate-800 border-slate-700 shadow-black/60' : 'bg-white border-slate-200 shadow-slate-300/60'}`}
                            style={{ transform: 'translateZ(80px)' }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-slate-900 rounded-full p-1"><Sparkles className="w-3 h-3 text-white" /></div>
                                <h4 className={`text-[0.65rem] md:text-[0.7rem] font-bold tracking-widest uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>AI NARRATIVE</h4>
                            </div>
                            <p className={`text-[0.65rem] md:text-xs leading-relaxed text-left ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                Revenue grew <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>12.3% MoM</span> to <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>$2.4M</span>, driven by a <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>23%</span> surge in Paid Search. CAC decreased <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>8.1%</span> to $34.50.
                            </p>
                            <div className="flex gap-2 mt-3">
                                <span className={`text-[0.55rem] md:text-[0.6rem] px-2 py-0.5 rounded-full border ${isDark ? 'border-slate-600 text-slate-400' : 'border-slate-200 text-slate-500'}`}>grounded</span>
                                <span className={`text-[0.55rem] md:text-[0.6rem] px-2 py-0.5 rounded-full border ${isDark ? 'border-slate-600 text-slate-400' : 'border-slate-200 text-slate-500'}`}>auditable</span>
                            </div>
                        </motion.div>

                        {/* Floating Card 3: Recommendations */}
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.1 }}
                            className={`absolute right-0 -bottom-8 md:-right-4 md:-bottom-12 lg:-right-12 w-64 md:w-80 p-4 md:p-5 rounded-2xl border shadow-2xl z-20 ${isDark ? 'bg-slate-800 border-slate-700 shadow-black/60' : 'bg-white border-slate-200 shadow-slate-300/60'}`}
                            style={{ transform: 'translateZ(60px)' }}
                        >
                            <h4 className={`text-[0.65rem] md:text-[0.7rem] font-bold tracking-widest uppercase text-left mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>RECOMMENDATIONS</h4>
                            <div className="flex items-start gap-3 mb-4 text-left">
                                <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${isDark ? 'border-slate-600 text-slate-400' : 'border-slate-300 text-slate-400'}`}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                </div>
                                <div>
                                    <p className={`text-[0.65rem] md:text-xs font-medium mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Scale Paid Search budget by 15%</p>
                                    <span className={`text-[0.55rem] md:text-[0.6rem] px-2 py-0.5 rounded-full border ${isDark ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-emerald-200 text-emerald-600 bg-emerald-50'}`}>Growth</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-left">
                                <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${isDark ? 'border-slate-600 text-slate-400' : 'border-slate-300 text-slate-400'}`}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                </div>
                                <div>
                                    <p className={`text-[0.65rem] md:text-xs font-medium mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Investigate Social CPM increase</p>
                                    <span className={`text-[0.55rem] md:text-[0.6rem] px-2 py-0.5 rounded-full border ${isDark ? 'border-slate-600 text-slate-400' : 'border-slate-200 text-slate-500'}`}>Watch</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                </motion.div>
            </main>

            {/* Workflow Section: Data to Decisions */}
            <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
                        Data to <span className="text-gradient-premium">Decisions</span>
                    </h2>
                    <p className={`text-lg sm:text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto`}>
                        A radically simple workflow that eliminates manual engineering.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { num: "1", icon: Database, title: "Connect", desc: "Link databases, APIs, or files. 20+ native integrations." },
                        { num: "2", icon: Brain, title: "Model", desc: "AI automatically detects anomalies and builds relationships." },
                        { num: "3", icon: BarChart3, title: "Visualize", desc: "Interactive dashboards generated instantly with zero config." },
                        { num: "4", icon: MessageSquare, title: "Query", desc: "Ask questions in plain English and run predictive models." }
                    ].map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={`p-8 rounded-3xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'} border relative overflow-hidden group`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors" />
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
                                <step.icon className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{step.num}. {step.title}</h3>
                            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Showcase: A Platform Without Limits */}
            <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
                        A Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Without Limits</span>
                    </h2>
                    <p className={`text-lg sm:text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto`}>
                        Living interfaces that adapt to your workflows.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[320px]">
                    {/* Large Card 1 */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className={`lg:col-span-2 rounded-3xl p-8 relative overflow-hidden border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'} bento-card`}
                    >
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
                            <Brain className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-3xl font-bold mb-3">Machine Learning Hub</h3>
                        <p className={`max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-8`}>
                            Auto-ML automatically trains predictive models on your live data. Deploy forecasts in seconds.
                        </p>
                        
                        {/* Mockup UI Element */}
                        <div className={`absolute -bottom-10 right-10 w-96 h-64 rounded-xl border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-slate-50 border-slate-200'} shadow-2xl p-4 hidden md:block`}>
                            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-amber-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 bg-indigo-500/20 rounded w-3/4" />
                                <div className="h-4 bg-slate-500/20 rounded w-1/2" />
                                <div className="h-20 bg-indigo-500/10 rounded-lg w-full mt-4" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Small Card 1 */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className={`rounded-3xl p-8 relative overflow-hidden border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'} bento-card flex flex-col`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent" />
                        <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center mb-6 relative z-10">
                            <MessageSquare className="w-6 h-6 text-fuchsia-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 relative z-10">AI Copilot</h3>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} relative z-10 mb-auto`}>Chat with your data.</p>
                        
                        <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-slate-200'} border relative z-10`}>
                            <p className="text-sm font-medium text-fuchsia-400">✨ Show me Q3 revenue...</p>
                        </div>
                    </motion.div>

                    {/* Small Card 2 */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className={`rounded-3xl p-8 relative overflow-hidden border ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200 shadow-xl'} bento-card`}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                            <Users className="w-6 h-6 text-amber-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Multiplayer</h3>
                        <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                            Build dashboards together in real-time. Annotate, tag, and decide faster.
                        </p>
                    </motion.div>

                    {/* Small Card 3 */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className={`rounded-3xl p-8 relative overflow-hidden border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200 shadow-xl'} bento-card`}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-emerald-500/20 rounded-full flex items-center justify-center pointer-events-none">
                            <div className="w-32 h-32 border border-emerald-500/10 rounded-full" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 relative z-10">
                            <Shield className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 relative z-10">Bank-Grade</h3>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} relative z-10`}>
                            SOC2 compliant. End-to-end encryption with fine-grained RBAC.
                        </p>
                    </motion.div>

                    {/* Developer API Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className={`rounded-3xl p-8 relative overflow-hidden border ${isDark ? 'bg-[#0A0C10] border-white/10' : 'bg-slate-900 border-slate-800'} bento-card group`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                            <Code className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-white">Developer API</h3>
                        <p className="text-slate-400 mb-6 text-sm">Embed anywhere using GraphQL.</p>
                        
                        <div className="bg-[#0D1117] rounded-xl p-4 border border-white/5 font-mono text-xs overflow-hidden">
                            <div className="text-emerald-400 mb-1"><span className="text-pink-400">const</span> dashboard = <span className="text-blue-400">await</span> analytics.<span className="text-amber-200">embed</span>({`{`}</div>
                            <div className="text-slate-300 pl-4">id: <span className="text-green-300">'dash_1'</span>,</div>
                            <div className="text-slate-300 pl-4">theme: <span className="text-green-300">'dark'</span></div>
                            <div className="text-emerald-400">{`});`}</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <IntegrationMarquee />

            {/* Smart Pricing Section */}
            <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
                        Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Pricing</span>
                    </h2>
                    <p className={`text-lg sm:text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto`}>
                        Choose the plan that accelerates your growth.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
                    {/* Free Plan */}
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className={`p-8 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}
                    >
                        <h3 className="text-2xl font-bold mb-2">Free</h3>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm mb-6 h-10`}>Perfect for exploring the platform.</p>
                        <div className="text-4xl font-extrabold mb-8">Demo</div>
                        <ul className="space-y-4 mb-8">
                            {['Up to 3 Dashboards', 'Basic CSV Import', 'Standard AI Insights', 'Community Support'].map((ft, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{ft}</span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={onNavigateToSignup} className={`w-full py-3 rounded-xl font-bold border ${isDark ? 'border-white/20 hover:bg-white/10' : 'border-slate-300 hover:bg-slate-50'} transition-colors`}>
                            Select Free
                        </button>
                    </motion.div>

                    {/* Premium Plan */}
                    <motion.div 
                        whileHover={{ y: -5, scale: 1.02 }}
                        className={`p-8 rounded-3xl border-2 border-indigo-500 relative transform md:-translate-y-4 shadow-[0_0_40px_-15px_rgba(99,102,241,0.5)] ${isDark ? 'bg-white/10 backdrop-blur-xl' : 'bg-indigo-50/80 backdrop-blur-xl'}`}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">
                            Most Popular
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Premium</h3>
                        <p className={`${isDark ? 'text-indigo-200' : 'text-indigo-800'} text-sm mb-6 h-10`}>For growing businesses needing deeper analytics.</p>
                        <div className="text-4xl font-extrabold mb-8 text-indigo-500">₹10,000<span className="text-lg text-slate-400 font-medium">/mo</span></div>
                        <ul className="space-y-4 mb-8">
                            {['Unlimited Dashboards', 'Live Database Connectors', 'Advanced Predictive Models', 'Priority Support'].map((ft, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                    <span className={isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'}>{ft}</span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={onNavigateToSignup} className="w-full py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg">
                            Select Premium
                        </button>
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className={`p-8 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}
                    >
                        <h3 className="text-2xl font-bold mb-2">Pro</h3>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm mb-6 h-10`}>Maximum security and dedicated resources.</p>
                        <div className="text-4xl font-extrabold mb-8">Custom</div>
                        <ul className="space-y-4 mb-8">
                            {['Dedicated Infrastructure', 'Custom AI Model Training', 'Advanced Role-based Access', '24/7 SLA Support'].map((ft, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{ft}</span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={onNavigateToSignup} className={`w-full py-3 rounded-xl font-bold border ${isDark ? 'border-white/20 hover:bg-white/10' : 'border-slate-300 hover:bg-slate-50'} transition-colors`}>
                            Select Pro
                        </button>
                    </motion.div>
                </div>
            </section>
            
            {/* Footer component has its own styling but sits at the bottom */}
            <div className="mt-auto relative z-10 w-full">
                <Footer />
            </div>
        </div>
    );
};
