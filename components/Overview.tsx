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
            className="text-center mb-40 relative z-10 px-4 max-w-7xl mx-auto"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs sm:text-sm font-bold tracking-widest uppercase mb-8 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              <SparklesIcon className="w-4 h-4" /> The Future of Data
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`text-6xl sm:text-7xl md:text-[6.5rem] font-black tracking-tighter mb-8 leading-[1.05]`}
            >
              The AI-Native <br />
              <span className="text-gradient-premium drop-shadow-2xl">
                Analytics OS
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className={`text-xl sm:text-2xl md:text-3xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-4xl mx-auto mb-14 leading-relaxed font-medium`}
            >
              Transform raw data into beautiful, interactive dashboards instantly. Predict trends and query your database in plain English.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex justify-center mb-20 sm:mb-32 relative"
            >
              <button
                onClick={handleGetStarted}
                className="px-10 py-5 rounded-full bg-indigo-600 text-white font-bold text-xl transition-all duration-300 shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:shadow-[0_0_60px_rgba(139,92,246,0.8)] hover:scale-105 flex items-center gap-3 group relative overflow-hidden"
              >
                <span className="relative z-10 tracking-wide">Enter Workspace</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform relative z-10" strokeWidth={2.5} />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
            </motion.div>

            {/* Dashboard Mockup 3D */}
            <motion.div 
              style={{ y: mockupY }}
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }}
              className="relative max-w-5xl mx-auto perspective-[2000px] hidden md:block"
            >
              <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#030014]' : 'from-slate-50'} via-transparent to-transparent z-20 bottom-[-50px] h-2/3 translate-y-1/2 pointer-events-none`}></div>
              
              <motion.div 
                whileHover={{ rotateX: 0, scale: 1.02 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`relative rounded-3xl border glass-panel-premium overflow-hidden transform rotate-x-[15deg] scale-[1.0]`}
              >
                 <div className={`h-12 border-b ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50/80'} flex items-center px-6 gap-2`}>
                   <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500"></div>
                     <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                     <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                   </div>
                   <div className={`ml-6 h-5 w-1/3 max-w-[300px] rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200/60'}`}></div>
                 </div>
                 <div className="p-8 grid grid-cols-3 gap-6 h-[450px]">
                   <div className="col-span-2 flex flex-col gap-6">
                     <div className={`h-56 rounded-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-slate-200 shadow-sm'} border p-6 relative overflow-hidden group`}>
                       <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-indigo-500/20' : 'from-indigo-500/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                       <svg className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <path d="M0,100 L0,70 Q25,50 50,60 T100,20 L100,100 Z" fill={isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"} />
                          <path d="M0,100 L0,70 Q25,50 50,60 T100,20" fill="none" stroke="#818cf8" strokeWidth="2" className={isDark ? "drop-shadow-[0_0_12px_rgba(99,102,241,1)]" : "drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"} />
                       </svg>
                     </div>
                     <div className="grid grid-cols-2 gap-6 h-full">
                       <div className={`rounded-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-slate-200 shadow-sm'} border p-5`}>
                          <div className={`w-1/2 h-4 rounded ${isDark ? 'bg-white/10' : 'bg-slate-200'} mb-6`}></div>
                          <div className={`w-3/4 h-10 rounded ${isDark ? 'bg-indigo-500/30' : 'bg-indigo-100'} mb-3`}></div>
                          <div className={`w-1/3 h-4 rounded ${isDark ? 'bg-emerald-500/30' : 'bg-emerald-100'}`}></div>
                       </div>
                       <div className={`rounded-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-slate-200 shadow-sm'} border p-5 flex items-center justify-center`}>
                          <div className={`w-28 h-28 rounded-full border-[6px] ${isDark ? 'border-indigo-500/20 border-t-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]' : 'border-indigo-100 border-t-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.4)]'} animate-spin-slow`}></div>
                       </div>
                     </div>
                   </div>
                   <div className={`rounded-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-slate-200 shadow-sm'} border p-6 flex flex-col gap-4`}>
                      <div className={`w-full h-10 rounded-xl ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                      <div className={`w-full h-20 rounded-xl ${isDark ? 'bg-violet-500/20 border-violet-500/30' : 'bg-violet-50 border-violet-200 shadow-inner'} flex items-center px-4 border`}>
                        <div className="w-10 h-10 rounded-full bg-violet-500 mr-4 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.6)]"><Bot className="w-5 h-5 text-white" /></div>
                        <div className={`h-2 w-1/2 rounded ${isDark ? 'bg-white/30' : 'bg-violet-200'}`}></div>
                      </div>
                      <div className={`w-full h-20 rounded-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} flex items-center px-4 justify-end border`}>
                        <div className={`h-2 w-1/3 rounded ${isDark ? 'bg-white/20' : 'bg-slate-200'} mr-4`}></div>
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.6)]"><UserIcon className="w-5 h-5 text-white" /></div>
                      </div>
                   </div>
                 </div>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Workflow Section: Animated Pipeline */}
          <section className="mb-40 sm:mb-48 relative z-10 px-4">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16 sm:mb-24"
            >
              <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight`}>Data to <span className="text-gradient-premium">Decisions</span></h2>
              <p className={`text-lg sm:text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto px-4`}>A radically simple workflow that eliminates manual engineering.</p>
            </motion.div>

            <div className="relative max-w-7xl mx-auto">
              {/* Continuous Animated SVG Flow Line */}
              <div className="absolute top-1/2 left-[10%] right-[10%] h-[2px] -translate-y-1/2 hidden lg:block z-0">
                 <svg className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(99,102,241,0.2)" strokeWidth="2" strokeDasharray="10 10" />
                    <motion.line 
                       x1="0" y1="0" x2="100%" y2="0" 
                       stroke="url(#gradientLine)" strokeWidth="4" 
                       initial={{ pathLength: 0 }}
                       animate={{ pathLength: 1, pathOffset: [0, 1] }}
                       transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                       style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.8))' }}
                    />
                    <defs>
                      <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                 </svg>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                {[
                  { icon: Database, title: "1. Connect", desc: "Link databases, APIs, or files. 20+ native integrations.", color: "indigo" },
                  { icon: Workflow, title: "2. Model", desc: "AI automatically detects anomalies and builds relationships.", color: "violet" },
                  { icon: LineChart, title: "3. Visualize", desc: "Interactive dashboards generated instantly with zero config.", color: "fuchsia" },
                  { icon: MessageSquare, title: "4. Query", desc: "Ask questions in plain English and run predictive models.", color: "pink" }
                ].map((step, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    key={i} 
                    className={`glass-panel-premium p-8 rounded-[2rem] border transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_20px_40px_rgba(99,102,241,0.2)] group`}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 ${isDark ? 'bg-white/5' : 'bg-indigo-500/5'} rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors`} />
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-16 h-16 rounded-2xl ${isDark ? 'bg-white/10 border-white/20' : 'bg-slate-100 border-slate-200'} flex items-center justify-center mb-6 text-${step.color}-500 relative z-10 border shadow-lg`}
                    >
                      <step.icon className="w-8 h-8" />
                    </motion.div>
                    <h3 className={`text-2xl font-bold mb-4 relative z-10`}>{step.title}</h3>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed relative z-10`}>{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Core Capabilities (Bento) - Living UI */}
          <section className="mb-40 sm:mb-48 z-10 relative px-4 max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16 sm:mb-24"
            >
              <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight`}>A Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Without Limits</span></h2>
              <p className={`text-lg sm:text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto`}>Living interfaces that adapt to your workflows.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px]">
              {/* ML Hub */}
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                 className={`md:col-span-2 p-10 rounded-[2.5rem] glass-panel-premium bento-card relative overflow-hidden group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent z-0`}></div>
                
                <div className="absolute right-[-10%] top-0 w-2/3 h-full opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none hidden sm:block">
                   <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 10px rgba(129, 140, 248, 0.8))' }}>
                     {[...Array(25)].map((_, i) => (
                       <motion.circle key={`n-${i}`} cx={Math.random() * 200} cy={Math.random() * 200} r="1.5" fill="#c084fc"
                         animate={{ opacity: [0.2, 1, 0.2], scale: [1, 2, 1] }} transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }} />
                     ))}
                     <motion.path d="M50 50 L100 100 L150 50 M100 100 L100 150 M50 150 L100 100" stroke="#818cf8" strokeWidth="1" fill="none"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, repeat: Infinity }} />
                   </svg>
                </div>

                <div className="flex flex-col h-full justify-start relative z-10 sm:w-2/3">
                  <div className={`w-14 h-14 rounded-2xl bg-indigo-500/20 ${isDark ? 'text-indigo-400' : 'text-indigo-600 bg-indigo-100 border-indigo-200 shadow-sm'} flex items-center justify-center mb-8 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.5)]`}>
                    <Cpu className="w-8 h-8" />
                  </div>
                  <h3 className={`text-3xl sm:text-4xl font-bold mb-4`}>Machine Learning Hub</h3>
                  <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-md leading-relaxed`}>Auto-ML automatically trains predictive models on your live data. Deploy forecasts in seconds.</p>
                </div>
              </motion.div>

              {/* AI Copilot */}
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                 className={`p-10 rounded-[2.5rem] glass-panel-premium bento-card relative overflow-hidden group flex flex-col justify-between`}
              >
                <div className={`absolute inset-0 bg-gradient-to-bl from-fuchsia-500/20 via-transparent to-transparent z-0`}></div>
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-fuchsia-500/20 ${isDark ? 'text-fuchsia-400' : 'text-fuchsia-600 bg-fuchsia-100 border-fuchsia-200 shadow-sm'} flex items-center justify-center mb-6 border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.5)]`}>
                    <Bot className="w-8 h-8" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2`}>AI Copilot</h3>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Chat with your data.</p>
                </div>
                
                <div className="mt-8 space-y-4 relative z-10">
                  <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200 shadow-sm'} border p-4 rounded-2xl rounded-tr-sm w-4/5 ml-auto relative overflow-hidden shadow-lg`}>
                     <motion.div initial={{ width: "0%" }} whileInView={{ width: "100%" }} transition={{ duration: 2, ease: "linear" }} className={`whitespace-nowrap overflow-hidden text-xs font-mono font-medium ${isDark ? 'text-fuchsia-300' : 'text-fuchsia-600'}`}>
                      ✨ Show revenue...
                     </motion.div>
                  </div>
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 2.2 }} className={`bg-fuchsia-500/20 border border-fuchsia-500/30 p-4 rounded-2xl rounded-tl-sm w-5/6 ${isDark ? 'shadow-[0_0_20px_rgba(217,70,239,0.2)]' : 'shadow-sm'}`}>
                     <div className="h-2 bg-fuchsia-500/50 rounded w-full mb-2"></div>
                     <div className="h-12 w-full bg-gradient-to-t from-fuchsia-500/30 to-transparent rounded-lg border-b-2 border-fuchsia-400"></div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Real-time Collab */}
              <motion.div 
                 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                 className={`p-10 rounded-[2.5rem] glass-panel-premium bento-card relative overflow-hidden group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-t from-amber-500/20 via-transparent to-transparent z-0`}></div>
                
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity">
                   <motion.div animate={{ x: [20, 150, 50, 20], y: [20, 50, 150, 20] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 left-10 flex flex-col items-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24" stroke="white" strokeWidth="1"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                      <span className="bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full mt-1">Alex</span>
                   </motion.div>
                   <motion.div animate={{ x: [200, 100, 220, 200], y: [150, 200, 80, 150] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-10 flex flex-col items-center shadow-[0_0_15px_rgba(56,189,248,0.5)] hidden sm:flex">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#38bdf8" stroke="white" strokeWidth="1"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                      <span className="bg-sky-400 text-black text-[9px] font-bold px-2 py-0.5 rounded-full mt-1">Sarah</span>
                   </motion.div>
                </div>
                
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className={`w-14 h-14 rounded-2xl bg-amber-500/20 ${isDark ? 'text-amber-400' : 'text-amber-600 bg-amber-100 border-amber-200 shadow-sm'} flex items-center justify-center mb-6 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.4)]`}>
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2`}>Multiplayer</h3>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm leading-relaxed`}>Build dashboards together in real-time. Annotate, tag, and decide faster.</p>
                </div>
              </motion.div>

              {/* Enterprise Security */}
              <motion.div 
                 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                 className={`p-10 rounded-[2.5rem] glass-panel-premium bento-card relative overflow-hidden group flex flex-col justify-between`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent z-0`}></div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-emerald-500/30 rounded-full flex items-center justify-center pointer-events-none group-hover:border-emerald-500/60 transition-colors shadow-[0_0_30px_rgba(16,185,129,0.1)] inset-0 m-auto">
                  <motion.div animate={{ scale: [1, 2.5], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute w-24 h-24 bg-emerald-500/30 rounded-full"></motion.div>
                  <Shield className="w-16 h-16 text-emerald-500/40 absolute drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                </div>
                
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className={`w-14 h-14 rounded-2xl bg-emerald-500/20 ${isDark ? 'text-emerald-400' : 'text-emerald-600 bg-emerald-100 border-emerald-200 shadow-sm'} flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.4)]`}>
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2`}>Bank-Grade</h3>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm leading-relaxed`}>SOC2 compliant. End-to-end encryption with fine-grained RBAC.</p>
                </div>
              </motion.div>

              {/* Developer API */}
              <motion.div 
                 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
                 className={`p-10 rounded-[2.5rem] bg-[#0A0C10] border border-white/10 bento-card relative overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.5)]`}
              >
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-indigo-500/30 to-transparent rounded-full blur-3xl z-0 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                     <div className="w-14 h-14 rounded-2xl bg-indigo-500/30 text-indigo-400 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-500/40">
                       <Code2 className="w-8 h-8" />
                     </div>
                     <h3 className={`text-2xl font-bold text-white mb-2`}>Developer API</h3>
                     <p className={`text-indigo-200 text-sm mb-6`}>Embed anywhere using GraphQL.</p>
                  </div>
                  
                  <div className="bg-[#0D1117] rounded-xl p-5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden text-xs font-mono w-full">
                     <div className="flex gap-1.5 mb-3 border-b border-white/10 pb-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                     </div>
                     <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                       <span className="text-pink-400">const</span> <span className="text-blue-400">dashboard</span> = <span className="text-blue-400">await</span> <span className="text-emerald-400">api</span>.<span className="text-sky-300">embed</span>({`{`}<br/>
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
          <section className="mb-24 z-10 relative px-4 max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              <h2 className={`text-4xl sm:text-5xl font-black mb-4 tracking-tight`}>Smart <span className="text-gradient-premium">Pricing</span></h2>
              <p className={`text-lg sm:text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Choose the plan that accelerates your growth.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto items-center">
              {pricingTiers.map((tier, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  key={idx} 
                  className={`relative p-8 sm:p-10 rounded-[2.5rem] glass-panel-premium bento-card flex flex-col ${tier.recommended ? `border-2 border-indigo-500 shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)] md:scale-105 z-10 ${isDark ? 'bg-indigo-900/10' : 'bg-indigo-50/50'}` : `${isDark ? 'border-white/10' : 'border-slate-200'}`}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-violet-500/0 to-fuchsia-500/0 group-hover:from-indigo-500/5 group-hover:via-violet-500/5 group-hover:to-fuchsia-500/5 transition-all duration-500 pointer-events-none rounded-[2.5rem]"></div>
                  
                  {tier.recommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] rounded-b-xl shadow-lg shadow-indigo-500/40">
                      Most Popular
                    </div>
                  )}
                  <h3 className={`text-2xl font-bold mb-2 mt-2 group-hover:text-indigo-400 transition-colors`}>{tier.name}</h3>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm mb-8 min-h-[40px] leading-relaxed`}>{tier.description}</p>
                  <div className="mb-8 relative">
                    <span className={`text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${tier.recommended ? 'from-white to-indigo-200' : (isDark ? 'from-white to-slate-400' : 'from-slate-900 to-slate-500')}`}>{tier.price}</span>
                  </div>
                  <ul className="space-y-4 sm:space-y-5 mb-10 flex-grow">
                    {tier.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${tier.recommended ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className={`font-medium text-sm ${tier.recommended ? 'text-white' : ''}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleGetStarted}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 relative overflow-hidden group/btn ${
                      tier.recommended 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] transform hover:-translate-y-1' 
                        : `${isDark ? 'bg-white/5 hover:bg-white/10 border-white/20' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 shadow-sm'} border`
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
