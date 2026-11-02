/**
 * Utility to generate and download RFC 4180-compliant CSV files in the browser.
 * Includes UTF-8 BOM (\uFEFF) so Excel and spreadsheet tools open international
 * characters without garbled encodings.
 */

export interface CsvColumn<T> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

export function exportToCsv<T>(
  filename: string,
  data: T[],
  columns: CsvColumn<T>[]
): boolean {
  try {
    const escapeCell = (value: unknown): string => {
      if (value === null || value === undefined) return '""';
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerRow = columns.map((col) => escapeCell(col.header)).join(',');
    const dataRows = data.map((item) =>
      columns.map((col) => escapeCell(col.accessor(item))).join(',')
    );

    const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to export CSV:', err);
    return false;
  }
}
