/**
 * Utility functions for formatting values in the dashboard
 */

/**
 * Formats a number as Indian Rupee currency
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0 for whole numbers, 2 for decimals)
 * @returns Formatted currency string with ₹ symbol
 */
export const formatCurrency = (value: number | string | null | undefined, decimals?: number): string => {
    if (value === null || value === undefined || value === '') {
        return '₹0';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return '₹0';
    }

    // Auto-detect decimals if not specified
    const hasDecimals = decimals !== undefined ? decimals : (numValue % 1 !== 0 ? 2 : 0);

    // Format with Indian numbering system
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: hasDecimals,
        maximumFractionDigits: hasDecimals,
    }).format(numValue);

    return formatted;
};

/**
 * Formats a number as Indian Rupee with compact notation (K, L, Cr)
 * Useful for axis labels and small spaces
 * @param value - The numeric value to format
 * @returns Formatted compact currency string
 */
export const formatCompactCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') {
        return '₹0';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return '₹0';
    }

    const absValue = Math.abs(numValue);
    const sign = numValue < 0 ? '-' : '';

    if (absValue >= 10000000) return `${sign}₹${(absValue / 10000000).toFixed(1)}Cr`;
    if (absValue >= 100000) return `${sign}₹${(absValue / 100000).toFixed(1)}L`;
    if (absValue >= 1000) return `${sign}₹${(absValue / 1000).toFixed(1)}K`;

    // For small numbers, use standard formatting with auto-decimals
    const hasDecimals = absValue % 1 !== 0;
    return `${sign}₹${new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(absValue)}`;
};

/**
 * Formats a number with commas (Indian numbering system) without currency symbol
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export const formatNumber = (value: number | string | null | undefined, decimals: number = 0): string => {
    if (value === null || value === undefined || value === '') {
        return '0';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return '0';
    }

    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(numValue);
};

/**
 * Detects if a column is an ID field
 * @param columnName - The name of the column to check
 * @returns true if it's likely an ID field
 */
export const isIdColumn = (columnName: string): boolean => {
    const lowerName = columnName.toLowerCase();

    // Check for common ID patterns
    if (lowerName === 'id' || lowerName === '_id') return true;
    if (lowerName.endsWith('_id') || lowerName.endsWith('id')) return true;
    if (lowerName.startsWith('id_') || lowerName.startsWith('id')) return true;
    if (lowerName.includes('identifier')) return true;

    return false;
};

/**
 * Detects if a column is a date or time field
 * @param columnName - The name of the column to check
 * @returns true if it's likely a date/time field
 */
export const isDateTimeColumn = (columnName: string): boolean => {
    const lowerName = columnName.toLowerCase();

    // First check for exact matches or suffix matches for common patterns
    if (lowerName === 'date' || lowerName === 'time' || lowerName === 'datetime') return true;
    if (lowerName.endsWith('_date') || lowerName.endsWith('_time')) return true;
    if (lowerName.endsWith('_at') || lowerName.endsWith('_on')) return true;
    if (lowerName.startsWith('date_') || lowerName.startsWith('time_')) return true;

    // Then check for specific date/time keywords that are clear indicators
    const dateTimeKeywords = [
        'timestamp', 'created', 'updated', 'year', 'month', 'day',
        'hour', 'minute', 'second', 'when', 'period'
    ];

    return dateTimeKeywords.some(keyword => lowerName.includes(keyword));
};

/**
 * Detects if a column is a count, quantity, or index field
 * @param columnName - The name of the column to check
 * @returns true if it's likely a count/quantity/index field
 */
export const isCountColumn = (columnName: string): boolean => {
    const countKeywords = [
        'count', 'quantity', 'qty', 'number', 'num', 'index',
        'rank', 'position', 'sequence', 'order', 'medals', 'points', 'goals', 'votes', 'score', 'gold', 'silver', 'bronze', 'tally', 'total medals'
    ];

    const lowerName = columnName.toLowerCase();
    return countKeywords.some(keyword => lowerName.includes(keyword));
};

/**
 * Detects if a column name or value suggests it's a currency field
 * @param columnName - The name of the column to check
 * @returns true if it's likely a currency field
 */
export const isCurrencyColumn = (columnName: string): boolean => {
    // ID columns never take currency format
    if (isIdColumn(columnName)) return false;

    // Normalize column name for keyword matching
    const lowerName = columnName.toLowerCase();
    const normalizedName = lowerName.replace(/[\s_-]/g, '');

    // Category, status, or text columns should NOT be currency
    const categoryKeywords = ['mode', 'type', 'method', 'category', 'status', 'description', 'remark', 'note', 'name', 'title'];
    if (categoryKeywords.some(keyword => lowerName.includes(keyword))) return false;

    const currencyKeywords = [
        'price', 'cost', 'amount', 'total', 'revenue', 'sales',
        'profit', 'salary', 'payment', 'fee', 'charge', 'value',
        'income', 'expense', 'balance', 'rate', 'mrp', 'discount',
        'earning', 'wage', 'commission', 'bonus', 'refund', 'tax',
        'gst', 'vat', 'duty', 'bill', 'invoice', 'due', 'paid',
        'receivable', 'payable', 'credit', 'debit', 'rupees', 'inr',
        'shipping', 'ship'
    ];

    // Priority 1: If it contains currency keywords, it's likely currency
    const hasCurrencyKeyword = currencyKeywords.some(keyword =>
        lowerName.includes(keyword) || normalizedName.includes(keyword)
    );
    if (hasCurrencyKeyword) {
        if (isDateTimeColumn(columnName)) return false;
        // If it's explicitly a count column, it should NOT be currency, even if 'total' is present.
        if (isCountColumn(columnName)) return false;

        // CRITICAL: If the name is ONLY "total" (no context like "Total Sales"), 
        // it's highly ambiguous. Default to false here and let AI/User decide.
        if (lowerName === 'total') return false;

        return true;
    }

    // Priority 2: Exclusions for other numeric columns
    if (isDateTimeColumn(columnName)) return false;
    if (isCountColumn(columnName)) return false;

    return false;
};

/**
 * Converts Excel serial date number to formatted date string
 * Excel stores dates as numbers (days since 1900-01-01)
 * @param serial - Excel serial date number
 * @returns Formatted date string
 */
export const excelSerialToDate = (serial: number): string => {
    // Excel epoch starts at 1899-12-30 to handle the 1900 leap year bug correctly
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + Math.round(serial * 86400000));

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * Formats an Excel serial date for use in chart ticks (concise)
 * @param serial - Excel serial date
 * @returns Short formatted date string like '15 Jan'
 */
export const formatDateForTick = (serial: number): string => {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + Math.floor(serial) * 86400000);

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
    });
};

/**
 * Checks if a number is likely an Excel serial date
 * Excel dates are typically between 1 (1900-01-01) and 50000+ (current dates)
 * @param value - Number to check
 * @returns true if it looks like an Excel date serial
 */
export const isExcelSerialDate = (value: number): boolean => {
    // Excel dates for modern times (1982+) are numbers > 30000
    // This threshold prevents small integers (like year numbers 2024, 2025) 
    // from being incorrectly interpreted as Excel dates (which would be in year 1905).
    return Number.isInteger(value) && value > 30000 && value < 100000;
};

/**
 * Formats a value based on its column name and optional DataModel metadata
 */
export const smartFormat = (value: any, columnName: string, columnMetadata?: any): string => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    // For ID columns, return the value as-is (no formatting)
    if (isIdColumn(columnName)) {
        return String(value);
    }

    // Check if it's a numeric value
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    const isNumeric = !isNaN(numValue);

    // If we have AI-driven metadata, prioritize it
    if (columnMetadata && columnMetadata[columnName]) {
        const meta = columnMetadata[columnName];
        const type = meta.finalType || meta.detectedType;

        if (isNumeric) {
            switch (type) {
                case 'CURRENCY':
                    return formatCurrency(numValue);
                case 'INTEGER':
                    return formatNumber(numValue, 0);
                case 'PERCENT':
                    return `${formatNumber(numValue, 1)}%`;
                case 'DECIMAL':
                    return formatNumber(numValue, 2);
            }
        }

        if (type === 'DATE') {
            const lowerCol = columnName.toLowerCase();
            const isLikelyYearOnly = lowerCol === 'year' || lowerCol.endsWith('_year') || lowerCol.startsWith('year_');
            
            if (isNumeric && isExcelSerialDate(numValue) && !isLikelyYearOnly) {
                return excelSerialToDate(numValue);
            }
            return String(value);
        }

        if (type === 'BOOLEAN') {
            return String(value).toUpperCase();
        }

        if (type === 'TEXT') {
            return String(value);
        }
    }

    // Fallback to Rule-based detection if no metadata or metadata is UNKNOWN
    // IMPORTANT: Check currency BEFORE date/time to prevent amounts from being converted to dates
    if (isNumeric && isCurrencyColumn(columnName)) {
        return formatCurrency(numValue);
    }

    // For count columns, format with commas but no currency symbol
    if (isNumeric && isCountColumn(columnName)) {
        return formatNumber(numValue, 0);
    }

    // For date/time columns, handle Excel serial dates
    if (isDateTimeColumn(columnName)) {
        const lowerCol = columnName.toLowerCase();
        const isLikelyYearOnly = lowerCol === 'year' || lowerCol.endsWith('_year') || lowerCol.startsWith('year_');

        // Check if it's a number that might be an Excel serial date
        if (isNumeric && isExcelSerialDate(numValue) && !isLikelyYearOnly) {
            // Convert Excel serial date to readable format
            return excelSerialToDate(numValue);
        }

        // Otherwise return as-is (already formatted date string)
        return String(value);
    }

    // For other numeric values, format with commas
    if (isNumeric) {
        // Check if it looks like a whole number or has decimals
        const hasDecimals = numValue % 1 !== 0;
        return formatNumber(numValue, hasDecimals ? 2 : 0);
    }

    // Not a number, return as string
    return String(value);
};
