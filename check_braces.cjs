const fs = require('fs');

const code = fs.readFileSync('server/index.js', 'utf8');
let balance = 0;
let line = 1;
let openStack = [];

for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (char === '\n') line++;

    if (char === '{') {
        balance++;
        openStack.push(line);
    } else if (char === '}') {
        balance--;
        if (balance < 0) {
            console.log(`Error: Extra closing brace at line ${line}`);
            process.exit(1);
        }
        openStack.pop();
    }
}

if (balance > 0) {
    console.log(`Error: Missing ${balance} closing brace(s).`);
    console.log(`Unclosed braces opened at lines: ${openStack.slice(-5).join(', ')}`);
} else {
    console.log("Braces are balanced.");
}
