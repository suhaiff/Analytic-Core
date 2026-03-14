import { GoogleGenAI, Type } from "@google/genai";
import { ChartConfig, DataModel, ChartType, AggregationType } from '../types';

const getAI = () => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) {
    console.error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

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
          aggregation: { type: Type.STRING, enum: ["SUM", "COUNT", "AVERAGE", "MINIMUM", "MAXIMUM", "NONE"] },
        },
        required: ["title", "type", "xAxisKey", "dataKey", "aggregation", "description"]
      }
    }
  },
  required: ["suggestions"]
};

export const analyzeDataAndSuggestKPIs = async (model: DataModel): Promise<ChartConfig[]> => {
  const ai = getAI();

  // Prepare a context summary
  const context = `
    I have a dataset named "${model.name}".
    The columns are: ${model.columns.join(', ')}.
    Numeric columns: ${model.numericColumns.join(', ')}.
    Categorical columns: ${model.categoricalColumns.join(', ')}.
    
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
  `;

  try {
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

    return result.suggestions.map((s: any, index: number) => ({
      ...s,
      id: `suggested-${index}-${Date.now()}`,
      color: '#4f46e5' // Default indigo
    }));

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return [];
  }
};

export const generateChartFromPrompt = async (model: DataModel, prompt: string): Promise<ChartConfig | null> => {
  const ai = getAI();

  const context = `
    Dataset Context:
    Columns: ${model.columns.join(', ')}.
    Numeric: ${model.numericColumns.join(', ')}.
    Categorical: ${model.categoricalColumns.join(', ')}.
    
    Column Context (Types & Intents):
    ${JSON.stringify(model.columnMetadata, null, 2)}
    
    User Request: "${prompt}"
    
    Create a single chart configuration that best satisfies the user request.
    You may use any chart type: BAR, LINE, AREA, PIE, KPI, HORIZONTAL_BAR, GROUPED_BAR, STACKED_BAR, COMBO, SCATTER, WATERFALL, HEATMAP, TABLE, MATRIX.
    For GROUPED_BAR, STACKED_BAR, or COMBO, provide both dataKey and dataKey2.
    For HEATMAP or MATRIX, provide xAxisKey, yAxisKey, and dataKey.
    For SCATTER, use two numeric columns.
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
      aggregation: { type: Type.STRING, enum: ["SUM", "COUNT", "AVERAGE", "MINIMUM", "MAXIMUM", "NONE"] },
    },
    required: ["title", "type", "xAxisKey", "dataKey", "aggregation"]
  };

  try {
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

    return {
      ...result,
      id: `custom-${Date.now()}`,
      color: '#10b981' // Emerald
    };

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
  const ai = getAI();

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
  } catch (error) {
    console.error("AI Schema Audit error:", error);
    throw error;
  }
};