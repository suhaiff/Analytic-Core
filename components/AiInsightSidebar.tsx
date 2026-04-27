import React, { useEffect, useState, useRef } from 'react';
import { X, Sparkles, Download, ArrowRight, Loader2, Info, ChevronRight, BarChart3, TrendingUp, Lightbulb } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getThemeClasses, type Theme } from '../theme';
import { getDashboardInsights } from '../services/geminiService';
import { DataModel, ChartConfig } from '../types';

interface AiInsightSidebarProps {
    dataModel: DataModel;
    charts: ChartConfig[];
    theme: Theme;
}

const MarkdownRenderer = ({ content, colors }: { content: string, colors: any }) => {
    // Very basic markdown parsing for a premium look without heavy dependencies
    const lines = content.split('\n');
    
    return (
        <div className="space-y-4">
            {lines.map((line, i) => {
                // Headers
                if (line.startsWith('### ')) {
                    return <h3 key={i} className={`text-sm font-black uppercase tracking-widest ${colors.textPrimary} mt-6 mb-2 flex items-center gap-2`}>
                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                        {line.replace('### ', '')}
                    </h3>;
                }
                if (line.startsWith('## ')) {
                    return <h2 key={i} className={`text-base font-black ${colors.textPrimary} mt-8 mb-3 border-b ${colors.borderPrimary} pb-2`}>
                        {line.replace('## ', '')}
                    </h2>;
                }
                if (line.startsWith('# ')) {
                    return <h1 key={i} className={`text-lg font-black ${colors.textPrimary} mb-4`}>
                        {line.replace('# ', '')}
                    </h1>;
                }
                
                // Lists
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    const text = line.replace(/^[-*]\s+/, '');
                    return (
                        <div key={i} className="flex gap-3 items-start pl-1">
                            <div className="mt-1.5 shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
                            </div>
                            <p className={`text-xs leading-relaxed ${colors.textSecondary}`}>
                                {parseInlineStyles(text)}
                            </p>
                        </div>
                    );
                }
                
                // Regular paragraph
                if (line.trim() === '') return <div key={i} className="h-2" />;
                
                return (
                    <p key={i} className={`text-xs leading-relaxed ${colors.textSecondary}`}>
                        {parseInlineStyles(line)}
                    </p>
                );
            })}
        </div>
    );
};

// Helper for bold and italic
const parseInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-black text-indigo-400">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index} className="italic font-medium">{part.slice(1, -1)}</em>;
        }
        return part;
    });
};

export const AiInsightSidebar: React.FC<AiInsightSidebarProps> = ({
    dataModel,
    charts,
    theme
}) => {
    const colors = getThemeClasses(theme);
    const [isOpen, setIsOpen] = useState(false);
    const [insights, setInsights] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [mounted, setMounted] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
        };
        window.addEventListener('open-ai-insight', handleOpen);
        return () => window.removeEventListener('open-ai-insight', handleOpen);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            if (!insights && !isLoading) {
                fetchInsights();
            }
        } else {
            const timer = setTimeout(() => setMounted(false), 700);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const result = await getDashboardInsights(dataModel, charts);
            setInsights(result);
        } catch (err) {
            console.error("AI Insight Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportInsights = async () => {
        if (!insights) return;
        
        setIsExportingPdf(true);
        try {
            // Create a temporary container for a professional document look
            const exportContainer = document.createElement('div');
            exportContainer.style.position = 'absolute';
            exportContainer.style.left = '-9999px';
            exportContainer.style.top = '0';
            exportContainer.style.width = '800px'; // Professional width for A4
            exportContainer.style.backgroundColor = '#ffffff';
            exportContainer.style.color = '#1e293b';
            exportContainer.style.padding = '40px 60px';
            exportContainer.style.fontFamily = "'Inter', sans-serif";
            
            // Add Header
            const header = `
                <div style="border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-between: center; align-items: center;">
                    <div>
                        <h1 style="font-size: 24px; font-weight: 900; color: #4338ca; margin: 0; text-transform: uppercase; letter-spacing: 2px;">InsightAI</h1>
                        <p style="font-size: 10px; font-weight: 700; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase;">Executive Analytical Report</p>
                    </div>
                    <div style="text-align: right; flex-grow: 1;">
                        <p style="font-size: 12px; font-weight: 600; color: #1e293b; margin: 0;">Dashboard: ${dataModel.name}</p>
                        <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            `;
            
            // Add Insights Content (simplified markdown rendering for PDF)
            const content = insights.split('\n').map(line => {
                if (line.startsWith('### ')) return `<h3 style="font-size: 16px; font-weight: 800; color: #4338ca; margin-top: 25px; margin-bottom: 10px; border-left: 4px solid #6366f1; padding-left: 12px;">${line.replace('### ', '')}</h3>`;
                if (line.startsWith('## ')) return `<h2 style="font-size: 18px; font-weight: 900; color: #1e293b; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; pb-5px;">${line.replace('## ', '')}</h2>`;
                if (line.startsWith('# ')) return `<h1 style="font-size: 22px; font-weight: 900; color: #1e293b; margin-bottom: 20px;">${line.replace('# ', '')}</h1>`;
                if (line.startsWith('- ') || line.startsWith('* ')) return `<div style="margin-left: 10px; margin-bottom: 8px; display: flex;"><span style="color: #6366f1; margin-right: 10px;">•</span><p style="font-size: 12px; line-height: 1.6; color: #334155; margin: 0;">${line.replace(/^[-*]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p></div>`;
                if (line.trim() === '') return '<div style="height: 10px;"></div>';
                return `<p style="font-size: 12px; line-height: 1.6; color: #334155; margin-bottom: 12px;">${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
            }).join('');
            
            // Add Footer
            const footer = `
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="font-size: 9px; color: #94a3b8; font-style: italic;">This analysis is AI-generated by Gemini Pro 1.5 via InsightAI. Please verify critical data points before making strategic decisions.</p>
                </div>
            `;
            
            exportContainer.innerHTML = header + content + footer;
            document.body.appendChild(exportContainer);
            
            const canvas = await html2canvas(exportContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            // Multi-page handling
            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }
            
            pdf.save(`InsightAI_Executive_Report_${dataModel.name.replace(/\s+/g, '_')}.pdf`);
            document.body.removeChild(exportContainer);
        } catch (error) {
            console.error("PDF Export Error:", error);
        } finally {
            setIsExportingPdf(false);
        }
    };

    if (!mounted && !isOpen) return null;

    const onClose = () => setIsOpen(false);

    return (
        <>
            {/* Backdrop Blur Overlay */}
            <div 
                className={`fixed inset-0 z-50 transition-all duration-700 ease-in-out bg-slate-950/20 backdrop-blur-[2px] ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={onClose}
            />

            {/* Main Sidebar Container */}
            <aside 
                className={`fixed top-0 right-0 h-full z-[60] w-[400px] max-w-[90vw] transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) transform shadow-2xl border-l ${colors.borderPrimary} ${theme === 'dark' ? 'bg-[#0f172a]/95 backdrop-blur-3xl' : 'bg-white/95 backdrop-blur-3xl'} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header Section */}
                <div className={`p-6 border-b ${colors.borderPrimary} sticky top-0 z-10 backdrop-blur-md`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                            </div>
                            <div>
                                <h2 className={`text-sm font-black uppercase tracking-[0.2em] ${colors.textPrimary}`}>AI Insights</h2>
                                <p className={`text-[10px] font-bold ${colors.textMuted} opacity-60 uppercase tracking-wider`}>Executive Analytical Report</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className={`p-2.5 rounded-xl ${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} hover:text-red-400 transition-all active:scale-95 border border-transparent hover:border-red-500/20`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-6" style={{ height: 'calc(100vh - 160px)' }}>
                    <div ref={contentRef} className="space-y-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 animate-pulse flex items-center justify-center border border-indigo-500/20">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-indigo-500/30 shadow-lg">
                                    <Sparkles className="w-3 h-3 text-indigo-500 animate-bounce" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className={`text-sm font-black ${colors.textPrimary} tracking-tight`}>Analyzing Dashboard Data...</p>
                                <p className={`text-[11px] ${colors.textMuted} max-w-[200px] leading-relaxed`}>Gemini is processing your metrics to uncover hidden trends and insights.</p>
                            </div>
                        </div>
                    ) : insights ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <MarkdownRenderer content={insights} colors={colors} />
                        </div>
                    ) : (
                        <div className={`flex flex-col items-center justify-center py-20 text-center space-y-4`}>
                            <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20">
                                <Info className="w-8 h-8 text-amber-500" />
                            </div>
                            <p className={`text-sm font-bold ${colors.textPrimary}`}>No insights available</p>
                            <p className={`text-xs ${colors.textMuted}`}>Wait for the dashboard to finish loading or try refreshing the analysis.</p>
                        </div>
                    )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={`p-6 border-t ${colors.borderPrimary} absolute bottom-0 left-0 right-0 backdrop-blur-md`}>
                    <button 
                        onClick={handleExportInsights}
                        disabled={isExportingPdf || !insights}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExportingPdf ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        )}
                        {isExportingPdf ? 'Generating PDF...' : 'Quick PDF Report'}
                    </button>
                    <p className={`text-[9px] text-center mt-4 ${colors.textMuted} font-bold opacity-40 uppercase tracking-tighter`}>
                        This analysis is AI-generated and should be verified for critical decisions.
                    </p>
                </div>
            </aside>
        </>
    );
};
