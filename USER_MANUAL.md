# 📊 AnalyticCore User Manual

**Version**: 2.0  
**Last Updated**: December 18, 2025  
**Powered by**: Gemini 2.0 Flash

---

## 📋 Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Data Upload](#3-data-upload)
4. [Data Configuration & Relationships](#4-data-configuration--relationships)
5. [AI-Powered Chart Building](#5-ai-powered-chart-building)
6. [Dashboard Management](#6-dashboard-management)
7. [Admin Panel (Administrators Only)](#7-admin-panel)
8. [Tips & Best Practices](#8-tips--best-practices)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Introduction

**AnalyticCore** is an advanced data visualization and analytics platform that transforms raw data into professional dashboards in seconds. Using state-of-the-art AI (Gemini 2.0 Flash), the platform automatically analyzes your data, suggests key performance indicators (KPIs), and builds interactive visualizations.

### Key Features:
- **Multi-File Support**: Upload and join multiple Excel/CSV files.
- **AI Insights**: Automatic KPI and chart recommendations.
- **Natural Language Builder**: Create charts by simply asking or using voice commands.
- **Interactive Dashboards**: Zoom, filter, and hover for deep data exploration.
- **Professional Exporting**: Save your insights as high-quality PDFs or images.

---

## 2. Getting Started

### Accessing the Platform
1. Navigate to the application URL.
2. You will be greeted by the **Welcome** screen.
3. **Login** with your credentials or **Sign Up** for a new account.
4. Once logged in, you will arrive at the **Landing Page**.

### The Landing Page
- **New Analysis**: Start here to upload a new dataset.
- **My Dashboards**: Access your previously saved work.
- **Theme Toggle**: Switch between Light and Dark modes using the moon/sun icon in the header.

---

## 3. Data Upload

### Supported Formats
- **Excel**: `.xlsx`, `.xls`
- **CSV**: `.csv`
- **Size Limit**: Up to 10MB per file.

### How to Upload
1. On the Landing Page, click the **"Upload Dataset"** area or drag and drop your file.
2. You can upload multiple files if you need to merge data from different sources.
3. Once the initial file is processed, you will be taken to the **Data Configuration** screen.

---

## 4. Data Configuration & Relationships

This is where you prepare your data for analysis.

### Managing Tables
- **Add More Tables**: Use the **(+)** button in the sidebar to upload additional files.
- **Header Row**: For each table, specify which row contains the column headers (default is row 0).
- **View Data**: Click the **Eye icon** next to any table to see a preview of its raw content.

### Joining Tables (Relationships)
If you have multiple tables, you can connect them:
1. Click the **"Data Relationships"** tab.
2. Click **"Add Join"**.
3. Select the **Left Table** and **Right Table**.
4. Choose the **Key Column** from each table (the column that links them, e.g., `CustomerID`).
5. Select the **Join Type**:
   - **INNER**: Only rows with matches in both tables.
   - **LEFT**: All rows from the left table, plus matches from the right.
   - **RIGHT**: All rows from the right table, plus matches from the left.
   - **FULL**: All rows from both tables.

### Selecting Columns
1. Click the **"Select Columns"** tab.
2. Use the checkboxes in the sidebar to choose which columns you want to include in your analysis.
3. **Tip**: Only select columns relevant to your goals to keep the AI analysis focused.

### Finalizing
- Enter a **Dashboard Title** in the sidebar.
- Click **"Finalize"** in the top right to proceed to the Chart Builder.

---

## 5. AI-Powered Chart Building

### AI Suggestions
AnalyticCore automatically analyzes your data and displays recommendations in the **"Insights"** sidebar:
- **KPIs**: Key numbers like Total Sales, Average Rating, etc.
- **Charts**: Visualizations like "Revenue over Time" or "Sales by Region".
- **Action**: Click the **(+)** button on any suggestion to add it to your dashboard bucket.

### Custom Chart Builder (Natural Language)
If you need a specific chart not suggested by the AI:
1. Use the **Search Bar** at the top.
2. **Type** your request (e.g., *"Show me a pie chart of profit by category"*).
3. **Voice Command**: Click the **Microphone** icon and speak your request.
4. Click **Send** to generate the chart.

### Managing Your Selection
- All selected charts appear in the **"Your Selection"** area.
- Click the **(X)** on any chart to remove it.
- Click **"Generate Report"** when you are ready to view your dashboard.

---

## 6. Dashboard Management

### Interacting with Charts
- **Hover**: See exact values in tooltips.
- **Zoom**: For Line and Area charts, use the slider (brush) at the bottom to zoom into specific time ranges.
- **Maximize**: Click the **Maximize icon** on any chart to view it in full screen.

### Saving & Sharing
- **Save**: Click the **"Save"** button to store your dashboard. You can give it a custom name.
- **Edit**: Click **"Edit / Add Charts"** to return to the builder and modify your selection.
- **Export PDF**: Click **"Export PDF"** to download a professional report of your dashboard.
- **Share**: Use the **Share** button to generate a link for colleagues (permissions required).

---

## 7. Admin Panel

*Note: This section is only visible to users with the **ADMIN** role.*

The Admin Dashboard provides a high-level overview of the entire system:
- **Users**: Manage registered users, view their roles, and delete accounts if necessary.
- **All Reports**: View and manage every dashboard created on the platform.
- **Uploads**: Track all file uploads, including file sizes and who uploaded them.
- **File Viewer**: Admins can click the **Eye icon** on any upload to view the raw data content directly in the browser.

---

## 8. Tips & Best Practices

- **Clean Data**: Ensure your Excel/CSV files have consistent headers and no merged cells.
- **Dates**: Use standard date formats (e.g., YYYY-MM-DD) for the best time-series analysis.
- **KPIs First**: Start your dashboard with 3-4 KPIs to give a quick summary before diving into detailed charts.
- **Simplicity**: Avoid adding too many charts to a single dashboard. 6-8 high-quality charts are usually better than 20 cluttered ones.

---

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| **File Upload Fails** | Ensure the file is a valid `.csv` or `.xlsx` and under 10MB. |
| **No AI Suggestions** | Ensure you have selected at least one numeric and one categorical column in the Config step. |
| **Chart Looks Empty** | Check if the columns you selected contain actual data and not just null values. |
| **Voice Input Not Working** | Ensure you are using a supported browser (Chrome is recommended) and have granted microphone permissions. |
| **PDF Export Formatting** | For best results, use the "Export PDF" button rather than the browser's default print function. |

---

© 2025 AnalyticCore. All rights reserved.
