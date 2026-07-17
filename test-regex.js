const datediffRegex = /DATEDIFF\(\s*(?:['"]([^'"]+)['"]|(-?\d+(?:\.\d+)?))\s*,\s*(?:['"]([^'"]+)['"]|(-?\d+(?:\.\d+)?))\s*,\s*(DAY|MONTH|QUARTER|YEAR)\s*\)/gi;

const test1 = 'DATEDIFF(1704067200000, 1735689600000, DAY)';
const test2 = 'DATEDIFF("2024-01-01", \'2024-12-31\', MONTH)';

console.log(datediffRegex.exec(test1));
datediffRegex.lastIndex = 0;
console.log(datediffRegex.exec(test2));
