const xlsx = require('xlsx');
const workbook = xlsx.readFile('/home/Suhaif/Downloads/Application Testing Checklist_Reporting APP L1.xlsx');
console.log("Sheets found:", workbook.SheetNames);
for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} ---`);
    console.log(data.slice(0, 3)); // show first 3 rows
}
