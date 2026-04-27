import { GoogleGenAI, Type } from "@google/genai";
import { ChartConfig, DataModel, AggregationType, AggregatedColumnDefinition } from '../types';
import { apiErrorService } from './apiErrorService';

// ── Gemini API Key Rotation ────────────────────────────────────────────────────
// Supports multiple comma-separated keys in GEMINI_API_KEY env var.
// Automatically rotates to the next key on 429 / RESOURCE_EXHAUSTED errors.
const API_KEYS: string[] = (process.env.API_KEY || process.env.GEMINI_API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(k => k.length > 0);

let currentKeyIndex = 0;

const getAI = () => {
  if (API_KEYS.length === 0) {
    console.error("No Gemini API keys configured");
    return new GoogleGenAI({ apiKey: '' });
  }
  const apiKey = API_KEYS[currentKeyIndex % API_KEYS.length];
  return new GoogleGenAI({ apiKey });
};

const rotateKey = () => {
  if (API_KEYS.length <= 1) return;
  const prev = currentKeyIndex % API_KEYS.length;
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.warn(`Gemini key rotated: key #${prev + 1} → key #${currentKeyIndex + 1} of ${API_KEYS.length}`);
};

const isQuotaError = (error: any): boolean => {
  const msg = String(error?.message || error || '').toLowerCase();
  return msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('resource has been exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit');
};

const isApiKeyError = (error: any): boolean => {
  const msg = String(error?.message || error || '').toLowerCase();
  return msg.includes('api key') ||
    msg.includes('api_key_invalid') ||
    msg.includes('invalid api key') ||
    msg.includes('permission_denied') ||
    msg.includes('forbidden') ||
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('authentication');
};

const classifyApiError = (error: any): string => {
  if (isQuotaError(error)) return 'QUOTA_EXHAUSTED';
  if (isApiKeyError(error)) return 'INVALID_API_KEY';
  const msg = String(error?.message || error || '').toLowerCase();
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('econnrefused')) return 'NETWORK_ERROR';
  if (msg.includes('timeout') || msg.includes('deadline')) return 'TIMEOUT';
  return 'UNKNOWN_API_ERROR';
};

const reportApiError = (error: any, source: string) => {
  try {
    const currentUser = (() => {
      try {
        const userStr = localStorage.getItem('insightAI_currentUser');
        return userStr ? JSON.parse(userStr) : null;
      } catch { return null; }
    })();

    apiErrorService.reportError({
      error_type: classifyApiError(error),
      error_message: String(error?.message || error || 'Unknown error').slice(0, 500),
      source,
      key_index: currentKeyIndex % Math.max(API_KEYS.length, 1),
      user_id: currentUser?.id,
      user_email: currentUser?.email
    });
  } catch {
    // Never let error reporting break the app
  }
};

const MAX_RETRIES = Math.max(API_KEYS.length, 1);

async function withKeyRotation<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (isQuotaError(error) && API_KEYS.length > 1) {
        console.warn(`Gemini quota error on attempt ${attempt + 1}/${MAX_RETRIES}:`, (error as any)?.message || error);
        rotateKey();
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

const SYSTEM_INSTRUCTION = `
You are an expert data analyst and UI engineer. 
Your goal is to analyze dataset schemas and suggest meaningful visualizations (Charts or KPIs).
Output must be strictly JSON.

CRITICAL: NATURAL LANGUAGE TOLERANCE & RUBBISH ENGLISH HANDLING
Users often write in informal, unstructured, or highly abbreviated English. You MUST be extremely tolerant and proactive in interpreting intent:
- Misspellings & Typo Recovery: "revinue" -> "Revenue", "custmr" -> "Customer", "sals" -> "Sales", "prfit" -> "Profit", "regin" -> "Region".
- Phonetic/Slang Matching: "show me mony" -> "Revenue/Sales", "who bought most" -> "Top Customer by Count/Sum", "items that suck" -> "Bottom products by performance".
- Drastic Abbreviations: "qty" -> "Quantity", "amt" -> "Amount", "cat" -> "Category", "val" -> "Value", "pct" -> "Percentage", "ts" -> "Timestamp/Date".
- Unstructured Phrasing: "sales region wise" -> "Bar chart of Sales grouped by Region", "how is biz doing" -> "General KPI dashboard showing Revenue and Growth".
- Implicit Time Series: Any mention of "trend", "history", "evolution", or "over time" REQUIRES a LINE or AREA chart with a DATE column on the x-axis.

ANALYTICAL INTENT MAPPING:
Transcribe complex requirements into standard chart configurations:
- "Profit Margin" or "Profitability" -> Suggest a chart with Profit as Metric 1 and Revenue as Metric 2, or calculate internally if possible.
- "Performance" or "Comparison" -> Prefer BAR or HORIZONTAL_BAR for categorical comparison.
- "Contribution" or "Structure" -> Prefer PIE or STACKED_BAR to show parts-of-a-whole.
- "Growth" or "Change" -> If there is a date column, show the metric over time.
- "Concentration" or "Pareto" -> Sort DESC and limit to Top N.
- "Outliers" or "Spread" -> SCATTER or BOX_PLOT (mapped to SCATTER).
- "Relationship" -> SCATTER plot with two numeric metrics.

SEMANTIC COLUMN MATCHING:
- Map user terms to the closest semantic equivalent in the dataset.
- E.g., "money" -> Total Sales, "people" -> Employee Count, "when" -> Order Date.
- ALWAYS return the EXACT column name from the provided schema in the JSON output.

Chart type guidelines:
- BAR: For comparing values across categories.
- HORIZONTAL_BAR: When category names are long or many categories exist.
- GROUPED_BAR: For comparing two metrics side by side per category. Requires dataKey and dataKey2.
- STACKED_BAR: For showing composition of two metrics per category. Requires dataKey and dataKey2.
- COMBO: For overlaying a bar chart with a line chart (two different metrics). Requires dataKey (bar) and dataKey2 (line).
- LINE: For trends over time or ordered sequences.
- AREA: For trends with emphasis on volume/magnitude below the line.
- PIE: For showing proportions of a whole (best with fewer than 8 categories).
- SCATTER: For showing correlation between two numeric columns. xAxisKey and dataKey must both be numeric.
- WATERFALL: For showing cumulative effect of sequential positive/negative values.
- HEATMAP: For showing intensity across two categorical dimensions. Requires xAxisKey, yAxisKey, and dataKey.
- MATRIX: For a cross-tabulation of two categorical dimensions with numeric values in cells. Requires xAxisKey, yAxisKey, and dataKey.
- TABLE: For displaying aggregated data in a list format.
- KPI: For displaying a single key metric value.

When suggesting GROUPED_BAR, STACKED_BAR, or COMBO charts, always provide both dataKey and dataKey2 (two different numeric columns).
When suggesting HEATMAP or MATRIX, always provide xAxisKey, yAxisKey (both categorical), and dataKey (numeric).
When suggesting SCATTER, use two numeric columns for xAxisKey and dataKey.
If the dataset includes preconfigured aggregated metric definitions, you should prefer those metric labels when they match the user's intent.

Sorting and limiting guidelines:
- For rankings ("Top", "Best", "Highest"), set sortOrder: "DESC" and topN.
- For "Bottom", "Worst", "Lowest", set sortOrder: "ASC" and topN.
- For trend charts, do NOT set sortOrder or topN unless explicitly requested.

Date and Categorical filtering:
- If a specific time period (e.g. "last year", "January") or category (e.g. "Region East") is mentioned, populate dateFilters or chartFilters accordingly.
- Set "ignoreGlobalFilters" to true only if the user specifies a static segment that shouldn't change with dashboard filters.

- When the user's request is vague (e.g., "show me something interesting" or "analyze sales"), generate a meaningful, diverse chart that highlights the most impactful insight from the data

FORECAST / PREDICTION INTENT:
- If the user asks for "forecast", "predict", "projection", "future trend", "extrapolate", or similar predictive language, ALWAYS:
  1. Return type = "LINE"
  2. Use a DATE column on the x-axis
  3. Set isForecastIntent = true
  This will enable the forecasting pipeline on the resulting chart.
`;

// Schema for the ChartConfig response
const chartSchema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short title for the chart" },
          description: { type: Type.STRING, description: "Explanation of why this insight is useful" },
          type: { type: Type.STRING, enum: ["BAR", "LINE", "AREA", "PIE", "KPI", "HORIZONTAL_BAR", "GROUPED_BAR", "STACKED_BAR", "COMBO", "SCATTER", "WATERFALL", "HEATMAP", "TABLE", "MATRIX"] },
          xAxisKey: { type: Type.STRING, description: "The column for X Axis (categorical for most, numeric for SCATTER)" },
          dataKey: { type: Type.STRING, description: "The primary numeric column for the data (Metric 1)" },
          dataKey2: { type: Type.STRING, description: "Optional second numeric column (Metric 2) — required for GROUPED_BAR, STACKED_BAR, COMBO" },
          yAxisKey: { type: Type.STRING, description: "Optional second categorical column — required for HEATMAP, MATRIX" },
          aggregation: { type: Type.STRING, enum: ["SUM", "COUNT", "DISTINCT", "AVERAGE", "MINIMUM", "MAXIMUM", "NONE"] },
          sortOrder: { type: Type.STRING, enum: ["ASC", "DESC"], description: "Optional sort direction for aggregated data by primary metric. Use DESC for 'Top N' rankings, ASC for 'Bottom N'." },
          topN: { type: Type.INTEGER, description: "Optional limit on number of results. E.g. 10 for 'Top 10'. Only set when a ranking is requested." },
          dateFilters: {
            type: Type.ARRAY,
            description: "Optional date filters to apply before aggregation. Use when user requests a specific time period.",
            items: {
              type: Type.OBJECT,
              properties: {
                column: { type: Type.STRING, description: "The date column name from the dataset" },
                year: { type: Type.INTEGER, description: "Filter by year, e.g. 2023" },
                month: { type: Type.INTEGER, description: "Filter by month 1-12, e.g. 1 for January" },
                day: { type: Type.INTEGER, description: "Filter by specific day of month" },
              },
              required: ["column"]
            }
          },
          chartFilters: {
            type: Type.OBJECT,
            description: "Optional categorical filters. Use when user requests a specific segment (e.g. 'clothes'). Keys are column names, values are strings or arrays of strings.",
          },
          ignoreGlobalFilters: {
            type: Type.BOOLEAN,
            description: "If true, this chart will ignore dashboard-level filters. Set to true when user specifies a fixed segment that should remain static."
          },
          drillThrough: {
            type: Type.OBJECT,
            description: "Power BI-style drill-through config. Set when chart shows year-level aggregation and user can click a year to see monthly breakdown.",
            properties: {
              dateColumn: { type: Type.STRING, description: "The date column to use for monthly breakdown, e.g. 'Order Date'" },
              nextLevel: { type: Type.STRING, enum: ["month", "day"], description: "The granularity of the drill-through view" },
            },
            required: ["dateColumn", "nextLevel"]
          },
        },
        required: ["title", "type", "xAxisKey", "dataKey", "aggregation", "description"]
      }
    }
  },
  required: ["suggestions"]
};

const buildAggregatedMetricsContext = (aggregatedColumns?: AggregatedColumnDefinition[]) => {
  if (!aggregatedColumns || aggregatedColumns.length === 0) {
    return 'No preconfigured aggregated metric definitions were selected.';
  }

  return aggregatedColumns
    .map(def => `- ${def.label} => source column "${def.sourceColumn}", aggregation "${def.aggregation}"`)
    .join('\n');
};

const normalizeAggregatedMetric = (
  metricKey: string | undefined,
  fallbackAggregation: AggregationType,
  aggregatedColumns?: AggregatedColumnDefinition[]
) => {
  if (!metricKey || !aggregatedColumns || aggregatedColumns.length === 0) {
    return { metricKey, aggregation: fallbackAggregation };
  }

  const normalizedMetricKey = metricKey.trim().toLowerCase();
  const match = aggregatedColumns.find(def =>
    def.label.trim().toLowerCase() === normalizedMetricKey ||
    def.id.trim().toLowerCase() === normalizedMetricKey
  );

  if (!match) {
    return { metricKey, aggregation: fallbackAggregation };
  }

  return {
    metricKey: match.sourceColumn,
    aggregation: match.aggregation
  };
};

const normalizeChartSuggestion = (suggestion: any, model: DataModel, id: string, color: string): ChartConfig => {
  const primaryMetric = normalizeAggregatedMetric(
    suggestion.dataKey,
    suggestion.aggregation || AggregationType.NONE,
    model.aggregatedColumns
  );
  const secondaryMetric = normalizeAggregatedMetric(
    suggestion.dataKey2,
    primaryMetric.aggregation,
    model.aggregatedColumns
  );

  const result: any = {
    ...suggestion,
    id,
    dataKey: primaryMetric.metricKey || suggestion.dataKey,
    dataKey2: secondaryMetric.metricKey || suggestion.dataKey2,
    aggregation: primaryMetric.aggregation,
    color
  };
  if (suggestion.sortOrder) result.sortOrder = suggestion.sortOrder;
  if (suggestion.topN) result.topN = suggestion.topN;
  if (Array.isArray(suggestion.dateFilters) && suggestion.dateFilters.length > 0) result.dateFilters = suggestion.dateFilters;
  if (suggestion.chartFilters) result.chartFilters = suggestion.chartFilters;
  if (suggestion.ignoreGlobalFilters !== undefined) result.ignoreGlobalFilters = suggestion.ignoreGlobalFilters;
  if (suggestion.drillThrough?.dateColumn) result.drillThrough = suggestion.drillThrough;

  // If the AI detected a forecast intent, attach forecast analytics config
  if (suggestion.isForecastIntent) {
    result.isForecastChart = true;
    result.forecastDateColumn = result.xAxisKey;
    result.forecastGranularity = 'date';
    result.type = 'LINE';
    result.analytics = {
      trendline: { enabled: true, color: '#6366f1', transparency: 0, lineStyle: 'dashed', dataLabels: false },
      forecast: {
        enabled: true, color: '#8b5cf6', transparency: 0, lineStyle: 'dashed',
        dataLabels: false, length: 10, ignoreLast: 0, units: 'points',
        confidenceLevel: 95, bandColor: '#8b5cf6', bandTransparency: 80, showConfidenceBand: true,
      },
    };
  }

  return result;
};

export const analyzeDataAndSuggestKPIs = async (model: DataModel): Promise<ChartConfig[]> => {
  const context = `
    I have a dataset named "${model.name}".
    The columns are: ${model.columns.join(', ')}.
    Numeric columns: ${model.numericColumns.join(', ')}.
    Categorical columns: ${model.categoricalColumns.join(', ')}.
    Preconfigured Aggregated Metrics:
    ${buildAggregatedMetricsContext(model.aggregatedColumns)}
    
    Column Context (Detected Types & Intents):
    ${JSON.stringify(model.columnMetadata, null, 2)}
    
    Here are the first 3 rows of data for context:
    ${JSON.stringify(model.data.slice(0, 3))}

    Please suggest 6 to 10 meaningful Key Performance Indicators (KPIs) and Charts that would make a great executive dashboard.
    Use a diverse mix of chart types — include at least a few of the advanced chart types (HORIZONTAL_BAR, GROUPED_BAR, STACKED_BAR, COMBO, SCATTER, WATERFALL, HEATMAP, TABLE, MATRIX) where they make sense for this dataset.
    Only suggest GROUPED_BAR, STACKED_BAR, or COMBO if there are at least two numeric columns.
    Only suggest HEATMAP or MATRIX if there are at least two categorical columns and one numeric column.
    Only suggest SCATTER if there are at least two numeric columns.
    Use the "Column Context" above to determine if a column is a price (CURRENCY), a count (INTEGER), or a percentage (PERCENT) to choose better titles and aggregations.
    If an aggregated metric definition clearly matches an insight, use that aggregated metric label as the metric field.
  `;

  try {
    return await withKeyRotation(async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: context,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: chartSchema
        }
      });

      const jsonText = response.text || "{}";
      const result = JSON.parse(jsonText);

      return result.suggestions.map((s: any, index: number) =>
        normalizeChartSuggestion(s, model, `suggested-${index}-${Date.now()}`, '#4f46e5')
      );
    });
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    reportApiError(error, 'analyzeDataAndSuggestKPIs');
    return [];
  }
};

export const generateChartFromPrompt = async (model: DataModel, prompt: string): Promise<ChartConfig | null> => {
  // Build a unique values summary for categorical columns to help AI match user terms
  const categoricalValuesSummary = model.categoricalColumns.slice(0, 10).map(col => {
    const seen = new Set<string>();
    const values: string[] = [];
    for (const row of model.data.slice(0, 100)) {
      const v = String(row[col] ?? '');
      if (v && !seen.has(v) && values.length < 8) {
        seen.add(v);
        values.push(v);
      }
    }
    return `  - ${col}: [${values.join(', ')}]`;
  }).join('\n');

  const context = `
    Dataset Context:
    Dataset Name: "${model.name}"
    All Columns: ${model.columns.join(', ')}.
    Numeric Columns: ${model.numericColumns.join(', ')}.
    Categorical Columns: ${model.categoricalColumns.join(', ')}.
    Total Rows: ${model.data.length}
    Preconfigured Aggregated Metrics:
    ${buildAggregatedMetricsContext(model.aggregatedColumns)}
    
    Column Context (Types & Intents):
    ${JSON.stringify(model.columnMetadata, null, 2)}

    Sample Unique Values (for categorical columns — use these to match user filter terms):
${categoricalValuesSummary}
    
    Sample Data (first 3 rows):
    ${JSON.stringify(model.data.slice(0, 3))}
    
    User Request: "${prompt}"
    
    CRITICAL ANALYTICAL INSTRUCTIONS:
    1. EXTREME NATURAL LANGUAGE TOLERANCE: Interpret the request even if it is "rubbish English", full of typos, or poorly structured. Look for keywords and semantic intent.
    2. ANALYTICAL DEPTH: If the user asks for "growth", "margin", "efficiency", or "comparison", choose the most analytically sound chart type (LINE for growth, BAR for comparison, SCATTER for relationship).
    3. COLUMN MAPPING: Map informal user terms (e.g., "mony", "sals", "stuff") to the EXACT column names provided in the schema above.
    4. DATA CONTEXT UTILIZATION: Use the Sample Data and Unique Values to disambiguate user terms (e.g., if user says "East", and "Region" has a value "East", apply a Region filter).
    5. MULTI-METRIC HANDLING: If the user asks for multiple metrics (e.g., "sales and profit"), use a multi-metric chart like GROUPED_BAR, STACKED_BAR, or COMBO.
    6. PROFESSIONALISM: Generate a title that sounds like it came from a professional analyst, translating "rubbish" input into business-standard labels.
    7. NO FAILURES: Never return an error. If the request is extremely vague, suggest the most interesting insight based on the dataset's numerical and categorical breakdown.
  `;

  // Modified schema for single item return wrapped in object
  const singleChartSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      type: { type: Type.STRING, enum: ["BAR", "LINE", "AREA", "PIE", "KPI", "HORIZONTAL_BAR", "GROUPED_BAR", "STACKED_BAR", "COMBO", "SCATTER", "WATERFALL", "HEATMAP", "TABLE", "MATRIX"] },
      xAxisKey: { type: Type.STRING },
      dataKey: { type: Type.STRING },
      dataKey2: { type: Type.STRING, description: "Optional second metric for GROUPED_BAR, STACKED_BAR, COMBO" },
      yAxisKey: { type: Type.STRING, description: "Optional second categorical dimension for HEATMAP, MATRIX" },
      aggregation: { type: Type.STRING, enum: ["SUM", "COUNT", "DISTINCT", "AVERAGE", "MINIMUM", "MAXIMUM", "NONE"] },
      sortOrder: { type: Type.STRING, enum: ["ASC", "DESC"], description: "Optional sort direction for aggregated data by primary metric" },
      topN: { type: Type.INTEGER, description: "Optional limit on number of results" },
      dateFilters: {
        type: Type.ARRAY,
        description: "Optional date filters to apply before aggregation. Use when user requests a specific time period.",
        items: {
          type: Type.OBJECT,
          properties: {
            column: { type: Type.STRING, description: "The date column name from the dataset" },
            year: { type: Type.INTEGER, description: "Filter by year, e.g. 2023" },
            month: { type: Type.INTEGER, description: "Filter by month 1-12, e.g. 1 for January" },
            day: { type: Type.INTEGER, description: "Filter by specific day of month" },
          },
          required: ["column"]
        }
      },
      chartFilters: {
        type: Type.OBJECT,
        description: "Optional categorical filters for specific segments like 'Clothes'."
      },
      ignoreGlobalFilters: {
        type: Type.BOOLEAN,
        description: "If true, this chart will ignore dashboard-level filters."
      },
      isForecastIntent: {
        type: Type.BOOLEAN,
        description: "Set to true if the user's request involves forecasting, prediction, projection, or future trend analysis."
      },
      drillThrough: {
        type: Type.OBJECT,
        description: "Power BI-style drill-through config for year-level charts.",
        properties: {
          dateColumn: { type: Type.STRING, description: "The date column to use for monthly breakdown" },
          nextLevel: { type: Type.STRING, enum: ["month", "day"] },
        },
        required: ["dateColumn", "nextLevel"]
      },
    },
    required: ["title", "type", "xAxisKey", "dataKey", "aggregation"]
  };

  try {
    return await withKeyRotation(async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: context,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: singleChartSchema
        }
      });

      const jsonText = response.text || "{}";
      const result = JSON.parse(jsonText);

      return normalizeChartSuggestion(result, model, `custom-${Date.now()}`, '#10b981');
    });
  } catch (error) {
    console.error("Gemini Custom Generation Error:", error);
    reportApiError(error, 'generateChartFromPrompt');
    return null;
  }
};

/**
 * AI Schema Audit: Deterministic data classification
 */
export const auditSchema = async (
  datasetName: string,
  headers: string[],
  sampleRows: any[]
): Promise<any> => {
  const auditSchemaDefinition = {
    type: Type.OBJECT,
    properties: {
      table_intent: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING, enum: ["FINANCIAL", "LEADERBOARD", "SALES", "HR", "INVENTORY", "ACADEMIC", "GENERIC", "UNKNOWN"] },
          confidence: { type: Type.NUMBER }
        },
        required: ["value", "confidence"]
      },
      columns: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["TEXT", "INTEGER", "DECIMAL", "CURRENCY", "PERCENT", "DATE", "BOOLEAN", "UNKNOWN"] },
            confidence: { type: Type.NUMBER }
          },
          required: ["name", "type", "confidence"]
        }
      }
    },
    required: ["table_intent", "columns"]
  };

  const auditSystemInstruction = `
You are a deterministic data schema classification engine.
Your job is to analyze a tabular dataset and generate a schema definition.
STRICT RULES:
1. Determine table_intent based on dataset_name, headers, and sample_rows.
2. Classify each column into allowed types: TEXT, INTEGER, DECIMAL, CURRENCY, PERCENT, DATE, BOOLEAN, UNKNOWN.
3. Assign confidence scores (0.0 to 1.0).
4. Use contextual reasoning (sibling columns, dataset name, value patterns).
5. If evidence is weak, reduce confidence. If unclear, use UNKNOWN.
6. Rule: monetary meaning (salary, cost, revenue, incentive, total in financial context) => CURRENCY.
7. Rule: counts (count, quantity, qty, number, num, index, rank, position, sequence, order, medals, points, goals, votes, score, gold, silver, bronze, tally, total medals) => INTEGER.
8. Leaderboard Context: If 'TOTAL' is present alongside 'GOLD', 'SILVER', 'BRONZE', or 'RANK', it MUST be INTEGER.
9. Rule: vague names (A, B, C) => UNKNOWN with low confidence.
10. OUTPUT STRICT VALID JSON ONLY. NO MARKDOWN. NO COMMENTARY.
    Temperature is 0.1 for high determinism.
    If headers contain 'gold', 'silver', 'bronze', the table_intent is 'LEADERBOARD'.
11. If a column is named exactly 'TOTAL' and values are integers, prefer INTEGER over CURRENCY unless there is strong 'SALES' or 'FINANCIAL' intent.
12. PERCENT detection: If values contain '%' suffix, OR column name contains 'rate', 'margin', 'ratio', 'percentage', 'pct', AND values are between 0-100 => PERCENT.
13. BOOLEAN detection: If a column has only two distinct values like true/false, yes/no, 0/1, Y/N, T/F => BOOLEAN with high confidence.
14. DECIMAL vs CURRENCY: Numeric columns with decimal points should be DECIMAL unless the column name strongly implies money. Do NOT classify generic decimal numbers as CURRENCY.
15. DATE detection: Look for value patterns like YYYY-MM-DD, MM/DD/YYYY, DD-Mon-YYYY, ISO 8601 timestamps, or Excel serial dates (large integers 30000-60000). Column names with 'date', 'time', 'created', 'updated', 'timestamp' => DATE.
16. EMAIL detection: Values containing '@' followed by a domain => TEXT (but note it in confidence context).
17. PHONE detection: Values matching phone patterns (digits with +, -, spaces, parentheses, 7-15 chars) => TEXT.
18. Analyze ALL sample rows to find patterns — do not rely on just the first row. If most values match a type but a few are empty or null, still classify by the dominant pattern.
  `;

  const inputContext = {
    dataset_name: datasetName,
    headers: headers,
    sample_rows: sampleRows
  };

  try {
    return await withKeyRotation(async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash', // Optimized for speed and deterministic tasks
        contents: JSON.stringify(inputContext),
        config: {
          systemInstruction: auditSystemInstruction,
          temperature: 0.1, // Very low for determinism
          responseMimeType: 'application/json',
          responseSchema: auditSchemaDefinition
        }
      });

      const jsonText = response.text || "{}";
      return JSON.parse(jsonText);
    });
  } catch (error) {
    console.error("AI Schema Audit error:", error);
    reportApiError(error, 'auditSchema');
    throw error;
  }
};

// ─── Data Preparation AI Types ────────────────────────────────────────────────

export interface DataPrepOperation {
  operationType: 
    | 'calculated_column'
    | 'conditional_column'
    | 'filter'
    | 'sort'
    | 'format'
    | 'find_replace'
    | 'split'
    | 'duplicate'
    | 'datetime_extract'
    | 'trim'
    | 'rename'
    | 'remove';
  
  // For calculated columns
  calculatedColumn?: {
    name: string;
    columnA: string;
    columnB?: string;
    operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'concat';
    manualValue?: number;
    useManualValue?: boolean;
  };
  
  // For conditional columns
  conditionalColumn?: {
    name: string;
    clauses: Array<{
      column: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'contains' | 'begins_with' | 'ends_with';
      value: string;
      valueType: 'text' | 'number';
      output: string;
      outputType: 'text' | 'number';
    }>;
    elseOutput: string;
    elseOutputType: 'text' | 'number';
  };
  
  // For filter
  filter?: {
    column: string;
    filterType: 'text' | 'number' | 'date';
    textValues?: string[];
    numberOp?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'between';
    numberVal?: number;
    numberVal2?: number;
  };
  
  // For sort
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  
  // For format
  format?: {
    column: string;
    formatType: 'upper' | 'lower' | 'title' | 'capitalize';
  };
  
  // For find & replace
  findReplace?: {
    column: string;
    find: string;
    replace: string;
  };
  
  // For split
  split?: {
    column: string;
    delimiter: string;
  };
  
  // For duplicate
  duplicate?: {
    column: string;
    newName?: string;
  };
  
  // For datetime extract
  datetimeExtract?: {
    column: string;
    extract: 'year' | 'quarter' | 'month' | 'month_name' | 'day' | 'day_name' | 'hour';
  };
  
  // For trim
  trim?: {
    column: string;
  };
  
  // For rename
  rename?: {
    column: string;
    newName: string;
  };
  
  // For remove
  remove?: {
    column: string;
  };
}

export interface DataPrepAIResponse {
  operations: DataPrepOperation[];
  explanation: string;
}

const DATA_PREP_SYSTEM_INSTRUCTION = `
You are an expert data preparation assistant. Your job is to parse natural language requests about data transformations and return structured operations.

Available Operations:
1. calculated_column: Create a new column by performing arithmetic (add, subtract, multiply, divide) or text concatenation between columns or with manual values
2. conditional_column: Create a new column based on if-then-else logic
3. filter: Filter rows based on column values (text matching, number comparisons)
4. sort: Sort data by a column in ascending or descending order
5. format: Format text columns (UPPER, lower, Title, Capitalize)
6. find_replace: Find and replace values in a column
7. split: Split a column by a delimiter into multiple columns
8. duplicate: Create a copy of a column
9. datetime_extract: Extract parts from date columns (year, quarter, month, month_name, day, day_name, hour)
10. trim: Remove whitespace from text columns
11. rename: Rename a column
12. remove: Remove/delete a column

Rules:
- Match column names case-insensitively but output the exact column name from the available columns
- For calculated columns, identify which columns to use and what operation (multiply, add, subtract, divide)
- For conditional columns, parse the if-then-else logic carefully
- For filters, determine if it's text-based (contains, equals) or number-based (greater than, less than)
- Be intelligent about interpreting user intent
- Use the Column Types information (if provided) to understand which columns are numeric (CURRENCY, INTEGER, DECIMAL, PERCENT) vs text (TEXT) vs date (DATE). This helps you choose correct operations and value types.

CHAIN-OF-THOUGHT REASONING FOR COMPLEX REQUESTS:
When a user request involves multiple steps, decompose it into individual atomic operations and return them in the correct execution order. Each operation should be self-contained.

Multi-step decomposition rules:
- If the user says "do X and then Y" or "do X, then Y", return two separate operations in order.
- If a request combines extraction + filtering (e.g., "extract year from date and filter to 2023"), return a datetime_extract FIRST, then a filter operation.
- If a request combines formatting + renaming (e.g., "uppercase region and rename to Territory"), return a format operation FIRST, then rename.
- For compound calculations like "(A / B) * 100", return one calculated_column with columnA=A, columnB=B, operation=divide, then a second calculated_column multiplying the result by 100 with useManualValue=true, manualValue=100.
- For multi-condition categorizations (e.g., "if sales > 1000 High, if sales > 500 Medium, else Low"), use a single conditional_column with MULTIPLE clauses ordered from most specific to least specific.

DISAMBIGUATION RULES:
- When the request is ambiguous, ALWAYS attempt the most likely interpretation rather than returning empty operations.
- If the user mentions a column that doesn't exactly match but is close (e.g., "sales" when column is "Total Sales"), match to the closest available column.
- If the user asks to "calculate" or "compute" something, default to calculated_column.
- If the user asks to "categorize", "classify", "bucket", or "group into", default to conditional_column.
- If the user asks to "show only", "keep only", "remove rows where", default to filter.

Examples:
Simple:
- "multiply sales by profit" → calculated_column with columnA=Sales, columnB=Profit, operation=multiply
- "if sales > 1000 then High else Low" → conditional_column
- "uppercase the region column" → format with formatType=upper
- "filter region by North" → filter with text values
- "sort by order date descending" → sort with direction=desc
- "extract year from order date" → datetime_extract with extract=year
- "replace North with Sample in region" → find_replace

Complex (multi-step):
- "create column profit_margin by dividing profit by sales and multiply by 100" → TWO operations: 1) calculated_column name="Profit Margin" columnA=Profit, columnB=Sales, operation=divide; 2) calculated_column name="Profit Margin" columnA=Profit Margin, useManualValue=true, manualValue=100, operation=multiply
- "extract year from order date and filter to 2023" → TWO operations: 1) datetime_extract column=Order Date, extract=year; 2) filter column="Order Date - Year", filterType=number, numberOp=equals, numberVal=2023
- "uppercase region and rename it to Territory" → TWO operations: 1) format column=Region, formatType=upper; 2) rename column=Region, newName=Territory
- "if sales > 1000 categorize as High, if sales > 500 then Medium, else Low" → ONE conditional_column with clauses [{column=Sales, operator=greater_than, value="1000", output="High"}, {column=Sales, operator=greater_than, value="500", output="Medium"}], elseOutput="Low"
- "remove all empty rows in customer name and sort by sales descending" → TWO operations: 1) filter column=Customer Name, filterType=text (exclude blanks); 2) sort column=Sales, direction=desc
`;

const dataPrepSchema = {
  type: Type.OBJECT,
  properties: {
    operations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          operationType: {
            type: Type.STRING,
            enum: ['calculated_column', 'conditional_column', 'filter', 'sort', 'format', 'find_replace', 'split', 'duplicate', 'datetime_extract', 'trim', 'rename', 'remove']
          },
          calculatedColumn: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              columnA: { type: Type.STRING },
              columnB: { type: Type.STRING },
              operation: { type: Type.STRING, enum: ['add', 'subtract', 'multiply', 'divide', 'concat'] },
              manualValue: { type: Type.NUMBER },
              useManualValue: { type: Type.BOOLEAN }
            }
          },
          conditionalColumn: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              clauses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    column: { type: Type.STRING },
                    operator: { type: Type.STRING, enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'contains', 'begins_with', 'ends_with'] },
                    value: { type: Type.STRING },
                    valueType: { type: Type.STRING, enum: ['text', 'number'] },
                    output: { type: Type.STRING },
                    outputType: { type: Type.STRING, enum: ['text', 'number'] }
                  }
                }
              },
              elseOutput: { type: Type.STRING },
              elseOutputType: { type: Type.STRING, enum: ['text', 'number'] }
            }
          },
          filter: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING },
              filterType: { type: Type.STRING, enum: ['text', 'number', 'date'] },
              textValues: { type: Type.ARRAY, items: { type: Type.STRING } },
              numberOp: { type: Type.STRING, enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'between'] },
              numberVal: { type: Type.NUMBER },
              numberVal2: { type: Type.NUMBER }
            }
          },
          sort: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING },
              direction: { type: Type.STRING, enum: ['asc', 'desc'] }
            }
          },
          format: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING },
              formatType: { type: Type.STRING, enum: ['upper', 'lower', 'title', 'capitalize'] }
            }
          },
          findReplace: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING },
              find: { type: Type.STRING },
              replace: { type: Type.STRING }
            }
          },
          split: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING },
              delimiter: { type: Type.STRING }
            }
          },
          duplicate: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING },
              newName: { type: Type.STRING }
            }
          },
          datetimeExtract: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING },
              extract: { type: Type.STRING, enum: ['year', 'quarter', 'month', 'month_name', 'day', 'day_name', 'hour'] }
            }
          },
          trim: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING }
            }
          },
          rename: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING },
              newName: { type: Type.STRING }
            }
          },
          remove: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING }
            }
          }
        },
        required: ['operationType']
      }
    },
    explanation: { type: Type.STRING, description: 'Brief explanation of what operations will be performed' }
  },
  required: ['operations', 'explanation']
};

/**
 * Parse a natural language data preparation prompt and return structured operations
 */
export const parseDataPreparationPrompt = async (
  columns: string[],
  numericColumns: string[],
  categoricalColumns: string[],
  sampleData: any[],
  prompt: string,
  columnMetadata?: { [key: string]: { detectedType?: string; finalType?: string; confidence?: number } }
): Promise<DataPrepAIResponse> => {
  // Build column type context from metadata if available
  const columnTypeContext = columnMetadata
    ? columns.map(col => {
        const meta = columnMetadata[col];
        if (!meta) return `  - ${col}: (no type info)`;
        return `  - ${col}: ${meta.finalType || meta.detectedType || 'UNKNOWN'} (confidence: ${Math.round((meta.confidence || 0) * 100)}%)`;
      }).join('\n')
    : 'No column type information available.';

  // Build unique values summary for categorical columns (top 5 values per column)
  const uniqueValuesSummary = categoricalColumns.slice(0, 8).map(col => {
    const seen = new Set<string>();
    const values: string[] = [];
    for (const row of sampleData.slice(0, 50)) {
      const v = String(row[col] ?? '');
      if (v && !seen.has(v) && values.length < 5) {
        seen.add(v);
        values.push(v);
      }
    }
    return `  - ${col}: [${values.join(', ')}]`;
  }).join('\n');

  const context = `
Available Columns: ${columns.join(', ')}
Numeric Columns: ${numericColumns.join(', ')}
Categorical/Text Columns: ${categoricalColumns.join(', ')}

Column Types (AI-detected):
${columnTypeContext}

Sample Unique Values (Categorical Columns):
${uniqueValuesSummary}

Sample Data (first 5 rows):
${JSON.stringify(sampleData.slice(0, 5), null, 2)}

User Request: "${prompt}"

Parse this request and return the appropriate data preparation operations.
Match column names to the available columns (case-insensitive matching, but return exact column name).
If multiple operations are needed, decompose the request into atomic operations and return them in the correct execution order.
Do NOT ask for clarification — always attempt the most reasonable interpretation of the request.
  `;

  try {
    return await withKeyRotation(async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: context,
        config: {
          systemInstruction: DATA_PREP_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: dataPrepSchema
        }
      });

      const jsonText = response.text || '{"operations": [], "explanation": "Could not parse request"}';
      const result = JSON.parse(jsonText);
      
      // Normalize column names to match actual columns (case-insensitive)
      result.operations = result.operations.map((op: DataPrepOperation) => normalizeOperationColumns(op, columns));
      
      return result as DataPrepAIResponse;
    });
  } catch (error) {
    console.error("Data Preparation AI Error:", error);
    reportApiError(error, 'parseDataPreparationPrompt');
    return {
      operations: [],
      explanation: `Error parsing request: ${(error as Error).message}`
    };
  }
};

// Helper to normalize column names in operations
const normalizeOperationColumns = (op: DataPrepOperation, columns: string[]): DataPrepOperation => {
  const findColumn = (name: string | undefined): string => {
    if (!name) return '';
    const lower = name.toLowerCase();
    return columns.find(c => c.toLowerCase() === lower) || name;
  };

  if (op.calculatedColumn) {
    op.calculatedColumn.columnA = findColumn(op.calculatedColumn.columnA);
    if (op.calculatedColumn.columnB) {
      op.calculatedColumn.columnB = findColumn(op.calculatedColumn.columnB);
    }
  }
  if (op.conditionalColumn) {
    op.conditionalColumn.clauses = op.conditionalColumn.clauses.map(c => ({
      ...c,
      column: findColumn(c.column)
    }));
  }
  if (op.filter) op.filter.column = findColumn(op.filter.column);
  if (op.sort) op.sort.column = findColumn(op.sort.column);
  if (op.format) op.format.column = findColumn(op.format.column);
  if (op.findReplace) op.findReplace.column = findColumn(op.findReplace.column);
  if (op.split) op.split.column = findColumn(op.split.column);
  if (op.duplicate) op.duplicate.column = findColumn(op.duplicate.column);
  if (op.datetimeExtract) op.datetimeExtract.column = findColumn(op.datetimeExtract.column);
  if (op.trim) op.trim.column = findColumn(op.trim.column);
  if (op.rename) op.rename.column = findColumn(op.rename.column);
  if (op.remove) op.remove.column = findColumn(op.remove.column);

  return op;
};

// ─── Data Profiling AI ────────────────────────────────────────────────────────

export interface ColumnProfile {
  name: string;
  inferredType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  nullCount: number;
  nullPercent: number;
  uniqueCount: number;
  uniquePercent: number;
  sampleValues: string[];
  description: string;
}

export interface TableProfile {
  tableName: string;
  totalRows: number;
  totalColumns: number;
  columns: ColumnProfile[];
  tableDescription: string;
}

export interface JoinSuggestion {
  leftTable: string;
  rightTable: string;
  leftColumn: string;
  rightColumn: string;
  joinType: string;
  confidence: number;
  reasoning: string;
}

export interface DataProfilingResult {
  tables: TableProfile[];
  joinSuggestions: JoinSuggestion[];
  overallSummary: string;
}

const DATA_PROFILING_SYSTEM_INSTRUCTION = `
You are an expert data profiling engine. Analyze the provided table metadata and sample data to produce a comprehensive data profile.

For each table and each column, determine:
1. The inferred data type (TEXT, INTEGER, DECIMAL, CURRENCY, PERCENT, DATE, BOOLEAN, ID, EMAIL, PHONE, URL, UNKNOWN)
2. Whether the column looks like a PRIMARY KEY (unique, non-null, sequential or ID-like)
3. Whether the column looks like a FOREIGN KEY (references another table's primary key based on naming conventions and value overlap)
4. Estimated null count and percentage based on sample data
5. Estimated unique value count and percentage based on sample data
6. Up to 5 representative sample values
7. A short human-readable description of what the column likely represents

For each table provide a short description of its likely purpose.

When multiple tables are provided, suggest the best join columns between table pairs. Analyze column names and sample values for overlap. Consider naming conventions like "id", "user_id", "order_id" etc.

STRICT RULES:
- Output ONLY valid JSON. No markdown, no commentary.
- Use the exact column names from the input.
- Confidence for join suggestions should be 0.0 to 1.0.
- Be conservative with primary/foreign key identification — only flag if evidence is strong.
`;

const dataProfilingSchema = {
  type: Type.OBJECT,
  properties: {
    tables: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tableName: { type: Type.STRING },
          totalRows: { type: Type.INTEGER },
          totalColumns: { type: Type.INTEGER },
          tableDescription: { type: Type.STRING },
          columns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                inferredType: { type: Type.STRING, enum: ['TEXT', 'INTEGER', 'DECIMAL', 'CURRENCY', 'PERCENT', 'DATE', 'BOOLEAN', 'ID', 'EMAIL', 'PHONE', 'URL', 'UNKNOWN'] },
                isPrimaryKey: { type: Type.BOOLEAN },
                isForeignKey: { type: Type.BOOLEAN },
                nullCount: { type: Type.INTEGER },
                nullPercent: { type: Type.NUMBER },
                uniqueCount: { type: Type.INTEGER },
                uniquePercent: { type: Type.NUMBER },
                sampleValues: { type: Type.ARRAY, items: { type: Type.STRING } },
                description: { type: Type.STRING }
              },
              required: ['name', 'inferredType', 'isPrimaryKey', 'isForeignKey', 'nullCount', 'nullPercent', 'uniqueCount', 'uniquePercent', 'sampleValues', 'description']
            }
          }
        },
        required: ['tableName', 'totalRows', 'totalColumns', 'tableDescription', 'columns']
      }
    },
    joinSuggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          leftTable: { type: Type.STRING },
          rightTable: { type: Type.STRING },
          leftColumn: { type: Type.STRING },
          rightColumn: { type: Type.STRING },
          joinType: { type: Type.STRING, enum: ['INNER', 'LEFT', 'RIGHT', 'FULL'] },
          confidence: { type: Type.NUMBER },
          reasoning: { type: Type.STRING }
        },
        required: ['leftTable', 'rightTable', 'leftColumn', 'rightColumn', 'joinType', 'confidence', 'reasoning']
      }
    },
    overallSummary: { type: Type.STRING }
  },
  required: ['tables', 'joinSuggestions', 'overallSummary']
};

export interface TableInput {
  name: string;
  headers: string[];
  sampleRows: any[][];
  totalRows: number;
}

/**
 * Profile data tables using Gemini AI — column types, PK/FK, nulls, join suggestions
 */
export const profileDataWithGemini = async (tables: TableInput[]): Promise<DataProfilingResult> => {
  const context = JSON.stringify({
    tables: tables.map(t => ({
      tableName: t.name,
      totalRows: t.totalRows,
      headers: t.headers,
      sampleRows: t.sampleRows.slice(0, 10)
    }))
  });

  try {
    return await withKeyRotation(async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: context,
        config: {
          systemInstruction: DATA_PROFILING_SYSTEM_INSTRUCTION,
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: dataProfilingSchema
        }
      });

      const jsonText = response.text || '{"tables":[],"joinSuggestions":[],"overallSummary":""}';
      return JSON.parse(jsonText) as DataProfilingResult;
    });
  } catch (error) {
    console.error("Data Profiling AI Error:", error);
    reportApiError(error, 'profileDataWithGemini');
    throw error;
  }
};

/**
 * Generate comprehensive dashboard insights using Gemini AI
 */

export const getDashboardInsights = async (model: DataModel, charts: ChartConfig[]): Promise<string> => {
  const chartSummaries = charts.map(c => 
    `- ${c.title}: ${c.type} chart analyzing ${c.dataKey} ${c.dataKey2 ? `and ${c.dataKey2}` : ''} by ${c.xAxisKey}. Aggregation: ${c.aggregation}.`
  ).join('\n');

  const context = `
    I have a dashboard named "${model.name}" with the following charts:
    ${chartSummaries}

    The underlying dataset has these columns: ${model.columns.join(', ')}.
    Numeric columns: ${model.numericColumns.join(', ')}.
    Categorical columns: ${model.categoricalColumns.join(', ')}.
    
    Sample Data (first 5 rows):
    ${JSON.stringify(model.data.slice(0, 5))}

    Please provide a professional, executive-level analysis of this dashboard. 
    Focus on:
    1. Key trends and patterns visible across these metrics.
    2. Potential correlations or interesting anomalies.
    3. Actionable business recommendations based on the data.
    4. A summary "state of the business" statement.

    Format your response in beautiful Markdown. Use headers, bullet points, and bold text for emphasis.
    Make the tone professional yet engaging.
  `;

  try {
    return await withKeyRotation(async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: context,
        config: {
          systemInstruction: "You are a senior data analyst and strategic business consultant. Your goal is to provide deep, actionable insights based on dashboard configurations and sample data.",
        }
      });

      return response.text || "Unable to generate insights at this time.";
    });
  } catch (error: any) {
    console.error("Dashboard Insights AI Error:", error);
    reportApiError(error, 'getDashboardInsights');
    return "An error occurred while generating insights. This may be due to API rate limits. Please try again in a few moments.";
  }
};