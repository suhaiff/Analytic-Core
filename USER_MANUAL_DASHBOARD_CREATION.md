# 📊 InsightAI User Manual - Dashboard Creation Guide

**Version**: 1.0  
**Last Updated**: December 18, 2025  
**Audience**: End Users

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Uploading Data](#uploading-data)
3. [Creating Your First Dashboard](#creating-your-first-dashboard)
4. [Dashboard Features](#dashboard-features)
5. [Chart Types & Usage](#chart-types--usage)
6. [AI-Powered Features](#ai-powered-features)
7. [Saving & Managing Dashboards](#saving--managing-dashboards)
8. [Exporting & Sharing](#exporting--sharing)
9. [Tips & Tricks](#tips--tricks)
10. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Getting Started

### What is InsightAI?

InsightAI is a powerful data visualization and analytics platform that helps you:
- ✅ Upload Excel files with your data
- ✅ Create interactive dashboards with AI suggestions
- ✅ Visualize data with multiple chart types
- ✅ Get AI-powered insights and recommendations
- ✅ Export reports as PDF or images
- ✅ Share insights with your team

### System Requirements

- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Internet**: Stable connection required
- **File Size**: Up to 50MB Excel files
- **Data Format**: .xlsx or .xls files

### Getting Your Login Credentials

1. Contact your administrator
2. You'll receive:
   - Email address
   - Temporary password
3. Log in at the application URL
4. You can change your password anytime

---

## Uploading Data

### Step 1: Prepare Your Excel File

Before uploading, ensure your file:

**✅ DO:**
- Use the first row for column headers
- Use consistent data types (don't mix text and numbers in same column)
- Use standard date formats (YYYY-MM-DD preferred)
- Keep column names descriptive and concise
- Use multiple sheets if you have different data categories

**❌ DON'T:**
- Leave blank rows in the middle of data
- Use merged cells (merge cells before upload)
- Include special characters in headers (use letters, numbers, underscores)
- Use formulas (save as values before uploading)
- Have inconsistent formatting

**Example of Good Excel Structure:**
```
| Sales_Date | Product_Name | Amount | Quantity | Region |
|------------|-------------|--------|----------|--------|
| 2024-01-01 | Widget A    | 1500   | 10       | East   |
| 2024-01-02 | Widget B    | 2000   | 15       | West   |
```

### Step 2: Upload File

1. **Click** "Upload Data" or "+" button on home screen
2. **Select** your Excel file (.xlsx or .xls)
3. **Wait** for upload to complete (progress bar shown)
4. **Confirm** your data appears correctly

**Status Messages:**
- 🟢 **Success**: File uploaded and ready
- 🟡 **Processing**: System is analyzing your data
- 🔴 **Error**: Check file format and try again

### Step 3: Review Uploaded Data

After upload, you'll see:
- File name and upload date
- Number of sheets
- Number of rows and columns
- Data preview (first few rows)

You can:
- **Preview** the data by clicking "View Data"
- **Delete** the file if it's incorrect
- **Proceed** to create dashboards

---

## Creating Your First Dashboard

### Method 1: AI-Powered Auto-Generation (Recommended)

This is the easiest way to get started!

#### Step 1: Upload Your Data
```
Home → Upload Data → Select Excel File → Wait for confirmation
```

#### Step 2: Access Chart Builder
```
After upload → Click "Create Dashboard" or "Build Charts"
```

#### Step 3: Review AI Suggestions
The system automatically analyzes your data and suggests:
- **Recommended Charts**: Based on your data structure
- **Key Metrics**: Important numbers to track
- **Insights**: Patterns AI found in your data

#### Step 4: Choose Charts to Add
For each suggested chart:
- 👀 **Preview**: See how it looks
- ✅ **Add**: Include in your dashboard
- ❌ **Skip**: Don't include
- 📝 **Customize**: Modify chart settings

#### Step 5: Save Your Dashboard
1. Click **"Save Dashboard"**
2. **Name** your dashboard (e.g., "Q1 Sales Analysis")
3. **Add description** (optional)
4. **Click Save**

✅ Your dashboard is now saved and ready to use!

---

### Method 2: Manual Chart Creation

For more control, create charts manually:

#### Step 1: Start Chart Builder
```
Dashboard → "Add Chart" button
```

#### Step 2: Select Chart Type

Choose from 6 chart types:

| Chart Type | Best For | Example |
|-----------|---------|---------|
| **Bar Chart** | Comparing values across categories | Sales by region |
| **Line Chart** | Showing trends over time | Revenue over months |
| **Pie Chart** | Showing parts of a whole | Market share by company |
| **Area Chart** | Showing cumulative values over time | Stack of sales by product |
| **Combination** | Comparing multiple metrics | Sales + Profit together |
| **Data Table** | Showing raw data | Detailed transaction list |

#### Step 3: Configure Your Chart

**Required Settings:**
1. **Chart Type**: What type of visualization
2. **X-Axis** (Horizontal): Usually categories or dates
3. **Y-Axis** (Vertical): Usually numbers/values
4. **Data Field**: Which column to display

**Optional Settings:**
1. **Color**: Custom colors for your chart
2. **Title**: Name of the chart
3. **Description**: What the chart shows
4. **Filters**: Limit data shown

#### Step 4: Preview & Adjust

- See live preview as you change settings
- Adjust colors, fonts, labels
- Add chart title and description
- Fine-tune until you're happy

#### Step 5: Add to Dashboard

Click **"Add to Dashboard"** to include this chart.

---

## Dashboard Features

### Dashboard Layout

Your dashboard contains:

```
┌─────────────────────────────────────────────┐
│  Dashboard Name  [Save] [Export] [Share]   │
├─────────────────────────────────────────────┤
│                                             │
│  [Chart 1]          [Chart 2]              │
│                                             │
│  [Chart 3]          [Chart 4]              │
│                                             │
└─────────────────────────────────────────────┘
```

**Features Available:**

| Feature | What It Does |
|---------|-------------|
| **Expand** | Make a chart full screen for detailed view |
| **Refresh** | Reload data (shows latest changes) |
| **Download** | Save chart as image (PNG) |
| **More Info** | See detailed statistics and numbers |
| **Delete** | Remove chart from dashboard |
| **Edit** | Modify chart settings |

### Interactive Charts

When you hover over charts:
- **Tooltip**: See exact values
- **Legend**: Toggle series on/off (click legend items)
- **Zoom**: Click and drag to zoom (line/area charts)
- **Pan**: Use brush tool to shift view

---

## Chart Types & Usage

### 📊 Bar Chart

**What it shows**: Values across different categories

**Best for:**
- Sales by region
- Product comparison
- Monthly performance
- Category analysis

**Example:**
```
    Sales by Region
    ▓▓▓
    ▓▓░ East
    ▓░░ West
    ░░░ South
```

**How to create:**
1. X-Axis: Region (categories)
2. Y-Axis: Sales (numbers)
3. Chart Type: Bar
4. Colors: Auto or custom

---

### 📈 Line Chart

**What it shows**: Trends over time

**Best for:**
- Sales trends
- Growth tracking
- Time-series data
- Daily/weekly/monthly metrics

**Example:**
```
    Revenue Over Time
    ▲
    │     ╱╲
    │    ╱  ╲
    │   ╱    ╲
    └──────────►
```

**How to create:**
1. X-Axis: Date/Time
2. Y-Axis: Value (Sales, Revenue, etc.)
3. Chart Type: Line
4. Multiple lines: Add more Y-axis values

---

### 🥧 Pie Chart

**What it shows**: Parts of a whole (percentages)

**Best for:**
- Market share
- Budget allocation
- Category distribution
- Composition analysis

**Example:**
```
    Market Share
    ┌──────┐
    │ 40% │ Product A
    │ 35% │ Product B
    │ 25% │ Product C
    └──────┘
```

**How to create:**
1. Labels: Category names
2. Values: Percentages/amounts
3. Chart Type: Pie
4. Colors: Custom for each slice

---

### 📉 Area Chart

**What it shows**: Cumulative trends over time

**Best for:**
- Stacked data over time
- Total growth breakdown
- Composition changes
- Multiple series comparison

**Example:**
```
    Stack Chart
    ▲
    │ ╭─────────
    │ │ Series B
    │ ├─────────
    │ │ Series A
    └──────────►
```

**How to create:**
1. X-Axis: Time period
2. Y-Axis: Multiple values
3. Chart Type: Area (Stacked)
4. Colors: Different for each area

---

### 📊 Combination Chart

**What it shows**: Multiple metrics together

**Best for:**
- Sales vs profit
- Revenue vs growth rate
- Comparing different units (sales + margin%)

**How to create:**
1. X-Axis: Category/Time
2. Add multiple Y-axis values
3. Chart Type: Combination
4. Customize which is Bar, Line, Area

---

### 📋 Data Table

**What it shows**: Raw data in table format

**Best for:**
- Detailed transaction list
- Data verification
- Exporting exact numbers
- Complex data review

**Features:**
- ✅ Sort by clicking headers
- ✅ Search/filter data
- ✅ Export to CSV
- ✅ Page navigation

---

## AI-Powered Features

### 🤖 Smart Chart Suggestions

The AI analyzes your data and suggests:

1. **Recommended Charts**
   - Automatically detects what charts would work
   - Shows preview of each suggestion
   - Explains why it's a good fit

2. **Key Metrics**
   - Identifies important numbers to track
   - Calculates totals, averages, maximums
   - Shows trends and changes

3. **Insights & Patterns**
   - Detects anomalies (unusual values)
   - Identifies trends (increasing/decreasing)
   - Finds correlations between data

### 🎤 Voice-Powered Chart Creation

You can create charts using voice commands:

**How to use:**
1. Click **Microphone** icon
2. **Speak** your request clearly
3. System transcribes and creates chart
4. **Review** and confirm

**Example commands:**
- "Create a bar chart of sales by region"
- "Show me revenue trend over time"
- "Compare product performance"
- "Pie chart of market share"

### 💬 Natural Language Chart Builder

Describe what you want in plain English:

**Examples:**
- "I want to see total sales for each product"
- "Show me monthly revenue trend"
- "Create a pie chart of customer segments"
- "Compare region performance with a bar chart"

**How to use:**
1. Type or speak your request
2. Click **Generate**
3. System creates chart
4. **Adjust** if needed

---

## Saving & Managing Dashboards

### Saving a Dashboard

**First Time Save:**
1. Click **"Save Dashboard"** button
2. **Name** your dashboard
   - Clear, descriptive name
   - Example: "Q1 2024 Sales Analysis"
3. **Add description** (optional)
   - What the dashboard shows
   - Key metrics included
4. **Click Save**

**Update Existing Dashboard:**
1. Make changes to charts
2. Click **"Save"** (auto-saves changes)
3. Version is automatically updated

### Dashboard List

View all your dashboards:
1. From home page, click **"My Dashboards"**
2. See list with:
   - Dashboard name
   - Last modified date
   - Number of charts
   - Actions (View, Edit, Delete)

### Organizing Dashboards

**Naming Convention (Recommended):**
```
[Department] - [Topic] - [Period]

Examples:
- Sales - Regional Analysis - Q1 2024
- Marketing - Campaign Performance - January
- Finance - Budget Review - FY2024
```

### Deleting a Dashboard

1. Go to **"My Dashboards"**
2. Find dashboard to delete
3. Click **"Delete"** (or ⋮ menu)
4. **Confirm** deletion
5. Dashboard is removed (cannot be undone)

---

## Exporting & Sharing

### Export Options

#### 📄 Export as PDF

**What it includes:**
- All charts from dashboard
- Dashboard name and date
- Professional formatting
- Print-ready layout

**How to export:**
1. Open dashboard
2. Click **"Export" → "PDF"**
3. Select options:
   - [ ] Include summary
   - [ ] Include data tables
   - [ ] Page orientation
4. Click **"Download"**

**File size:** Usually 2-10 MB

#### 🖼️ Export as Image

**What it includes:**
- Individual chart as PNG
- High resolution (300 DPI)
- Transparent background option

**How to export:**
1. Click on chart
2. Click **"Download"** button
3. Image saves to computer

#### 📊 Export as CSV/Excel

**What it includes:**
- Raw data used in chart
- All rows and columns
- Excel-compatible format

**How to export:**
1. Click on chart
2. Click **"Data" → "Export"**
3. Choose format (CSV or Excel)
4. File downloads

### Sharing Dashboards

#### Share via Link

1. Click **"Share"** button
2. Click **"Copy Link"**
3. **Share** with colleague/email/chat
4. They can view dashboard (with permission)

#### Share as PDF

1. Click **"Export" → "PDF"**
2. Click **"Share"** (email option)
3. Compose email
4. Send to recipient

#### Print Dashboard

1. Click **"Print"** button
2. Browser print dialog opens
3. Select printer and settings
4. Click **"Print"**

---

## Tips & Tricks

### 💡 Pro Tips for Better Dashboards

**Tip 1: Keep it Simple**
- Don't overcrowd with too many charts
- 4-6 charts per dashboard is ideal
- Use consistent color schemes

**Tip 2: Tell a Story**
- Arrange charts in logical order
- Start with overview, then details
- Use titles to guide reader

**Tip 3: Use Appropriate Chart Types**
- Trends → Line charts
- Comparisons → Bar charts
- Parts of whole → Pie charts
- Time-series changes → Area charts

**Tip 4: Format Your Data Well**
- Consistent column names
- Proper data types
- No blank rows or columns
- Clean, descriptive headers

**Tip 5: Add Context**
- Use chart titles
- Add descriptions
- Include data source
- Mention date of data

**Tip 6: Use Filters**
- Filter by time period
- Filter by category
- Compare different segments
- Show specific regions

**Tip 7: Leverage AI Suggestions**
- Review AI recommendations first
- They're usually good starting points
- Customize from there
- Saves you time

**Tip 8: Refresh Regularly**
- Upload latest data
- Update dashboards monthly
- Track changes over time
- Keep insights current

### 🎨 Customization Tips

**Colors:**
- Use consistent brand colors
- Use contrasting colors for clarity
- Avoid too many colors (max 5-6)
- Consider colorblind-friendly palettes

**Titles & Labels:**
- Keep titles descriptive but concise
- Use sentence case (not ALL CAPS)
- Include units ($ for currency, % for percentages)
- Add data source/date

**Layout:**
- Arrange by importance
- Group related charts
- Use consistent sizing
- Leave whitespace for readability

### ⏱️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save dashboard |
| `Ctrl+Z` | Undo last action |
| `Ctrl+Y` | Redo action |
| `Escape` | Close modals/popups |
| `Enter` | Confirm selection |

---

## FAQ & Troubleshooting

### 📱 Common Questions

**Q: Can I edit a dashboard after saving?**
A: Yes! Open the dashboard and click "Edit". You can add, remove, or modify charts anytime.

**Q: Can multiple people access the same dashboard?**
A: Yes! Use the Share feature to give access. They'll see the same dashboard.

**Q: What file formats do you support?**
A: .xlsx and .xls (Excel files). CSV is not directly supported - convert to Excel first.

**Q: Can I have multiple sheets in one file?**
A: Yes! All sheets will be processed. You can create dashboards from each sheet.

**Q: Can I combine data from multiple files?**
A: You'll need to combine them in Excel first, then upload as one file.

**Q: Is there a data size limit?**
A: Files up to 50MB are supported. Very large files may process slowly.

**Q: Can I download my data?**
A: Yes! Export individual charts as CSV/Excel using the Download option.

**Q: How long are dashboards stored?**
A: Indefinitely! Your dashboards are saved until you delete them.

**Q: Can I change dashboard privacy?**
A: Currently all dashboards are private to your account. Share feature allows selective access.

---

### 🐛 Troubleshooting

#### Problem: Upload Fails

**Symptoms:** Error message when uploading file

**Solutions:**
1. Check file format (must be .xlsx or .xls)
2. Verify file isn't corrupted (open in Excel)
3. Try smaller file first
4. Clear browser cache and retry
5. Contact support if issue persists

#### Problem: Charts Don't Show Data

**Symptoms:** Chart appears empty or says "No Data Available"

**Solutions:**
1. Check data was uploaded successfully
2. Verify correct columns selected
3. Ensure data types match (numbers for Y-axis)
4. Check filters aren't hiding all data
5. Refresh dashboard with **Refresh** button

#### Problem: AI Suggestions Are Slow

**Symptoms:** Takes a long time to get chart suggestions

**Solutions:**
1. Wait 30+ seconds (AI is analyzing)
2. For large files, upload smaller subset first
3. Check internet connection
4. Try different browser if consistent issue

#### Problem: Can't Save Dashboard

**Symptoms:** Save button doesn't work or gives error

**Solutions:**
1. Check internet connection
2. Make sure dashboard has at least one chart
3. Try giving it a different name
4. Log out and log back in
5. Contact support

#### Problem: Exported PDF Looks Wrong

**Symptoms:** Formatting issues in PDF export

**Solutions:**
1. Try exporting as image instead
2. Adjust dashboard layout (fewer charts per row)
3. Try different browser
4. Contact support with screenshot

---

### 🆘 Getting Help

**If you need help:**

1. **Check this manual** - Most questions are answered here
2. **Try troubleshooting** - Use solutions above
3. **Contact Support** - Email: support@insightai.com
4. **Phone Support** - Call during business hours
5. **Chat Support** - Available in app (bottom right)

**When contacting support, provide:**
- What you were trying to do
- Error message (if any)
- Screenshot
- File name (if applicable)
- Your browser/device type

---

## Video Tutorials

Links to video guides (if available):

- ✅ [Getting Started (2 min)](https://videos.insightai.com/getting-started)
- ✅ [Creating Your First Dashboard (5 min)](https://videos.insightai.com/first-dashboard)
- ✅ [Advanced Chart Configuration (8 min)](https://videos.insightai.com/advanced-charts)
- ✅ [Using AI Features (4 min)](https://videos.insightai.com/ai-features)
- ✅ [Exporting & Sharing (3 min)](https://videos.insightai.com/export-share)

---

## Quick Reference Card

**Bookmark this for quick access:**

### Dashboard Creation Workflow
```
1. Upload Data
   ↓
2. View Data Preview
   ↓
3. Create Dashboard
   ↓
4. Choose charts (AI suggested or manual)
   ↓
5. Customize charts
   ↓
6. Save Dashboard
   ↓
7. Export/Share if needed
```

### Most Used Features
| Feature | Icon | Keyboard |
|---------|------|----------|
| Save | 💾 | Ctrl+S |
| Export | 📥 | - |
| Share | 🔗 | - |
| Add Chart | ➕ | - |
| Refresh | 🔄 | F5 |

### Chart Type Quick Guide
| Data | Chart Type |
|------|-----------|
| Values over time | Line |
| Category comparison | Bar |
| Parts of whole | Pie |
| Multiple series over time | Area |
| Multiple metrics | Combination |
| Raw data | Table |

---

## Best Practices Summary

✅ **DO:**
- Use descriptive names
- Keep dashboards focused
- Update data regularly
- Export for sharing
- Use AI suggestions
- Test before sharing
- Document your data source

❌ **DON'T:**
- Overcrowd dashboards
- Use wrong chart types
- Mix inconsistent data
- Share sensitive data publicly
- Delete dashboards you might need
- Ignore data quality issues
- Forget to save

---

## Glossary

| Term | Definition |
|------|-----------|
| **Dashboard** | Visual display of charts and metrics |
| **Chart** | Individual data visualization (bar, line, pie, etc.) |
| **Data Model** | Structure of uploaded Excel data |
| **X-Axis** | Horizontal axis (usually categories) |
| **Y-Axis** | Vertical axis (usually values) |
| **Legend** | Key showing what colors/symbols mean |
| **Tooltip** | Info box that appears on hover |
| **Export** | Download dashboard as PDF/image |
| **Share** | Give access to others |
| **Filter** | Limit data shown by criteria |
| **Aggregate** | Combine/summarize data |
| **Metric** | Key number you're tracking |
| **KPI** | Key Performance Indicator |
| **Series** | Individual line/bar in a chart |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 18, 2025 | Initial user manual release |

---

## Contact & Support

**Need Help?**
- 📧 Email: support@insightai.com
- 📞 Phone: +1-XXX-XXX-XXXX
- 💬 Live Chat: Available 9 AM - 6 PM EST
- 🌐 Website: www.insightai.com
- 📚 Documentation: docs.insightai.com

---

**Last Updated:** December 18, 2025  
**For Questions:** Contact Support Team  
**Feedback:** We'd love to hear from you! Send suggestions to feedback@insightai.com

---

*InsightAI - Making Data Accessible to Everyone* 📊✨
