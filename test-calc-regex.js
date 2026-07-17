const calculateRegex = /CALCULATE\(\s*(.+?)\s*,\s*(?:FILTER\(\s*(?:'[^']+'\s*,\s*)?|)(?:'[^']+'\[([^\]]+)\]|\[([^\]]+)\])\s*(=|>|<|>=|<=|<>)\s*(['"]?[^'")]+['"]?)(?:\s*\))?\s*\)/gi;

const formulas = [
    'CALCULATE(SUM([Sales]), [Region] = "West")',
    'CALCULATE(SUM([Sales]), FILTER(\'Table\', [Quantity] > 10))',
    'CALCULATE(SUM([Sales]), \'Table\'[Date] >= "2024-01-01")',
    'CALCULATE(SUM([Sales]), FILTER([Category] <> \'Furniture\'))'
];

formulas.forEach(f => {
    calculateRegex.lastIndex = 0;
    console.log(calculateRegex.exec(f));
});
