# Per-Chart Filtering Feature Guide

## Overview

The dashboard now supports **individual chart-level filtering** with **multiple value selection** in addition to the existing global and clickable filters. This allows you to isolate and analyze specific data within a single chart without affecting other charts on the dashboard.

## Features

### 1. **Per-Chart Filter Controls with Multi-Select**
- Each chart displays a filter button (🔍) in the top-right corner on hover
- **Select multiple values** from the same column to filter by OR logic
- Buttons remain hidden on hover to minimize lag and improve performance
- Click the filter button to open a dropdown menu to select filter criteria

### 2. **Two-Step Filtering Process with Multiple Selections**

#### Step 1: Select Column
- Search through available columns to filter by
- Only columns that contain data are available for filtering

#### Step 2: Select Multiple Values
- After selecting a column, choose one or more values to filter by
- The dropdown stays open so you can select multiple values
- Click each value to toggle it on/off
- Checkmarks (✓) show which values are selected
- All selected values use OR logic (show rows matching ANY selected value)

### 3. **Visual Indicators**
- **Active Filters Badges**: Shows all active filters applied to a chart below its title (one badge per selected value)
- **Filter Button Highlight**: The filter button glows when active filters are applied
- **Data Highlighting**: Bars/segments matching selected values show in gold (#f59e0b), others fade to 40% opacity
- **Multi-Value Display**: Each selected value gets its own badge, making it easy to see all active filters at a glance

### 4. **Managing Per-Chart Filters**

#### Clear Individual Chart Filters
- When a chart has active filters, an "X" button appears next to the filter button
- Click the X to clear all filters from that chart

#### Clear All Dashboard Filters
- Use the global "Clear Filters" button in the header to clear both global and per-chart filters

## How to Use

### Adding Per-Chart Filters

1. **Hover over a chart** - The control buttons appear in the top-right corner
2. **Click the Filter Icon** (🔍) - The filter dropdown opens
3. **Select a Column** - Search and click on the column you want to filter by
4. **Select Multiple Values** - Click on values to toggle them on/off (dropdown stays open)
5. **Automatic Update** - The chart updates in real-time to show only rows matching ANY of your selected values
6. **Click outside or another column** to close the filter menu

### Example: Multi-Value Filtering

If you have a "Sales by Region" chart and want to see data for North AND South regions:

1. Hover over the chart
2. Click the filter icon (🔍)
3. Select "Region" from the column list
4. Click "North" (checkmark appears)
5. Click "South" (checkmark appears)
6. The chart now displays sales data for both North AND South regions
7. Other regions are dimmed to 40% opacity

### Multiple Columns

You can filter by multiple columns at once:
- First column filter: Select "Region" → Select "North"
- Second column filter: Click filter icon again, select "Year" → Select "2025"
- Chart will show only data matching BOTH conditions (North region AND 2025)

## Key Differences: Global vs. Per-Chart Filters

| Feature | Global Filters | Per-Chart Filters |
|---------|-----------------|------------------|
| Scope | Affects ALL charts | Affects ONLY that chart |
| Location | Dashboard header | Individual chart top-right |
| Use Case | Dashboard-wide analysis | Deep-dive into specific chart |
| Multiple Values | Single value per column | Multiple values per column (OR logic) |
| Combined Usage | Can be used together | Can be used together |

## Technical Details

### ChartConfig Update

The `ChartConfig` interface now includes:

```typescript
chartFilters?: { [column: string]: any[] };  // Per-chart filters with multiple values
```

### Performance Optimization

**Hover Lag Fixed**: The hover state now uses `useRef` instead of `useState` to avoid unnecessary component re-renders:
- Previously: Hovering triggered state update → full component re-render → chart aggregation recalculation
- Now: Hover updates ref only → CSS group-hover handles visual changes → no re-renders

### State Management

Per-chart filters are stored as arrays to support multiple values:

```typescript
// Per-chart filters - stores arrays of selected values
const [chartFilters, setChartFilters] = useState<{ [chartId: string]: { [column: string]: any[] } }>({});

// Example: { chart1: { Region: ['North', 'South'], Year: ['2025'] } }
```

### Filter Application

When rendering a chart:

1. Apply global filters to get base data
2. Apply per-chart filters using OR logic (match ANY value in the array)
3. Display the final result in the chart

```typescript
const chartFilteredData = applyChartFilters(aggregatedData, chart.id);
// Multiple values use: values.some(val => row[column] === val)
```

## Benefits

✅ **Detailed Analysis** - Drill down into specific data segments within a chart

✅ **Non-Destructive** - Other charts remain unaffected by your filtering

✅ **Flexible Exploration** - Combine with global filters for multi-level analysis

✅ **Intuitive UI** - Simple dropdown interface for selecting filters

✅ **Visual Feedback** - Clear indicators show when filters are active

## Limitations & Notes

- Per-chart filters are **session-based** - they reset when you refresh or load a different dashboard
- Filters apply **after data aggregation** - aggregations happen before filtering
- **OR logic for multiple values** - all selected values display matching rows
- Filters persist during PDF export (exported PDFs show filtered data)

## Troubleshooting

### Filter dropdown doesn't appear

- Make sure to **hover over the chart** first
- The filter button should appear in the top-right corner on hover (mobile shows button always)
- Click the filter button to open the dropdown

### How to select multiple values

- Click on values in the dropdown - they stay selected (checkmark appears)
- Click again to deselect
- The dropdown stays open until you click outside or switch columns
- Close the menu by clicking outside it

### Chart shows no data after filtering

- Check that the selected values actually exist in the data
- Verify the combination of column filters makes sense (AND logic between columns)
- Try clearing the filter and re-applying it
- Verify global filters aren't also restricting the data

### Performance is smooth with filters

✅ Hover lag has been fixed with React refs - charts no longer re-render on hover
- Filtering uses efficient array matching
- Works well even with large datasets
- Refresh the page if performance degrades

## Future Enhancements

Potential improvements for future versions:

- [ ] Multi-value filtering (select multiple values per column)
- [ ] Filter presets/templates
- [ ] Save and load filter configurations
- [ ] Date range filtering with calendar picker
- [ ] Filter history/undo functionality
- [ ] Regex-based text filtering
