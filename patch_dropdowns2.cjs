const fs = require('fs');
const p = 'components/ChartBuilder.tsx';
let d = fs.readFileSync(p, 'utf8');

const dropdownComponent = `
interface ColumnSelectDropdownProps {
    value: string;
    onChange: (val: string) => void;
    allColumns: string[];
    customMeasures: any[];
    onEditMeasure: (m: any) => void;
    onDeleteMeasure: (id: number) => void;
    placeholder?: string;
    theme: string;
    colors: any;
}

const ColumnSelectDropdown: React.FC<ColumnSelectDropdownProps> = ({
    value, onChange, allColumns, customMeasures, onEditMeasure, onDeleteMeasure, placeholder = "Select a column...", theme, colors
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={\`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between \${colors.bgPrimary} border \${colors.borderSecondary} \${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer\`}
            >
                <span className="flex items-center gap-2 truncate">
                    {value ? (
                        <>
                            {customMeasures.some(m => m.name === value) && <Calculator className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                            <span className="truncate">{value}</span>
                        </>
                    ) : placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
            </button>
            
            {isOpen && (
                <div className={\`absolute top-full left-0 mt-2 w-full max-h-64 overflow-y-auto \${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl z-[70] p-1.5 animate-fade-in custom-scrollbar\`}>
                    <button
                        onClick={() => { onChange(''); setIsOpen(false); }}
                        className={\`w-full text-left px-3 py-2 rounded-lg text-sm transition-all mb-0.5 \${!value ? 'bg-indigo-500/10 text-indigo-400 font-bold' : \`\${colors.textSecondary} hover:\${colors.bgTertiary}\`}\`}
                    >
                        {placeholder}
                    </button>
                    {allColumns.map(col => {
                        const isCustom = customMeasures.some(m => m.name === col);
                        return (
                            <button
                                key={col}
                                onClick={() => { onChange(col); setIsOpen(false); }}
                                className={\`group w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all mb-0.5 \${value === col ? 'bg-indigo-500/10 text-indigo-400 font-bold' : \`\${colors.textSecondary} hover:\${colors.bgTertiary}\`}\`}
                            >
                                {isCustom && <Calculator className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                                <span className="truncate flex-1">{col}</span>
                                {isCustom && (
                                    <div className="flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity ml-auto">
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                onEditMeasure(customMeasures.find(m => m.name === col)); 
                                                setIsOpen(false);
                                            }}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-500"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                const m = customMeasures.find(m => m.name === col);
                                                if (m) onDeleteMeasure(m.id);
                                            }}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-rose-500"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
`;

if (!d.includes('ColumnSelectDropdownProps')) {
    d = d.replace(/const BucketChartCard: React\.FC<BucketChartCardProps> = \(\{/, dropdownComponent + '\nconst BucketChartCard: React.FC<BucketChartCardProps> = ({');
}

const delFunc = `
    const handleDeleteMeasure = async (id: number) => {
        if (confirm('Are you sure you want to delete this measure?')) {
            try {
                if (typeof id === 'number' && dataModel.fileId) {
                    await fetchWithAuth(\`\${API_BASE}/dax/measure/\${id}\`, { method: 'DELETE' });
                }
                const newMeasures = customMeasures.filter((x: any) => x.id !== id);
                setCustomMeasures(newMeasures);
                dataModel.customMeasures = newMeasures;
            } catch (err) {
                console.error('Failed to delete', err);
            }
        }
    };
`;
if (!d.includes('const handleDeleteMeasure = async')) {
    d = d.replace('const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);', 'const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);\n' + delFunc);
}

// xAxis
const xAxisTarget = /<div className="relative">\s*<select\s*value=\{manualConfig\.xAxisKey\}\s*onChange=\{e => setManualConfig\(\{\.\.\.manualConfig, xAxisKey: e\.target\.value\}\)\}\s*className=\{`w-full px-4 py-2\.5 rounded-xl \$\{colors\.bgPrimary\} border \$\{colors\.borderSecondary\} \$\{colors\.textPrimary\} focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer`\}\s*>\s*<option value="">Select a column\.\.\.<\/option>\s*\{allColumns\.map\(col => <option key=\{col\} value=\{col\}>\{col\}<\/option>\)\}\s*<\/select>\s*<ChevronDown className="absolute right-4 top-1\/2 -translate-y-1\/2 w-4 h-4 text-slate-500 pointer-events-none" \/>\s*<\/div>/;
d = d.replace(xAxisTarget, `<ColumnSelectDropdown value={manualConfig.xAxisKey || ''} onChange={(val) => setManualConfig({...manualConfig, xAxisKey: val})} allColumns={allColumns} customMeasures={customMeasures} onEditMeasure={(m) => { setMeasureToEdit(m); setIsMeasureModalOpen(true); }} onDeleteMeasure={handleDeleteMeasure} theme={theme} colors={colors} />`);

// yAxis
const yAxisTarget = /<div className="relative">\s*<select\s*value=\{manualConfig\.yAxisKey \|\| ''\}\s*onChange=\{e => setManualConfig\(\{\.\.\.manualConfig, yAxisKey: e\.target\.value\}\)\}\s*className=\{`w-full px-4 py-2\.5 rounded-xl \$\{colors\.bgPrimary\} border \$\{colors\.borderSecondary\} \$\{colors\.textPrimary\} focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer`\}\s*>\s*<option value="">Select a column\.\.\.<\/option>\s*\{allColumns\.map\(col => <option key=\{col\} value=\{col\}>\{col\}<\/option>\)\}\s*<\/select>\s*<ChevronDown className="absolute right-4 top-1\/2 -translate-y-1\/2 w-4 h-4 text-slate-500 pointer-events-none" \/>\s*<\/div>/;
d = d.replace(yAxisTarget, `<ColumnSelectDropdown value={manualConfig.yAxisKey || ''} onChange={(val) => setManualConfig({...manualConfig, yAxisKey: val})} allColumns={allColumns} customMeasures={customMeasures} onEditMeasure={(m) => { setMeasureToEdit(m); setIsMeasureModalOpen(true); }} onDeleteMeasure={handleDeleteMeasure} theme={theme} colors={colors} />`);

// dataKey2
const dataKey2Target = /<div className="relative">\s*<select\s*value=\{manualConfig\.dataKey2 \|\| ''\}\s*onChange=\{e => setManualConfig\(\{\.\.\.manualConfig, dataKey2: e\.target\.value\}\)\}\s*className=\{`w-full px-4 py-2\.5 rounded-xl \$\{colors\.bgPrimary\} border \$\{colors\.borderSecondary\} \$\{colors\.textPrimary\} focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer`\}\s*>\s*<option value="">None<\/option>\s*\{allColumns\.map\(col => <option key=\{col\} value=\{col\}>\{col\}<\/option>\)\}\s*<\/select>\s*<ChevronDown className="absolute right-4 top-1\/2 -translate-y-1\/2 w-4 h-4 text-slate-500 pointer-events-none" \/>\s*<\/div>/;
d = d.replace(dataKey2Target, `<ColumnSelectDropdown value={manualConfig.dataKey2 || ''} onChange={(val) => setManualConfig({...manualConfig, dataKey2: val})} allColumns={allColumns} customMeasures={customMeasures} onEditMeasure={(m) => { setMeasureToEdit(m); setIsMeasureModalOpen(true); }} onDeleteMeasure={handleDeleteMeasure} theme={theme} colors={colors} placeholder="None" />`);

// forecastDateColumn
const forecastTarget = /<div className="relative">\s*<select\s*value=\{manualConfig\.forecastDateColumn \|\| ''\}\s*onChange=\{e => setManualConfig\(\{\.\.\.manualConfig, forecastDateColumn: e\.target\.value, xAxisKey: e\.target\.value\}\)\}\s*className=\{`w-full px-4 py-2\.5 rounded-xl \$\{colors\.bgPrimary\} border \$\{colors\.borderSecondary\} \$\{colors\.textPrimary\} focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer`\}\s*>\s*<option value="">Select a date column\.\.\.<\/option>\s*\{allColumns\.map\(col => <option key=\{col\} value=\{col\}>\{col\}<\/option>\)\}\s*<\/select>\s*<ChevronDown className="absolute right-4 top-1\/2 -translate-y-1\/2 w-4 h-4 text-slate-500 pointer-events-none" \/>\s*<\/div>/;
d = d.replace(forecastTarget, `<ColumnSelectDropdown value={manualConfig.forecastDateColumn || ''} onChange={(val) => setManualConfig({...manualConfig, forecastDateColumn: val, xAxisKey: val})} allColumns={allColumns} customMeasures={customMeasures} onEditMeasure={(m) => { setMeasureToEdit(m); setIsMeasureModalOpen(true); }} onDeleteMeasure={handleDeleteMeasure} theme={theme} colors={colors} placeholder="Select a date column..." />`);

// dataKey (manualMetricMenuRef)
const dataKeyCustomTarget = /<div className="relative" ref=\{manualMetricMenuRef\}>[\s\S]*?<\/div>\s*<\/div>\n\s*\{\/\* Aggregation \*\/\}/;
// Instead of regex which is failing on such a huge block, we do exact string slicing!
const s1 = d.indexOf('<div className="relative" ref={manualMetricMenuRef}>');
const s2 = d.indexOf('{/* Aggregation */}', s1);
if (s1 > -1 && s2 > -1) {
    const replacement = `<ColumnSelectDropdown value={manualConfig.dataKey || ''} onChange={(val) => setManualConfig({...manualConfig, dataKey: val})} allColumns={allColumns} customMeasures={customMeasures} onEditMeasure={(m) => { setMeasureToEdit(m); setIsMeasureModalOpen(true); }} onDeleteMeasure={handleDeleteMeasure} theme={theme} colors={colors} />\n                                </div>\n\n                                `;
    d = d.slice(0, s1) + replacement + d.slice(s2);
}

fs.writeFileSync(p, d);
console.log('Done dropdowns!');
