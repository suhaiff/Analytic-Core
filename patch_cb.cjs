const fs = require('fs');
const p = 'components/ChartBuilder.tsx';
let d = fs.readFileSync(p, 'utf8');

if (d.includes('const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);')) {
    d = d.replace('const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);', 'const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);\n    const [measureToEdit, setMeasureToEdit] = useState<any>(null);');
}

d = d.replace(/<CreateMeasureModal[\s\S]*?onMeasureSaved=\{\(measure\) => \{[\s\S]*?\}\s*\/>/, 
`<CreateMeasureModal
                isOpen={isMeasureModalOpen}
                onClose={() => { setIsMeasureModalOpen(false); setMeasureToEdit(null); }}
                sheetId={dataModel.fileId?.toString() || 'unknown'}
                availableColumns={allColumns}
                initialMeasure={measureToEdit}
                onMeasureSaved={(measure) => {
                    const existingIdx = customMeasures.findIndex(m => m.id === measure.id);
                    let newMeasures = [...customMeasures];
                    if (existingIdx >= 0) {
                        newMeasures[existingIdx] = measure;
                    } else {
                        newMeasures = [...customMeasures, measure];
                    }
                    setCustomMeasures(newMeasures);
                    dataModel.customMeasures = newMeasures;
                    setIsMeasureModalOpen(false);
                    setMeasureToEdit(null);
                }}
            />`);

// Now add the edit and delete icons to the dropdown
const targetDropdownItem = `{isCustom && <Calculator className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                                                            <span className="truncate">{col}</span>
                                                        </button>`;
const replDropdownItem = `{isCustom && <Calculator className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                                                            <span className="truncate flex-1">{col}</span>
                                                            {isCustom && (
                                                                <div className="flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity ml-auto">
                                                                    <button 
                                                                        onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            setMeasureToEdit(customMeasures.find(m => m.name === col)); 
                                                                            setIsMeasureModalOpen(true);
                                                                            setIsManualMetricOpen(false);
                                                                        }}
                                                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-500"
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={async (e) => { 
                                                                            e.stopPropagation(); 
                                                                            const m = customMeasures.find(m => m.name === col);
                                                                            if (m && confirm('Are you sure you want to delete this measure?')) {
                                                                                try {
                                                                                    // If it's a real measure (not in-memory), delete it from backend
                                                                                    if (m.id && typeof m.id === 'number' && dataModel.fileId) {
                                                                                        const { API_BASE } = require('../config/api');
                                                                                        const { fetchWithAuth } = require('../utils/fetchWithAuth');
                                                                                        await fetchWithAuth(\`\${API_BASE}/dax/measure/\${m.id}\`, { method: 'DELETE' });
                                                                                    }
                                                                                    const newMeasures = customMeasures.filter(x => x.name !== col);
                                                                                    setCustomMeasures(newMeasures);
                                                                                    dataModel.customMeasures = newMeasures;
                                                                                } catch (err) {
                                                                                    console.error('Failed to delete', err);
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-rose-500"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </button>`;

// we need to add Trash2 import if not present
if (!d.includes('Trash2')) {
    d = d.replace('Calculator } from \'lucide-react\';', 'Calculator, Trash2 } from \'lucide-react\';');
}

// We also need to add `group` to the button for group-hover to work
const buttonTarget = `<button
                                                            key={col}
                                                            onClick={() => { setManualConfig({...manualConfig, dataKey: col}); setIsManualMetricOpen(false); }}
                                                            className={\`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all mb-0.5 \${manualConfig.dataKey === col ? 'bg-indigo-500/10 text-indigo-400 font-bold' : \`\${colors.textSecondary} hover:\${colors.bgTertiary}\`}\`}`;

const buttonRepl = `<button
                                                            key={col}
                                                            onClick={() => { setManualConfig({...manualConfig, dataKey: col}); setIsManualMetricOpen(false); }}
                                                            className={\`group w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all mb-0.5 \${manualConfig.dataKey === col ? 'bg-indigo-500/10 text-indigo-400 font-bold' : \`\${colors.textSecondary} hover:\${colors.bgTertiary}\`}\`}`;


d = d.replace(buttonTarget, buttonRepl);
d = d.replace(targetDropdownItem, replDropdownItem);

fs.writeFileSync(p, d);
console.log('ChartBuilder updated!');
