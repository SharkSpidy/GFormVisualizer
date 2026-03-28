import Papa from 'papaparse';

export interface CSVParseResult {
  data: any[];
  errors: any[];
  meta: {
    fields?: string[];
  };
}

export function parseCSVFile(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results as CSVParseResult);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export function parseCSVText(csvText: string): CSVParseResult {
  return Papa.parse(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  }) as CSVParseResult;
}

export function validateCSVData(data: any[]): { valid: boolean; error?: string } {
  if (!data || data.length === 0) {
    return { valid: false, error: 'No data found in CSV file' };
  }

  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  if (columns.length === 0) {
    return { valid: false, error: 'No columns found in CSV file' };
  }

  if (columns.length > 200) {
    return { valid: false, error: 'Too many columns (maximum 200)' };
  }

  if (data.length > 10000) {
    return { valid: false, error: 'Too many rows (maximum 10,000)' };
  }

  return { valid: true };
}
