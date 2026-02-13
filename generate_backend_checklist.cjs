const XLSX = require('xlsx');

const validationData = [
    // Authentication
    { Field: "User Name", "Input Type": "Text", "Validation Rule": "Required, Min 2 chars", "Expected Result": "Accepted if meeting criteria, else 400 Error", Status: "" },
    { Field: "Email Address", "Input Type": "Email", "Validation Rule": "Valid email format, Unique in database", "Expected Result": "Accepted if unique/valid, else 'Email library exists' or 'Invalid email'", Status: "" },
    { Field: "Password", "Input Type": "Password", "Validation Rule": "Required, Strong password (suggested)", "Expected Result": "Hashed and stored securely", Status: "" },

    // File Upload
    { Field: "File Upload", "Input Type": "File (.xlsx, .xls, .sql)", "Validation Rule": "Allowed extensions only, Max size check", "Expected Result": "Parsed if valid, else 'File type not supported' error", Status: "" },
    { Field: "User ID", "Input Type": "Number", "Validation Rule": "Must be valid existing userId", "Expected Result": "Data associated with correct user record", Status: "" },

    // Google Sheets
    { Field: "Google Sheet URL", "Input Type": "URL", "Validation Rule": "Valid sheet URL containing spreadsheetId", "Expected Result": "ID extracted correctly, 400 error if invalid URL", Status: "" },
    { Field: "Sheet Selection", "Input Type": "Array", "Validation Rule": "At least one sheet must be selected", "Expected Result": "400 error if no sheets selected for import", Status: "" },

    // SQL Database
    { Field: "DB Host", "Input Type": "Text", "Validation Rule": "Required, IP or Domain", "Expected Result": "Connection succeeds or timeout error returned", Status: "" },
    { Field: "DB Port", "Input Type": "Number", "Validation Rule": "Valid port range (0-65535)", "Expected Result": "Accepted if within range", Status: "" },
    { Field: "DB Credentials", "Input Type": "Text/Pass", "Validation Rule": "Authentication via DB driver", "Expected Result": "Access granted or 'Invalid credentials' error", Status: "" },

    // SharePoint
    { Field: "OAuth Token", "Input Type": "Secret", "Validation Rule": "Valid non-expired Azure AD token", "Expected Result": "Sites/Lists fetched, 401 if expired/invalid", Status: "" },
    { Field: "Site ID / List ID", "Input Type": "UUID/String", "Validation Rule": "Must exist in user's SharePoint tenant", "Expected Result": "Data pulled successfully", Status: "" },

    // Dashboard Saving
    { Field: "Dashboard Name", "Input Type": "Text", "Validation Rule": "Required, Max 100 chars", "Expected Result": "Saved to DB with timestamp", Status: "" },
    { Field: "Chart Configs", "Input Type": "JSON Array", "Validation Rule": "Must be valid JSON structure", "Expected Result": "Stored in Supabase jsonb column correctly", Status: "" },
    { Field: "Data Model", "Input Type": "JSON Object", "Validation Rule": "Must contains columns and data mappings", "Expected Result": "Validated schema before persistence", Status: "" }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(validationData);

// Set column widths for better readability
const wscols = [
    { wch: 20 }, // Field
    { wch: 25 }, // Input Type
    { wch: 35 }, // Validation Rule
    { wch: 45 }, // Expected Result
    { wch: 10 }  // Status
];
ws['!cols'] = wscols;

XLSX.utils.book_append_sheet(wb, ws, "Data Validation");
XLSX.writeFile(wb, "Backend_Data_Validation_Checklist.xlsx");

console.log("Checklist created: Backend_Data_Validation_Checklist.xlsx");
