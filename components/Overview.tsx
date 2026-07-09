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
  const mockupY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

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

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
    })
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${colors.bgPrimary}`} ref={containerRef}>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")] opacity-20 mix-blend-overlay`}></div>
        <div className={`absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent opacity-50`}></div>
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ x: mousePosition.x * 0.02, y: mousePosition.y * 0.02 }}
          className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full ${colors.gradientTop} blur-[120px] opacity-40`}
        />
        <motion.div 
          animate={{ x: mousePosition.x * -0.02, y: mousePosition.y * -0.02 }}
          className={`absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full ${colors.gradientBottom} blur-[120px] opacity-40`}
        />
      </div>

      <AnimatePresence>
        {isTransitioning && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 1 }}
             className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
           >
              <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-slate-950/80 backdrop-blur-3xl' : 'bg-white/80 backdrop-blur-3xl'}`} />
              <div className="relative z-10 flex flex-col items-center">
                 <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} 
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 p-1"
                 >
                    <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
                      <Activity className="w-10 h-10 text-white" />
                    </div>
                 </motion.div>
                 <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400"
                 >
                   Initializing OS
                 </motion.h2>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <nav className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <h1 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'}`}>
              AnalyticCore
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <button
                onClick={handleSkipToDashboard}
                className="px-6 py-2.5 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/25 transform hover:-translate-y-0.5 flex items-center gap-2 group"
              >
                Skip to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-24 overflow-x-hidden">
          
          {/* Hero Section */}
          <motion.section 
            style={{ opacity: heroOpacity }}
            className="text-center mb-32 mt-10 lg:mt-20 relative z-10"
          >
            <motion.div 
              custom={0} initial="hidden" animate="visible" variants={fadeUpVariant}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold mb-8 uppercase tracking-widest backdrop-blur-sm"
            >
              <SparklesIcon className="w-4 h-4" /> The Future of Data
            </motion.div>
            
            <motion.h1 
              custom={1} initial="hidden" animate="visible" variants={fadeUpVariant}
              className={`text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-black ${colors.textPrimary} tracking-tighter mb-8 leading-[1.05]`}
            >
              The AI-Native <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 animate-gradient-x inline-block drop-shadow-sm">
                Analytics OS
              </span>
            </motion.h1>
            
            <motion.p 
              custom={2} initial="hidden" animate="visible" variants={fadeUpVariant}
              className={`text-xl sm:text-2xl md:text-3xl ${colors.textMuted} max-w-4xl mx-auto mb-14 leading-relaxed font-light`}
            >
              Transform raw data into beautiful, interactive dashboards instantly. Predict trends and query your database in plain English.
            </motion.p>
            
            <motion.div 
              custom={3} initial="hidden" animate="visible" variants={fadeUpVariant}
              className="flex justify-center mb-20 sm:mb-32 relative"
            >
              <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full w-full h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white font-bold text-lg transition-all duration-300 shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] hover:-translate-y-1 flex items-center gap-3 group relative overflow-hidden border border-white/10"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-[-20deg]"></div>
                <span className="relative z-10 tracking-wide">Enter Workspace</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" strokeWidth={2.5} />
              </button>
            </motion.div>

            {/* Dashboard Mockup 3D */}
            <motion.div 
              style={{ y: mockupY }}
              custom={4} initial="hidden" animate="visible" variants={fadeUpVariant}
              className="relative max-w-5xl mx-auto perspective-[2000px] hidden md:block"
            >
              <div className={`absolute inset-0 bg-gradient-to-t from-${theme === 'dark' ? 'slate-950' : 'white'} via-transparent to-transparent z-20 bottom-0 h-1/2 translate-y-1/2`}></div>
              
              <motion.div 
                whileHover={{ rotateX: 0, scale: 1.05 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`relative rounded-3xl border ${theme === 'dark' ? 'border-white/10 bg-slate-900/80 shadow-[0_0_100px_rgba(79,70,229,0.2)]' : 'border-indigo-100 bg-white/90 shadow-[0_30px_100px_rgba(79,70,229,0.15)]'} backdrop-blur-xl overflow-hidden transform rotate-x-[10deg] scale-[1.0]`}
              >
                 <div className={`h-12 border-b ${theme === 'dark' ? 'border-white/10' : 'border-indigo-50'} flex items-center px-6 gap-2 bg-black/10`}>
                   <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                     <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                     <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                   </div>
                   <div className={`ml-6 h-6 w-1/3 max-w-[300px] rounded-md ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-200'}`}></div>
                 </div>
                 <div className="p-8 grid grid-cols-3 gap-6 h-[450px]">
                   <div className="col-span-2 flex flex-col gap-6">
                     <div className={`h-56 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'} p-6 relative overflow-hidden group`}>
                       <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <svg className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <path d="M0,100 L0,70 Q25,50 50,60 T100,20 L100,100 Z" fill={theme === 'dark' ? 'rgba(79,70,229,0.2)' : 'rgba(79,70,229,0.1)'} />
                          <path d="M0,100 L0,70 Q25,50 50,60 T100,20" fill="none" stroke="#6366f1" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                       </svg>
                     </div>
                     <div className="grid grid-cols-2 gap-6 h-full">
                       <div className={`rounded-2xl ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'} p-5`}>
                          <div className={`w-1/2 h-4 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} mb-6`}></div>
                          <div className={`w-3/4 h-10 rounded ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-100'} mb-3`}></div>
                          <div className={`w-1/3 h-4 rounded ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}></div>
                       </div>
                       <div className={`rounded-2xl ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'} p-5 flex items-center justify-center`}>
                          <div className="w-28 h-28 rounded-full border-[6px] border-indigo-500/20 border-t-indigo-500 animate-spin-slow"></div>
                       </div>
                     </div>
                   </div>
                   <div className={`rounded-2xl ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'} p-6 flex flex-col gap-4`}>
                      <div className={`w-full h-10 rounded-xl ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                      <div className={`w-full h-20 rounded-xl ${theme === 'dark' ? 'bg-violet-500/20' : 'bg-violet-100'} flex items-center px-4`}>
                        <div className="w-10 h-10 rounded-full bg-violet-500 mr-4 flex items-center justify-center shadow-lg shadow-violet-500/40"><Bot className="w-5 h-5 text-white" /></div>
                        <div className={`h-2 w-1/2 rounded ${theme === 'dark' ? 'bg-white/20' : 'bg-violet-300'}`}></div>
                      </div>
                      <div className={`w-full h-20 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-white'} flex items-center px-4 justify-end`}>
                        <div className={`h-2 w-1/3 rounded ${theme === 'dark' ? 'bg-white/20' : 'bg-slate-200'} mr-4`}></div>
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40"><UserIcon className="w-5 h-5 text-white" /></div>
                      </div>
                   </div>
                 </div>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Workflow Section: Animated Pipeline */}
          <section className="mb-32 sm:mb-48 relative z-10 px-4">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16 sm:mb-32"
            >
              <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black ${colors.textPrimary} mb-6 tracking-tight`}>Data to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Decisions</span></h2>
              <p className={`text-lg sm:text-xl ${colors.textMuted} max-w-2xl mx-auto px-4`}>A radically simple workflow that eliminates manual engineering.</p>
            </motion.div>

            <div className="relative max-w-7xl mx-auto">
              {/* Continuous Animated SVG Flow Line */}
              <div className="absolute top-1/2 left-[10%] right-[10%] h-[2px] -translate-y-1/2 hidden lg:block z-0">
                 <svg className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(99,102,241,0.2)" strokeWidth="2" strokeDasharray="10 10" />
                    <motion.line 
                       x1="0" y1="0" x2="100%" y2="0" 
                       stroke="url(#gradientLine)" strokeWidth="3" 
                       initial={{ pathLength: 0 }}
                       animate={{ pathLength: 1, pathOffset: [0, 1] }}
                       transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                    <defs>
                      <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                 </svg>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                {[
                  { icon: Database, title: "1. Connect", desc: "Link databases, APIs, or files. 20+ native integrations.", color: "blue", shadow: "shadow-blue-500/20" },
                  { icon: Workflow, title: "2. Model", desc: "AI automatically detects anomalies and builds relationships.", color: "violet", shadow: "shadow-violet-500/20" },
                  { icon: LineChart, title: "3. Visualize", desc: "Interactive dashboards generated instantly with zero config.", color: "fuchsia", shadow: "shadow-fuchsia-500/20" },
                  { icon: MessageSquare, title: "4. Query", desc: "Ask questions in plain English and run predictive models.", color: "emerald", shadow: "shadow-emerald-500/20" }
                ].map((step, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    key={i} 
                    className={`relative p-8 rounded-[2rem] ${theme === 'dark' ? 'bg-slate-900/40 border-white/5' : 'bg-white/60 border-slate-200'} backdrop-blur-2xl border hover:border-${step.color}-500/50 transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:${step.shadow} group`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-b from-${step.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]`}></div>
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-16 h-16 rounded-2xl bg-${step.color}-500/10 flex items-center justify-center mb-6 text-${step.color}-400 relative z-10 border border-${step.color}-500/20 shadow-lg`}
                    >
                      <step.icon className="w-8 h-8" />
                    </motion.div>
                    <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-4 relative z-10`}>{step.title}</h3>
                    <p className={`${colors.textMuted} leading-relaxed relative z-10`}>{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Core Capabilities (Bento) - Living UI */}
          <section className="mb-32 sm:mb-48 z-10 relative px-4">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16 sm:mb-24"
            >
              <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black ${colors.textPrimary} mb-6 tracking-tight`}>A Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Without Limits</span></h2>
              <p className={`text-lg sm:text-xl ${colors.textMuted} max-w-2xl mx-auto`}>Living interfaces that adapt to your workflows.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto auto-rows-[400px]">
              {/* ML Hub */}
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                 className={`md:col-span-2 p-10 rounded-[2.5rem] ${theme === 'dark' ? 'bg-slate-900/60 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'bg-white/70 border-indigo-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]'} backdrop-blur-2xl border relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] transition-all duration-500`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${theme === 'dark' ? 'from-indigo-500/20 via-transparent to-transparent' : 'from-indigo-100/60 via-white/40 to-transparent'} z-0`}></div>
                {/* Neural Network SVG Anim */}
                <div className="absolute right-0 top-0 w-1/2 h-full opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none hidden sm:block">
                   <svg viewBox="0 0 200 200" className="w-full h-full">
                     {[...Array(20)].map((_, i) => (
                       <motion.circle key={`n-${i}`} cx={Math.random() * 200} cy={Math.random() * 200} r="2" fill="#818cf8"
                         animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }} transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }} />
                     ))}
                     <motion.path d="M50 50 L100 100 L150 50 M100 100 L100 150" stroke="#4f46e5" strokeWidth="0.5" fill="none"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, repeat: Infinity }} />
                   </svg>
                </div>

                <div className="flex flex-col h-full justify-between relative z-10 sm:w-2/3">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-8 border border-indigo-500/30">
                      <Cpu className="w-8 h-8" />
                    </div>
                    <h3 className={`text-3xl sm:text-4xl font-bold ${colors.textPrimary} mb-4`}>Machine Learning Hub</h3>
                    <p className={`text-lg ${colors.textMuted} max-w-md leading-relaxed`}>Auto-ML automatically trains predictive models on your live data. Deploy forecasts in seconds.</p>
                  </div>
                </div>
              </motion.div>

              {/* AI Copilot */}
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                 className={`p-10 rounded-[2.5rem] ${theme === 'dark' ? 'bg-slate-900/60 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'bg-white/70 border-fuchsia-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]'} backdrop-blur-2xl border relative overflow-hidden group flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(217,70,239,0.15)] transition-all duration-500`}
              >
                <div className={`absolute inset-0 bg-gradient-to-bl ${theme === 'dark' ? 'from-fuchsia-500/20 via-transparent to-transparent' : 'from-fuchsia-100/60 via-white/40 to-transparent'} z-0`}></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center mb-6 border border-fuchsia-500/30">
                    <Bot className="w-8 h-8" />
                  </div>
                  <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-2`}>AI Copilot</h3>
                  <p className={`${colors.textMuted} text-sm`}>Chat with your data.</p>
                </div>
                
                {/* Typing Effect UI */}
                <div className="mt-8 space-y-4 relative z-10">
                  <div className={`${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'} border p-4 rounded-2xl rounded-tr-sm w-4/5 ml-auto relative overflow-hidden`}>
                     <motion.div initial={{ width: "0%" }} whileInView={{ width: "100%" }} transition={{ duration: 2, ease: "linear" }} className={`whitespace-nowrap overflow-hidden text-xs ${colors.textSecondary} font-mono`}>
                      &gt; Show revenue...
                     </motion.div>
                  </div>
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 2.2 }} className="bg-fuchsia-500/10 border border-fuchsia-500/20 p-4 rounded-2xl rounded-tl-sm w-5/6">
                     <div className="h-2 bg-fuchsia-500/30 rounded w-full mb-2"></div>
                     <div className="h-16 w-full bg-gradient-to-t from-fuchsia-500/20 to-transparent rounded-lg border-b-2 border-fuchsia-500"></div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Real-time Collab */}
              <motion.div 
                 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                 className={`p-10 rounded-[2.5rem] ${theme === 'dark' ? 'bg-slate-900/60 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'bg-white/70 border-amber-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]'} backdrop-blur-2xl border relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)] transition-all duration-500`}
              >
                <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'dark' ? 'from-amber-500/20 via-transparent to-transparent' : 'from-amber-100/60 via-white/40 to-transparent'} z-0`}></div>
                {/* Floating Multiplayer Cursors */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity">
                   <motion.div animate={{ x: [20, 150, 50, 20], y: [20, 50, 150, 20] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 left-10 flex flex-col items-center shadow-lg">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24" stroke="white" strokeWidth="1"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                      <span className="bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full mt-1">Alex</span>
                   </motion.div>
                   <motion.div animate={{ x: [200, 100, 220, 200], y: [150, 200, 80, 150] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-10 flex flex-col items-center shadow-lg hidden sm:flex">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#38bdf8" stroke="white" strokeWidth="1"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                      <span className="bg-sky-400 text-black text-[9px] font-bold px-2 py-0.5 rounded-full mt-1">Sarah</span>
                   </motion.div>
                </div>
                
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-6 border border-amber-500/30">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-2`}>Multiplayer</h3>
                  <p className={`${colors.textMuted} text-sm leading-relaxed`}>Build dashboards together in real-time. Annotate, tag, and decide faster.</p>
                </div>
              </motion.div>

              {/* Enterprise Security */}
              <motion.div 
                 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                 className={`p-10 rounded-[2.5rem] ${theme === 'dark' ? 'bg-slate-900/60 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'bg-white/70 border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]'} backdrop-blur-2xl border relative overflow-hidden group flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] transition-all duration-500`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${theme === 'dark' ? 'from-emerald-500/10 via-transparent to-transparent' : 'from-emerald-50/80 via-white/40 to-transparent'} z-0`}></div>
                {/* Radar/Shield Pulse Anim */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-emerald-500/20 rounded-full flex items-center justify-center pointer-events-none group-hover:border-emerald-500/40 transition-colors">
                  <motion.div animate={{ scale: [1, 2], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute w-32 h-32 bg-emerald-500/20 rounded-full"></motion.div>
                  <Shield className="w-16 h-16 text-emerald-500/20 absolute" />
                </div>
                
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/30">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-2`}>Bank-Grade</h3>
                  <p className={`${colors.textMuted} text-sm leading-relaxed`}>SOC2 compliant. End-to-end encryption with fine-grained RBAC.</p>
                </div>
              </motion.div>

              {/* Developer API */}
              <motion.div 
                 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
                 className={`p-10 rounded-[2.5rem] ${theme === 'dark' ? 'bg-indigo-950 border-indigo-500/30 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'bg-indigo-950 border-indigo-400/50 shadow-[0_20px_50px_rgba(79,70,229,0.3)]'} border relative overflow-hidden group`}
              >
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-indigo-500/30 to-transparent rounded-full blur-3xl z-0 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex-1">
                     <div className="w-14 h-14 rounded-2xl bg-indigo-500/30 text-indigo-500 flex items-center justify-center mb-6">
                       <Code2 className="w-8 h-8" />
                     </div>
                     <h3 className={`text-2xl font-bold text-white mb-2`}>Developer API</h3>
                     <p className={`text-indigo-200 text-sm mb-6`}>Embed anywhere using GraphQL.</p>
                  </div>
                  
                  {/* Code Editor Anim */}
                  <div className="bg-[#0f111a] rounded-xl p-4 border border-indigo-500/20 shadow-2xl overflow-hidden text-[10px] sm:text-xs font-mono w-[110%] relative -left-4">
                     <div className="flex gap-1.5 mb-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                     </div>
                     <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                       <span className="text-pink-400">const</span> <span className="text-blue-400">dashboard</span> <span className="text-pink-400">=</span> <span className="text-blue-400">await</span> <span className="text-emerald-400">analytic</span>.<span className="text-sky-300">embed</span>({`{`}<br/>
                       &nbsp;&nbsp;<span className="text-slate-300">id:</span> <span className="text-amber-300">'dash_1'</span>,<br/>
                       &nbsp;&nbsp;<span className="text-slate-300">theme:</span> <span className="text-amber-300">'dark'</span><br/>
                       {`}`});
                     </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Pricing */}
          <section className="mb-24 z-10 relative px-4">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              <h2 className={`text-4xl sm:text-5xl font-black ${colors.textPrimary} mb-4 tracking-tight`}>Smart <span className="text-violet-400">Pricing</span></h2>
              <p className={`text-lg sm:text-xl ${colors.textMuted}`}>Choose the plan that accelerates your growth.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {pricingTiers.map((tier, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  key={idx} 
                  className={`relative p-8 sm:p-10 rounded-[2.5rem] border ${tier.recommended ? `border-indigo-500 ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-900/40 via-indigo-900/10 to-transparent shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]' : 'bg-gradient-to-br from-indigo-100 via-indigo-50 to-white shadow-[0_20px_50px_rgba(99,102,241,0.2)]'} lg:scale-105 z-10` : `${colors.borderPrimary} ${colors.bgSecondary} hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)]`} backdrop-blur-xl transition-all duration-500 group flex flex-col`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-violet-500/0 to-fuchsia-500/0 group-hover:from-indigo-500/10 group-hover:via-violet-500/5 group-hover:to-fuchsia-500/10 transition-all duration-500 pointer-events-none rounded-[2.5rem]"></div>
                  
                  {tier.recommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] rounded-b-xl shadow-lg shadow-indigo-500/30">
                      Most Popular
                    </div>
                  )}
                  <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-2 mt-2 group-hover:text-indigo-400 transition-colors`}>{tier.name}</h3>
                  <p className={`${colors.textMuted} text-sm mb-8 min-h-[40px] leading-relaxed`}>{tier.description}</p>
                  <div className="mb-8 relative">
                    <span className={`text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${tier.recommended ? (theme === 'dark' ? 'from-white to-indigo-200' : 'from-indigo-600 to-violet-600') : (theme === 'dark' ? 'from-white to-slate-400' : 'from-slate-900 to-slate-500')}`}>{tier.price}</span>
                  </div>
                  <ul className="space-y-4 sm:space-y-5 mb-10 flex-grow">
                    {tier.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${tier.recommended ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className={`${colors.textSecondary} font-medium text-sm`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleGetStarted}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 relative overflow-hidden group/btn ${
                      tier.recommended 
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transform hover:-translate-y-1' 
                        : `${colors.bgTertiary} ${colors.textPrimary} hover:border-indigo-500/50 border ${colors.borderPrimary} hover:bg-indigo-500/10`
                    }`}
                  >
                    <div className="absolute inset-0 w-full h-full bg-white/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity translate-x-[-100%] group-hover/btn:translate-x-[100%] duration-1000"></div>
                    <span className="relative z-10">Select {tier.name}</span>
                  </button>
                </motion.div>
              ))}
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
