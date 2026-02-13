const XLSX = require('xlsx');

const securityData = [
    { Scenario: "Unauthorized API Access", "Expected Result": "Accessing /api/admin or private routes without a token returns 401 Unauthorized", Status: "", Comments: "" },
    { Scenario: "SQL Injection on Connection", "Expected Result": "SQL commands in database host/name fields are sanitized or rejected by drivers", Status: "", Comments: "" },
    { Scenario: "Data Privacy (User Isolation)", "Expected Result": "User A cannot fetch dashboards or files belonging to User B by changing IDs in URLs", Status: "", Comments: "" },
    { Scenario: "Session Termination", "Expected Result": "Logging out clears all user data from memory and prevents further authenticated requests", Status: "", Comments: "" },
    { Scenario: "OAuth Token Security", "Expected Result": "SharePoint/Google tokens are stored securely in the backend and never exposed to the frontend console", Status: "", Comments: "" },
    { Scenario: "Cross-Site Scripting (XSS)", "Expected Result": "Malicious scripts in sheet names or table data are escaped and not executed in the UI", Status: "", Comments: "" },
    { Scenario: "CORS Policy Enforcement", "Expected Result": "Requests from unauthorized domains are blocked by the backend API", Status: "", Comments: "" },
    { Scenario: "Credential Storage", "Expected Result": "User passwords are stored as hashes in Supabase, never in plain text", Status: "", Comments: "" },
    { Scenario: "Brute Force Protection", "Expected Result": "Multiple failed login attempts should trigger a cooling period or rate limiting", Status: "", Comments: "" }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(securityData);

const wscols = [
    { wch: 45 }, // Scenario
    { wch: 65 }, // Expected Result
    { wch: 10 }, // Status
    { wch: 25 }  // Comments
];
ws['!cols'] = wscols;

XLSX.utils.book_append_sheet(wb, ws, "Security Testing");
XLSX.writeFile(wb, "Security_Testing_Checklist.xlsx");

console.log("Checklist created: Security_Testing_Checklist.xlsx");
