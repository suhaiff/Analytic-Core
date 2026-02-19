const fs = require('fs');
const content = fs.readFileSync('components/Dashboard.tsx', 'utf8');
let open = 0;
for (let char of content) {
    if (char === '{') open++;
    if (char === '}') open--;
}
console.log('Brace count:', open);
