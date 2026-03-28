import { GoogleGenAI, Type } from "@google/genai";
import { ChartConfig, DataModel, AggregationType, AggregatedColumnDefinition } from '../types';

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
If the dataset includes preconfigured aggregated metric definitions such as "Sum of Sales" or "Distinct Customer", you should prefer those metric labels when they match the user's intent.

Sorting and limiting guidelines:
- When a chart represents a ranking (e.g. "Top 10", "Top 5", "Highest", "Best"), set sortOrder to "DESC" and topN to the number requested (default 10).
- When a chart represents the lowest (e.g. "Bottom 10", "Lowest", "Worst"), set sortOrder to "ASC" and topN to the number requested.
- For trend charts (LINE, AREA) or general comparisons, do NOT set sortOrder or topN.

Date filtering guidelines:
- When the user's request mentions a specific time period (e.g. "January 2023", "Jan 2023", "Q1 2023", "2022", "last year", "March"), you MUST populate the dateFilters array.
- dateFilters is an array of objects. Each object has: "column" (the date column name from the dataset), "year" (optional integer), "month" (optional integer 1-12).
- Use the available date columns from Column Context (type DATE) to find the right column name.
- Example: user asks "sum of sales for January 2023" → dateFilters: [{"column": "Order Date", "year": 2023, "month": 1}]
- Example: user asks "revenue for 2022" → dateFilters: [{"column": "Order Date", "year": 2022}]
- Example: user asks "sales in March" → dateFilters: [{"column": "Order Date", "month": 3}]
- If no date column exists or no time period is mentioned, do NOT include dateFilters.

Categorical filtering guidelines:
- When the user's request mentions a specific category or dimension value (e.g. "clothes", "electronics", "Region East", "John Doe"), you MUST populate the chartFilters object.
- chartFilters is an object where keys are column names and values are the values to filter for (either a single string or an array of strings).
- If the user specifies an absolute metric that should not be affected by changes to dashboard-level filters (like a KPI showing total lifetime sales or a specific segment), set "ignoreGlobalFilters" to true.
- If a specific segment mentioned in the request (e.g., "sales of clothes") is used to define the metric, set "ignoreGlobalFilters" to true so it remains stable even when the user filters the dashboard by other categories later.

Drill-through guidelines:
- When a chart shows aggregated data by YEAR (e.g. "Sales by Year", "Revenue per Year", "Yearly Sales"), AND there is a date column in the dataset (type DATE), set drillThrough to enable Power BI-style drill-through to monthly breakdown.
- drillThrough has: "dateColumn" (the date column name, e.g. "Order Date"), "nextLevel": "month".
- The xAxisKey for year charts should NOT be the date column itself — instead set xAxisKey to the date column and let the frontend group by year. For such charts where the user wants year-level view, the system will automatically group the date column by year.
- Only set drillThrough when the chart groups data by a yearly or period-level granularity AND a DATE column is available.
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
    return [];
  }
};

export const generateChartFromPrompt = async (model: DataModel, prompt: string): Promise<ChartConfig | null> => {
  const context = `
    Dataset Context:
    Columns: ${model.columns.join(', ')}.
    Numeric: ${model.numericColumns.join(', ')}.
    Categorical: ${model.categoricalColumns.join(', ')}.
    Preconfigured Aggregated Metrics:
    ${buildAggregatedMetricsContext(model.aggregatedColumns)}
    
    Column Context (Types & Intents):
    ${JSON.stringify(model.columnMetadata, null, 2)}
    
    User Request: "${prompt}"
    
    Create a single chart configuration that best satisfies the user request.
    You may use any chart type: BAR, LINE, AREA, PIE, KPI, HORIZONTAL_BAR, GROUPED_BAR, STACKED_BAR, COMBO, SCATTER, WATERFALL, HEATMAP, TABLE, MATRIX.
    For GROUPED_BAR, STACKED_BAR, or COMBO, provide both dataKey and dataKey2.
    For HEATMAP or MATRIX, provide xAxisKey, yAxisKey, and dataKey.
    For SCATTER, use two numeric columns.
    If the request matches one of the preconfigured aggregated metric definitions, use that aggregated metric label as the metric field.
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
    throw error;
  }
};