const fs = require('fs');
const p = 'components/ChartBuilder.tsx';
let d = fs.readFileSync(p, 'utf8');

// Update BucketChartCardProps
const propsRegex = /interface BucketChartCardProps \{([\s\S]*?)\}/;
d = d.replace(propsRegex, (match, p1) => {
    if (!p1.includes('onEditMeasure')) {
        return `interface BucketChartCardProps {${p1}    onEditMeasure?: (measure: any) => void;\n    onDeleteMeasure?: (id: number) => void;\n}`;
    }
    return match;
});

// Update BucketChartCard definition
const defRegex = /const BucketChartCard: React\.FC<BucketChartCardProps> = \(\{\n\s*(.*?)\n\}\) => \{/;
d = d.replace(defRegex, (match, p1) => {
    if (!p1.includes('onEditMeasure')) {
        return `const BucketChartCard: React.FC<BucketChartCardProps> = ({\n    ${p1}, onEditMeasure, onDeleteMeasure\n}) => {`;
    }
    return match;
});

// Replace the allColumns map in BucketChartCard metric menu (around line 545-555)
// Let's use a regex that safely targets the Metric menu map in BucketChartCard
const metricMenuRegex = /\{showMetricMenu[\s\S]*?Change Metric<\/p>\n\s*\{allColumns\.map\(col => \(\n\s*<button\n\s*key=\{col\}\n\s*onClick=\{\(\) => \{ onMetricChange\(chart\.id, col\); setShowMetricMenu\(false\); \}\}\n\s*className=\{\`w-full text-left px-2\.5 py-2 rounded-lg text-xs transition-all mb-0\.5 \$\{chart\.dataKey === col \? 'bg-indigo-500\/10 text-indigo-400 font-bold' : \`\$\{colors\.textSecondary\} hover:\$\{colors\.bgTertiary\}\`\}\`\}\n\s*>\n\s*\{col\}\n\s*<\/button>\n\s*\)\)\}/;

const newMetricMenu = `{showMetricMenu && (
                        <div className={\`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 max-h-64 overflow-y-auto \${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-[60] p-1.5 animate-fade-in custom-scrollbar\`}>
                            <p className={\`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 pt-1 \${colors.textMuted}\`}>Change Metric</p>
                            {allColumns.map(col => {
                                const isCustom = customMeasures.some(m => m.name === col);
                                return (
                                <button
                                    key={col}
                                    onClick={() => { onMetricChange(chart.id, col); setShowMetricMenu(false); }}
                                    className={\`group w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 transition-all mb-0.5 \${chart.dataKey === col ? 'bg-indigo-500/10 text-indigo-400 font-bold' : \`\${colors.textSecondary} hover:\${colors.bgTertiary}\`}\`}
                                >
                                    {isCustom && <Calculator className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
                                    <span className="truncate flex-1">{col}</span>
                                    {isCustom && onEditMeasure && onDeleteMeasure && (
                                        <div className="flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity ml-auto">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    onEditMeasure(customMeasures.find(m => m.name === col)); 
                                                    setShowMetricMenu(false);
                                                }}
                                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-500"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    const m = customMeasures.find(m => m.name === col);
                                                    if (m) onDeleteMeasure(m.id);
                                                }}
                                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-rose-500"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </button>
                            )})}
                        </div>
                    )}`;

d = d.replace(/\{showMetricMenu[\s\S]*?<\/button>\n\s*\)\)\}\n\s*<\/div>\n\s*\)\}/, newMetricMenu);

// Update BucketChartCard instances to pass onEditMeasure and onDeleteMeasure
d = d.replace(/<BucketChartCard\n([\s\S]*?)onFontSizeChange=\{onFontSizeChangeBucket\}/g, 
    `<BucketChartCard\n$1onFontSizeChange={onFontSizeChangeBucket}\n                                                        onEditMeasure={(m) => { setMeasureToEdit(m); setIsMeasureModalOpen(true); }}\n                                                        onDeleteMeasure={async (id) => {\n                                                            if (confirm('Are you sure you want to delete this measure?')) {\n                                                                try {\n                                                                    if (typeof id === 'number' && dataModel.fileId) {\n                                                                        await fetchWithAuth(\`\${API_BASE}/dax/measure/\${id}\`, { method: 'DELETE' });\n                                                                    }\n                                                                    const newMeasures = customMeasures.filter((x: any) => x.id !== id);\n                                                                    setCustomMeasures(newMeasures);\n                                                                    dataModel.customMeasures = newMeasures;\n                                                                } catch (err) { console.error(err); }\n                                                            }\n                                                        }}`);

fs.writeFileSync(p, d);
console.log('BucketChartCard updated');
