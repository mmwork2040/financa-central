
import { toast } from "sonner";

/**
 * Generic function to export data to CSV format
 * @param data Array of objects to export
 * @param headers Column headers mapping
 * @param filename Output filename (without extension)
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  headers: Record<keyof T, string>,
  filename: string
): void => {
  try {
    // Prepare CSV header row
    const headerRow = Object.values(headers).join(",");
    
    // Prepare CSV content with headers
    let csvContent = "data:text/csv;charset=utf-8," + headerRow + "\n";
    
    // Add data rows
    data.forEach(item => {
      const row = Object.keys(headers)
        .map(key => {
          // Handle special formatting for dates, nulls, etc.
          const value = item[key];
          if (value === null || value === undefined) return '""';
          if (value instanceof Date) return `"${value.toLocaleDateString()}"`;
          // Escape quotes and wrap in quotes to handle commas in values
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",");
      csvContent += row + "\n";
    });
    
    // Create download link and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    toast.success("Exportação CSV concluída com sucesso");
  } catch (error: any) {
    toast.error(`Erro ao exportar CSV: ${error.message}`);
  }
};

/**
 * Generic function to generate PDF view from data
 * Now delegates to the shared styled PDF template.
 */
export const generatePDFView = <T extends Record<string, any>>(
  data: T[],
  headers: Record<keyof T, string>,
  title: string,
  subtitle?: string
): void => {
  const { generateStyledPDF } = require("@/utils/pdfTemplate");
  const keys = Object.keys(headers) as (keyof T)[];
  generateStyledPDF({
    title,
    subtitle,
    columns: keys.map((k) => ({ key: String(k), header: String(headers[k]) })),
    rows: data.map((item) => {
      const row: Record<string, string> = {};
      keys.forEach((k) => {
        let val = item[k];
        if (val === null || val === undefined) val = "-";
        else if (val instanceof Date) val = val.toLocaleDateString();
        row[String(k)] = String(val);
      });
      return row;
    }),
  });
};
