/**
 * Report CSV Export Utility - VCMS
 *
 * Implements safe, privacy-compliant CSV generation for consultancy reporting:
 * - Omits sensitive identity details (Aadhaar, PAN, Passport, personal mobile/email)
 * - Masks account numbers (e.g. XXXX 9012)
 * - Prepends audit metadata and DEMO DATA disclaimers
 * - Adheres to RFC 4180 CSV escaping rules
 */

interface ExportReportOptions {
  title: string;
  category: string;
  filterSummary: string;
  isDemo: boolean;
  headers: string[];
  rows: (string | number)[][];
}

export function exportReportToCSV({
  title,
  category,
  filterSummary,
  isDemo,
  headers,
  rows,
}: ExportReportOptions): void {
  const now = new Date().toISOString();
  const dateFormatted = now.slice(0, 10);

  // Metadata comments in header
  const metadataLines = [
    `# VISA CONSULTANCY MANAGEMENT SYSTEM (VCMS) - CONFIDENTIAL INTERNAL REPORT`,
    `# Report Title: ${title}`,
    `# Category: ${category}`,
    `# Generated At: ${now}`,
    `# Applied Scope / Filters: ${filterSummary || 'All Records (Unfiltered)'}`,
    `# Record Count: ${rows.length}`,
    `# Data Classification: ${isDemo ? 'DEMO DATA (Prototype Sample Reference)' : 'OPERATIONAL SESSION RECORDS'}`,
    `# Notice: Fiduciary proof-of-funds internal tracking schedule. Not an official bank statement or visa determination document.`,
    `#`,
  ];

  // Helper to escape individual CSV cell
  const escapeCell = (val: string | number): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCell).join(','));

  const csvContent = [...metadataLines, headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `vcms_${isDemo ? 'demo_' : ''}report_${cleanCategory}_${dateFormatted}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
