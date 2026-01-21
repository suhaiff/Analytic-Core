import React, { useState, useEffect } from 'react';
import { DataModel, ChartConfig } from '../types';
import { analyzeDataAndSuggestKPIs, generateChartFromPrompt } from '../services/geminiService';
import { Plus, Sparkles, X, BarChart3, PieChart, LineChart, Activity, Send, Loader2, ArrowRight, Table as TableIcon, Mic, MicOff, Home, Save } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import { smartFormat } from '../utils/formatters';

interface ChartBuilderProps {
    dataModel: DataModel;
    onGenerateReport: (charts: ChartConfig[]) => void;
    onHome: () => void;
    initialBucket?: ChartConfig[];
    mode?: 'create' | 'update';
}

export const ChartBuilder: React.FC<ChartBuilderProps> = ({
    dataModel,
    onGenerateReport,
    onHome,
    initialBucket = [],
    mode = 'create'
}) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [suggestedCharts, setSuggestedCharts] = useState<ChartConfig[]>([]);
    const [bucket, setBucket] = useState<ChartConfig[]>(initialBucket);
    const [loading, setLoading] = useState(true);
    const [customPrompt, setCustomPrompt] = useState('');
    const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showData, setShowData] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (initialBucket && initialBucket.length > 0) {
            setBucket(initialBucket);
        }
    }, [initialBucket]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setLoading(true);
            const suggestions = await analyzeDataAndSuggestKPIs(dataModel);
            setSuggestedCharts(suggestions);
            setLoading(false);
        };
        fetchSuggestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataModel.name]);

    const addToBucket = (chart: ChartConfig) => {
        if (!bucket.find(c => c.id === chart.id)) {
            setBucket([...bucket, chart]);
        }
    };

    const removeFromBucket = (id: string) => {
        setBucket(bucket.filter(c => c.id !== id));
    };

    const handleCustomChart = async () => {
        if (!customPrompt.trim()) return;
        setIsGeneratingCustom(true);
        const newChart = await generateChartFromPrompt(dataModel, customPrompt);
        if (newChart) {
            setBucket([newChart, ...bucket]);
            setCustomPrompt('');
        }
        setIsGeneratingCustom(false);
    };

    const toggleVoiceInput = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Voice recognition is not supported in this browser. Please use Chrome.");
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setCustomPrompt(prev => (prev ? prev + ' ' + transcript : transcript));
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'BAR': return <BarChart3 className="w-5 h-5" />;
            case 'PIE': return <PieChart className="w-5 h-5" />;
            case 'LINE': return <LineChart className="w-5 h-5" />;
            case 'AREA': return <Activity className="w-5 h-5" />;
            case 'KPI': return <div className="text-xs font-bold border border-current px-1 rounded">123</div>;
            default: return <BarChart3 className="w-5 h-5" />;
        }
    };

    return (
        <div className={`flex h-screen ${colors.bgPrimary} ${colors.textSecondary} overflow-hidden relative`}>
            {/* Data Preview Modal - Responsive */}
            {showData && (
                <div className={`fixed inset-0 z-50 ${colors.overlayBg} glass-effect flex items-center justify-center p-2 sm:p-4 lg:p-8 animate-fade-in`}>
                    <div className={`responsive-modal ${colors.bgSecondary} border ${colors.borderPrimary} w-full h-full rounded-xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden`}>
                        <div className={`p-3 sm:p-4 md:p-6 border-b ${colors.borderPrimary} flex justify-between items-center ${colors.bgSecondary} shrink-0`}>
                            <div>
                                <h2 className={`font-bold ${colors.textPrimary} responsive-text-lg sm:text-xl`}>Dataset Preview</h2>
                                <p className={` colors.textMuted} responsive-text-xs sm:text-sm`}>{dataModel.data.length} rows found</p>
                            </div>
                            <button onClick={() => setShowData(false)} className={`p-1.5 sm:p-2 hover:${colors.bgTertiary} rounded-full ${colors.textMuted} hover:${colors.textPrimary} transition shrink-0`}>
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <table className={`responsive-table w-full text-left responsive-text-sm ${colors.textMuted}`}>
                                <thead className={`${theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-200/80'} sticky top-0 z-10 backdrop-blur-sm`}>
                                    <tr>{dataModel.columns.map(c => <th key={c} className={`px-3 sm:px-6 py-2 sm:py-3 font-semibold ${colors.textPrimary} border-b ${colors.borderSecondary} whitespace-nowrap responsive-text-xs sm:text-sm`}>{c}</th>)}</tr>
                                </thead>
                                <tbody className={`divide-y ${colors.borderPrimary}`}>
                                    {dataModel.data.slice(0, 200).map((row, i) => (
                                        <tr key={i} className={`hover:${colors.bgTertiary}/50 transition-colors`}>
                                            {dataModel.columns.map(c => {
                                                const cellValue = row[c];
                                                const displayValue = cellValue !== null && cellValue !== undefined
                                                    ? smartFormat(cellValue, c)
                                                    : <span className="text-slate-700 italic">null</span>;
                                                return (
                                                    <td key={c} className="px-3 sm:px-6 py-2 sm:py-3 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis responsive-text-xs sm:text-sm">
                                                        {displayValue}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={`p-2 sm:p-3 md:p-4 border-t ${colors.borderPrimary} ${colors.bgSecondary} text-center responsive-text-xs ${colors.textMuted} shrink-0`}>
                            Showing first 200 rows for preview
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-30 animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Left: AI Suggestions - Responsive Sidebar */}
            <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative w-80 sm:w-[350px] lg:w-[400px] max-w-[85vw] border-r ${colors.borderPrimary} ${colors.bgSecondary} flex flex-col z-40 md:z-10 shadow-2xl transition-transform duration-300 h-full glass-effect`}>
                {/* Mobile: Close button */}
                <div className={`md:hidden flex justify-between items-center p-4 border-b ${colors.borderPrimary}`}>
                    <h3 className={`font-bold ${colors.textPrimary}`}>AI Insights</h3>
                    <button onClick={() => setSidebarOpen(false)} className={`p-1.5 rounded-lg hover:${colors.bgTertiary}`}>
                        <X className={`w-5 h-5 ${colors.textMuted}`} />
                    </button>
                </div>

                <div className={`p-4 sm:p-6 border-b ${colors.borderPrimary} ${colors.bgSecondary}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <button onClick={onHome} className={`p-1.5 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition active-press`} title={mode === 'update' ? "Cancel" : "Go Home"}>
                            {mode === 'update' ? <X className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                        </button>
                        <h2 className={`responsive-text-base sm:text-lg font-bold ${colors.textPrimary} flex items-center gap-2`}>
                            <Sparkles className="text-indigo-400 w-4 h-4 sm:w-5 sm:h-5" />
                            Insights
                        </h2>
                    </div>
                    <p className={`responsive-text-xs ${colors.textMuted} ml-8`}>
                        AI suggestions based on <span className={`${colors.textTertiary} font-medium`}>{dataModel.name}</span>
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 relative overflow-hidden rounded-xl">
                            <div className="absolute inset-0 animate-shimmer -z-10"></div>
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <p className={`${colors.textMuted} text-xs animate-pulse`}>Consulting Gemini...</p>
                        </div>
                    ) : (
                        suggestedCharts.map(chart => {
                            const inBucket = !!bucket.find(b => b.id === chart.id);
                            return (
                                <div
                                    key={chart.id}
                                    className={`group relative rounded-lg sm:rounded-xl p-4 sm:p-5 transition-all duration-300 border hover-lift elevation-md
                                    ${inBucket
                                            ? 'bg-indigo-900/10 border-indigo-500/30 opacity-60'
                                            : `${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} hover:border-indigo-500/50 hover:${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'} hover:shadow-lg hover:shadow-indigo-500/10`
                                        }
                                `}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2 text-indigo-400">
                                            {getIcon(chart.type)}
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded text-indigo-300">
                                                {chart.type}
                                            </span>
                                        </div>
                                        {!inBucket && (
                                            <button
                                                onClick={() => addToBucket(chart)}
                                                className={`${colors.textMuted} hover:${colors.textPrimary} ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} hover:bg-indigo-500 p-1.5 rounded-lg transition-colors active-press`}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className={`font-bold ${colors.textSecondary} responsive-text-sm leading-snug`}>{chart.title}</h3>
                                    <p className={`responsive-text-xs ${colors.textMuted} mt-2 leading-relaxed line-clamp-2`}>{chart.description}</p>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Right: Workspace */}
            <div className="flex-1 flex flex-col relative">
                {/* Header - Responsive */}
                <header className={`px-3 sm:px-6 md:px-8 py-3 sm:py-5 md:py-6 flex justify-between items-center z-20 pointer-events-none bg-gradient-to-b ${theme === 'dark' ? 'from-slate-950 to-slate-950/0' : 'from-slate-50 to-slate-50/0'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 pointer-events-auto">
                        {/* Mobile: Sidebar toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`md:hidden p-1.5 rounded-lg ${colors.bgSecondary} border ${colors.borderPrimary} ${colors.textMuted}`}
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                        <h1 className={`text-base sm:text-xl md:text-2xl font-bold ${colors.textPrimary}`}>
                            {mode === 'update' ? 'Edit Dashboard' : 'Chart Builder'}
                        </h1>
                        <button
                            onClick={() => setShowData(true)}
                            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 ${colors.bgTertiary} hover:${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} border ${colors.borderSecondary} rounded-md text-[10px] sm:text-xs font-medium ${colors.textTertiary} transition active-press`}
                            title="View Data"
                        >
                            <TableIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden md:inline">View Data</span>
                        </button>
                        <div className="scale-75 sm:scale-100 origin-left">
                            <ThemeToggle />
                        </div>
                    </div>
                    <button
                        onClick={() => onGenerateReport(bucket)}
                        disabled={bucket.length === 0}
                        className="pointer-events-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-2.5 sm:px-4 md:px-6 py-1.5 sm:py-2.5 rounded-full font-bold text-[10px] sm:text-sm transition-all flex items-center gap-1 sm:gap-2 shadow-lg shadow-emerald-900/20 active-press"
                    >
                        {mode === 'update' ? (
                            <>
                                <span className="hidden sm:inline">Save Updates</span>
                                <span className="sm:hidden">Save</span>
                                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                            </>
                        ) : (
                            <>
                                <span className="hidden sm:inline">Generate Report</span>
                                <span className="sm:hidden">Generate</span>
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </>
                        )}
                    </button>
                </header>

                <div className="flex-1 responsive-container pt-0 overflow-y-auto custom-scrollbar flex flex-col gap-6 sm:gap-8">

                    {/* AI Chat Input - Responsive */}
                    <div className="w-full max-w-3xl mx-auto mt-2 sm:mt-4">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                            <div className={`relative ${colors.bgSecondary} rounded-xl sm:rounded-2xl p-1 flex items-center ring-1 ${theme === 'dark' ? 'ring-white/10' : 'ring-slate-300'} focus-within:ring-indigo-500/50 transition-all elevation-md`}>
                                <input
                                    type="text"
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="Ask for a custom chart..."
                                    className={`flex-1 bg-transparent border-none ${colors.textSecondary} ${theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-slate-400'} px-3 sm:px-5 py-1.5 sm:py-3 focus:ring-0 outline-none text-xs sm:text-sm`}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCustomChart()}
                                />
                                <div className="flex items-center gap-1 pr-1">
                                    <button
                                        onClick={toggleVoiceInput}
                                        className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition ${isListening ? 'bg-red-500 text-white animate-pulse' : `hover:${colors.bgTertiary} ${colors.textMuted}`}`}
                                        title="Use Voice Input"
                                    >
                                        {isListening ? <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                    </button>
                                    <button
                                        onClick={handleCustomChart}
                                        disabled={isGeneratingCustom || !customPrompt.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition disabled:opacity-50 disabled:bg-slate-700"
                                    >
                                        {isGeneratingCustom ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {isListening && (
                            <p className="text-center responsive-text-xs text-indigo-400 mt-2 animate-pulse">Listening...</p>
                        )}
                    </div>

                    {/* The Bucket Area */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                            <div className="h-px flex-1 bg-slate-800"></div>
                            <h3 className="responsive-text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                                {mode === 'update' ? 'Dashboard Charts' : 'Your Selection'}
                            </h3>
                            <div className="h-px flex-1 bg-slate-800"></div>
                        </div>

                        {bucket.length === 0 ? (
                            <div className={`h-48 sm:h-56 md:h-64 flex flex-col items-center justify-center border-2 border-dashed ${colors.borderPrimary} rounded-xl sm:rounded-2xl ${theme === 'dark' ? 'bg-slate-900/30' : 'bg-slate-100/30'}`}>
                                <div className={`${colors.bgTertiary} p-3 sm:p-4 rounded-full mb-3 sm:mb-4`}>
                                    <BarChart3 className={`${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} w-6 h-6 sm:w-8 sm:h-8`} />
                                </div>
                                <p className={`${colors.textMuted} font-medium responsive-text-sm sm:text-base text-center px-4`}>Your dashboard bucket is empty</p>
                                <p className={`${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} responsive-text-xs mt-2 text-center px-4`}>Select insights from the left or ask AI above.</p>
                            </div>
                        ) : (
                            <div className="suggestions-grid pb-12 sm:pb-16 md:pb-20">
                                {bucket.map((chart, i) => (
                                    <div
                                        key={chart.id}
                                        className={`responsive-card p-3 sm:p-4 ${colors.bgSecondary} border ${colors.borderPrimary} rounded-lg sm:rounded-xl relative group hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-900/10 transition-all duration-300 animate-fade-in-up flex flex-col h-full hover-lift elevation-md`}
                                        style={{ animationDelay: `${i * 50}ms` }}
                                    >
                                        <button
                                            onClick={() => removeFromBucket(chart.id)}
                                            className={`absolute top-2 right-2 sm:top-3 sm:right-3 ${colors.textMuted} hover:text-red-400 hover:bg-red-400/10 p-1 sm:p-1.5 rounded-md transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10 active-press`}
                                        >
                                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>

                                        <div className="flex items-start gap-2 mb-2 sm:mb-4 flex-1">
                                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${chart.id.startsWith('custom') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                                {React.cloneElement(getIcon(chart.type) as React.ReactElement, { className: "w-3.5 h-3.5 sm:w-5 sm:h-5" })}
                                            </div>
                                            <div className="min-w-0 flex-1 pr-6">
                                                <div className={`text-[9px] sm:text-[10px] ${colors.textMuted} font-bold uppercase tracking-wider`}>
                                                    {chart.id.startsWith('custom') ? 'Custom Request' : 'AI Insight'}
                                                </div>
                                                <h4 className={`font-bold ${colors.textSecondary} text-xs sm:text-sm w-full line-clamp-2`}>{chart.title}</h4>
                                            </div>
                                        </div>

                                        <div className={`grid grid-cols-3 gap-1.5 sm:gap-2 py-2 sm:py-3 border-t ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'} mt-auto`}>
                                            <div className={`text-center p-1.5 sm:p-2 ${theme === 'dark' ? 'bg-slate-950/50' : 'bg-slate-100'} rounded-md sm:rounded-lg overflow-hidden`}>
                                                <div className={`text-[9px] sm:text-[10px] ${colors.textMuted} uppercase`}>X-Axis</div>
                                                <div className={`text-[10px] sm:text-xs ${colors.textTertiary} font-mono mt-0.5 sm:mt-1 truncate`} title={chart.xAxisKey || "-"}>{chart.xAxisKey || "-"}</div>
                                            </div>
                                            <div className={`text-center p-1.5 sm:p-2 ${theme === 'dark' ? 'bg-slate-950/50' : 'bg-slate-100'} rounded-md sm:rounded-lg overflow-hidden`}>
                                                <div className={`text-[9px] sm:text-[10px] ${colors.textMuted} uppercase`}>Metric</div>
                                                <div className={`text-[10px] sm:text-xs ${colors.textTertiary} font-mono mt-0.5 sm:mt-1 truncate`} title={chart.dataKey}>{chart.dataKey}</div>
                                            </div>
                                            <div className={`text-center p-1.5 sm:p-2 ${theme === 'dark' ? 'bg-slate-950/50' : 'bg-slate-100'} rounded-md sm:rounded-lg overflow-hidden`}>
                                                <div className={`text-[9px] sm:text-[10px] ${colors.textMuted} uppercase`}>Agg</div>
                                                <div className={`text-[10px] sm:text-xs ${colors.textTertiary} font-mono mt-0.5 sm:mt-1 truncate`} title={chart.aggregation}>{chart.aggregation}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};