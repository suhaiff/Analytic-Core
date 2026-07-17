const fs = require('fs');
const p = 'components/ChartBuilder.tsx';
let d = fs.readFileSync(p, 'utf8');

// Add Calculator and Trash2 to lucide-react imports
d = d.replace(/} from 'lucide-react';/, ', Calculator, Trash2 } from \'lucide-react\';');

// Add API_BASE and fetchWithAuth
if (!d.includes('import { API_BASE }')) {
    d = d.replace('import { getThemeClasses }', 'import { API_BASE } from \'../config/api\';\nimport { fetchWithAuth } from \'../utils/fetchWithAuth\';\nimport { getThemeClasses }');
}

fs.writeFileSync(p, d);
console.log('Fixed imports!');
