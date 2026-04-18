import { auditSchema } from './geminiService';
import { ColumnType, ColumnMetadata } from '../types';
import { isCurrencyColumn, isCountColumn, isDateTimeColumn, isIdColumn } from '../utils/formatters';

interface SchemaAuditResult {
    [columnName: string]: ColumnMetadata;
}

/**
 * Value-pattern analysis: Detect types from actual cell values using regex patterns.
 * This provides a second signal (alongside column-name heuristics) before the AI call.
 */
const analyzeValuePatterns = (col: string, sampleRows: any[]): { type: ColumnType; confidence: number } | null => {
    const values = sampleRows
        .map(row => row[col] ?? row[Object.keys(row).find(k => k.toLowerCase() === col.toLowerCase()) || ''])
        .filter(v => v !== null && v !== undefined && String(v).trim() !== '');

    if (values.length === 0) return null;

    const strValues = values.map(v => String(v).trim());

    // Boolean detection: only 2 distinct values that look boolean
    const uniqueLower = new Set(strValues.map(v => v.toLowerCase()));
    const booleanSets = [
        new Set(['true', 'false']), new Set(['yes', 'no']), new Set(['y', 'n']),
        new Set(['t', 'f']), new Set(['0', '1']), new Set(['on', 'off'])
    ];
    for (const bs of booleanSets) {
        if (uniqueLower.size <= 2 && [...uniqueLower].every(v => bs.has(v))) {
            return { type: ColumnType.BOOLEAN, confidence: 0.9 };
        }
    }

    // Percentage detection: values ending with '%'
    const percentCount = strValues.filter(v => /^-?\d+(\.\d+)?%$/.test(v)).length;
    if (percentCount >= strValues.length * 0.7) {
        return { type: ColumnType.PERCENT, confidence: 0.85 };
    }

    // Date detection: common date patterns
    const datePatterns = [
        /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/, // YYYY-MM-DD or YYYY/MM/DD
        /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/, // MM/DD/YYYY or DD-MM-YYYY
        /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i, // DD Mon YYYY
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d/i, // Mon DD
        /^\d{4}-\d{2}-\d{2}T/, // ISO 8601
    ];
    const dateCount = strValues.filter(v => datePatterns.some(p => p.test(v))).length;
    if (dateCount >= strValues.length * 0.6) {
        return { type: ColumnType.DATE, confidence: 0.85 };
    }

    // Numeric analysis: classify into INTEGER vs DECIMAL
    const cleanedNumerics = strValues.map(v => v.replace(/[$€£₹,\s]/g, ''));
    const numericCount = cleanedNumerics.filter(v => !isNaN(Number(v)) && v !== '').length;
    if (numericCount >= strValues.length * 0.7) {
        const hasDecimals = cleanedNumerics.filter(v => !isNaN(Number(v)) && v.includes('.')).length;
        if (hasDecimals >= numericCount * 0.3) {
            // Check if column name suggests currency
            if (isCurrencyColumn(col)) {
                return { type: ColumnType.CURRENCY, confidence: 0.8 };
            }
            return { type: ColumnType.DECIMAL, confidence: 0.75 };
        }
        // All integers
        if (isCountColumn(col)) {
            return { type: ColumnType.INTEGER, confidence: 0.8 };
        }
    }

    return null;
};

/**
 * Orchestrates the schema audit process: Value-Pattern Analysis + Rule-Based + AI
 */
export const performSchemaAudit = async (
    datasetName: string,
    headers: string[],
    sampleRows: any[]
): Promise<SchemaAuditResult> => {
    const metadata: SchemaAuditResult = {};

    // 1. Rule-Based Pre-Detection (Baseline from column names)
    headers.forEach(col => {
        let type = ColumnType.TEXT;
        let confidence = 0.5;

        if (isCurrencyColumn(col)) {
            type = ColumnType.CURRENCY;
            confidence = 0.75;
        } else if (isCountColumn(col)) {
            type = ColumnType.INTEGER;
            confidence = 0.75;
        } else if (isDateTimeColumn(col)) {
            type = ColumnType.DATE;
            confidence = 0.8;
        } else if (isIdColumn(col)) {
            type = ColumnType.TEXT;
            confidence = 0.9;
        }

        metadata[col] = {
            detectedType: type,
            finalType: type,
            confidence: confidence,
            source: 'RULE',
            requiresConfirmation: true
        };
    });

    // 2. Value-Pattern Analysis (Enrichment from actual data values)
    headers.forEach(col => {
        const valueAnalysis = analyzeValuePatterns(col, sampleRows);
        if (valueAnalysis) {
            const ruleMetadata = metadata[col];

            if (ruleMetadata.detectedType === valueAnalysis.type) {
                // Rule-based and value-pattern AGREE → boost confidence
                const boostedConfidence = Math.min(0.95, Math.max(ruleMetadata.confidence, valueAnalysis.confidence) + 0.1);
                metadata[col] = {
                    ...ruleMetadata,
                    confidence: boostedConfidence,
                    requiresConfirmation: boostedConfidence < 0.75
                };
            } else if (valueAnalysis.confidence > ruleMetadata.confidence) {
                // Value pattern has higher confidence → prefer it
                metadata[col] = {
                    detectedType: valueAnalysis.type,
                    finalType: valueAnalysis.type,
                    confidence: valueAnalysis.confidence,
                    source: 'RULE',
                    requiresConfirmation: valueAnalysis.confidence < 0.75
                };
            }
        }
    });

    // 3. AI Schema Audit (Final enrichment)
    try {
        // Set a timeout for AI call — 10s allows better accuracy than 5s
        const aiPromise = auditSchema(datasetName, headers, sampleRows);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI Audit Timeout')), 10000)
        );

        const aiResult = await Promise.race([aiPromise, timeoutPromise]) as any;

        if (aiResult && aiResult.columns) {
            aiResult.columns.forEach((aiCol: any) => {
                const colName = aiCol.name;
                const aiType = aiCol.type as ColumnType;
                const aiConfidence = aiCol.confidence;

                if (metadata[colName]) {
                    const ruleMetadata = metadata[colName];

                    if (ruleMetadata.detectedType === aiType) {
                        // Rule-based/value-pattern and AI AGREE → boost confidence significantly
                        const agreedConfidence = Math.min(0.98, Math.max(ruleMetadata.confidence, aiConfidence) + 0.1);
                        metadata[colName] = {
                            detectedType: aiType,
                            finalType: aiType,
                            confidence: agreedConfidence,
                            source: aiConfidence > ruleMetadata.confidence ? 'AI' : ruleMetadata.source,
                            requiresConfirmation: agreedConfidence < 0.75
                        };
                    } else if (aiConfidence > ruleMetadata.confidence) {
                        // Confidence Merge Strategy: AI wins with higher confidence
                        metadata[colName] = {
                            detectedType: aiType,
                            finalType: aiType,
                            confidence: aiConfidence,
                            source: 'AI',
                            requiresConfirmation: aiConfidence < 0.75
                        };
                    } else if (aiType !== ruleMetadata.detectedType) {
                        // Disagreement with low AI confidence
                        metadata[colName].requiresConfirmation = true;
                        metadata[colName].confidence = Math.min(ruleMetadata.confidence, aiConfidence);
                    }
                }

                // --- CRITICAL: Always require confirmation for plain "Total" ---
                if (colName.toLowerCase().trim() === 'total') {
                    metadata[colName].requiresConfirmation = true;
                    // Lower confidence slightly if it's a generic name to trigger UI warnings
                    metadata[colName].confidence = Math.min(metadata[colName].confidence, 0.6);
                }
            });
        }
    } catch (error) {
        console.warn('AI Schema Audit failed or timed out, falling back to rules + value-pattern analysis:', error);
        // Fallback already populated in Steps 1 & 2
    }

    return metadata;
};

