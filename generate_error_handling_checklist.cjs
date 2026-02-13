const XLSX = require('xlsx');

const errorHandlingData = [
    { Scenario: "Upload Invalid File Extension", "Expected Result": "UI shows Toast error: 'Only Excel and SQL files are supported'", Status: "", Comments: "" },
    { Scenario: "Database Connection Timeout", "Expected Result": "System provides clear error message instead of infinite loading state", Status: "", Comments: "" },
    { Scenario: "Incorrect SQL Credentials", "Expected Result": "Backend returns specific 'Access Denied' error to the UI for user feedback", Status: "", Comments: "" },
    { Scenario: "Expired SharePoint Session", "Expected Result": "User is prompted to re-authenticate or 'Connect' button is reactivated", Status: "", Comments: "" },
    { Scenario: "Network Disconnect during Upload", "Expected Result": "UI handles the interruption gracefully and allows retry without page refresh", Status: "", Comments: "" },
    { Scenario: "Empty File Import", "Expected Result": "User notified that the file contains no data for analysis", Status: "", Comments: "" },
    { Scenario: "Missing Required Fields (Signup)", "Expected Result": "Form validation highlights the missing fields before submisson", Status: "", Comments: "" },
    { Scenario: "Server Offline during Login", "Expected Result": "UI shows 'Service unavailable' instead of a broken layout", Status: "", Comments: "" },
    { Scenario: "Duplicate Email Registration", "Expected Result": "Backend rejects creation and UI shows 'Email already exists' warning", Status: "", Comments: "" },
    { Scenario: "Handling Corrupted Excel Data", "Expected Result": "Parser skips invalid rows/cells and logs a warning instead of crashing the app", Status: "", Comments: "" }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(errorHandlingData);

const wscols = [
    { wch: 45 }, // Scenario
    { wch: 65 }, // Expected Result
    { wch: 10 }, // Status
    { wch: 25 }  // Comments
];
ws['!cols'] = wscols;

XLSX.utils.book_append_sheet(wb, ws, "Error Handling Testing");
XLSX.writeFile(wb, "Error_Handling_Testing_Checklist.xlsx");

console.log("Checklist created: Error_Handling_Testing_Checklist.xlsx");
