const fs = require('fs');
const p = 'components/DataModelling.tsx';
let d = fs.readFileSync(p, 'utf8');

const target1 = `                 const rightMap = new Map();
                 toTable.data.forEach(row => {
                    rightMap.set(String(row[rel.toColumn]), row);
                 });

                 mergedData = mergedData.map(row => {
                    const joinKey = String(row[\`\${rel.fromTable}.\${rel.fromColumn}\`] ?? row[rel.fromColumn]);
                    const match = rightMap.get(joinKey);
                    const newRow = { ...row };
                    toTable.columns.forEach(col => {
                       const val = match ? match[col] : null;
                       newRow[\`\${toTable.name}.\${col}\`] = val;
                       newRow[col] = val; // fallback for AI processing un-prefixed
                    });
                    return newRow;
                 });`;

const replacement1 = `                 const rightMap = new Map<string, any[]>();
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
                          newRow[col] = val;
                       });
                       return newRow;
                    });
                 });`;

const target2 = `                 const rightMap = new Map();
                 fromTable.data.forEach(row => {
                    rightMap.set(String(row[rel.fromColumn]), row);
                 });

                 mergedData = mergedData.map(row => {
                    const joinKey = String(row[\`\${rel.toTable}.\${rel.toColumn}\`] ?? row[rel.toColumn]);
                    const match = rightMap.get(joinKey);
                    const newRow = { ...row };
                    fromTable.columns.forEach(col => {
                       const val = match ? match[col] : null;
                       newRow[\`\${fromTable.name}.\${col}\`] = val;
                       newRow[col] = val;
                    });
                    return newRow;
                 });`;

const replacement2 = `                 const rightMap = new Map<string, any[]>();
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
                 });`;

if (d.includes(target1)) {
    d = d.replace(target1, replacement1);
    console.log("Replaced target 1");
} else {
    console.log("Could not find target 1");
}

if (d.includes(target2)) {
    d = d.replace(target2, replacement2);
    console.log("Replaced target 2");
} else {
    console.log("Could not find target 2");
}

fs.writeFileSync(p, d);
