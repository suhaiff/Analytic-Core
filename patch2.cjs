const fs = require('fs');
const p = 'components/DataModelling.tsx';
let d = fs.readFileSync(p, 'utf8');

// Target 1
const regex1 = /const rightMap = new Map\(\);\s+toTable\.data\.forEach\(row => \{\s+rightMap\.set\(String\(row\[rel\.toColumn\]\), row\);\s+\}\);\s+mergedData = mergedData\.map\(row => \{\s+const joinKey = String\(row\[`\$\{rel\.fromTable\}\.\$\{rel\.fromColumn\}`\] \?\? row\[rel\.fromColumn\]\);\s+const match = rightMap\.get\(joinKey\);\s+const newRow = \{ \.\.\.row \};\s+toTable\.columns\.forEach\(col => \{\s+const val = match \? match\[col\] : null;\s+newRow\[`\$\{toTable\.name\}\.\$\{col\}`\] = val;\s+newRow\[col\] = val; \/\/ fallback for AI processing un-prefixed\s+\}\);\s+return newRow;\s+\}\);/g;

// Target 2
const regex2 = /const rightMap = new Map\(\);\s+fromTable\.data\.forEach\(row => \{\s+rightMap\.set\(String\(row\[rel\.fromColumn\]\), row\);\s+\}\);\s+mergedData = mergedData\.map\(row => \{\s+const joinKey = String\(row\[`\$\{rel\.toTable\}\.\$\{rel\.toColumn\}`\] \?\? row\[rel\.toColumn\]\);\s+const match = rightMap\.get\(joinKey\);\s+const newRow = \{ \.\.\.row \};\s+fromTable\.columns\.forEach\(col => \{\s+const val = match \? match\[col\] : null;\s+newRow\[`\$\{fromTable\.name\}\.\$\{col\}`\] = val;\s+newRow\[col\] = val;\s+\}\);\s+return newRow;\s+\}\);/g;

d = d.replace(regex1, `const rightMap = new Map<string, any[]>();
                 toTable.data.forEach(row => {
                    const key = String(row[rel.toColumn]);
                    if (!rightMap.has(key)) rightMap.set(key, []);
                    rightMap.get(key)!.push(row);
                 });

                 mergedData = mergedData.flatMap(row => {
                    const joinKey = String(row[\`\${rel.fromTable}.\${rel.fromColumn}\`] ?? row[rel.fromColumn]);
                    const matches = rightMap.get(joinKey);
                    
                    if (!matches || matches.length === 0) {
                       const newRow = { ...row };
                       toTable.columns.forEach(col => {
                          newRow[\`\${toTable.name}.\${col}\`] = null;
                          newRow[col] = null;
                       });
                       return [newRow];
                    }

                    return matches.map(match => {
                       const newRow = { ...row };
                       toTable.columns.forEach(col => {
                          const val = match[col];
                          newRow[\`\${toTable.name}.\${col}\`] = val;
                          newRow[col] = val; // fallback for AI processing un-prefixed
                       });
                       return newRow;
                    });
                 });`);

d = d.replace(regex2, `const rightMap = new Map<string, any[]>();
                 fromTable.data.forEach(row => {
                    const key = String(row[rel.fromColumn]);
                    if (!rightMap.has(key)) rightMap.set(key, []);
                    rightMap.get(key)!.push(row);
                 });

                 mergedData = mergedData.flatMap(row => {
                    const joinKey = String(row[\`\${rel.toTable}.\${rel.toColumn}\`] ?? row[rel.toColumn]);
                    const matches = rightMap.get(joinKey);
                    
                    if (!matches || matches.length === 0) {
                       const newRow = { ...row };
                       fromTable.columns.forEach(col => {
                          newRow[\`\${fromTable.name}.\${col}\`] = null;
                          newRow[col] = null;
                       });
                       return [newRow];
                    }

                    return matches.map(match => {
                       const newRow = { ...row };
                       fromTable.columns.forEach(col => {
                          const val = match[col];
                          newRow[\`\${fromTable.name}.\${col}\`] = val;
                          newRow[col] = val;
                       });
                       return newRow;
                    });
                 });`);

fs.writeFileSync(p, d);
console.log("Done");
