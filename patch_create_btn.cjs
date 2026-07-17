const fs = require('fs');
const p = 'components/ChartBuilder.tsx';
let d = fs.readFileSync(p, 'utf8');

const createBtn = `
                                    <button
                                        onClick={() => setIsMeasureModalOpen(true)}
                                        className={\`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition hover:\${colors.bgTertiary} \${colors.textMuted}\`}
                                        title="Create Custom Measure"
                                    >
                                        <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>`;

if (!d.includes('title="Create Custom Measure"')) {
    d = d.replace(/<button\n\s*onClick=\{\(\) => setIsManualOpen\(true\)\}/, createBtn + '\n                                    <button\n                                        onClick={() => setIsManualOpen(true)}');
    fs.writeFileSync(p, d);
    console.log('Restored Create Custom Measure button!');
} else {
    console.log('Button already exists');
}
