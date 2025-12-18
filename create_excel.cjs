const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();
const data = [];
for (let i = 0; i < 50; i++) {
    data.push({
        Name: "Row " + i,
        Value: i,
        Description: "Long text ".repeat(10)
    });
}
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
XLSX.writeFile(wb, "complex_upload.xlsx");
console.log("Created complex_upload.xlsx");
