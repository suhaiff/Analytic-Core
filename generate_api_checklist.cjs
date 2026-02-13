const XLSX = require('xlsx');

const apiTestData = [
    // 1. Authentication APIs
    { "API Name": "POST /api/login", "Test Case": "Login with valid credentials", "Expected Result": "200 Success - Returns user object (excluding password)", Status: "", Notes: "" },
    { "API Name": "POST /api/login", "Test Case": "Login with incorrect password", "Expected Result": "401 Unauthorized - 'Invalid credentials'", Status: "", Notes: "" },
    { "API Name": "POST /api/signup", "Test Case": "Register new user with unique email", "Expected Result": "200 Success - Returns new user object", Status: "", Notes: "" },
    { "API Name": "POST /api/signup", "Test Case": "Register with email that already exists", "Expected Result": "400 Bad Request - 'Email already exists'", Status: "", Notes: "" },

    // 2. Data Ingestion (File & Sheets)
    { "API Name": "POST /api/upload", "Test Case": "Upload valid .xlsx file with userId", "Expected Result": "200 Success - Returns fileId and sheet metadata", Status: "", Notes: "" },
    { "API Name": "POST /api/upload", "Test Case": "Upload unsupported file type (.pdf)", "Expected Result": "400 Bad Request - Extension not supported error", Status: "", Notes: "" },
    { "API Name": "POST /api/google-sheets/metadata", "Test Case": "Fetch metadata for valid Public/Shared GS URL", "Expected Result": "200 Success - Returns Spreadsheet ID and Sheet Names", Status: "", Notes: "" },
    { "API Name": "POST /api/google-sheets/import", "Test Case": "Import specific sheets from Google Sheets", "Expected Result": "200 Success - Data parsed and stored in Supabase", Status: "", Notes: "" },

    // 3. SharePoint APIs (OAuth Flow)
    { "API Name": "GET /auth/sharepoint/start", "Test Case": "Initiate connection for valid userId", "Expected Result": "302 Redirect - To Microsoft Login Page", Status: "", Notes: "" },
    { "API Name": "GET /api/sharepoint/connection-status", "Test Case": "Check status for connected user", "Expected Result": "200 OK - { connected: true }", Status: "", Notes: "" },
    { "API Name": "POST /api/sharepoint/user/sites", "Test Case": "Fetch sites list for authenticated user", "Expected Result": "200 OK - Array of SharePoint sites", Status: "", Notes: "" },

    // 4. Dashboard & Reports
    { "API Name": "POST /api/dashboards", "Test Case": "Save new chart configurations", "Expected Result": "200 Success - Dashboard ID returned", Status: "", Notes: "" },
    { "API Name": "GET /api/dashboards", "Test Case": "Fetch dashboards for specific userId", "Expected Result": "200 OK - List of saved reports", Status: "", Notes: "" },
    { "API Name": "DELETE /api/dashboards/:id", "Test Case": "Delete report by ID", "Expected Result": "200 OK - 'Dashboard deleted'", Status: "", Notes: "" },

    // 5. Data Retrieval & Admin
    { "API Name": "GET /api/uploads/:id/content", "Test Case": "Retrieve raw rows for a stored fileId", "Expected Result": "200 OK - JSON object with sheet data arrays", Status: "", Notes: "" },
    { "API Name": "POST /api/log-config", "Test Case": "Log data join and column mapping session", "Expected Result": "200 OK - Entry added to config_logs", Status: "", Notes: "" },
    { "API Name": "GET /api/admin/uploads", "Test Case": "Fetch all global uploads (Admin only)", "Expected Result": "200 OK - List of files from all users", Status: "", Notes: "" },
    { "API Name": "DELETE /api/users/:id", "Test Case": "Admin deletes a user account", "Expected Result": "200 OK - 'User deleted successfully'", Status: "", Notes: "" }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(apiTestData);

// Set column widths
const wscols = [
    { wch: 30 }, // API Name
    { wch: 45 }, // Test Case
    { wch: 50 }, // Expected Result
    { wch: 10 }, // Status
    { wch: 25 }  // Notes
];
ws['!cols'] = wscols;

XLSX.utils.book_append_sheet(wb, ws, "API Testing");
XLSX.writeFile(wb, "API_Testing_Checklist.xlsx");

console.log("Checklist created: API_Testing_Checklist.xlsx");
