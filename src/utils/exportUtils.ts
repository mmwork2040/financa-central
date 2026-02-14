
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
 * @param data Array of objects to display
 * @param headers Column headers mapping
 * @param title PDF title
 * @param filename Output filename (without extension)
 */
export const generatePDFView = <T extends Record<string, any>>(
  data: T[],
  headers: Record<keyof T, string>,
  title: string,
  subtitle?: string
): void => {
  try {
    // Open new window for PDF preview
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      throw new Error("Não foi possível abrir uma nova janela para o PDF.");
    }
    
    // Define styles for PDF view
    const style = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        h3 { color: #555; text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    `;
    
    // Generate table rows from data
    let tableRows = "";
    data.forEach(item => {
      tableRows += "<tr>";
      Object.keys(headers).forEach(key => {
        // Format values appropriately
        let value = item[key];
        if (value === null || value === undefined) value = "-";
        else if (value instanceof Date) value = value.toLocaleDateString();
        tableRows += `<td>${value}</td>`;
      });
      tableRows += "</tr>";
    });
    
    // Build the HTML document for the PDF view
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        ${style}
      </head>
      <body>
        <h1>${title}</h1>
        ${subtitle ? `<h3>${subtitle}</h3>` : ''}
        <p>Data de geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        
        <table>
          <thead>
            <tr>
              ${Object.values(headers).map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Sistema Financeiro - Relatório gerado automaticamente</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Allow time for styles to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    toast.success("Visualização PDF gerada com sucesso");
  } catch (error: any) {
    toast.error(`Erro ao gerar PDF: ${error.message}`);
  }
};
