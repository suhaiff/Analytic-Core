import React from 'react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { Mail, Phone, MapPin, Linkedin, Twitter, Github, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    return (
        <footer className={`border-t mt-auto ${colors.borderPrimary} ${colors.bgSecondary} relative overflow-hidden`}>
            {/* Ambient background blur */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    
                    {/* Brand Section */}
                    <div className="col-span-1 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <img src="/logo.png" alt="AnalyticCore Logo" className="h-10 w-auto object-contain" />
                            <h2 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'}`}>
                                AnalyticCore
                            </h2>
                        </div>
                        <p className={`text-sm ${colors.textMuted} mb-6 leading-relaxed`}>
                            Empowering businesses with AI-driven analytics. Turn your raw data into actionable, professional insights in seconds.
                        </p>
                        <div className="flex items-center gap-4">
                            <button className={`${colors.textMuted} hover:text-indigo-400 transition-colors p-2 rounded-full hover:${colors.bgTertiary}`}>
                                <Twitter className="w-5 h-5" />
                            </button>
                            <button className={`${colors.textMuted} hover:text-indigo-400 transition-colors p-2 rounded-full hover:${colors.bgTertiary}`}>
                                <Linkedin className="w-5 h-5" />
                            </button>
                            <button className={`${colors.textMuted} hover:text-indigo-400 transition-colors p-2 rounded-full hover:${colors.bgTertiary}`}>
                                <Github className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Solutions */}
                    <div>
                        <h3 className={`text-sm font-bold ${colors.textPrimary} uppercase tracking-wider mb-5`}>Solutions</h3>
                        <ul className="space-y-3">
                            {['Data Profiling', 'Smart Dashboards', 'Predictive Analytics', 'Scheduled Refresh', 'Team Workspaces'].map((item) => (
                                <li key={item}>
                                    <button className={`text-sm ${colors.textMuted} hover:text-indigo-400 hover:translate-x-1 inline-block transition-all text-left`}>
                                        {item}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className={`text-sm font-bold ${colors.textPrimary} uppercase tracking-wider mb-5`}>Company</h3>
                        <ul className="space-y-3">
                            {['About Us', 'Careers', 'Privacy Policy', 'Terms of Service', 'Contact Support'].map((item) => (
                                <li key={item}>
                                    <button className={`text-sm ${colors.textMuted} hover:text-indigo-400 hover:translate-x-1 inline-block transition-all text-left`}>
                                        {item}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className={`text-sm font-bold ${colors.textPrimary} uppercase tracking-wider mb-5`}>Contact Us</h3>
                        <ul className="space-y-4">
                            <li className={`flex items-start gap-3 text-sm ${colors.textMuted}`}>
                                <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                <span>11 Scott Street, Wausau<br />WI USA 54403</span>
                            </li>
                            <li className={`flex items-center gap-3 text-sm ${colors.textMuted}`}>
                                <Phone className="w-5 h-5 text-indigo-400 shrink-0" />
                                <span>+91 99625 97975</span>
                            </li>
                            <li className={`flex items-center gap-3 text-sm ${colors.textMuted}`}>
                                <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                                <a href="mailto:info@vtabsquare.com" className="hover:text-indigo-400 transition-colors">info@vtabsquare.com</a>
                            </li>
                            <li className={`flex items-center gap-3 text-sm ${colors.textMuted}`}>
                                <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
                                <a href="https://vtabsquare.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">https://vtabsquare.com/</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className={`mt-12 pt-8 border-t ${colors.borderPrimary} flex flex-col md:flex-row items-center justify-between gap-4`}>
                    <p className={`text-xs ${colors.textMuted}`}>
                        © {new Date().getFullYear()} AnalyticCore Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className={`flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
