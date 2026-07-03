import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { Footer } from './Footer';
import { ArrowRight, CheckCircle2, Zap, BarChart3, Lock, Cpu, Star, TrendingUp, Layers, Activity } from 'lucide-react';
import { User } from '../types';

interface OverviewProps {
  user: User | null;
  onNavigateToLanding: () => void;
}

export const Overview: React.FC<OverviewProps> = ({ user, onNavigateToLanding }) => {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Initial fade in for content
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    setIsTransitioning(true);
    // Fantastic transition effect duration
    setTimeout(() => {
      onNavigateToLanding();
    }, 1200);
  };

  const pricingTiers = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for exploring the platform.',
      features: ['Up to 3 Dashboards', 'Basic CSV Import', 'Standard AI Insights', 'Community Support'],
      recommended: false,
    },
    {
      name: 'Premium',
      price: '₹10,000/mo',
      description: 'For growing businesses needing deeper analytics.',
      features: ['Unlimited Dashboards', 'Live Database Connectors', 'Advanced Predictive Models', 'Priority Support'],
      recommended: true,
    },
    {
      name: 'Pro',
      price: 'Custom',
      description: 'Maximum security and dedicated resources.',
      features: ['Dedicated Infrastructure', 'Custom AI Model Training', 'Advanced Role-based Access', '24/7 SLA Support'],
      recommended: false,
    }
  ];

  const comparisonPoints = [
    { title: 'Time to Value', us: 'Seconds (AI-driven)', them: 'Weeks (Manual Setup)', icon: Zap },
    { title: 'Required Skill Level', us: 'No Code (Natural Language)', them: 'SQL / Data Engineering', icon: Cpu },
    { title: 'Design Quality', us: 'Premium, Auto-responsive', them: 'Basic, Manual Tweaking', icon: Star },
    { title: 'Advanced Analytics', us: 'Instant Machine Learning', them: 'Complex R/Python Integration', icon: TrendingUp },
  ];

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${colors.bgPrimary}`}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full ${colors.gradientTop} blur-[120px] opacity-60 animate-blob`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full ${colors.gradientBottom} blur-[120px] opacity-60 animate-blob animation-delay-4000`}></div>
        <div className={`absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-fuchsia-500/10 blur-[120px] opacity-40 animate-blob animation-delay-2000`}></div>
      </div>

      {/* Transition Overlay */}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-all duration-[1200ms] ease-[cubic-bezier(0.87,0,0.13,1)] overflow-hidden
          ${isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Luxurious Glass Background */}
        <div className={`absolute inset-0 transition-all duration-[1200ms] ${isTransitioning ? (theme === 'dark' ? 'bg-slate-950/80 backdrop-blur-3xl' : 'bg-white/80 backdrop-blur-3xl') : 'bg-transparent backdrop-blur-0'}`} />
        
        {/* Animated Orbs/Gradients */}
        <div className={`absolute inset-0 transition-all duration-1000 delay-300 ${isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] animate-pulse pointer-events-none ${theme === 'dark' ? 'bg-indigo-600/20' : 'bg-indigo-500/10'}`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] animate-[spin_8s_linear_infinite] pointer-events-none ${theme === 'dark' ? 'bg-violet-600/20' : 'bg-violet-500/10'}`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[80px] animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none ${theme === 'dark' ? 'bg-fuchsia-600/20' : 'bg-fuchsia-500/10'}`} />
        </div>

        {isTransitioning && (
          <div className="relative z-10 flex flex-col items-center animate-fade-in-up delay-500">
            {/* Elegant Icon Container */}
            <div className="relative group mb-10">
              <div className={`absolute inset-0 bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 rounded-3xl blur-xl animate-pulse ${theme === 'dark' ? 'opacity-50' : 'opacity-30'}`}></div>
              <div className={`relative w-24 h-24 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(79,70,229,0.3)] flex items-center justify-center border ${theme === 'dark' ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/20' : 'bg-gradient-to-br from-white/80 to-white/40 border-slate-200/60'}`}>
                <div className={`absolute inset-0 rounded-3xl ${theme === 'dark' ? 'bg-gradient-to-tr from-indigo-500/20 to-transparent' : 'bg-gradient-to-tr from-indigo-200/50 to-transparent'}`}></div>
                <Activity className={`w-12 h-12 animate-[pulse_2s_ease-in-out_infinite] ${theme === 'dark' ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'text-indigo-600 drop-shadow-[0_0_15px_rgba(79,70,229,0.3)]'}`} />
              </div>
            </div>
            
            {/* Typography */}
            <div className="text-center space-y-3">
              <h2 className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r animate-pulse tracking-tight drop-shadow-sm ${theme === 'dark' ? 'from-white via-indigo-200 to-white' : 'from-slate-900 via-indigo-600 to-slate-900'}`}>
                Initializing Workspace
              </h2>
              <div className={`flex items-center justify-center gap-2 font-medium tracking-widest text-sm uppercase ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}`}>
                <div className="w-1 h-1 bg-indigo-500 rounded-full animate-ping"></div>
                Setting up your environment
                <div className="w-1 h-1 bg-indigo-500 rounded-full animate-ping delay-150"></div>
              </div>
            </div>
            
            {/* Loading Bar */}
            <div className={`mt-12 w-64 h-1.5 rounded-full overflow-hidden backdrop-blur-sm border ${theme === 'dark' ? 'bg-white/10 border-white/5' : 'bg-slate-200 border-slate-300/50'}`}>
              <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '100%', transformOrigin: 'left', animation: 'progress 2s infinite linear' }}></div>
            </div>
          </div>
        )}
      </div>

      <div className={`relative z-10 transition-all duration-1000 ${showContent && !isTransitioning ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Navbar */}
        <nav className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <h1 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'}`}>
              AnalyticCore
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {user && (
               <div className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-full ${colors.bgSecondary} border ${colors.borderPrimary} shadow-sm`}>
                 <div className="flex items-center gap-2 pr-3 border-r border-slate-500/20">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className={`text-sm font-medium ${colors.textSecondary}`}>Active as <span className="font-bold">{user.name}</span></span>
                 </div>
                 {user.pricing && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${user.pricing === 'Premium' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 
                          user.pricing === 'Pro' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                          'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                        {user.pricing || 'Starter'}
                    </div>
                 )}
               </div>
             )}
             <button
                onClick={handleGetStarted}
                className="px-6 py-2.5 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 flex items-center gap-2 group"
              >
                Skip to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 pt-12 pb-24">
          {/* Hero / Overview Section */}
          <section className="text-center mb-32 mt-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold mb-8 animate-fade-in-up uppercase tracking-widest">
              <SparklesIcon className="w-4 h-4" /> Welcome to the Future of BI
            </div>
            <h1 className={`text-5xl md:text-7xl font-extrabold ${colors.textPrimary} tracking-tight mb-8 leading-tight animate-fade-in-up delay-100`}>
              The AI-Native <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
                Analytics OS
              </span>
            </h1>
            <p className={`text-xl ${colors.textMuted} max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up delay-200`}>
              You're logged in. AnalyticCore automatically cleans, models, and visualizes your data. Discover hidden insights instantly with our next-generation machine learning engine.
            </p>
            <div className="animate-fade-in-up delay-300 flex justify-center">
              <button
                onClick={handleGetStarted}
                className="px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xl transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-1 hover:scale-105 flex items-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-100%] group-hover:translate-x-[100%] duration-1000"></div>
                Launch Workspace
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </section>

          {/* Comparison Section: Why We Are Best */}
          <section className="mb-32">
            <div className="text-center mb-16">
              <h2 className={`text-3xl md:text-4xl font-bold ${colors.textPrimary} mb-4`}>Why AnalyticCore is <span className="text-indigo-400">Better</span></h2>
              <p className={`text-lg ${colors.textMuted}`}>Leave traditional BI tools in the past.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {comparisonPoints.map((point, idx) => (
                <div key={idx} className={`p-8 rounded-3xl ${colors.bgSecondary} border ${colors.borderPrimary} premium-shadow hover:border-indigo-500/40 transition-all hover:-translate-y-2 group relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px] -z-10 transition-colors group-hover:bg-indigo-500/10"></div>
                  <div className={`w-14 h-14 rounded-2xl ${colors.bgTertiary} flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors`}>
                    <point.icon className={`w-7 h-7 ${colors.textMuted} group-hover:text-indigo-400 transition-colors`} />
                  </div>
                  <h3 className={`text-xl font-bold ${colors.textPrimary} mb-6`}>{point.title}</h3>
                  <div className="space-y-4">
                    <div>
                      <div className={`text-xs uppercase tracking-wider font-bold text-indigo-400 mb-1`}>AnalyticCore</div>
                      <div className={`font-semibold ${colors.textPrimary} flex items-center gap-2`}><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {point.us}</div>
                    </div>
                    <div className="h-px w-full bg-slate-500/20"></div>
                    <div>
                      <div className={`text-xs uppercase tracking-wider font-bold ${colors.textMuted} mb-1`}>Traditional BI</div>
                      <div className={`font-medium ${colors.textMuted}`}>{point.them}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Smart Pricing Section */}
          <section className="mb-24">
            <div className="text-center mb-16">
              <h2 className={`text-3xl md:text-4xl font-bold ${colors.textPrimary} mb-4`}>Smart, Transparent <span className="text-violet-400">Pricing</span></h2>
              <p className={`text-lg ${colors.textMuted}`}>Choose the plan that accelerates your growth.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingTiers.map((tier, idx) => (
                <div key={idx} className={`relative p-8 rounded-[2rem] border ${tier.recommended ? 'border-indigo-500 bg-gradient-to-br from-indigo-900/40 via-indigo-900/10 to-transparent shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]' : `${colors.borderPrimary} ${colors.bgSecondary} hover:bg-white/5`} backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl overflow-hidden group`}>
                  {/* Subtle glowing background effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-violet-500/0 to-fuchsia-500/0 group-hover:from-indigo-500/10 group-hover:via-violet-500/5 group-hover:to-fuchsia-500/10 transition-all duration-500 pointer-events-none"></div>
                  
                  {tier.recommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-b-xl shadow-lg shadow-indigo-500/30">
                      Most Popular
                    </div>
                  )}
                  <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-2 mt-2 group-hover:text-indigo-400 transition-colors`}>{tier.name}</h3>
                  <p className={`${colors.textMuted} text-sm mb-8 min-h-[40px] leading-relaxed`}>{tier.description}</p>
                  <div className="mb-8 relative">
                    <span className={`text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${tier.recommended ? 'from-white to-indigo-200' : 'from-white to-slate-400'}`}>{tier.price}</span>
                  </div>
                  <ul className="space-y-5 mb-10">
                    {tier.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${tier.recommended ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
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
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40' 
                        : `${colors.bgTertiary} ${colors.textPrimary} hover:border-indigo-500/50 border ${colors.borderPrimary} hover:bg-indigo-500/10`
                    }`}
                  >
                    <div className="absolute inset-0 w-full h-full bg-white/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity translate-x-[-100%] group-hover/btn:translate-x-[100%] duration-1000"></div>
                    <span className="relative z-10">Select {tier.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
};

// Simple Sparkles SVG
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);
