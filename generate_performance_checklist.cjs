const XLSX = require('xlsx');

const performanceData = [
    { Scenario: "Initial Application Load", "Expected Result": "App should be interactive in < 3 seconds on a standard connection", Status: "", Comments: "" },
    { Scenario: "Large File Ingestion (10,000+ rows)", "Expected Result": "Parsing and metadata extraction should complete within 10 seconds without browser freeze", Status: "", Comments: "" },
    { Scenario: "Database Data Retrieval", "Expected Result": "Fetching saved dashboard with 100+ data nodes should load in < 2 seconds", Status: "", Comments: "" },
    { Scenario: "Chart Rendering Latency", "Expected Result": "Switching between chart types (Bar, Radar, Pie) should be near-instant (< 500ms)", Status: "", Comments: "" },
    { Scenario: "Google Sheets Multi-Sheet Import", "Expected Result": "Connecting and pulling metadata for 5+ sheets should take < 5 seconds", Status: "", Comments: "" },
    { Scenario: "Concurrent User Simulation (Load)", "Expected Result": "Server should handle multiple simultaneous uploads without 504 Timeouts", Status: "", Comments: "" },
    { Scenario: "Admin Panel Dashboard List", "Expected Result": "Loading 'All Reports' list with pagination/search should scale efficiently", Status: "", Comments: "" },
    { Scenario: "Export to PDF Performance", "Expected Result": "Generating a multi-chart PDF report should complete in < 8 seconds", Status: "", Comments: "" },
    { Scenario: "SharePoint Site Traversal", "Expected Result": "Fetching site directory and lists via OAuth should respond within 3 seconds", Status: "", Comments: "" },
    { Scenario: "Large Database Import (SQL)", "Expected Result": "Processing 1MB+ SQL dump files should happen in the background without UI blocking", Status: "", Comments: "" },
    { Scenario: "Theme Switching Responsiveness", "Expected Result": "Toggling dark/light mode should update all CSS variables in < 200ms", Status: "", Comments: "" },
    { Scenario: "Memory Leak Check", "Expected Result": "Opening and closing 10+ large files sequentially shouldn't crash the browser tab", Status: "", Comments: "" }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(performanceData);

// Set column widths
const wscols = [
    { wch: 45 }, // Scenario
    { wch: 60 }, // Expected Result
    { wch: 10 }, // Status
    { wch: 30 }  // Comments
];
ws['!cols'] = wscols;

XLSX.utils.book_append_sheet(wb, ws, "Performance testing");
XLSX.writeFile(wb, "Performance_Testing_Checklist.xlsx");

console.log("Checklist created: Performance_Testing_Checklist.xlsx");
