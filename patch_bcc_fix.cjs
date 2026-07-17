const fs = require('fs');
const p = 'components/ChartBuilder.tsx';
let d = fs.readFileSync(p, 'utf8');

d = d.replace('onFontSizeChange, onEditMeasure, onDeleteMeasure', 'onFontSizeChange, customMeasures = [], onEditMeasure, onDeleteMeasure');

fs.writeFileSync(p, d);
console.log('Fixed BucketChartCard customMeasures');
