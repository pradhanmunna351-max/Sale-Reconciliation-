import * as XLSX from 'xlsx';
import { CsvRow } from '../types';

// Helper to convert sheet to JSON, with header normalization
const sheetToJSON = (sheet: XLSX.WorkSheet): CsvRow[] => {
    // Generate headers from the first row, trimming them
    const headers: string[] = [];
    const range = XLSX.utils.decode_range(sheet['!ref']!);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
        let hdr = "UNKNOWN " + C; // Default header
        if (cell && cell.t) hdr = XLSX.utils.format_cell(cell);
        headers.push(hdr.trim());
    }

    // Convert sheet to JSON, skipping the header row
    const data = XLSX.utils.sheet_to_json<CsvRow>(sheet, {
        header: headers,
        range: 1, // Start from the second row
        defval: null, // Use null for blank cells
        raw: false, // Get formatted strings for all values
        dateNF: 'yyyy-mm-dd', // Format dates
    });

    // Clean up data: trim headers and values, and filter out empty rows
    return data
        .map(row => {
            const cleanedRow: CsvRow = {};
            for (const key in row) {
                const trimmedKey = key.trim();
                const value = row[key];
                cleanedRow[trimmedKey] = typeof value === 'string' ? value.trim() : value;
            }
            return cleanedRow;
        })
        .filter(row => Object.values(row).some(value => value !== null && value !== ''));
};

// A small delay to allow UI updates between chunks
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export const parseFile = (
    file: File,
    onProgress: (percentage: number) => void,
    signal: AbortSignal
): Promise<CsvRow[]> => {
    return new Promise(async (resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event: ProgressEvent<FileReader>) => {
            if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
            try {
                if (!event.target?.result) {
                    return reject(new Error("File content is empty."));
                }
                const data = event.target.result;

                onProgress(25);
                await yieldToMain();
                if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));

                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                
                onProgress(50);
                await yieldToMain();
                if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                onProgress(75);
                await yieldToMain();
                if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));

                const jsonData = sheetToJSON(worksheet);

                onProgress(100);
                resolve(jsonData);
            } catch (error) {
                console.error("Error parsing file:", error);
                reject(error);
            }
        };

        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            reject(error);
        };

        if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
        
        signal.addEventListener('abort', () => {
             reader.abort();
             reject(new DOMException('Aborted', 'AbortError'));
        });

        reader.readAsBinaryString(file);
    });
};


// A helper to convert any value to a number, returning 0 if invalid.
export const toNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    // Remove commas for thousand separators before converting
    const num = Number(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
};

// Helper function to parse month strings for chronological sorting
export const parseMonthYear = (monthStr: string): Date | null => {
  if (!monthStr) return null;

  const monthMap: { [key: string]: number } = {
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11
  };
  
  // Try to match patterns like "Jan-24", "January 2024", and also "4.Apr-24"
  // The regex now optionally matches a leading "number." part.
  const match = monthStr.toLowerCase().match(/(?:\d{1,2}\.\s*)?([a-z]+)[\s-]*(\d{2,4})/);
  
  if (match) {
    const monthName = match[1]; // This will be 'apr' from '4.apr-24' or 'jan' from 'jan-24'
    let year = parseInt(match[2], 10);
    
    // Handle two-digit years like '24' -> 2024
    if (year < 100) {
      year += 2000;
    }

    const monthIndex = monthMap[monthName];

    if (monthIndex !== undefined && year >= 1900 && year <= 2100) {
      return new Date(year, monthIndex, 1);
    }
  }

  // Fallback for other formats that new Date() can handle, e.g., "2024-01"
  const d = new Date(monthStr);
  if (!isNaN(d.getTime())) {
    // Set to first of month to avoid issues with different day numbers
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  return null;
}