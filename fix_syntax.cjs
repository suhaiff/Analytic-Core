const fs = require('fs');
const p = 'components/ChartBuilder.tsx';
let d = fs.readFileSync(p, 'utf8');

// I will just use a precise replace to restore the button closing and the metric menu properly.
// The broken part starts with: className={`w-full text-center p-1.5 sm:p-2 rounded-md sm:rounded-lg overflow-hidden transition-all ${showMetricMenu && (

const brokenPart = 'className={`w-full text-center p-1.5 sm:p-2 rounded-md sm:rounded-lg overflow-hidden transition-all ${showMetricMenu && (';

const correctPart = `className={\`w-full text-center p-1.5 sm:p-2 rounded-md sm:rounded-lg overflow-hidden transition-all \${showMetricMenu ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : \`\${theme === 'dark' ? 'bg-slate-950/50 hover:bg-slate-900' : 'bg-slate-100 hover:bg-slate-200'}\`}\`}
                    >
                        <div className={\`text-[9px] sm:text-[10px] \${colors.textMuted} uppercase\`}>Metric</div>
                        <div className={\`text-[10px] sm:text-xs \${colors.textTertiary} font-mono mt-0.5 sm:mt-1 truncate\`} title={chart.dataKey}>{chart.dataKey}</div>
                    </button>
                    {showMetricMenu && (`;

d = d.replace(brokenPart, correctPart);

fs.writeFileSync(p, d);
console.log('Fixed syntax!');
