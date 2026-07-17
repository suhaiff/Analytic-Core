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

interface WelcomeProps {
    onNavigateToLogin: () => void;
    onNavigateToSignup: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNavigateToLogin, onNavigateToSignup }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const { scrollYProgress } = useScroll();
    
    // Parallax values
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

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
            <main className="relative z-10 flex-1 flex flex-col items-center pt-32 sm:pt-48 pb-20 px-4">
                
                {/* Floating Elements (Background) */}
                <motion.div style={{ y: y1 }} className="absolute top-40 left-[10%] opacity-20 hidden lg:block animate-float">
                    <div className="w-64 h-64 bg-indigo-500 rounded-full blur-[100px]" />
                </motion.div>
                <motion.div style={{ y: y2 }} className="absolute top-60 right-[10%] opacity-20 hidden lg:block animate-float-delayed">
                    <div className="w-72 h-72 bg-violet-500 rounded-full blur-[120px]" />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    style={{ opacity: opacityHero }}
                    className="flex flex-col items-center text-center max-w-5xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs sm:text-sm font-bold tracking-widest uppercase mb-8">
                        <LinkIcon className="w-3.5 h-3.5" />
                        The Future of Data
                    </div>

                    <h1 className="text-5xl sm:text-7xl md:text-[6rem] font-extrabold tracking-tighter mb-8 leading-[1.1]">
                        The AI-Native <br />
                        <span className="text-gradient-premium">Analytics OS</span>
                    </h1>

                    <p className={`text-lg sm:text-xl md:text-2xl max-w-3xl mb-12 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Transform raw data into beautiful, interactive dashboards instantly. 
                        Predict trends and query your database in plain English.
                    </p>

                    <button
                        onClick={onNavigateToSignup}
                        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-indigo-600 text-white font-bold text-lg overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(99,102,241,0.6)]"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Enter Workspace
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </button>
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
