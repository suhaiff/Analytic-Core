import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Code2, Megaphone, Palette, Target, Settings, 
  Database, Wand2, LineChart, Sparkles, CheckCircle2, 
  Zap, Shield, Info, Clock, Wifi, CheckCircle 
} from 'lucide-react';

interface DetailsProps {
  onNavigateToLanding: () => void;
}

const tabs = [
  { id: 'software', label: 'Software', icon: Code2 },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'project', label: 'Project', icon: Target },
  { id: 'operations', label: 'Operations', icon: Settings },
];

const tabContent = {
  software: {
    title: 'Software teams',
    features: [
      { title: 'Sprint Analytics:', desc: 'Automatically track velocity, burn-down charts, and sprint health metrics from Jira or GitHub.' },
      { title: 'Deployment Health:', desc: 'Monitor error rates, server loads, and deployment frequencies in real-time dashboards.' },
      { title: 'Bug Tracking Insights:', desc: 'Squash bugs faster by prioritizing and visualizing backlog growth versus resolution rates.' }
    ],
    color: 'indigo',
    image: '/images/mockups/software_dashboard_1783583179532.png'
  },
  marketing: {
    title: 'Marketing teams',
    features: [
      { title: 'Campaign ROI:', desc: 'Unify ad spend from Google, Meta, and LinkedIn against sales data to calculate true ROAS.' },
      { title: 'Funnel Conversion:', desc: 'Visualize user drop-offs at every stage of your marketing funnel instantly.' },
      { title: 'Audience Sentiment:', desc: 'Use AI models to analyze feedback and social mentions in natural language.' }
    ],
    color: 'fuchsia',
    image: '/images/mockups/marketing_dashboard_1783583189551.png'
  },
  design: {
    title: 'Design teams',
    features: [
      { title: 'User Engagement:', desc: 'Track how users interact with specific UI components and measure time-on-task.' },
      { title: 'A/B Test Results:', desc: 'Connect testing platforms to automatically visualize winning variants with statistical significance.' },
      { title: 'Feedback Aggregation:', desc: 'Consolidate qualitative feedback into measurable metrics.' }
    ],
    color: 'pink',
    image: '/images/mockups/design_dashboard_1783583201618.png'
  },
  project: {
    title: 'Project Management',
    features: [
      { title: 'Resource Allocation:', desc: 'Map team capacity against upcoming milestones to prevent bottlenecks.' },
      { title: 'Timeline Tracking:', desc: 'Generate dynamic Gantt charts and dependency graphs from flat task lists.' },
      { title: 'Budget Burndown:', desc: 'Keep projects under budget with predictive forecasting models.' }
    ],
    color: 'emerald',
    image: '/images/mockups/project_management_1783583237182.png'
  },
  operations: {
    title: 'Operations',
    features: [
      { title: 'Supply Chain Metrics:', desc: 'Monitor inventory levels, supplier lead times, and fulfillment rates across regions.' },
      { title: 'Cost Optimization:', desc: 'Identify operational inefficiencies using anomaly detection algorithms.' },
      { title: 'SLA Monitoring:', desc: 'Ensure service level agreements are met with live threshold alerts.' }
    ],
    color: 'amber',
    image: '/images/mockups/operations_dashboard_1783583249875.png'
  }
};

const pros = [
  { id: 1, title: 'AI-Native Insights', desc: 'Ask questions in plain English and instantly receive interactive charts and SQL queries.', icon: Sparkles },
  { id: 2, title: 'Real-time Multiplayer', desc: 'Collaborate with your team on live dashboards simultaneously, just like Google Docs.', icon: Zap },
  { id: 3, title: 'Bank-Grade Security', desc: 'SOC2 compliant with end-to-end encryption and fine-grained RBAC out of the box.', icon: Shield },
];

const cons = [
  { id: 1, title: 'Cloud-Only Deployment', desc: 'Currently does not support on-premise installations for fully air-gapped environments.', icon: Wifi },
  { id: 2, title: 'Initial Indexing Time', desc: 'Connecting massive legacy databases (10TB+) may take a few hours to fully index semantics.', icon: Clock },
  { id: 3, title: 'Advanced Custom ML', desc: 'While Auto-ML is powerful, importing custom Python ML models requires the Enterprise API.', icon: Code2 },
];

export const Details: React.FC<DetailsProps> = ({ onNavigateToLanding }) => {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const currentContent = tabContent[activeTab as keyof typeof tabContent];

  const getColorClass = (colorStr: string, type: 'bg' | 'text' | 'border' | 'shadow' | 'gradient') => {
    const map: Record<string, any> = {
      indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500', shadow: 'shadow-indigo-500/20', gradient: 'from-indigo-500 to-violet-500' },
      fuchsia: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-500', border: 'border-fuchsia-500', shadow: 'shadow-fuchsia-500/20', gradient: 'from-fuchsia-500 to-pink-500' },
      pink: { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500', shadow: 'shadow-pink-500/20', gradient: 'from-pink-500 to-rose-500' },
      emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500', shadow: 'shadow-emerald-500/20', gradient: 'from-emerald-500 to-teal-500' },
      amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500', shadow: 'shadow-amber-500/20', gradient: 'from-amber-500 to-orange-500' },
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500', shadow: 'shadow-blue-500/20', gradient: 'from-blue-500 to-indigo-500' },
      violet: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500', shadow: 'shadow-violet-500/20', gradient: 'from-violet-500 to-fuchsia-500' },
    };
    return map[colorStr][type];
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${colors.bgPrimary}`}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")] opacity-10 mix-blend-overlay`}></div>
        <div className={`absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-indigo-500/20 to-transparent blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3`}></div>
        <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-fuchsia-500/10 to-transparent blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3`}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 w-full"
        >
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black ${colors.textPrimary} tracking-tight mb-6`}>
            Set up projects faster <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500">for your team</span>
          </h1>
          <p className={`text-lg md:text-xl ${colors.textMuted} max-w-2xl mx-auto font-light`}>
            Discover how our AI-Native Analytics OS empowers every department to turn raw data into strategic insights instantly.
          </p>
        </motion.div>

        {/* Tabs Section */}
        <div className="w-full mb-24">
          <div className="flex justify-center mb-12">
            <div className={`flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-3xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'} backdrop-blur-md`}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-5 py-2.5 rounded-2xl text-sm md:text-base font-semibold transition-all duration-300 flex items-center gap-2 z-10 ${
                      isActive 
                        ? `${theme === 'dark' ? 'text-white' : 'text-indigo-700'}` 
                        : `${colors.textMuted} hover:${colors.textPrimary} hover:bg-white/5`
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute inset-0 rounded-2xl ${theme === 'dark' ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white shadow-md border border-indigo-100'}`}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className={`rounded-[2.5rem] p-8 md:p-12 border ${theme === 'dark' ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-slate-200 shadow-xl shadow-indigo-900/5'} backdrop-blur-xl relative overflow-hidden min-h-[400px]`}>
             {/* Background Decoration based on active tab */}
             <div className={`absolute -right-20 -top-20 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 transition-colors duration-700 ${getColorClass(currentContent.color, 'bg')}`}></div>
             
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ duration: 0.4 }}
                 className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
               >
                 <div>
                   <h2 className={`text-3xl font-bold ${colors.textPrimary} mb-8 flex items-center gap-3`}>
                     <div className={`w-3 h-8 rounded-full bg-gradient-to-b ${getColorClass(currentContent.color, 'gradient')}`}></div>
                     {currentContent.title}
                   </h2>
                   <div className="space-y-6">
                     {currentContent.features.map((feature, idx) => (
                       <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 + 0.2 }}
                          key={idx} 
                          className="flex gap-4 group"
                       >
                         <div className={`mt-1 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${getColorClass(currentContent.color, 'bg')} ${getColorClass(currentContent.color, 'text')}`}>
                           <CheckCircle2 className="w-4 h-4" />
                         </div>
                         <div>
                           <h3 className={`text-lg font-bold ${colors.textPrimary} mb-1 group-hover:${getColorClass(currentContent.color, 'text')} transition-colors`}>{feature.title}</h3>
                           <p className={`${colors.textMuted} leading-relaxed`}>{feature.desc}</p>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                 </div>
                 
                 {/* Decorative Right Side - Image Rendering */}
                 <div className="relative h-[300px] lg:h-[400px] rounded-3xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl flex items-center justify-center p-2 group perspective-[1000px]">
                    <div className={`absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-700 ${getColorClass(currentContent.color, 'bg')}`}></div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className={`w-full h-full rounded-2xl border ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'} overflow-hidden relative z-10`}
                    >
                       <img src={currentContent.image} alt={`${currentContent.title} Dashboard`} className="w-full h-full object-cover" />
                    </motion.div>
                 </div>
               </motion.div>
             </AnimatePresence>
          </div>
        </div>

        {/* Pros & Cons Section - Massive Innovative Design */}
        <div className="w-full mb-32 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest mb-6 ${theme === 'dark' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 'border-indigo-400/40 bg-indigo-50 text-indigo-600'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Platform Evaluation
            </div>
            <h2 className={`text-5xl md:text-6xl font-black ${colors.textPrimary} mb-6 tracking-tight`}>
              Strategic <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">Trade-offs</span>
            </h2>
            <p className={`${colors.textMuted} text-xl max-w-2xl mx-auto font-medium`}>A transparent look at where AnalyticCore excels and where it's evolving.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative z-10 w-full">
            
            {/* Pros Column */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`relative rounded-[2.5rem] p-8 md:p-12 border overflow-hidden group
                ${theme === 'dark' 
                  ? 'bg-slate-900/50 border-emerald-500/20 shadow-[0_0_50px_-15px_rgba(16,185,129,0.2)]' 
                  : 'bg-white/80 border-emerald-200 shadow-xl shadow-emerald-900/5'}`}
            >
              <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
              
              <div className="relative z-10 flex items-center gap-4 mb-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30`}>
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-3xl md:text-4xl font-black ${colors.textPrimary}`}>Advantages</h3>
              </div>

              <div className="space-y-6 relative z-10">
                {pros.map((pro) => (
                  <motion.div 
                    whileHover={{ x: 10 }}
                    key={pro.id}
                    className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-emerald-500/30' : 'bg-slate-50 border-slate-200 hover:border-emerald-300'} flex gap-5`}
                  >
                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                      <pro.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>{pro.title}</h4>
                      <p className={`${colors.textMuted} leading-relaxed text-sm md:text-base`}>{pro.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Cons Column */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`relative rounded-[2.5rem] p-8 md:p-12 border overflow-hidden group
                ${theme === 'dark' 
                  ? 'bg-slate-900/50 border-amber-500/20 shadow-[0_0_50px_-15px_rgba(245,158,11,0.2)]' 
                  : 'bg-white/80 border-amber-200 shadow-xl shadow-amber-900/5'}`}
            >
              <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-amber-500/20 transition-colors duration-700"></div>
              
              <div className="relative z-10 flex items-center gap-4 mb-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30`}>
                  <Info className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-3xl md:text-4xl font-black ${colors.textPrimary}`}>Considerations</h3>
              </div>

              <div className="space-y-6 relative z-10">
                {cons.map((con) => (
                  <motion.div 
                    whileHover={{ x: -10 }}
                    key={con.id}
                    className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-amber-500/30' : 'bg-slate-50 border-slate-200 hover:border-amber-300'} flex gap-5`}
                  >
                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                      <con.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>{con.title}</h4>
                      <p className={`${colors.textMuted} leading-relaxed text-sm md:text-base`}>{con.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>

        {/* Top Functionalities - Massive Bento Grid */}
        <div className="w-full mb-32 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest mb-6 ${theme === 'dark' ? 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400' : 'border-fuchsia-400/40 bg-fuchsia-50 text-fuchsia-600'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Core Arsenal
            </div>
            <h2 className={`text-5xl md:text-6xl font-black ${colors.textPrimary} mb-6 tracking-tight`}>
              Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-400">Capabilities</span>
            </h2>
            <p className={`${colors.textMuted} text-xl max-w-2xl mx-auto font-medium`}>Everything you need to build, analyze, and scale—engineered for performance.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 w-full max-w-7xl mx-auto">
            {[
              {
                id: 'ai-copilot',
                title: 'AI Copilot & NL-to-SQL',
                desc: 'Ask complex questions in natural language. The engine instantly translates them into highly optimized SQL and generates interactive charts without you writing a single line of code.',
                icon: Sparkles,
                bgLight: 'bg-fuchsia-50/80', bgDark: 'bg-fuchsia-900/10',
                textLight: 'text-fuchsia-600', textDark: 'text-fuchsia-400',
                borderLight: 'border-fuchsia-200 hover:border-fuchsia-400', borderDark: 'border-white/10 hover:border-fuchsia-500/50',
                iconBgLight: 'bg-fuchsia-100', iconBgDark: 'bg-fuchsia-500/20',
                shadowLight: 'shadow-xl hover:shadow-2xl shadow-fuchsia-900/5', shadowDark: 'shadow-xl hover:shadow-[0_0_40px_-10px_rgba(217,70,239,0.4)]',
                colSpan: 'lg:col-span-2',
                glow: 'bg-fuchsia-500/30'
              },
              {
                id: 'multiplayer',
                title: 'Real-time Multiplayer',
                desc: 'See cursor movements, chat, and co-edit dashboards with your team in real-time.',
                icon: Zap,
                bgLight: 'bg-amber-50/80', bgDark: 'bg-amber-900/10',
                textLight: 'text-amber-600', textDark: 'text-amber-400',
                borderLight: 'border-amber-200 hover:border-amber-400', borderDark: 'border-white/10 hover:border-amber-500/50',
                iconBgLight: 'bg-amber-100', iconBgDark: 'bg-amber-500/20',
                shadowLight: 'shadow-xl hover:shadow-2xl shadow-amber-900/5', shadowDark: 'shadow-xl hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]',
                colSpan: 'lg:col-span-1',
                glow: 'bg-amber-500/30'
              },
              {
                id: 'drag-drop',
                title: 'Drag & Drop Canvas',
                desc: 'Build pixel-perfect layouts instantly. Snap elements to the grid and configure KPI tiles intuitively.',
                icon: LineChart,
                bgLight: 'bg-indigo-50/80', bgDark: 'bg-indigo-900/10',
                textLight: 'text-indigo-600', textDark: 'text-indigo-400',
                borderLight: 'border-indigo-200 hover:border-indigo-400', borderDark: 'border-white/10 hover:border-indigo-500/50',
                iconBgLight: 'bg-indigo-100', iconBgDark: 'bg-indigo-500/20',
                shadowLight: 'shadow-xl hover:shadow-2xl shadow-indigo-900/5', shadowDark: 'shadow-xl hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)]',
                colSpan: 'lg:col-span-1',
                glow: 'bg-indigo-500/30'
              },
              {
                id: 'automl',
                title: 'Auto-ML Hub',
                desc: 'Detect anomalies and forecast trends with one click. The platform auto-selects the best predictive models.',
                icon: Wand2,
                bgLight: 'bg-emerald-50/80', bgDark: 'bg-emerald-900/10',
                textLight: 'text-emerald-600', textDark: 'text-emerald-400',
                borderLight: 'border-emerald-200 hover:border-emerald-400', borderDark: 'border-white/10 hover:border-emerald-500/50',
                iconBgLight: 'bg-emerald-100', iconBgDark: 'bg-emerald-500/20',
                shadowLight: 'shadow-xl hover:shadow-2xl shadow-emerald-900/5', shadowDark: 'shadow-xl hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]',
                colSpan: 'lg:col-span-1',
                glow: 'bg-emerald-500/30'
              },
              {
                id: 'dax',
                title: 'Advanced DAX Measures',
                desc: 'Write powerful time-intelligence formulas (YTD, SAMEPERIODLASTYEAR) just like PowerBI, running at cloud-scale.',
                icon: Code2,
                bgLight: 'bg-blue-50/80', bgDark: 'bg-blue-900/10',
                textLight: 'text-blue-600', textDark: 'text-blue-400',
                borderLight: 'border-blue-200 hover:border-blue-400', borderDark: 'border-white/10 hover:border-blue-500/50',
                iconBgLight: 'bg-blue-100', iconBgDark: 'bg-blue-500/20',
                shadowLight: 'shadow-xl hover:shadow-2xl shadow-blue-900/5', shadowDark: 'shadow-xl hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)]',
                colSpan: 'lg:col-span-1',
                glow: 'bg-blue-500/30'
              }
            ].map((feat, idx) => (
              <motion.div
                key={feat.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={`relative rounded-[2rem] p-8 md:p-10 border overflow-hidden group transition-all duration-500 ${feat.colSpan}
                  ${theme === 'dark' 
                    ? `${feat.bgDark} ${feat.borderDark} ${feat.shadowDark}` 
                    : `${feat.bgLight} ${feat.borderLight} ${feat.shadowLight}`}`}
              >
                {/* Background Ambient Glow */}
                <div className={`absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${feat.glow}`}></div>
                
                {/* Icon Header */}
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${theme === 'dark' ? `${feat.iconBgDark} ${feat.textDark} border-white/10` : `${feat.iconBgLight} ${feat.textLight} border-white/50`}`}>
                    <feat.icon className="w-7 h-7" />
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-3 transition-colors duration-300 ${theme === 'dark' ? `group-hover:${feat.textDark}` : `group-hover:${feat.textLight}`}`}>{feat.title}</h3>
                  <p className={`${colors.textMuted} leading-relaxed text-sm md:text-base`}>{feat.desc}</p>
                </div>
                
                {/* Decorative Pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTUwLCAxNTAsIDE1MCwgMC4wNCkiLz48L3N2Zz4=')] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay"></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-full flex justify-center pb-20 relative z-20"
        >
           <button
             onClick={onNavigateToLanding}
             className="relative px-12 py-5 sm:py-6 rounded-2xl group overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_80px_rgba(139,92,246,0.6)] transform hover:-translate-y-1 transition-all duration-300 border border-white/10"
           >
             <div className="absolute inset-0 bg-[url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E&quot;)] opacity-20 mix-blend-overlay"></div>
             <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-[-20deg]"></div>
             <div className="relative z-10 flex items-center gap-4">
               <span className="text-white font-bold text-xl sm:text-2xl tracking-wide">Let's Start Building</span>
               <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
                 <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
               </div>
             </div>
           </button>
        </motion.div>

      </div>
    </div>
  );
};
