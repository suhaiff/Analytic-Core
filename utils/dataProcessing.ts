import { DataTable, JoinConfig, JoinType, ProcessedRow, RawData } from '../types';

export const processRawData = (rawData: RawData, headerIndex: number): { headers: string[], rows: any[] } => {
  if (!rawData.rows.length) return { headers: [], rows: [] };
  
  const headers = rawData.rows[headerIndex] || [];
  // Ensure unique headers to prevent collisions
  const uniqueHeaders = headers.map((h, i) => h !== null && h !== undefined ? String(h).trim() : `Column_${i}`);
  
  const dataRows = rawData.rows.slice(headerIndex + 1).map(row => {
    const obj: any = {};
    uniqueHeaders.forEach((header, index) => {
        obj[header] = row[index];
    });
    return obj;
  });

  return { headers: uniqueHeaders, rows: dataRows };
};

export const performJoins = (
  tables: DataTable[], 
  joins: JoinConfig[], 
  headerIndices: {[tableId: string]: number}
): { data: any[], columns: string[] } => {
  
  // 1. Process all raw tables into structured arrays of objects
  const processedTables: {[id: string]: { headers: string[], rows: any[] }} = {};
  
  tables.forEach(table => {
    const idx = headerIndices[table.id] || 0;
    processedTables[table.id] = processRawData(table.rawData, idx);
  });

  if (tables.length === 0) return { data: [], columns: [] };

  // Start with the first table as the base
  // Important: The base data MUST start with table 0 prefix to match join logic expectation
  const table0 = tables[0];
  const table0Data = processedTables[table0.id];
  
  let resultData = table0Data.rows.map(row => {
    const newRow: any = {};
    Object.keys(row).forEach(key => {
        newRow[`${table0.name}.${key}`] = row[key];
    });
    return newRow;
  });
  
  let resultColumns = table0Data.headers.map(c => `${table0.name}.${c}`);

  // Apply joins sequentially
  joins.forEach(join => {
    const rightTable = processedTables[join.rightTableId];
    if (!rightTable) return;

    const rightTableName = tables.find(t => t.id === join.rightTableId)?.name || 'Unknown';
    const leftTableName = tables.find(t => t.id === join.leftTableId)?.name || table0.name;
    
    // Prepare right data with prefixes
    const rightData = rightTable.rows.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
            newRow[`${rightTableName}.${key}`] = row[key];
        });
        return newRow;
    });
    const rightColumns = rightTable.headers.map(c => `${rightTableName}.${c}`);

    // Determine the exact key string to look for in the existing dataset
    // If the left key doesn't contain a dot, we prefix it with the selected Left Table's name
    const leftKey = join.leftKey.includes('.') ? join.leftKey : `${leftTableName}.${join.leftKey}`;
    const rightKey = `${rightTableName}.${join.rightKey}`;

    const newResultData: any[] = [];
    const matchedRightIndices = new Set<number>();

    // Hash Map for Right Table for O(1) lookup (assuming unique keys on right for ideal join, but handling 1:N)
    // Group right rows by key
    const rightMap = new Map<string, any[]>();
    rightData.forEach((row, idx) => {
        const keyVal = String(row[rightKey]);
        if (!rightMap.has(keyVal)) rightMap.set(keyVal, []);
        rightMap.get(keyVal)?.push({ row, idx });
    });

    // Iterate Left Data (Current Result)
    resultData.forEach(leftRow => {
        const keyVal = String(leftRow[leftKey]);
        const matches = rightMap.get(keyVal);

        if (matches && matches.length > 0) {
            matches.forEach(match => {
                newResultData.push({ ...leftRow, ...match.row });
                matchedRightIndices.add(match.idx);
            });
        } else {
            // No match found
            if (join.type === JoinType.LEFT || join.type === JoinType.FULL) {
                // Fill with nulls for right columns
                const nullRight: any = {};
                rightColumns.forEach(c => nullRight[c] = null);
                newResultData.push({ ...leftRow, ...nullRight });
            }
        }
    });

    // Handle Right Joins / Full Outer Joins for unmatched right rows
    if (join.type === JoinType.RIGHT || join.type === JoinType.FULL) {
         rightData.forEach((rightRow, idx) => {
            if (!matchedRightIndices.has(idx)) {
                // Create null left part
                const nullLeft: any = {};
                resultColumns.forEach(c => nullLeft[c] = null);
                newResultData.push({ ...nullLeft, ...rightRow });
            }
         });
    }

    resultData = newResultData;
    // Merge columns
    resultColumns = Array.from(new Set([...resultColumns, ...rightColumns]));
  });

  return { data: resultData, columns: resultColumns };
};