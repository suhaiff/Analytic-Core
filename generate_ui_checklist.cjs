const XLSX = require('xlsx');

const navigationData = [
    { Scenario: "Welcome Screen: Verify 'Login' button navigation", "Expected Result": "User navigated to the Login page", Status: "", Comments: "" },
    { Scenario: "Welcome Screen: Verify 'Get Started' button navigation", "Expected Result": "User navigated to the Signup page", Status: "", Comments: "" },
    { Scenario: "Login Page: Click 'Back' arrow", "Expected Result": "User returned to Welcome screen", Status: "", Comments: "" },
    { Scenario: "Signup Page: Click 'Back' arrow", "Expected Result": "User returned to Welcome screen", Status: "", Comments: "" },
    { Scenario: "Authentication: Successful Login (User)", "Expected Result": "Redirected to the main Landing/Import page", Status: "", Comments: "" },
    { Scenario: "Authentication: Successful Login (Admin)", "Expected Result": "Redirected directly to the Admin Dashboard", Status: "", Comments: "" },
    { Scenario: "Landing Page: Click 'Import from Google Sheets'", "Expected Result": "Google Sheets configuration modal opens", Status: "", Comments: "" },
    { Scenario: "Landing Page: Click 'Import from SharePoint'", "Expected Result": "SharePoint site/list selection modal opens", Status: "", Comments: "" },
    { Scenario: "Landing Page: Click 'Import SQL Data'", "Expected Result": "SQL Connection configuration modal opens", Status: "", Comments: "" },
    { Scenario: "Landing Page: Drag & Drop local file", "Expected Result": "Screen transitions to Data Configuration step", Status: "", Comments: "" },
    { Scenario: "Landing Page: Click 'View' on My Dashboards", "Expected Result": "Navigates directly to the saved Dashboard view", Status: "", Comments: "" },
    { Scenario: "Analysis Flow: Click 'Finalize' on Config Step", "Expected Result": "User transitions to the Chart Builder screen", Status: "", Comments: "" },
    { Scenario: "Analysis Flow: Click 'Generate Report' on Builder", "Expected Result": "User transitions to the final Dashboard screen", Status: "", Comments: "" },
    { Scenario: "Navigation Guard: Home icon click during analysis", "Expected Result": "Exit confirmation modal appears", Status: "", Comments: "" },
    { Scenario: "Global: Profile Avatar menu click", "Expected Result": "Dropdown opens with Logout and account options", Status: "", Comments: "" },
    { Scenario: "Global: Logout selection", "Expected Result": "Session cleared, returned to Welcome screen", Status: "", Comments: "" },
    { Scenario: "Global: Theme Toggle", "Expected Result": "UI colors switch between Light/Dark instantly", Status: "", Comments: "" },
    { Scenario: "Admin Dashboard: Switch between tabs (Users/Reports/Uploads)", "Expected Result": "List content updates based on active tab", Status: "", Comments: "" },
    { Scenario: "Admin Dashboard: Click 'View' (Eye icon) on Uploads", "Expected Result": "Raw data preview modal opens containing table data", Status: "", Comments: "" }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(navigationData);

// Set column widths
const wscols = [
    { wch: 45 }, // Scenario
    { wch: 45 }, // Expected Result
    { wch: 10 }, // Status
    { wch: 30 }  // Comments
];
ws['!cols'] = wscols;

XLSX.utils.book_append_sheet(wb, ws, "Navigation Testing");
XLSX.writeFile(wb, "UI_Navigation_Checklist.xlsx");

console.log("Checklist created: UI_Navigation_Checklist.xlsx");
