/**
 * Excel Import Utilities
 * Handles parsing Excel files for team member imports during onboarding
 */

import * as XLSX from 'xlsx';

export interface ExcelImportResult {
  valid: Array<{ email: string; name?: string; department?: string }>;
  invalid: Array<{ value: string; reason: string; row: number }>;
  duplicates: Array<{ email: string; rows: number[] }>;
}

/**
 * Parse Excel file and extract email addresses
 * Supports .xlsx, .xls, .csv formats
 */
export async function parseExcelFile(file: File): Promise<ExcelImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) throw new Error('Failed to read file');

        // Parse the workbook
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!worksheet) throw new Error('No worksheet found in file');

        // Get data starting from row 2 (skip header)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rows.length < 2) {
          throw new Error('File must contain at least a header and one data row');
        }

        const headers = (rows[0] || []).map((h: any) => String(h).toLowerCase().trim());
        const emailColIndex = headers.findIndex(h => 
          h === 'email' || h === 'e-mail' || h === 'email address'
        );
        const nameColIndex = headers.findIndex(h =>
          h === 'name' || h === 'first name' || h === 'full name'
        );
        const departmentColIndex = headers.findIndex(h =>
          h === 'department' || h === 'dept' || h === 'department name' || h === 'departement'
        );

        if (emailColIndex === -1) {
          throw new Error('No "Email" column found. Please ensure your Excel file has an "Email" column.');
        }

        const valid: Array<{ email: string; name?: string; department?: string }> = [];
        const invalid: Array<{ value: string; reason: string; row: number }> = [];
        const duplicatesMap = new Map<string, number[]>();
        const seenEmails = new Set<string>();

        // Process data rows (skip header)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] || [];
          const emailValue = String(row[emailColIndex] || '').trim();
          const nameValue = nameColIndex >= 0 ? String(row[nameColIndex] || '').trim() : undefined;
          const departmentValue = departmentColIndex >= 0 ? String(row[departmentColIndex] || '').trim() : undefined;

          // Skip empty rows
          if (!emailValue) continue;

          // Validate email
          const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
          if (!isValidEmail) {
            invalid.push({
              value: emailValue,
              reason: 'Invalid email format',
              row: i + 1, // +1 for header, then +1 for human-readable row numbers
            });
            continue;
          }

          const emailLower = emailValue.toLowerCase();

          // Track duplicates within file
          if (seenEmails.has(emailLower)) {
            if (!duplicatesMap.has(emailLower)) {
              duplicatesMap.set(emailLower, []);
            }
            duplicatesMap.get(emailLower)!.push(i + 1);
            continue;
          }

          seenEmails.add(emailLower);
          valid.push({
            email: emailValue,
            name: nameValue || undefined,
            department: departmentValue || undefined,
          });
        }

        // Format duplicates
        const duplicates: Array<{ email: string; rows: number[] }> = Array.from(
          duplicatesMap.entries()
        ).map(([email, rows]) => ({ email, rows }));

        resolve({
          valid,
          invalid,
          duplicates,
        });
      } catch (error: any) {
        reject(new Error(error?.message || 'Failed to parse Excel file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Generate a sample Excel template for team import
 * Returns a blob that can be downloaded
 */
export function generateExcelTemplate(language: string = 'en'): Blob {
  const templates: Record<string, { headers: string[]; sampleData: any[] }> = {
    en: {
      headers: ['Email', 'Name', 'Department'],
      sampleData: [
        { Email: 'john.doe@company.com', Name: 'John Doe', Department: 'Engineering' },
        { Email: 'jane.smith@company.com', Name: 'Jane Smith', Department: 'Marketing' },
        { Email: 'mike.johnson@company.com', Name: 'Mike Johnson', Department: 'Operations' },
      ],
    },
    fr: {
      headers: ['Email', 'Nom', 'Department'],
      sampleData: [
        { Email: 'john.doe@company.com', Nom: 'John Doe', Department: 'Ingénierie' },
        { Email: 'jane.smith@company.com', Nom: 'Jane Smith', Department: 'Marketing' },
        { Email: 'mike.johnson@company.com', Nom: 'Mike Johnson', Department: 'Opérations' },
      ],
    },
    de: {
      headers: ['Email', 'Name', 'Department'],
      sampleData: [
        { Email: 'john.doe@company.com', Name: 'John Doe', Department: 'Engineering' },
        { Email: 'jane.smith@company.com', Name: 'Jane Smith', Department: 'Marketing' },
        { Email: 'mike.johnson@company.com', Name: 'Mike Johnson', Department: 'Operations' },
      ],
    },
  };

  const template = templates[language] || templates['en'];

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(template.sampleData, {
    header: template.headers,
  });

  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // Email column
    { wch: 25 }, // Name column
    { wch: 25 }, // Department column
  ];

  // Style header row (bold)
  const headerRange = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: template.headers.length - 1 } });
  worksheet['!rows'] = [{ hpx: 20 }]; // Bold header

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Team Members');

  // Write to blob
  return new Blob(
    [XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );
}

/**
 * Download Excel template
 */
export function downloadExcelTemplate(language: string = 'en') {
  const blob = generateExcelTemplate(language);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `team-import-template-${language}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
