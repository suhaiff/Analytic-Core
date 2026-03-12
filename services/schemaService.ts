import { auditSchema } from './geminiService';
import { ColumnType, ColumnMetadata } from '../types';
import { isCurrencyColumn, isCountColumn, isDateTimeColumn, isIdColumn } from '../utils/formatters';

interface SchemaAuditResult {
    [columnName: string]: ColumnMetadata;
}

/**
 * Orchestrates the schema audit process: AI + Rule-based Fallback
 */
export const performSchemaAudit = async (
    datasetName: string,
    headers: string[],
    sampleRows: any[]
): Promise<SchemaAuditResult> => {
    const metadata: SchemaAuditResult = {};

    // 1. Rule-Based Pre-Detection (Baseline)
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

    // 2. AI Schema Audit (Enrichment)
    try {
        // Set a timeout for AI call
        const aiPromise = auditSchema(datasetName, headers, sampleRows);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI Audit Timeout')), 5000)
        );

        const aiResult = await Promise.race([aiPromise, timeoutPromise]) as any;

        if (aiResult && aiResult.columns) {
            aiResult.columns.forEach((aiCol: any) => {
                const colName = aiCol.name;
                const aiType = aiCol.type as ColumnType;
                const aiConfidence = aiCol.confidence;

                if (metadata[colName]) {
                    const ruleMetadata = metadata[colName];

                    // Confidence Merge Strategy
                    // If AI confidence is higher, prefer AI
                    if (aiConfidence > ruleMetadata.confidence) {
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
        console.warn('AI Schema Audit failed or timed out, falling back to rules:', error);
        // Fallback already populated in Step 1
    }

    return metadata;
};
