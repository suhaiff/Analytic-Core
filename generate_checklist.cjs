const XLSX = require('xlsx');

const checklistData = [
    // 1. Authentication & Profile
    { Category: "Authentication", Module: "Welcome Screen", TestCase: "Verify 'Login' & 'Sign Up' button navigation", ExpectedResult: "User navigated to correct auth forms", Priority: "High" },
    { Category: "Authentication", Module: "Signup", TestCase: "Create new account with email/pass", ExpectedResult: "Account created and redirected to Landing", Priority: "High" },
    { Category: "Authentication", Module: "Login", TestCase: "Login with existing credentials", ExpectedResult: "Successful login and data persistence", Priority: "High" },
    { Category: "Authentication", Module: "Profile Menu", TestCase: "Verify logout functionality", ExpectedResult: "Session cleared and redirected to Welcome", Priority: "Medium" },
    { Category: "Global", Module: "Theme Engine", TestCase: "Toggle Dark/Light mode", ExpectedResult: "Full UI colors switch correctly without refresh", Priority: "Low" },

    // 2. Data Sourcing (Ingestion)
    { Category: "Ingestion", Module: "File Upload", TestCase: "Drag & drop .csv / .xlsx file", ExpectedResult: "File parsed and shown in Config step", Priority: "High" },
    { Category: "Ingestion", Module: "Google Sheets", TestCase: "Connect via Sheet URL", ExpectedResult: "Metadata fetched and sheet selection appears", Priority: "High" },
    { Category: "Ingestion", Module: "SQL Database", TestCase: "Connect to MySQL/Postgres", ExpectedResult: "Tables listed after successful auth", Priority: "High" },
    { Category: "Ingestion", Module: "SharePoint", TestCase: "OAuth connection to Microsoft", ExpectedResult: "Microsoft login popup appears and connects", Priority: "High" },
    { Category: "Ingestion", Module: "SharePoint", TestCase: "Select Site & List", ExpectedResult: "Site data accurately imported to app", Priority: "High" },

    // 3. Data Configuration
    { Category: "Data Config", Module: "Header Selector", TestCase: "Change header row by clicking", ExpectedResult: "Table columns update based on new header", Priority: "Medium" },
    { Category: "Data Config", Module: "Type Mapping", TestCase: "Change column type (Numeric <-> Text)", ExpectedResult: "Aggregations in charts reflect type change", Priority: "High" },
    { Category: "Data Config", Module: "Multi-Table Join", TestCase: "Join 2 tables using a common key", ExpectedResult: "Data combined correctly in preview", Priority: "High" },
    { Category: "Data Config", Module: "Exclusions", TestCase: "Deselect columns for analysis", ExpectedResult: "Hidden columns do not appear in Chart Builder", Priority: "Medium" },

    // 4. AI & Chart Building
    { Category: "Analytics", Module: "AI Suggestions", TestCase: "Request 'Suggest Charts' (Gemini)", ExpectedResult: "Relevant KPIs and chart configs returned", Priority: "High" },
    { Category: "Analytics", Module: "Chart Builder", TestCase: "Manually select Axis (X and Y)", ExpectedResult: "Chart preview updates instantly", Priority: "High" },
    { Category: "Analytics", Module: "Chart Types", TestCase: "Switch between Bar, Line, Pie, Radar", ExpectedResult: "Data visualized correctly in each type", Priority: "Medium" },

    // 5. Dashboard
    { Category: "Dashboard", Module: "Live Filters", TestCase: "Apply Category/Date filter", ExpectedResult: "All dashboard charts filter in real-time", Priority: "High" },
    { Category: "Dashboard", Module: "Persistence", TestCase: "Save Dashboard to Profile", ExpectedResult: "Found in 'My Dashboards' after refresh", Priority: "High" },
    { Category: "Dashboard", Module: "Export", TestCase: "Export Dashboard to PDF", ExpectedResult: "High-quality PDF with charts and summary", Priority: "Medium" },
    { Category: "Dashboard", Module: "Live Sink", TestCase: "Refresh data from source", ExpectedResult: "Latest data pulled from GS/SQL/SP", Priority: "High" },

    // 6. Admin Panel
    { Category: "Admin", Module: "User Audit", TestCase: "View registered users list", ExpectedResult: "Full user list visible with roles", Priority: "Medium" },
    { Category: "Admin", Module: "Storage Management", TestCase: "View all file uploads", ExpectedResult: "File names, sizes, and owners visible", Priority: "Medium" },
    { Category: "Admin", Module: "Data Inspection", TestCase: "Open file viewer for any upload", ExpectedResult: "Raw table data modal opens correctly", Priority: "Low" },

    // 7. General UI/UX
    { Category: "System", Module: "Responsiveness", TestCase: "Test on Mobile (Portrait)", ExpectedResult: "Tables turn into cards, menu collapses", Priority: "High" },
    { Category: "System", Module: "Error Handling", TestCase: "Upload invalid file format", ExpectedResult: "Toast notification shows clear error message", Priority: "Medium" },
    { Category: "System", Module: "Loading States", TestCase: "Visual feedback during processing", ExpectedResult: "Subtle Loader/Skeleton screens visible", Priority: "Low" }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(checklistData);

// Set column widths for better readability
const wscols = [
    { wch: 15 }, // Category
    { wch: 20 }, // Module
    { wch: 45 }, // TestCase
    { wch: 45 }, // ExpectedResult
    { wch: 10 }  // Priority
];
ws['!cols'] = wscols;

XLSX.utils.book_append_sheet(wb, ws, "QA Checklist");
XLSX.writeFile(wb, "AnalyticCore_Functional_Checklist.xlsx");

console.log("Checklist created successfully: AnalyticCore_Functional_Checklist.xlsx");
