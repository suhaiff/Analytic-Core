const fs = require('fs');
const p = 'components/ChartBuilder.tsx';
let d = fs.readFileSync(p, 'utf8');

// 1. Add state variables inside ChartBuilder
const stateVars = `    const [customMeasures, setCustomMeasures] = useState<any[]>(dataModel.customMeasures || []);
    const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);
    const [measureToEdit, setMeasureToEdit] = useState<any>(null);

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
// find a place to inject: e.g. after `const [isManualOpen, setIsManualOpen] = useState(false);`
if (!d.includes('const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);')) {
    d = d.replace('const [isManualOpen, setIsManualOpen] = useState(false);', 'const [isManualOpen, setIsManualOpen] = useState(false);\n' + stateVars);
}

// 2. Add CreateMeasureModal at the bottom of ChartBuilder return
const modalJSX = `
            <CreateMeasureModal
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
            />
`;

if (!d.includes('<CreateMeasureModal')) {
    // Inject right before the last closing div
    d = d.replace(/<\/div>\n\s*\);\n\s*\}\n*$/g, modalJSX + '        </div>\n    );\n}\n');
}

fs.writeFileSync(p, d);
console.log('Done patch modal!');
