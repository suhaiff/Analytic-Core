/**
 * AnalyticCore – Professional User Guide PDF Generator
 * Uses jsPDF with Helvetica only (ASCII-safe, no emoji, no Unicode symbols)
 * All decorative elements are drawn geometrically (rects, lines, circles).
 */
import jsPDF from 'jspdf';

// ──────────────────────────────────────────────────────────────────────────────
// Colour palette  (all [R, G, B] triples)
// ──────────────────────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const C = {
  indigoD:  [67,  56,  202] as RGB,   // darker indigo
  indigo:   [99,  102, 241] as RGB,
  indigoL:  [129, 140, 248] as RGB,   // lighter indigo
  violet:   [139, 92,  246] as RGB,
  white:    [255, 255, 255] as RGB,
  darkBg:   [10,  17,  35 ] as RGB,   // near-black page background
  darkCard: [20,  29,  55 ] as RGB,   // card / section background
  darkLine: [36,  48,  78 ] as RGB,   // subtle separator
  textPrim: [240, 244, 255] as RGB,   // near-white
  textSec:  [165, 180, 210] as RGB,   // medium slate
  textMut:  [90,  110, 155] as RGB,   // muted slate
  // accent colours per section
  blue:     [59,  130, 246] as RGB,
  teal:     [20,  184, 166] as RGB,
  purple:   [168, 85,  247] as RGB,
  emerald:  [16,  185, 129] as RGB,
  amber:    [245, 158, 11 ] as RGB,
  rose:     [239, 68,  100] as RGB,
  green:    [34,  197, 94 ] as RGB,
};

// Page constants (A4 in mm)
const PW = 210;
const PH = 297;
const ML = 16;   // margin left
const MR = 16;   // margin right
const CW = PW - ML - MR;

// ──────────────────────────────────────────────────────────────────────────────
// Low-level drawing helpers
// ──────────────────────────────────────────────────────────────────────────────
function setFill(doc: jsPDF, rgb: RGB) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setDraw(doc: jsPDF, rgb: RGB) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}
function setTxt(doc: jsPDF, rgb: RGB) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function fillRect(doc: jsPDF, x: number, y: number, w: number, h: number, rgb: RGB) {
  setFill(doc, rgb);
  doc.rect(x, y, w, h, 'F');
}

function filledRoundRect(
  doc: jsPDF, x: number, y: number, w: number, h: number, r: number, rgb: RGB,
) {
  setFill(doc, rgb);
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

function strokedRoundRect(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  r: number, strokeRgb: RGB, lw = 0.25,
) {
  setDraw(doc, strokeRgb);
  doc.setLineWidth(lw);
  doc.roundedRect(x, y, w, h, r, r, 'S');
}

/** Horizontal gradient bar: leftRgb -> rightRgb */
function gradBar(doc: jsPDF, x: number, y: number, w: number, h: number, l: RGB, r: RGB) {
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const rgb: RGB = [
      Math.round(l[0] + t * (r[0] - l[0])),
      Math.round(l[1] + t * (r[1] - l[1])),
      Math.round(l[2] + t * (r[2] - l[2])),
    ];
    fillRect(doc, x + (w * i) / steps, y, w / steps + 0.6, h, rgb);
  }
}

/** Line */
function hLine(doc: jsPDF, x1: number, y: number, x2: number, rgb: RGB, lw = 0.25) {
  setDraw(doc, rgb);
  doc.setLineWidth(lw);
  doc.line(x1, y, x2, y);
}

function vLine(doc: jsPDF, x: number, y1: number, y2: number, rgb: RGB, lw = 0.3) {
  setDraw(doc, rgb);
  doc.setLineWidth(lw);
  doc.line(x, y1, x, y2);
}

/** Print text and return the text height (for multi-line) */
function drawText(
  doc: jsPDF,
  str: string,
  x: number,
  y: number,
  rgb: RGB,
  size: number,
  style: 'normal' | 'bold' = 'normal',
  maxWidth?: number,
  align: 'left' | 'center' | 'right' = 'left',
): number {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  setTxt(doc, rgb);
  const opts: any = { align };
  if (maxWidth) opts.maxWidth = maxWidth;
  doc.text(str, x, y, opts);
  if (maxWidth) {
    return doc.splitTextToSize(str, maxWidth).length * (size * 0.353 + 1.2);
  }
  return size * 0.353 + 1;
}

/** Multi-line text block; returns total height consumed */
function drawParagraph(
  doc: jsPDF,
  str: string,
  x: number,
  y: number,
  rgb: RGB,
  size: number,
  maxWidth: number,
  style: 'normal' | 'bold' = 'normal',
): number {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  setTxt(doc, rgb);
  const lines = doc.splitTextToSize(str, maxWidth);
  doc.text(lines, x, y);
  const lineH = size * 0.353 + 1.6;
  return lines.length * lineH;
}

// ──────────────────────────────────────────────────────────────────────────────
// Page state tracker
// ──────────────────────────────────────────────────────────────────────────────
let _doc: jsPDF;
let _page = 0;
let _cursor = 0;

function initDoc() {
  _doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  _page = 1;
}

function addPage() {
  _doc.addPage();
  _page++;
  paintPageBackground();
  _cursor = 24;
}

function paintPageBackground() {
  fillRect(_doc, 0, 0, PW, PH, C.darkBg);
  // Top accent line
  gradBar(_doc, 0, 0, PW, 1.2, C.indigo, C.violet);
  // Bottom footer bar
  fillRect(_doc, 0, PH - 11, PW, 11, C.darkCard);
  hLine(_doc, 0, PH - 11, PW, C.darkLine, 0.2);
  drawText(_doc, 'AnalyticCore  -  Official User Guide  -  Version 2.0', ML, PH - 4.8, C.textMut, 6.5);
  drawText(_doc, `Page ${_page}`, PW - MR, PH - 4.8, C.indigoL, 6.5, 'bold', undefined, 'right');
}

function ensureSpace(needed: number) {
  if (_cursor + needed > PH - 16) {
    addPage();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Content data
// ──────────────────────────────────────────────────────────────────────────────
interface Step {
  id: string;           // e.g. "1.1"
  title: string;
  bullets: string[];
}

interface Section {
  num: number;
  title: string;
  tagline: string;
  accent: RGB;
  accentDark: RGB;
  steps: Step[];
  tip?: string;
}

const SECTIONS: Section[] = [
  {
    num: 1,
    title: 'Getting Started',
    tagline: 'Sign in and navigate the home screen with confidence.',
    accent: C.indigo,
    accentDark: C.indigoD,
    steps: [
      {
        id: '1.1',
        title: 'Log In to Your Account',
        bullets: [
          'Open AnalyticCore in your browser and go to the login page.',
          'Enter your registered email address and password, then click Log In.',
          'New accounts are created by an administrator — contact your admin for access.',
          'After login you land on the main Home screen.',
        ],
      },
      {
        id: '1.2',
        title: 'Navigate the Home Screen',
        bullets: [
          'The Home screen has two tabs: New Analysis and My Dashboards.',
          'New Analysis lets you import fresh data from any supported source.',
          'My Dashboards shows all previously saved dashboards as quick-open cards.',
          'The top-right Profile Menu gives access to Help, About, and Log Out.',
          'A theme toggle (sun / moon icon) switches between dark and light mode.',
        ],
      },
    ],
  },
  {
    num: 2,
    title: 'Importing Data',
    tagline: 'Connect your data from five different source types.',
    accent: C.blue,
    accentDark: [37, 99, 235] as RGB,
    steps: [
      {
        id: '2.1',
        title: 'Upload CSV or Excel Files',
        bullets: [
          'Drag and drop a .csv, .xlsx, or .xls file onto the upload zone on the Home screen.',
          'Alternatively, click the upload zone to open the system file picker.',
          'Files up to 10 MB are supported. Larger files should be split before upload.',
          'The system auto-detects column headers and data types upon upload.',
        ],
      },
      {
        id: '2.2',
        title: 'Connect Google Sheets',
        bullets: [
          'Click Other Import Options and select Connect with Google Sheets.',
          'Share your Google Sheet with the listed service-account email (Viewer access).',
          'Paste the full Google Sheets URL into the URL field and click Connect Sheet.',
          'Choose one or more sheet tabs to include, then click Import Sheet.',
          'Once imported, live refresh keeps your dashboard in sync with the sheet.',
        ],
      },
      {
        id: '2.3',
        title: 'Import from SQL Database',
        bullets: [
          'Click Other Import Options and select Import SQL Data.',
          'Choose your database engine: MySQL, MariaDB, or PostgreSQL.',
          'Enter the Host, Port, Database Name, Username, and Password.',
          'Click Test Connection to verify your credentials are correct.',
          'Click Fetch Tables, select the tables you need, then click Import Table.',
        ],
      },
      {
        id: '2.4',
        title: 'Import from SharePoint',
        bullets: [
          'Click Other Import Options and select Import from SharePoint.',
          'Click Connect SharePoint Account and sign in via Microsoft OAuth.',
          'Grant the required read permissions when prompted by Microsoft.',
          'Select your SharePoint site from the list, then choose the target list.',
          'Click Import SharePoint Data to load the data into AnalyticCore.',
        ],
      },
      {
        id: '2.5',
        title: 'Multiple-Table Import',
        bullets: [
          'You can import multiple sheets or SQL tables in one session.',
          'Each imported table is available for joining in the Data Configuration step.',
          'Use descriptive table names to keep your workspace organised.',
        ],
      },
    ],
    tip: 'TIP: For Google Sheets, only Viewer access is needed for the service account.',
  },
  {
    num: 3,
    title: 'Data Configuration',
    tagline: 'Shape your data before generating charts.',
    accent: C.teal,
    accentDark: [13, 148, 136] as RGB,
    steps: [
      {
        id: '3.1',
        title: 'Header Row Selection',
        bullets: [
          'If your file contains extra metadata rows above the real header, adjust the',
          '  Header Row Index setting to identify the correct row.',
          'The live preview table updates instantly as you change the setting.',
        ],
      },
      {
        id: '3.2',
        title: 'Column Type Review',
        bullets: [
          'AnalyticCore detects column types: TEXT, INTEGER, DECIMAL, CURRENCY, PERCENT, DATE, BOOLEAN.',
          'Columns with low detection confidence are highlighted for manual review.',
          'Click the type badge next to any column to override the detected type.',
          'Correct types ensure better aggregation and chart axis formatting.',
        ],
      },
      {
        id: '3.3',
        title: 'Joining Multiple Tables',
        bullets: [
          'Click Add Join to merge two imported tables on a shared key column.',
          'Select the left table, right table, and the matching key columns.',
          'Choose join type: INNER, LEFT, RIGHT, or FULL OUTER.',
          'Chain multiple joins by clicking Add Join again for each relationship.',
          'A live preview shows the merged result after each join is applied.',
        ],
      },
      {
        id: '3.4',
        title: 'Aggregated Columns',
        bullets: [
          'Create computed columns using SUM, COUNT, AVG, MIN, MAX, or DISTINCT.',
          'Click Add Aggregated Column, choose a source column and aggregation type.',
          'Assign a friendly label — this label appears as a selectable metric in charts.',
        ],
      },
      {
        id: '3.5',
        title: 'Filter Columns',
        bullets: [
          'Select which columns should appear in the dashboard filter sidebar.',
          'Categorical and text columns with distinct values work best as global filters.',
          'Numeric and date columns are filtered at the individual chart level.',
        ],
      },
    ],
    tip: 'TIP: Always verify column types before proceeding to avoid incorrect chart aggregations.',
  },
  {
    num: 4,
    title: 'AI Chart Builder',
    tagline: 'Build your dashboard layout using Gemini AI suggestions.',
    accent: C.purple,
    accentDark: [126, 34, 206] as RGB,
    steps: [
      {
        id: '4.1',
        title: 'AI Chart Suggestions',
        bullets: [
          'The left panel displays AI-generated chart suggestions tailored to your dataset.',
          'Each suggestion shows the chart type, metric, dimension, and a short insight.',
          'Click the + button on a suggestion card to add it to your dashboard bucket.',
          'Use the Re-Analyse button to refresh suggestions with updated criteria.',
        ],
      },
      {
        id: '4.2',
        title: 'Custom Chart Requests',
        bullets: [
          'Type a plain-language request in the input at the top of the workspace.',
          'Example: "Show total revenue by region as a horizontal bar chart."',
          'Voice input is also available — click the microphone icon to speak your request.',
          'The AI generates the chart and adds it to your selection automatically.',
        ],
      },
      {
        id: '4.3',
        title: 'Organising with Sections',
        bullets: [
          'Click Add Section to create a named group such as "Sales Overview" or "HR Metrics".',
          'Drag chart cards between sections to rearrange your dashboard layout.',
          'Rename any section by clicking directly on its title in the workspace.',
          'Each section becomes a separate tab in the final interactive dashboard.',
        ],
      },
      {
        id: '4.4',
        title: 'Customising Chart Cards',
        bullets: [
          'Each bucket card has colour controls accessible via the small icon buttons.',
          'Change the primary colour using the colour-picker dropdown on the card.',
          'Bar and line charts support a secondary colour for dual-metric visualisations.',
          'Toggle Multicolor to render each bar or segment in a distinct palette.',
          'Edit the chart title inline by clicking directly on the title text.',
        ],
      },
      {
        id: '4.5',
        title: 'Generating the Dashboard',
        bullets: [
          'When your chart selection is complete, click Generate Report (create mode)',
          '  or Save Updates (edit mode) in the top-right header.',
          'The fully interactive dashboard opens immediately with all your charts.',
        ],
      },
    ],
  },
  {
    num: 5,
    title: 'Interactive Dashboard',
    tagline: 'Explore, filter, and drill into your data in real time.',
    accent: C.emerald,
    accentDark: [4, 120, 87] as RGB,
    steps: [
      {
        id: '5.1',
        title: 'Supported Chart Types',
        bullets: [
          'BAR              - Vertical bar chart for category comparisons.',
          'HORIZONTAL BAR   - Better readability for long category labels.',
          'GROUPED BAR      - Compare multiple metrics side by side.',
          'STACKED BAR      - Show part-to-whole relationships within groups.',
          'LINE             - Trend over time or sequential categories.',
          'AREA             - Filled line chart for cumulative totals.',
          'COMBO            - Dual-axis bar and line for two concurrent metrics.',
          'PIE              - Proportional breakdown of a categorical field.',
          'SCATTER          - Bivariable correlation plots.',
          'WATERFALL        - Incremental gain and loss visualisations.',
          'HEATMAP          - Two-dimensional cross-column intensity grid.',
          'TABLE            - Paginated tabular data view.',
          'MATRIX           - Aggregated pivot-style cross-tab grid.',
          'KPI              - Single-value metric card with trend indicator.',
        ],
      },
      {
        id: '5.2',
        title: 'Global Filter Sidebar',
        bullets: [
          'The left sidebar contains filter controls for all filter-enabled columns.',
          'Expand a column section to see its distinct values as toggle options.',
          'Selecting a value highlights matching data across all charts simultaneously.',
          'Active filter tags appear at the top of the sidebar for quick reference.',
          'Click the X on any tag to clear that individual filter immediately.',
          'Collapse the sidebar with the arrow button to gain more chart area.',
        ],
      },
      {
        id: '5.3',
        title: 'Per-Chart Controls',
        bullets: [
          'Hover over any chart card to reveal its control bar in the top-right corner.',
          'Filter icon  - Add a column-value filter scoped to this chart only.',
          'Trend icon   - Set a Top N or Bottom N limit (e.g., Top 10 products).',
          'Rotate icon  - Toggle orientation between vertical and horizontal (Bar charts).',
          'Maximise icon - Open the chart in full-screen expand mode.',
          'These controls apply only to that individual chart, not the whole dashboard.',
        ],
      },
      {
        id: '5.4',
        title: 'Date Drill-Through',
        bullets: [
          'Charts with date-based x-axes support Power BI-style drill-through.',
          'Click a year bar to drill down into a monthly breakdown for that year.',
          'Click a month bar to drill further into daily granularity.',
          'A breadcrumb label shows the current drill level (Year / Month).',
          'Click Reset View to return to the top-level view at any time.',
        ],
      },
      {
        id: '5.5',
        title: 'Dashboard Tabs',
        bullets: [
          'If sections were created in the Chart Builder, they appear as tabs here.',
          'Click each tab to navigate between sections of your dashboard.',
          'Each section can contain its own set of KPI cards and chart visuals.',
        ],
      },
    ],
  },
  {
    num: 6,
    title: 'Saving and Managing',
    tagline: 'Save, reload, update, and delete your dashboards.',
    accent: C.amber,
    accentDark: [180, 83, 9] as RGB,
    steps: [
      {
        id: '6.1',
        title: 'Saving a Dashboard',
        bullets: [
          'Click the Save Dashboard button in the dashboard header bar.',
          'Enter a descriptive name such as "Q1 2025 Sales Report".',
          'All chart configurations, filters, colour settings, and sections are saved.',
          'Saved dashboards appear on the My Dashboards tab on the Home screen.',
        ],
      },
      {
        id: '6.2',
        title: 'Loading a Saved Dashboard',
        bullets: [
          'Switch to the My Dashboards tab on the Home screen.',
          'Click any dashboard card to fully restore it with its data and charts.',
        ],
      },
      {
        id: '6.3',
        title: 'Editing an Existing Dashboard',
        bullets: [
          'Open a saved dashboard, then click the Edit (pencil) icon in the header.',
          'This re-opens the Chart Builder so you can add, remove, or reorder charts.',
          'Click Save Updates when finished to persist your changes.',
        ],
      },
      {
        id: '6.4',
        title: 'Deleting a Dashboard',
        bullets: [
          'On the My Dashboards tab, click the trash icon on a saved dashboard card.',
          'Confirm deletion when prompted. This action cannot be undone.',
        ],
      },
      {
        id: '6.5',
        title: 'Live Data Refresh',
        bullets: [
          'Dashboards from Google Sheets, SharePoint, or SQL sources support live refresh.',
          'Click Refresh in the dashboard header to pull the latest data from the source.',
          'A refresh timer can be configured for automatic periodic updates.',
          'Data is updated in place — your chart configurations remain unchanged.',
        ],
      },
    ],
    tip: 'TIP: Save frequently when building complex dashboards to avoid losing progress.',
  },
  {
    num: 7,
    title: 'Exporting to PDF',
    tagline: 'Generate a polished, print-ready report with one click.',
    accent: C.rose,
    accentDark: [190, 18, 60] as RGB,
    steps: [
      {
        id: '7.1',
        title: 'Start the Export',
        bullets: [
          'Click the Export PDF button (printer icon) in the dashboard header bar.',
          'AnalyticCore renders all charts at high resolution for print-quality output.',
          'The export process may take a few seconds for dashboards with many charts.',
        ],
      },
      {
        id: '7.2',
        title: 'Export Layout and Contents',
        bullets: [
          'Each dashboard section becomes a labelled chapter in the PDF.',
          'Charts are arranged in a 2-column grid with consistent sizing.',
          'KPI metric cards appear at the top of the first page.',
          'Applied filters and section titles are preserved as context headings.',
          'Every page includes a header, page number, and footer with branding.',
        ],
      },
      {
        id: '7.3',
        title: 'Downloading the PDF',
        bullets: [
          'The PDF downloads automatically to your browser default download folder.',
          'The filename includes the dashboard name and the current date.',
          'Use your browser download panel to locate or rename the file after saving.',
        ],
      },
    ],
    tip: 'NOTE: Applying filters before export will reflect those filtered values in the PDF.',
  },
  {
    num: 8,
    title: 'Tips and Best Practices',
    tagline: 'Get the best results from AnalyticCore every time.',
    accent: C.green,
    accentDark: [21, 128, 61] as RGB,
    steps: [
      {
        id: '8.1',
        title: 'Data Quality Guidelines',
        bullets: [
          'Ensure the header row is on the first data row or set the header index correctly.',
          'Remove merged cells from Excel files before uploading — they cause parse errors.',
          'Use a consistent date format throughout each column, for example YYYY-MM-DD.',
          'Avoid mixing currency symbols and plain numbers within the same column.',
          'Remove summary or total rows from raw data before importing.',
        ],
      },
      {
        id: '8.2',
        title: 'Performance Guidelines',
        bullets: [
          'For datasets over 50,000 rows, use aggregated columns to pre-summarise data.',
          'Disable global filters on focused single-metric KPI dashboards.',
          'Use the Top N filter on high-cardinality dimensions to keep charts readable.',
          'Limit each section to six or fewer charts for optimal layout and performance.',
        ],
      },
      {
        id: '8.3',
        title: 'Dashboard Design Guidelines',
        bullets: [
          'Place KPI cards at the top of each section for fast executive summaries.',
          'Pair related charts side by side (e.g., a trend line with its KPI card).',
          'Use multicolor mode only for categories with distinct memorable names.',
          'Organise related metrics in their own named section for clarity.',
        ],
      },
      {
        id: '8.4',
        title: 'Google Sheets Sync Guidelines',
        bullets: [
          'Keep the service-account as Viewer only — read access is sufficient.',
          'Avoid renaming sheet tabs after connecting — reconnect if you rename them.',
          'Enable auto-refresh so KPIs stay current without manual intervention.',
          'Use a dedicated sheet tab for dashboard data, separate from raw inputs.',
        ],
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Professional logo — radial gradient disc + bar-chart icon + decorative ring
// ──────────────────────────────────────────────────────────────────────────────
function drawLogo(doc: jsPDF, cx: number, cy: number) {
  const maxR = 13;
  const outerC: RGB = [22, 14, 100];
  const innerC: RGB = [88,  92, 238];

  // 1. Drop shadow (dark offset disc)
  setFill(doc, [6, 4, 28] as RGB);
  doc.circle(cx + 1.5, cy + 1.8, maxR, 'F');

  // 2. Radial gradient disc — concentric circles from dark outer -> bright inner
  for (let r = maxR; r >= 0; r--) {
    const t = 1 - r / maxR;  // 0 at edge, 1 at centre
    const cr: RGB = [
      Math.round(outerC[0] + t * (innerC[0] - outerC[0])),
      Math.round(outerC[1] + t * (innerC[1] - outerC[1])),
      Math.round(outerC[2] + t * (innerC[2] - outerC[2])),
    ];
    setFill(doc, cr);
    doc.circle(cx, cy, r, 'F');
  }

  // 3. White accent ring — draw white disc then re-cover centre
  setFill(doc, C.white);
  doc.circle(cx, cy, 8.6, 'F');
  setFill(doc, innerC);
  doc.circle(cx, cy, 7.0, 'F');

  // 4. Subtle inner glow ring (semi-bright)
  setDraw(doc, [140, 150, 255] as RGB);
  doc.setLineWidth(0.2);
  doc.circle(cx, cy, 7.0, 'S');

  // 5. Bar chart icon (3 bars: short, tall, medium — growth pattern)
  const baseY = cy + 3.2;  // bottom anchor of bars
  const barsSpec = [
    { relX: -3.3, h: 2.5 },
    { relX: -0.9, h: 5.2 },
    { relX:  1.5, h: 3.8 },
  ];
  barsSpec.forEach(b => {
    setFill(doc, C.white);
    doc.rect(cx + b.relX, baseY - b.h, 1.6, b.h, 'F');
  });

  // 6. Upward trend line across bar tops (left-to-right rise)
  setDraw(doc, [190, 205, 255] as RGB);
  doc.setLineWidth(0.5);
  doc.line(cx - 2.5, cy + 0.7, cx + 3.1, cy - 1.8);

  // Filled dots at endpoints of trend line
  setFill(doc, C.white);
  doc.circle(cx - 2.5, cy + 0.7, 0.7, 'F');
  doc.circle(cx + 3.1, cy - 1.8, 0.7, 'F');

  // 7. Outer decorative stroke ring
  setDraw(doc, C.indigoL);
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, maxR + 2, 'S');

  // Small filled accent dots at cardinal positions on outer ring
  const dR = maxR + 2;
  const cardinals: [number, number][] = [
    [cx,      cy - dR],
    [cx + dR, cy     ],
    [cx,      cy + dR],
    [cx - dR, cy     ],
  ];
  cardinals.forEach(([dx, dy]) => {
    setFill(doc, C.indigoL);
    doc.circle(dx, dy, 1.1, 'F');
  });
}

/** 
 * Draw small geometric micro-icons for chips 
 * Using only basic ASCII/Helvetica isn't as good as geometric icons.
 */
function drawMiniIcon(doc: jsPDF, type: string, x: number, y: number, color: RGB) {
  setFill(doc, color);
  setDraw(doc, color);
  doc.setLineWidth(0.4);

  if (type === 'Data Import') {
    // Tray icon (U-shape + down arrow)
    doc.rect(x - 2, y + 0.5, 4, 1.5, 'F');      // Bottom
    doc.line(x, y - 1.5, x, y + 0.5);            // Arrow stem
    doc.line(x - 1, y - 0.5, x, y + 0.5);       // Arrow head L
    doc.line(x + 1, y - 0.5, x, y + 0.5);       // Arrow head R
  } else if (type === 'AI Charts') {
    // 4-point star (Diamond)
    doc.rect(x - 1.5, y - 1.5, 3, 3, 'F');
    doc.setLineWidth(0.6);
    doc.line(x, y - 2.5, x, y + 2.5);
    doc.line(x - 2.5, y, x + 2.5, y);
  } else if (type === 'Live Sync') {
    // Circular arrows (2 arcs)
    doc.setLineWidth(0.45);
    doc.circle(x, y, 1.8, 'S');
    fillRect(doc, x + 1.2, y - 1, 1.5, 1.5, color); // Point
  } else if (type === 'Smart Filters') {
    // Funnel
    doc.triangle(x - 2, y - 2, x + 2, y - 2, x, y + 1.2, 'F');
    fillRect(doc, x - 0.5, y + 1.2, 1, 1, color);
  } else if (type === 'Drill-Through') {
    // Hierarchy icon (3 dots connected)
    doc.circle(x, y - 1.5, 0.8, 'F');
    doc.circle(x - 1.5, y + 1.5, 0.8, 'F');
    doc.circle(x + 1.5, y + 1.5, 0.8, 'F');
    doc.setLineWidth(0.3);
    doc.line(x, y - 0.7, x - 1.5, y + 0.7);
    doc.line(x, y - 0.7, x + 1.5, y + 0.7);
  } else if (type === 'PDF Export') {
    // Page with corner fold icon
    doc.rect(x - 1.8, y - 2.2, 3.6, 4.4, 'S');
    doc.line(x + 0.5, y - 2.2, x + 1.8, y - 0.9);
    doc.line(x - 1, y, x + 1, y);
  } else {
    doc.circle(x, y, 1.5, 'F');
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Cover page
// ──────────────────────────────────────────────────────────────────────────────
function drawCover() {
  const doc = _doc;

  // Background
  fillRect(doc, 0, 0, PW, PH, C.darkBg);

  // Top gradient banner
  gradBar(doc, 0, 0, PW, 46, C.indigoD, C.violet);

  // ── Professional analytics logo ──
  drawLogo(doc, PW / 2, 23);

  // Product name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  setTxt(doc, C.textPrim);
  doc.text('AnalyticCore', PW / 2, 56, { align: 'center' }); // Adjusted Y

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  setTxt(doc, C.indigoL);
  doc.text('Official User Guide', PW / 2, 66, { align: 'center' }); // Adjusted Y

  // Thin gradient divider
  gradBar(doc, ML, 72, CW, 0.7, C.indigo, C.violet); // Adjusted Y

  // Version chip — full content width so text never overflows
  const vChipY = 76, vChipH = 9;
  filledRoundRect(doc, ML, vChipY, CW, vChipH, 2, C.darkCard);
  strokedRoundRect(doc, ML, vChipY, CW, vChipH, 2, C.indigo, 0.4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  setTxt(doc, C.indigoL);
  doc.text('Version 2.0   |   Powered by Gemini 2.0 Flash', PW / 2, vChipY + 6.2, { align: 'center' });

  // Description card — 36mm tall to comfortably hold 4 lines at 7.5pt
  const descCardY = 90;
  const descCardH = 36;
  filledRoundRect(doc, ML, descCardY, CW, descCardH, 3, C.darkCard);
  strokedRoundRect(doc, ML, descCardY, CW, descCardH, 3, C.darkLine, 0.3);
  filledRoundRect(doc, ML, descCardY, 2.5, descCardH, 1.5, C.indigo); // left accent bar

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setTxt(doc, C.textSec);
  const desc =
    'This guide covers every feature of AnalyticCore - from importing data and ' +
    'configuring your dataset to building AI-powered dashboards, applying interactive ' +
    'filters, and exporting professional PDF reports. Follow the numbered sections ' +
    'in order for the best learning experience.';
  const descLines = doc.splitTextToSize(desc, CW - 9);
  // Line height at 7.5pt ≈ 4.6mm; start 7mm below card top
  doc.text(descLines, ML + 6, descCardY + 8);

  // Feature chips (2 rows x 3 cols) — starts right after description card
  let chipY = descCardY + descCardH + 6;
  const features = [
    { label: 'Data Import',   sub: 'CSV, Excel, SQL, Sheets, SharePoint', c: C.blue    },
    { label: 'AI Charts',     sub: '14 chart types via Gemini AI',         c: C.purple  },
    { label: 'Live Sync',     sub: 'Real-time data source refresh',        c: C.teal    },
    { label: 'Smart Filters', sub: 'Global and per-chart filtering',        c: C.emerald },
    { label: 'Drill-Through', sub: 'Date hierarchy navigation',             c: C.amber   },
    { label: 'PDF Export',    sub: 'One-click print-ready reports',         c: C.rose    },
  ];
  const fChipW = (CW - 4) / 3;
  const fChipH = 15;
  const fGap = 2.5;
  features.forEach((f, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const fx = ML + col * (fChipW + fGap);
    const fy = chipY + row * (fChipH + fGap);
    filledRoundRect(doc, fx, fy, fChipW, fChipH, 2, C.darkCard);
    strokedRoundRect(doc, fx, fy, fChipW, fChipH, 2, f.c, 0.4);
    
    // Draw geometric micro-icon
    drawMiniIcon(doc, f.label, fx + 5, fy + 5.5, f.c);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setTxt(doc, C.textPrim);
    doc.text(f.label, fx + 9.5, fy + 6.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    setTxt(doc, C.textMut);
    const sub = doc.splitTextToSize(f.sub, fChipW - 11);
    doc.text(sub, fx + 9.5, fy + 11.5);
  });

  // Table of Contents — starts after chips (2 rows)
  const tocTop = chipY + (fChipH + fGap) * 2 + 8;
  gradBar(doc, ML, tocTop, CW, 0.6, C.indigo, C.violet);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setTxt(doc, C.indigoL);
  doc.text('TABLE OF CONTENTS', ML, tocTop + 6);

  const tocItems = SECTIONS.map(s => `${s.num}.  ${s.title}`);
  const colH = Math.ceil(tocItems.length / 2);
  const rowH = 6.5;
  tocItems.forEach((item, i) => {
    const col = Math.floor(i / colH);
    const row = i % colH;
    const tx = ML + col * (CW / 2);
    const ty = tocTop + 12 + row * rowH;
    setFill(doc, SECTIONS[i].accent);
    doc.circle(tx + 1.5, ty - 1.5, 1.1, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setTxt(doc, C.textSec);
    doc.text(item, tx + 5, ty);
  });

  // Footer — date + copyright pinned near bottom
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setTxt(doc, C.textMut);
  doc.text(`Generated: ${dateStr}`, PW / 2, 276.5, { align: 'center' });
  doc.text('(c) 2025 Vtab Square Technologies. All rights reserved.', PW / 2, 282.5, { align: 'center' });

  // Bottom accent bar
  gradBar(doc, 0, PH - 1.2, PW, 1.2, C.indigo, C.violet);
}

// ──────────────────────────────────────────────────────────────────────────────
// Section splash page
// ──────────────────────────────────────────────────────────────────────────────
function drawSectionSplash(sec: Section) {
  const doc = _doc;

  // Background
  fillRect(doc, 0, 0, PW, PH, C.darkBg);

  // Banner
  gradBar(doc, 0, 0, PW, 58, sec.accentDark, sec.accent);

  // Section number badge — pill shape, number centred precisely
  const badgeW = 14, badgeH = 10, badgeX = ML, badgeY = 19;
  filledRoundRect(doc, badgeX, badgeY, badgeW, badgeH, 3, C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setTxt(doc, sec.accent);
  // Vertical centre: badgeY + badgeH/2 + font_ascent(≈ size_mm * 0.35)
  doc.text(String(sec.num), badgeX + badgeW / 2, badgeY + badgeH / 2 + 2.2, { align: 'center' });

  // Section title — aligned vertically with badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setTxt(doc, C.white);
  doc.text(sec.title, ML + 18, 27);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setTxt(doc, [210, 220, 255] as RGB);
  doc.text(sec.tagline, ML + 18, 38);

  // Divider
  hLine(doc, ML + 24, 47, PW - MR, [255, 255, 255] as RGB, 0.25);

  // Section index (top-right corner)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setTxt(doc, [200, 210, 255] as RGB);
  doc.text(`SECTION ${sec.num} OF ${SECTIONS.length}`, PW - MR, 16, { align: 'right' });

  // Footer
  fillRect(doc, 0, PH - 11, PW, 11, C.darkCard);
  hLine(doc, 0, PH - 11, PW, C.darkLine, 0.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  setTxt(doc, C.textMut);
  doc.text('AnalyticCore  -  Official User Guide  -  Version 1.0', ML, PH - 4.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  setTxt(doc, C.indigoL);
  doc.text(`Page ${_page}`, PW - MR, PH - 4.8, { align: 'right' });

  _cursor = 66;
}

// ──────────────────────────────────────────────────────────────────────────────
// Step card
// ──────────────────────────────────────────────────────────────────────────────
function drawStep(sec: Section, step: Step) {
  const doc = _doc;

  // Estimate height: header ~12mm + bullets
  const bulletH = 6.5;
  const estH = 12 + step.bullets.length * bulletH + 6;
  ensureSpace(estH);

  // Step header background
  filledRoundRect(doc, ML, _cursor, CW, 11, 2, C.darkCard);
  // left accent bar
  filledRoundRect(doc, ML, _cursor, 3, 11, 1, sec.accent);

  // Step ID chip
  filledRoundRect(doc, ML + 6, _cursor + 2.5, 10, 6, 1.5, sec.accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setTxt(doc, C.white);
  doc.text(step.id, ML + 11, _cursor + 6.8, { align: 'center' });

  // Step title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  setTxt(doc, C.textPrim);
  doc.text(step.title, ML + 20, _cursor + 7.5);

  _cursor += 13;

  // Bullet lines
  step.bullets.forEach((bullet) => {
    ensureSpace(8);

    // Square bullet dot
    setFill(doc, sec.accent);
    doc.rect(ML + 4.5, _cursor - 1.5, 1.8, 1.8, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setTxt(doc, C.textSec);

    const maxW = CW - 12;
    const lines = doc.splitTextToSize(bullet, maxW);
    doc.text(lines, ML + 9, _cursor);
    _cursor += lines.length * 5.4 + 1.5;
  });

  _cursor += 5;
}

// ──────────────────────────────────────────────────────────────────────────────
// Tip / note callout
// ──────────────────────────────────────────────────────────────────────────────
function drawTipBox(text: string, accent: RGB, accentDark: RGB) {
  const doc = _doc;
  const maxW = CW - 14;
  const lines = doc.splitTextToSize(text, maxW);
  const boxH = lines.length * 5.2 + 10;
  ensureSpace(boxH + 4);

  // Background
  setFill(doc, accentDark);
  doc.setFillColor(
    Math.max(0, accentDark[0] - 20),
    Math.max(0, accentDark[1] - 20),
    Math.max(0, accentDark[2] - 20),
  );
  doc.roundedRect(ML, _cursor, CW, boxH, 2.5, 2.5, 'F');
  strokedRoundRect(doc, ML, _cursor, CW, boxH, 2.5, accent, 0.4);

  // Left bar
  filledRoundRect(doc, ML, _cursor, 3, boxH, 1, accent);

  // Label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setTxt(doc, accent);
  doc.text('NOTE', ML + 7, _cursor + 6);

  // Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  // light version of accent text
  setTxt(doc, [
    Math.min(255, accent[0] + 80),
    Math.min(255, accent[1] + 80),
    Math.min(255, accent[2] + 80),
  ] as RGB);
  doc.text(lines, ML + 7, _cursor + 12);

  _cursor += boxH + 6;
}

// ──────────────────────────────────────────────────────────────────────────────
// Back cover
// ──────────────────────────────────────────────────────────────────────────────
function drawBackCover() {
  const doc = _doc;

  fillRect(doc, 0, 0, PW, PH, C.darkBg);
  gradBar(doc, 0, 0, PW, 3, C.indigo, C.violet);
  gradBar(doc, 0, PH - 3, PW, 3, C.indigo, C.violet);

  // Large central professional emblem
  drawLogo(doc, PW / 2, PH / 2 - 20);
  
  // Outer glowing ring for back cover only
  setDraw(doc, C.indigoL);
  doc.setLineWidth(0.15);
  doc.circle(PW / 2, PH / 2 - 20, 24, 'S');
  doc.circle(PW / 2, PH / 2 - 20, 32, 'S');

  // Thank you text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setTxt(doc, C.textPrim);
  doc.text('Thank you for using AnalyticCore', PW / 2, PH / 2 + 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setTxt(doc, C.textSec);
  doc.text('Built with care by the VTAB Square Engineering Team', PW / 2, PH / 2 + 33, { align: 'center' });

  // Horizontal divider
  gradBar(doc, ML + 20, PH / 2 + 40, CW - 40, 0.6, C.indigo, C.violet);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setTxt(doc, C.textMut);
  doc.text(
    'For support, feature requests, or feedback, please contact your administrator.',
    PW / 2, PH / 2 + 52, { align: 'center' },
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setTxt(doc, C.textMut);
  doc.text('(c) 2025 Vtab Square Technologies. All rights reserved.', PW / 2, PH / 2 + 70, { align: 'center' });
  doc.text('AnalyticCore is a registered product of Vtab Square Technologies.', PW / 2, PH / 2 + 78, { align: 'center' });
}

// ──────────────────────────────────────────────────────────────────────────────
// Main entry point
// ──────────────────────────────────────────────────────────────────────────────
export function generatePDFGuide(): void {
  initDoc();
  const doc = _doc;

  // ── Cover page ──
  fillRect(doc, 0, 0, PW, PH, C.darkBg);
  drawCover();

  // ── Section pages ──
  SECTIONS.forEach((sec) => {
    // Section splash (always starts on a fresh page)
    addPage();
    drawSectionSplash(sec);

    // Steps
    sec.steps.forEach((step) => {
      drawStep(sec, step);
    });

    // Optional tip / note box
    if (sec.tip) {
      drawTipBox(sec.tip, sec.accent, sec.accentDark);
    }
  });

  // ── Back cover ──
  addPage();
  drawBackCover();

  // ── Download ──
  const today = new Date().toISOString().slice(0, 10);
  doc.save(`AnalyticCore_User_Guide_${today}.pdf`);
}
