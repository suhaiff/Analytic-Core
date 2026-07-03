import { DataTable, RawData } from '../types';
const parseCSVContent = (content: string): RawData => {
  const lines = content.split(/\r\n|\n/);
  const rows = lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Handle quoted values containing commas
      const result = [];
      let current = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  // Initially, return all as rows. Headers are determined by config.
  return {
    headers: rows[0], 
    rows: rows,
  };
};

export const processFile = async (file: File): Promise<DataTable[]> => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  let XLSX: any;
  if (isExcel) {
    XLSX = await import('xlsx');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (isExcel) {
      reader.readAsArrayBuffer(file);
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const tables: DataTable[] = [];
          
          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            // Get all data as array of arrays
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
            
            if (rows && rows.length > 0) {
               // Convert all cells to strings for consistency
               const stringRows = rows.map(row => row.map(cell => 
                 cell === null || cell === undefined ? '' : String(cell).trim()
               ));

               tables.push({
                 id: `sheet-${sheetName}-${Date.now()}`,
                 name: sheetName,
                 rawData: {
                   headers: stringRows[0] || [],
                   rows: stringRows
                 }
               });
            }
          });
          resolve(tables);
        } catch (error) {
          console.error("Error parsing Excel:", error);
          reject(error);
        }
      };
      reader.onerror = (err) => reject(err);
    } else {
      reader.readAsText(file);
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = parseCSVContent(content);
          resolve([{ 
            id: `csv-${Date.now()}`, 
            name: file.name.replace(/\.csv$/i, ''), 
            rawData: parsed 
          }]);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (err) => reject(err);
    }
  });
};