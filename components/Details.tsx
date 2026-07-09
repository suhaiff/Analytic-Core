import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Code2, Megaphone, Palette, Target, Settings, Database, Wand2, LineChart, Sparkles, CheckCircle2 } from 'lucide-react';

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

const flowSteps = [
  { id: 1, title: 'Connect Data', desc: 'Securely link databases, APIs, or upload spreadsheets. We handle the formatting.', icon: Database, color: 'blue' },
  { id: 2, title: 'AI Processing', desc: 'Our neural engines automatically clean, type-cast, and join your scattered data.', icon: Wand2, color: 'violet' },
  { id: 3, title: 'Visualize', desc: 'Generate pixel-perfect interactive dashboards without writing a single line of code.', icon: LineChart, color: 'fuchsia' },
  { id: 4, title: 'Decide', desc: 'Query your data in plain English and share insights with your entire organization.', icon: Sparkles, color: 'emerald' }
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

        {/* Application Flow - Vertical Connected Cards */}
        <div className="w-full mb-32 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-4xl font-black ${colors.textPrimary} mb-4`}>The AnalyticCore Flow</h2>
            <p className={`${colors.textMuted} text-lg max-w-xl mx-auto`}>From raw data to actionable decisions in four seamless steps.</p>
          </motion.div>

          <div className="max-w-4xl mx-auto relative px-4 md:px-0">
             <div className="flex flex-col gap-8 relative z-10">
               {flowSteps.map((step, idx) => (
                 <motion.div 
                   initial={{ opacity: 0, y: 50 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true, margin: "-50px" }}
                   transition={{ duration: 0.6, delay: idx * 0.1 }}
                   key={step.id} 
                   className={`p-8 md:p-10 rounded-[2rem] border ${theme === 'dark' ? 'bg-slate-900/60 border-white/5' : 'bg-white/80 border-slate-200'} backdrop-blur-xl hover:-translate-y-2 transition-all duration-300 shadow-xl ${getColorClass(step.color, 'shadow')} flex flex-col sm:flex-row items-start sm:items-center gap-8 group`}
                 >
                    <div className={`shrink-0 w-20 h-20 rounded-2xl ${getColorClass(step.color, 'bg')} ${getColorClass(step.color, 'text')} flex items-center justify-center border border-${step.color}-500/20`}>
                      <step.icon className="w-10 h-10" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-4 mb-2">
                         <span className={`text-4xl md:text-5xl font-black opacity-20 ${getColorClass(step.color, 'text')}`}>0{step.id}</span>
                         <h3 className={`text-2xl md:text-3xl font-bold ${colors.textPrimary}`}>{step.title}</h3>
                      </div>
                      <p className={`text-lg ${colors.textMuted} leading-relaxed`}>{step.desc}</p>
                    </div>
                 </motion.div>
               ))}
             </div>
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
