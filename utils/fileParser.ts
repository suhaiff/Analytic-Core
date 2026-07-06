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

  return {
    headers: rows[0],
    rows: rows,
  };
};

/** Flatten a JS object into dot-notation key/value pairs */
const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else if (Array.isArray(value)) {
      result[fullKey] = value.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
    } else {
      result[fullKey] = value === null || value === undefined ? '' : String(value);
    }
  }
  return result;
};

/** Parse a JSON array-of-objects (or object containing an array) into tabular rows */
export const parseJSONToTable = (content: string): { headers: string[]; rows: string[][] } => {
  const parsed = JSON.parse(content);

  let records: any[] = [];
  if (Array.isArray(parsed)) {
    records = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    // Try to find the first array property
    const arrayProp = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
    if (arrayProp) {
      records = parsed[arrayProp];
    } else {
      // Wrap single object
      records = [parsed];
    }
  }

  if (records.length === 0) {
    return { headers: [], rows: [] };
  }

  // Collect all unique headers across all records
  const headerSet = new Set<string>();
  const flattenedRecords = records.map(rec => {
    const flat = typeof rec === 'object' && rec !== null ? flattenObject(rec) : { value: String(rec) };
    Object.keys(flat).forEach(k => headerSet.add(k));
    return flat;
  });

  const headers = Array.from(headerSet);
  const headerRow = headers;
  const dataRows = flattenedRecords.map(rec => headers.map(h => rec[h] ?? ''));

  return { headers, rows: [headerRow, ...dataRows] };
};

/** Parse an XML string into tabular rows using DOMParser */
export const parseXMLToTable = (content: string): { headers: string[]; rows: string[][] } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('Invalid XML: ' + parseError.textContent);

  const root = doc.documentElement;

  // Find the repeating child elements (first-level children of root, or root's children's children)
  let items = Array.from(root.children);

  // If items look like wrappers (only 1 child type and they all have children), go one level deeper
  if (items.length === 1 && items[0].children.length > 0) {
    items = Array.from(items[0].children);
  }

  if (items.length === 0) {
    return { headers: [], rows: [] };
  }

  // Collect all unique headers from attributes + child element text
  const headerSet = new Set<string>();
  const flattenedItems = items.map(item => {
    const flat: Record<string, string> = {};
    // Attributes
    Array.from(item.attributes).forEach(attr => {
      flat[attr.name] = attr.value;
      headerSet.add(attr.name);
    });
    // Child elements (flatten text content)
    Array.from(item.children).forEach(child => {
      if (child.children.length === 0) {
        flat[child.tagName] = child.textContent?.trim() ?? '';
        headerSet.add(child.tagName);
      } else {
        // Nested children: flatten one more level
        Array.from(child.children).forEach(grandchild => {
          const key = `${child.tagName}.${grandchild.tagName}`;
          flat[key] = grandchild.textContent?.trim() ?? '';
          headerSet.add(key);
        });
      }
    });
    // If no children, use text content
    if (item.children.length === 0) {
      flat[item.tagName] = item.textContent?.trim() ?? '';
      headerSet.add(item.tagName);
    }
    return flat;
  });

  const headers = Array.from(headerSet);
  const headerRow = headers;
  const dataRows = flattenedItems.map(rec => headers.map(h => rec[h] ?? ''));

  return { headers, rows: [headerRow, ...dataRows] };
};

export const processFile = async (file: File): Promise<DataTable[]> => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  const isJSON = file.name.endsWith('.json');
  const isXML = file.name.endsWith('.xml');

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
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
            
            if (rows && rows.length > 0) {
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
    } else if (isJSON) {
      reader.readAsText(file);
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const { headers, rows } = parseJSONToTable(content);
          resolve([{
            id: `json-${Date.now()}`,
            name: file.name.replace(/\.json$/i, ''),
            rawData: { headers, rows }
          }]);
        } catch (error) {
          console.error("Error parsing JSON:", error);
          reject(error);
        }
      };
      reader.onerror = (err) => reject(err);
    } else if (isXML) {
      reader.readAsText(file);
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const { headers, rows } = parseXMLToTable(content);
          resolve([{
            id: `xml-${Date.now()}`,
            name: file.name.replace(/\.xml$/i, ''),
            rawData: { headers, rows }
          }]);
        } catch (error) {
          console.error("Error parsing XML:", error);
          reject(error);
        }
      };
      reader.onerror = (err) => reject(err);
    } else {
      // Default: CSV
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