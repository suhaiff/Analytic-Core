import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { Footer } from './Footer';
import { ArrowRight, CheckCircle2, BarChart3, Lock, Cpu, Activity, Database, MessageSquare, Shield, Users, Bot, LineChart, Code2, Workflow, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

interface OverviewProps {
  user: User | null;
  onNavigateToLanding: () => void;
  onNavigateToDetails: () => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigateToLanding, onNavigateToDetails }) => {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const mockupY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const isDark = theme === 'dark';

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleGetStarted = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      onNavigateToDetails();
    }, 1200);
  };

  const handleSkipToDashboard = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      onNavigateToLanding();
    }, 1200);
  };

  const pricingTiers = [
    { name: 'Free', price: 'Demo', description: 'Perfect for exploring the platform.', features: ['Up to 3 Dashboards', 'Basic CSV Import', 'Standard AI Insights', 'Community Support'], recommended: false },
    { name: 'Premium', price: '₹10,000/mo', description: 'For growing businesses needing deeper analytics.', features: ['Unlimited Dashboards', 'Live Database Connectors', 'Advanced Predictive Models', 'Priority Support'], recommended: true },
    { name: 'Pro', price: 'Custom', description: 'Maximum security and dedicated resources.', features: ['Dedicated Infrastructure', 'Custom AI Model Training', 'Advanced Role-based Access', '24/7 SLA Support'], recommended: false }
  ];

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${isDark ? 'mesh-bg text-white' : 'mesh-bg-light text-slate-900'}`} ref={containerRef}>
      
      <AnimatePresence>
        {isTransitioning && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.8 }}
             className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
           >
              <div className={`absolute inset-0 ${isDark ? 'bg-slate-950/80 backdrop-blur-3xl' : 'bg-white/80 backdrop-blur-3xl'}`} />
              <div className="relative z-10 flex flex-col items-center">
                 <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} 
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 p-1 shadow-[0_0_50px_rgba(99,102,241,0.6)]"
                 >
                    <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
                      <Activity className="w-10 h-10 text-white" />
                    </div>
                 </motion.div>
                 <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400 drop-shadow-lg"
                 >
                   Initializing OS
                 </motion.h2>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <motion.nav 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex justify-between items-center w-full backdrop-blur-xl border-b border-white/10 bg-black/5"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              AnalyticCore
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <button
                onClick={handleSkipToDashboard}
                className="px-6 py-2.5 text-sm rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/25 transform hover:scale-105 flex items-center gap-2 group"
              >
                Skip to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.nav>

        <main className="mx-auto pt-32 pb-24 overflow-x-hidden">
          
          {/* Hero Section */}
          <motion.section 
            style={{ opacity: heroOpacity }}
            className="text-center mb-40 relative z-10 px-4 w-full"
          >
                {/* Floating Elements (Background) */}
                <motion.div style={{ y: mockupY }} className="absolute top-10 left-[5%] opacity-20 hidden lg:block animate-float pointer-events-none">
                    <div className="w-64 h-64 bg-indigo-500 rounded-full blur-[100px]" />
                </motion.div>
                <motion.div style={{ y: mockupY }} className="absolute top-40 right-[5%] opacity-20 hidden lg:block animate-float-delayed pointer-events-none">
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

                    <button
                        onClick={handleGetStarted}
                        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-indigo-600 text-white font-bold text-lg overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(99,102,241,0.6)] mb-20 md:mb-28"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Enter Workspace
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </button>

                    {/* Massive Dashboard Mockup */}
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-5xl mx-auto hidden md:block"
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
                                <div className="bg-slate-900 rounded-full p-1"><SparklesIcon className="w-3 h-3 text-white" /></div>
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
                </motion.div>
          </motion.section>

          {/* Workflow Section: Massive Staggered Blocks */}
          <section className="mb-40 sm:mb-48 relative z-10 px-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="text-center mb-24 sm:mb-32"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest mb-6 ${isDark ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 'border-indigo-400/40 bg-indigo-50 text-indigo-600'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                The AnalyticCore Flow
              </div>
              <h2 className={`text-5xl sm:text-6xl md:text-7xl font-black mb-6 tracking-tight`}>Data to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">Decisions</span></h2>
              <p className={`text-xl sm:text-2xl ${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-3xl mx-auto px-4 font-medium`}>A radically simple workflow that eliminates manual engineering.</p>
            </motion.div>

            <div className="relative max-w-7xl mx-auto space-y-24 sm:space-y-32">
              
              {/* Connecting line between blocks */}
              <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px hidden lg:block pointer-events-none">
                <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent' : 'bg-gradient-to-b from-transparent via-indigo-400/20 to-transparent'}`} />
              </div>

              {[
                {
                  step: "01",
                  title: "Connect Data",
                  desc: "Link any database, API, or file in seconds. With 20+ native integrations including Postgres, Snowflake, and BigQuery, your data is unified securely without writing ETL pipelines.",
                  badge: "Data Ingestion",
                  icon: Database,
                  accent: "from-blue-500 to-indigo-600",
                  glow: "rgba(99,102,241,0.4)",
                  textColor: isDark ? "text-blue-400" : "text-blue-600",
                  bgLight: "bg-blue-50/50",
                  bgDark: "bg-blue-900/10",
                  mockup: (
                    <div className="relative w-full h-full min-h-[250px] flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0,transparent_100%)]" />
                      <div className="relative z-10 flex items-center justify-between w-3/4 max-w-sm">
                        {/* Source Nodes */}
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <motion.div key={i} animate={{ x: [0, 5, 0] }} transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                              <Database className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                            </motion.div>
                          ))}
                        </div>
                        {/* Animated Lines */}
                        <div className="flex-1 h-32 relative">
                           <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                             {[20, 60, 100].map((y, i) => (
                               <motion.path key={i} d={`M0,${y} C50,${y} 50,60 100,60`} fill="none" stroke={isDark ? '#6366f1' : '#818cf8'} strokeWidth="2" strokeDasharray="5,5" className="opacity-50"
                                 animate={{ strokeDashoffset: [20, 0] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                             ))}
                           </svg>
                        </div>
                        {/* Target Node */}
                        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                          className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl border relative z-20 ${isDark ? 'bg-indigo-600 border-indigo-400/30' : 'bg-indigo-500 border-indigo-300'}`}>
                           <div className="absolute inset-0 rounded-2xl bg-indigo-400 blur-xl opacity-40 animate-pulse" />
                           <Database className="w-8 h-8 text-white relative z-10" />
                        </motion.div>
                      </div>
                    </div>
                  )
                },
                {
                  step: "02",
                  title: "AI Processing",
                  desc: "Our neural engines automatically clean, type-cast, and join your scattered data. An intelligent semantic layer is generated instantly, giving your data deep context.",
                  badge: "Neural Mapping",
                  icon: Workflow,
                  accent: "from-violet-500 to-purple-600",
                  glow: "rgba(139,92,246,0.4)",
                  textColor: isDark ? "text-violet-400" : "text-violet-600",
                  bgLight: "bg-violet-50/50",
                  bgDark: "bg-violet-900/10",
                  mockup: (
                    <div className="relative w-full h-full min-h-[250px] flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0,transparent_100%)]" />
                      <div className="relative z-10 w-3/4 max-w-sm">
                        <div className={`p-4 rounded-xl border mb-4 backdrop-blur-sm ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center"><Workflow className="w-4 h-4 text-violet-500" /></div>
                            <div className={`h-2 w-24 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
                          </div>
                          <div className="space-y-2">
                            {[1, 2].map(i => (
                              <div key={i} className="flex gap-2">
                                <div className={`h-1.5 w-full rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />
                                <div className={`h-1.5 w-2/3 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />
                              </div>
                            ))}
                          </div>
                        </div>
                        <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                          className={`p-4 rounded-xl border shadow-xl backdrop-blur-md relative ${isDark ? 'bg-violet-900/40 border-violet-500/30' : 'bg-violet-50 border-violet-200'}`}>
                          <div className="absolute -top-3 -right-3">
                            <span className="flex h-6 w-6 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-6 w-6 bg-violet-500 items-center justify-center"><SparklesIcon className="w-3 h-3 text-white" /></span>
                            </span>
                          </div>
                          <div className={`text-xs font-mono mb-2 ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>Auto-Join Detected</div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 shadow-sm'}`}>users.id</span>
                            <span className="text-violet-500">→</span>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 shadow-sm'}`}>orders.user_id</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  )
                },
                {
                  step: "03",
                  title: "Visualize",
                  desc: "Generate pixel-perfect, interactive dashboards without writing a single line of code. Drag-and-drop charts, live KPI tiles, and real-time filters instantly.",
                  badge: "Interactive UI",
                  icon: LineChart,
                  accent: "from-fuchsia-500 to-pink-600",
                  glow: "rgba(217,70,239,0.4)",
                  textColor: isDark ? "text-fuchsia-400" : "text-fuchsia-600",
                  bgLight: "bg-fuchsia-50/50",
                  bgDark: "bg-fuchsia-900/10",
                  mockup: (
                    <div className="relative w-full h-full min-h-[250px] flex items-end justify-center pb-8">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(217,70,239,0.15)_0,transparent_100%)]" />
                      <div className={`w-3/4 max-w-sm h-40 rounded-t-2xl border-t border-x relative overflow-hidden flex items-end px-4 gap-2 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                        {[40, 70, 45, 90, 60, 100].map((h, i) => (
                          <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                            className={`flex-1 rounded-t-lg bg-gradient-to-t ${isDark ? 'from-fuchsia-600/20 to-fuchsia-500/80' : 'from-fuchsia-100 to-fuchsia-400'}`} />
                        ))}
                        {/* Hover Tooltip Mockup */}
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }}
                          className={`absolute top-4 right-12 px-3 py-2 rounded-lg shadow-xl text-xs font-bold border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-900 border-slate-800 text-white'}`}>
                          $124,500 <span className="text-emerald-400 ml-1">↑12%</span>
                        </motion.div>
                      </div>
                    </div>
                  )
                },
                {
                  step: "04",
                  title: "Decide",
                  desc: "Query your data in plain English. The AI Copilot converts natural language into SQL, returning instant visual insights that you can share with your entire organization.",
                  badge: "AI Insights",
                  icon: MessageSquare,
                  accent: "from-pink-500 to-rose-600",
                  glow: "rgba(236,72,153,0.4)",
                  textColor: isDark ? "text-pink-400" : "text-pink-600",
                  bgLight: "bg-pink-50/50",
                  bgDark: "bg-pink-900/10",
                  mockup: (
                    <div className="relative w-full h-full min-h-[250px] flex items-center justify-center flex-col gap-4">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.15)_0,transparent_100%)]" />
                      
                      {/* Search Bar Mockup */}
                      <div className={`w-3/4 max-w-sm rounded-full p-1.5 pl-4 flex items-center justify-between border shadow-lg relative z-10 backdrop-blur-md ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <SparklesIcon className={`w-4 h-4 ${isDark ? 'text-pink-400' : 'text-pink-500'}`} />
                          <motion.div initial={{ width: 0 }} whileInView={{ width: "100%" }} transition={{ duration: 1.5, delay: 0.2 }} className="overflow-hidden whitespace-nowrap">
                            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Show Q4 Revenue by Region</span>
                          </motion.div>
                          <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className={`w-0.5 h-4 ${isDark ? 'bg-pink-400' : 'bg-pink-500'}`} />
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-pink-600' : 'bg-pink-500'}`}>
                          <ArrowRight className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Result Card Mockup */}
                      <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
                        className={`w-2/3 max-w-xs rounded-xl p-4 border shadow-xl relative z-10 backdrop-blur-md ${isDark ? 'bg-slate-900/80 border-pink-500/30' : 'bg-white border-pink-100'}`}>
                        <div className={`text-xs font-bold mb-2 ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>Insight Generated</div>
                        <div className="flex items-end gap-2 mb-2">
                          <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>$2.4M</span>
                          <span className="text-emerald-500 text-xs font-bold mb-1">+18% YoY</span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full ${isDark ? 'bg-pink-500/40' : 'bg-pink-200'}`} />
                          ))}
                        </div>
                      </motion.div>

                    </div>
                  )
                },
              ].map((item, i) => {
                const isEven = i % 2 !== 0;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative w-full rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden border transition-all duration-700 group flex flex-col lg:flex-row items-stretch
                      ${isDark
                        ? 'bg-slate-900/40 border-white/10 hover:border-white/20'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xl hover:shadow-2xl'
                      }`}
                  >
                    {/* Massive Background Step Number */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0 mix-blend-overlay">
                      <span className={`text-[15rem] md:text-[20rem] font-black leading-none opacity-[0.03] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.step}
                      </span>
                    </div>

                    {/* Ambient corner glow */}
                    <div className={`absolute ${isEven ? '-top-32 -left-32' : '-top-32 -right-32'} w-96 h-96 rounded-full bg-gradient-to-br ${item.accent} blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none z-0`} />

                    {/* Content Side */}
                    <div className={`relative z-10 w-full lg:w-1/2 p-10 sm:p-16 lg:p-20 flex flex-col justify-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 w-fit border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200 shadow-sm'} ${item.textColor}`}>
                        <item.icon className="w-4 h-4" />
                        {item.badge}
                      </div>

                      <h3 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </h3>
                      
                      <p className={`text-lg sm:text-xl leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {item.desc}
                      </p>
                    </div>

                    {/* Visual Mockup Side */}
                    <div className={`relative z-10 w-full lg:w-1/2 border-t lg:border-t-0 ${isEven ? 'lg:border-r lg:order-1' : 'lg:border-l lg:order-2'} ${isDark ? 'border-white/10 ' + item.bgDark : 'border-slate-100 ' + item.bgLight} overflow-hidden min-h-[300px] lg:min-h-full`}>
                      {item.mockup}
                    </div>

                  </motion.div>
                );
              })}
            </div>
            
            {/* Start Building CTA inside Flow section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-24 sm:mt-32 flex justify-center relative z-10"
            >
              <button
                onClick={handleGetStarted}
                className={`group relative overflow-hidden rounded-full px-10 py-5 font-bold text-lg transition-all duration-300 hover:scale-105 shadow-[0_0_40px_-10px_rgba(139,92,246,0.6)] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white`}
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-100%] group-hover:translate-x-[100%] duration-1000"></div>
                <span className="relative z-10 flex items-center gap-2">
                  Let's Start Building <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </motion.div>
          </section>

          {/* Core Capabilities — Innovative Feature Showcase */}
          <section className="mb-40 sm:mb-48 z-10 relative px-4 max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-20 sm:mb-28"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest mb-6 ${isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-400/40 bg-emerald-50 text-emerald-600'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                Core Capabilities
              </div>
              <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight`}>
                A Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Without Limits</span>
              </h2>
              <p className={`text-lg sm:text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto`}>Living interfaces that adapt to your workflows.</p>
            </motion.div>

            {/* Feature 1: Machine Learning Hub — Full-width hero card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`relative rounded-[3rem] overflow-hidden mb-8 group ${isDark ? 'bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-white/10 shadow-[0_0_80px_-20px_rgba(99,102,241,0.4)]' : 'bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100 shadow-2xl'}`}
            >
              <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-[80px] group-hover:bg-indigo-500/30 transition-colors duration-700 pointer-events-none" />
              <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-500/20 blur-[80px] pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[400px]">
                {/* Left text */}
                <div className="p-12 lg:p-16 flex flex-col justify-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6 w-fit ${isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'}`}>
                    <Cpu className="w-3.5 h-3.5" /> Auto-ML Engine
                  </div>
                  <h3 className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-5 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Machine<br/>Learning Hub</h3>
                  <p className={`text-base sm:text-lg leading-relaxed mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-md`}>Auto-ML automatically trains predictive models on your live data. No data scientists needed — deploy production forecasts in seconds.</p>
                  <div className="flex flex-wrap gap-3">
                    {['Predictive Forecasting', 'Anomaly Detection', 'Auto-Training'].map((tag, i) => (
                      <span key={i} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'}`}>{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Right: Neural network visual */}
                <div className="relative flex items-center justify-center p-8 overflow-hidden min-h-[300px]">
                  <div className={`absolute inset-0 ${isDark ? 'opacity-10' : 'opacity-5'}`} style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                  
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className={`absolute top-8 left-8 px-4 py-3 rounded-2xl ${isDark ? 'bg-white/10 border-white/10' : 'bg-white border-slate-200 shadow-lg'} border`}>
                    <div className="text-xs font-bold text-indigo-500 mb-0.5">Accuracy</div>
                    <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>98.7<span className="text-sm">%</span></div>
                  </motion.div>
                  <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className={`absolute bottom-8 right-8 px-4 py-3 rounded-2xl ${isDark ? 'bg-white/10 border-white/10' : 'bg-white border-slate-200 shadow-lg'} border`}>
                    <div className="text-xs font-bold text-violet-500 mb-0.5">Models Trained</div>
                    <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>12.4K</div>
                  </motion.div>

                  <svg viewBox="0 0 300 220" className="w-full max-w-sm h-auto" style={{ filter: isDark ? 'drop-shadow(0 0 20px rgba(129,140,248,0.6))' : 'drop-shadow(0 0 10px rgba(99,102,241,0.3))' }}>
                    {[[60,50,150,40],[60,50,150,110],[60,50,150,180],[60,130,150,40],[60,130,150,110],[60,130,150,180],[60,210,150,110],[60,210,150,180],[150,40,240,75],[150,110,240,75],[150,110,240,145],[150,180,240,145]].map(([x1,y1,x2,y2],i) => (
                      <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isDark ? '#818cf8' : '#6366f1'} strokeWidth="1" strokeOpacity="0.4"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: i * 0.1, repeat: Infinity, repeatDelay: 3 }} />
                    ))}
                    {[50,130,210].map((cy, i) => (
                      <motion.circle key={`i${i}`} cx="60" cy={cy} r="14" fill={isDark ? '#312e81' : '#eef2ff'} stroke="#6366f1" strokeWidth="2"
                        animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }} />
                    ))}
                    {[40,110,180].map((cy, i) => (
                      <motion.circle key={`h${i}`} cx="150" cy={cy} r="16" fill={isDark ? '#4c1d95' : '#ede9fe'} stroke="#8b5cf6" strokeWidth="2"
                        animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 + 0.5 }} />
                    ))}
                    {[75, 145].map((cy, i) => (
                      <motion.circle key={`o${i}`} cx="240" cy={cy} r="18" fill={isDark ? '#1e1b4b' : '#ddd6fe'} stroke="#a855f7" strokeWidth="2.5"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.6 + 1 }} />
                    ))}
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Row 2: AI Copilot (3 cols) + Multiplayer (2 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
              {/* AI Copilot */}
              <motion.div
                initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`lg:col-span-3 relative rounded-[2.5rem] overflow-hidden group ${isDark ? 'bg-gradient-to-br from-fuchsia-950/60 via-slate-900 to-slate-900 border border-white/10 shadow-[0_0_60px_-15px_rgba(217,70,239,0.4)]' : 'bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 border border-fuchsia-100 shadow-xl'}`}
              >
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-fuchsia-500/20 blur-[80px] pointer-events-none" />
                <div className="p-10 sm:p-12 relative z-10">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6 w-fit ${isDark ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30' : 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200'}`}>
                    <Bot className="w-3.5 h-3.5" /> Conversational AI
                  </div>
                  <h3 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Copilot</h3>
                  <p className={`text-sm sm:text-base leading-relaxed mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-md`}>Ask anything about your data in plain English. The Copilot understands context, runs SQL, and returns beautiful visual answers instantly.</p>
                  <div className={`rounded-2xl p-5 space-y-4 border ${isDark ? 'bg-black/40 border-white/10' : 'bg-white/80 border-slate-200 shadow-inner'}`}>
                    <div className="flex justify-end">
                      <div className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm font-medium max-w-xs bg-fuchsia-500 text-white shadow-lg">
                        ✨ Show me Q3 revenue vs forecast
                      </div>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                      className={`px-4 py-3 rounded-2xl rounded-bl-sm ${isDark ? 'bg-white/10 border-white/10' : 'bg-fuchsia-50 border-fuchsia-100'} border`}>
                      <div className="text-xs font-bold text-fuchsia-500 mb-2">AnalyticCore AI</div>
                      <div className="flex gap-2 items-end h-12">
                        {[60,80,55,90,70,95,65].map((h, i) => (
                          <motion.div key={i} initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} transition={{ delay: 0.7 + i * 0.07, duration: 0.4 }}
                            style={{ transformOrigin: 'bottom', height: `${h}%` }}
                            className="flex-1 rounded-t-sm bg-gradient-to-t from-fuchsia-500 to-pink-400" />
                        ))}
                      </div>
                      <div className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Q3 exceeded forecast by <span className="text-emerald-500 font-bold">+18.4%</span></div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Multiplayer */}
              <motion.div
                initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className={`lg:col-span-2 relative rounded-[2.5rem] overflow-hidden group ${isDark ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-white/10 shadow-[0_0_60px_-15px_rgba(245,158,11,0.3)]' : 'bg-gradient-to-br from-amber-50 via-white to-orange-50 border border-amber-100 shadow-xl'}`}
              >
                <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-amber-500/15 blur-[80px] pointer-events-none" />
                <div className="p-10 sm:p-12 relative z-10 h-full flex flex-col">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6 w-fit ${isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                    <Users className="w-3.5 h-3.5" /> Real-time Collab
                  </div>
                  <h3 className={`text-3xl font-extrabold tracking-tight mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Multiplayer</h3>
                  <p className={`text-sm leading-relaxed mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Build dashboards together in real-time. Annotate, tag, and decide faster.</p>
                  <div className={`flex-1 relative min-h-[140px] rounded-2xl overflow-hidden ${isDark ? 'bg-black/30 border border-white/10' : 'bg-white border border-amber-100 shadow-inner'}`}>
                    <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`} style={{ backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                    <motion.div animate={{ x: [20, 100, 60, 20], y: [20, 40, 90, 20] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute flex flex-col items-start">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="white" strokeWidth="1.5"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                      <span className="bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full mt-0.5 shadow-lg">Alex</span>
                    </motion.div>
                    <motion.div animate={{ x: [160, 80, 140, 160], y: [100, 60, 30, 100] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }} className="absolute flex flex-col items-start">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#38bdf8" stroke="white" strokeWidth="1.5"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                      <span className="bg-sky-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full mt-0.5 shadow-lg">Sarah</span>
                    </motion.div>
                    <motion.div animate={{ x: [80, 140, 40, 80], y: [60, 100, 50, 60] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }} className="absolute flex flex-col items-start">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#a78bfa" stroke="white" strokeWidth="1.5"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                      <span className="bg-violet-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full mt-0.5 shadow-lg">Ravi</span>
                    </motion.div>
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-black shadow-lg">
                      <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-white" />
                      LIVE
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Row 3: Bank-Grade (2 cols) + Developer API (3 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Bank-Grade Security */}
              <motion.div
                initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`lg:col-span-2 relative rounded-[2.5rem] overflow-hidden group ${isDark ? 'bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border border-white/10 shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-100 shadow-xl'}`}
              >
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-500/15 blur-[80px] pointer-events-none" />
                <div className="p-10 sm:p-12 relative z-10 h-full flex flex-col">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6 w-fit ${isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                    <Lock className="w-3.5 h-3.5" /> Enterprise Security
                  </div>
                  <h3 className={`text-3xl font-extrabold tracking-tight mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Bank-Grade</h3>
                  <p className={`text-sm leading-relaxed mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>SOC2 compliant. End-to-end encryption with fine-grained RBAC.</p>
                  <div className="flex-1 flex items-center justify-center relative min-h-[160px]">
                    {[1, 2, 3].map(n => (
                      <motion.div key={n} animate={{ scale: [1, 1.4 + n * 0.3], opacity: [0.5, 0] }} transition={{ duration: 2 + n * 0.5, repeat: Infinity, delay: n * 0.4 }}
                        className="absolute rounded-full border border-emerald-500/40" style={{ width: 60 + n * 30, height: 60 + n * 30 }} />
                    ))}
                    <div className={`relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${isDark ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-500 shadow-emerald-500/40'}`}
                      style={{ boxShadow: isDark ? '0 0 40px rgba(16,185,129,0.4)' : '0 0 40px rgba(16,185,129,0.5)' }}>
                      <Shield className={`w-10 h-10 ${isDark ? 'text-emerald-400' : 'text-white'}`} />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-6">
                    {['SOC2', 'GDPR', 'ISO 27001', 'AES-256'].map((b, i) => (
                      <span key={i} className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>{b}</span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Developer API */}
              <motion.div
                initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className="lg:col-span-3 relative rounded-[2.5rem] overflow-hidden group bg-[#0A0C14] border border-white/10 shadow-[0_0_80px_-20px_rgba(99,102,241,0.5)]"
              >
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/25 via-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 left-0 w-80 h-80 bg-gradient-to-tr from-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="p-10 sm:p-12 relative z-10 h-full flex flex-col">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6 w-fit bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Code2 className="w-3.5 h-3.5" /> REST &amp; GraphQL
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-white">Developer API</h3>
                  <p className="text-sm sm:text-base leading-relaxed mb-8 text-indigo-200 max-w-md">Embed AnalyticCore anywhere using our REST or GraphQL API. Full SDK support for React, Vue, and Angular.</p>
                  <div className="flex-1 bg-[#0D1117] rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 bg-white/5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="ml-3 text-[11px] text-slate-500 font-mono">embed.ts</span>
                    </div>
                    <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed space-y-1">
                      <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        <span className="text-purple-400">import</span> <span className="text-white">{'{ AnalyticCore }'}</span> <span className="text-purple-400">from</span> <span className="text-amber-300">'@analyticcore/sdk'</span><span className="text-white">;</span>
                      </motion.div>
                      <div className="h-3" />
                      <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                        <span className="text-blue-400">const</span> <span className="text-emerald-400">client</span> <span className="text-white">= </span><span className="text-sky-300">new</span> <span className="text-yellow-300">AnalyticCore</span><span className="text-white">{'({'}</span>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                        <span className="text-white pl-6">apiKey: </span><span className="text-amber-300">'ak_live_••••••••'</span><span className="text-white">,</span>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
                        <span className="text-white pl-6">theme: </span><span className="text-amber-300">'dark'</span>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}>
                        <span className="text-white">{'}'}</span><span className="text-white">);</span>
                      </motion.div>
                      <div className="h-3" />
                      <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }}>
                        <span className="text-blue-400">await</span> <span className="text-emerald-400">client</span><span className="text-white">.</span><span className="text-sky-300">embed</span><span className="text-white">{'({ id: '}</span><span className="text-amber-300">'dash_q3'</span><span className="text-white">{' });'}</span>
                      </motion.div>
                      <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="inline-block w-2 h-4 bg-indigo-400 ml-0.5 align-middle" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>


          {/* Pricing — Immersive Showcase */}
          <section className="mb-24 z-10 relative px-4 overflow-hidden">
            {/* Background ambient glows */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-indigo-500/10 blur-[140px]" />
              <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-fuchsia-500/10 blur-[100px]" />
            </div>

            <div className="relative max-w-7xl mx-auto">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center mb-20"
              >
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest mb-6 ${isDark ? 'border-violet-500/30 bg-violet-500/10 text-violet-400' : 'border-violet-300 bg-violet-50 text-violet-600'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Transparent Pricing
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tight">Smart <span className="text-gradient-premium">Pricing</span></h2>
                <p className={`text-lg sm:text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>One platform. Three tiers. Infinite possibilities.</p>
              </motion.div>

              {/* Stacked card rows — vertical, full-width, alternating */}
              <div className="space-y-5">
                {pricingTiers.map((tier, idx) => {
                  const isRec = tier.recommended;
                  const cfgs = [
                    {
                      from: 'from-slate-600', to: 'to-slate-800',
                      accentColor: isDark ? '#94a3b8' : '#475569',
                      glowColor: 'rgba(100,116,139,0.3)',
                      tagline: 'START EXPLORING',
                      label: 'For individuals & teams',
                      featureColor: isDark ? 'text-slate-300' : 'text-slate-700',
                      checkBg: isDark ? 'bg-slate-500/20 border-slate-500/30 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600',
                      outerBg: isDark ? 'bg-slate-900/80 border-white/[0.07]' : 'bg-white border-slate-200/80',
                      progressBg: isDark ? 'bg-slate-700' : 'bg-slate-200',
                      progressFill: isDark ? 'bg-slate-400' : 'bg-slate-500',
                      trustNote: 'No credit card required',
                      barWidths: [40, 30, 35, 25],
                    },
                    {
                      from: 'from-indigo-500', to: 'to-violet-600',
                      accentColor: '#818cf8',
                      glowColor: 'rgba(99,102,241,0.5)',
                      tagline: 'MOST POWERFUL',
                      label: 'For growing businesses',
                      featureColor: 'text-white',
                      checkBg: 'bg-white/20 border-white/30 text-white',
                      outerBg: 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 border-indigo-400/30',
                      progressBg: 'bg-white/20',
                      progressFill: 'bg-white',
                      trustNote: '14-day free trial included',
                      barWidths: [80, 90, 85, 95],
                    },
                    {
                      from: 'from-emerald-500', to: 'to-teal-600',
                      accentColor: isDark ? '#34d399' : '#059669',
                      glowColor: 'rgba(16,185,129,0.3)',
                      tagline: 'ENTERPRISE-READY',
                      label: 'For maximum scale',
                      featureColor: isDark ? 'text-slate-300' : 'text-slate-700',
                      checkBg: isDark ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600',
                      outerBg: isDark ? 'bg-slate-900/80 border-emerald-500/20' : 'bg-white border-emerald-100',
                      progressBg: isDark ? 'bg-slate-700' : 'bg-emerald-100',
                      progressFill: isDark ? 'bg-emerald-400' : 'bg-emerald-500',
                      trustNote: 'Custom SLA & onboarding',
                      barWidths: [100, 100, 100, 100],
                    },
                  ];
                  const cfg = cfgs[idx];

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.div
                        whileHover={{ y: -4, scale: 1.005 }}
                        transition={{ duration: 0.3 }}
                        className={`relative rounded-[2rem] border overflow-hidden transition-all duration-500 group
                          ${cfg.outerBg}
                          ${isRec ? 'shadow-[0_0_80px_-20px_rgba(99,102,241,0.6)]' : isDark ? 'shadow-[0_4px_30px_rgba(0,0,0,0.4)]' : 'shadow-xl'}
                        `}
                      >
                        {/* Glowing top edge for recommended */}
                        {isRec && (
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
                        )}

                        {/* Decorative corner orb */}
                        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br ${cfg.from} ${cfg.to} blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none`} />

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1fr] gap-0">

                          {/* ── Left: Identity column ── */}
                          <div className={`p-8 sm:p-10 flex flex-col justify-between border-r ${isRec ? 'border-white/10' : isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                            <div>
                              {/* Step indicator + tagline */}
                              <div className="flex items-center gap-3 mb-6">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white bg-gradient-to-br ${cfg.from} ${cfg.to} flex-shrink-0`}
                                  style={{ boxShadow: `0 6px 20px -4px ${cfg.glowColor}` }}>
                                  {String(idx + 1).padStart(2, '0')}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${isRec ? 'text-indigo-200' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>{cfg.tagline}</span>
                              </div>

                              {/* Tier name */}
                              <h3 className={`text-4xl sm:text-5xl font-black tracking-tight mb-1 ${isRec ? 'text-white' : isDark ? 'text-white' : 'text-slate-900'}`}>{tier.name}</h3>
                              <p className={`text-sm mb-8 ${isRec ? 'text-indigo-200' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>{cfg.label}</p>

                              {/* Price */}
                              <div className="mb-8">
                                {tier.price === '₹10,000/mo' ? (
                                  <div>
                                    <span className={`text-4xl sm:text-5xl font-black tracking-tighter leading-none ${isRec ? 'text-white' : isDark ? 'text-white' : 'text-slate-900'}`}>₹10,000</span>
                                    <span className={`text-base font-medium ml-1.5 ${isRec ? 'text-indigo-200' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>/month</span>
                                  </div>
                                ) : (
                                  <span className={`text-4xl sm:text-5xl font-black tracking-tight ${isRec ? 'text-white' : isDark ? 'text-white' : 'text-slate-900'}`}>{tier.price}</span>
                                )}
                              </div>
                            </div>

                            {/* Most Popular badge */}
                            {isRec && (
                              <motion.div
                                animate={{ scale: [1, 1.03, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/15 border border-white/25 text-white text-xs font-black uppercase tracking-widest w-fit backdrop-blur-sm"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
                                Most Popular
                              </motion.div>
                            )}
                          </div>

                          {/* ── Center: Features column ── */}
                          <div className={`p-8 sm:p-10 border-r ${isRec ? 'border-white/10' : isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-[0.18em] mb-5 ${isRec ? 'text-indigo-200' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>What's included</p>
                            <ul className="space-y-3.5">
                              {tier.features.map((feature, fidx) => (
                                <motion.li
                                  key={fidx}
                                  initial={{ opacity: 0, x: -12 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: idx * 0.08 + fidx * 0.06 }}
                                  className="flex items-center gap-3 group/feat"
                                >
                                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 border transition-transform group-hover/feat:scale-110 ${cfg.checkBg}`}>
                                    <CheckCircle2 className="w-3 h-3" />
                                  </div>
                                  <span className={`text-sm font-medium leading-snug ${isRec ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>{feature}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>

                          {/* ── Right: Visual capacity + CTA column ── */}
                          <div className="p-8 sm:p-10 flex flex-col justify-between">
                            {/* Capacity bars (visual differentiator) */}
                            <div className="mb-8">
                              <p className={`text-[10px] font-black uppercase tracking-[0.18em] mb-4 ${isRec ? 'text-indigo-200' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>Capability meter</p>
                              <div className="space-y-3">
                                {['Storage', 'Analytics', 'AI Models', 'Support'].map((label, bi) => (
                                  <div key={bi}>
                                    <div className={`flex justify-between text-[10px] font-semibold mb-1.5 ${isRec ? 'text-indigo-200' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                      <span>{label}</span>
                                      <span>{cfg.barWidths[bi]}%</span>
                                    </div>
                                    <div className={`h-1.5 rounded-full overflow-hidden ${cfg.progressBg}`}>
                                      <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${cfg.barWidths[bi]}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: idx * 0.1 + bi * 0.1, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${cfg.progressFill}`}
                                        style={{ boxShadow: isRec ? `0 0 8px ${cfg.glowColor}` : 'none' }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* CTA button */}
                            <div>
                              <button
                                onClick={handleGetStarted}
                                className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 relative overflow-hidden group/btn
                                  ${isRec
                                    ? 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-2xl hover:shadow-white/40 hover:-translate-y-0.5'
                                    : isDark
                                      ? 'bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:border-white/30'
                                      : `border-2 bg-transparent hover:-translate-y-0.5 shadow-lg`
                                  }`}
                                style={!isRec && !isDark ? { borderColor: cfg.accentColor, color: cfg.accentColor } : {}}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-all duration-700" />
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                  Select {tier.name}
                                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </span>
                              </button>

                              {/* Trust note */}
                              <p className={`text-xs text-center mt-4 flex items-center justify-center gap-1.5 ${isRec ? 'text-indigo-300' : isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                <span>✦</span> {cfg.trustNote}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom trust bar — no emojis, just icon + text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className={`mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}
              >
                {[
                  { label: 'SOC2 Compliant', Icon: Shield },
                  { label: '99.9% Uptime SLA', Icon: Activity },
                  { label: 'Cancel Anytime', Icon: CheckCircle2 },
                  { label: 'GDPR Ready', Icon: Lock },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.Icon className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </div>
  );
};

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);
