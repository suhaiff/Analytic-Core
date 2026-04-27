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
      name: 'Pro',
      price: '$49/mo',
      description: 'For growing businesses needing deeper analytics.',
      features: ['Unlimited Dashboards', 'Live Database Connectors', 'Advanced Predictive Models', 'Priority Support'],
      recommended: true,
    },
    {
      name: 'Enterprise',
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
        className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-all duration-[1200ms] ease-[cubic-bezier(0.87,0,0.13,1)]
          ${isTransitioning ? 'bg-indigo-600/90 backdrop-blur-xl opacity-100 scale-100' : 'bg-transparent backdrop-blur-0 opacity-0 scale-150'}`}
      >
        {isTransitioning && (
          <div className="flex flex-col items-center animate-fade-in delay-300">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-bounce">
              <Activity className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-white mt-8 tracking-wider animate-pulse">Initializing Workspace...</h2>
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
               <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full ${colors.bgSecondary} border ${colors.borderPrimary} shadow-sm`}>
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className={`text-sm font-medium ${colors.textSecondary}`}>Logged in as <span className="font-bold">{user.name}</span></span>
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
                <div key={idx} className={`relative p-8 rounded-3xl border ${tier.recommended ? 'border-indigo-500 bg-gradient-to-b from-indigo-500/10 to-transparent' : `${colors.borderPrimary} ${colors.bgSecondary}`} premium-shadow transition-transform hover:-translate-y-2`}>
                  {tier.recommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                      Most Popular
                    </div>
                  )}
                  <h3 className={`text-2xl font-bold ${colors.textPrimary} mb-2`}>{tier.name}</h3>
                  <p className={`${colors.textMuted} text-sm mb-6 min-h-[40px]`}>{tier.description}</p>
                  <div className="mb-8">
                    <span className={`text-5xl font-extrabold ${colors.textPrimary}`}>{tier.price}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${tier.recommended ? 'text-indigo-400' : 'text-emerald-500'}`} />
                        <span className={`${colors.textSecondary} font-medium`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleGetStarted}
                    className={`w-full py-4 rounded-xl font-bold transition-all ${
                      tier.recommended 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                        : `${colors.bgTertiary} ${colors.textPrimary} hover:border-indigo-500/50 border ${colors.borderPrimary}`
                    }`}
                  >
                    Select {tier.name}
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
