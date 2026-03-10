import { toast } from "sonner";

const now = () => {
  const d = new Date();
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR")}`;
};

export type PdfEmpresaInfo = {
  nome: string;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
};

export type PdfSummaryCard = {
  label: string;
  value: string;
  color?: string; // CSS color
};

export type PdfColumn = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
};

export type PdfBadgeMap = Record<string, { bg: string; color: string }>;

export interface PdfOptions {
  title: string;
  subtitle?: string;
  empresa?: PdfEmpresaInfo;
  columns: PdfColumn[];
  rows: Record<string, string>[];
  summaryCards?: PdfSummaryCard[];
  summaryCards2?: PdfSummaryCard[];
  badgeColumns?: Record<string, PdfBadgeMap>;
  totalCount?: number;
  footerNote?: string;
}

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 24px; font-size: 11px; }
.header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; }
.header h1 { font-size: 18px; margin-bottom: 4px; }
.header p { color: #555; font-size: 11px; }
.empresa-info { text-align: center; margin-bottom: 8px; }
.empresa-info h2 { font-size: 15px; color: #333; margin-bottom: 4px; }
.empresa-details { font-size: 10px; color: #555; display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
.summary-grid { display: grid; gap: 10px; margin-bottom: 20px; }
.summary-card { border: 1px solid #ddd; border-radius: 6px; padding: 10px; text-align: center; }
.summary-card .label { font-size: 10px; color: #666; text-transform: uppercase; }
.summary-card .value { font-size: 14px; font-weight: 700; margin-top: 2px; }
table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
th { background: #f3f4f6; font-weight: 600; text-align: left; padding: 6px 4px; border-bottom: 2px solid #d1d5db; white-space: nowrap; }
td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; }
tr:nth-child(even) { background: #fafafa; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.footer { margin-top: 24px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 8px; }
.badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
@media print { body { padding: 10px; } }
`;

function buildEmpresaHtml(e?: PdfEmpresaInfo): string {
  if (!e) return "";
  return `
    <div class="empresa-info">
      <h2>${e.nome}</h2>
      <div class="empresa-details">
        ${e.cnpj ? `<span><strong>CNPJ:</strong> ${e.cnpj}</span>` : ""}
        ${e.email ? `<span><strong>Email:</strong> ${e.email}</span>` : ""}
        ${e.telefone ? `<span><strong>Tel:</strong> ${e.telefone}</span>` : ""}
      </div>
      ${e.endereco ? `<div class="empresa-details"><span><strong>Endereço:</strong> ${e.endereco}</span></div>` : ""}
    </div>
  `;
}

function buildSummaryGrid(cards: PdfSummaryCard[]): string {
  if (!cards.length) return "";
  const cols = Math.min(cards.length, 4);
  return `
    <div class="summary-grid" style="grid-template-columns: repeat(${cols}, 1fr);">
      ${cards.map((c) => `<div class="summary-card"><div class="label">${c.label}</div><div class="value" style="color:${c.color || '#1a1a1a'}">${c.value}</div></div>`).join("")}
    </div>
  `;
}

export function generateStyledPDF(opts: PdfOptions): void {
  try {
    if (!opts.rows.length) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    const thRow = opts.columns
      .map((c) => `<th class="${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""}">${c.header}</th>`)
      .join("");

    const bodyRows = opts.rows
      .map((row) => {
        const cells = opts.columns
          .map((c) => {
            let val = row[c.key] || "-";
            const badges = opts.badgeColumns?.[c.key];
            if (badges) {
              const key = val.toLowerCase();
              const badge = badges[key];
              if (badge) {
                val = `<span class="badge" style="background:${badge.bg};color:${badge.color}">${val}</span>`;
              }
            }
            return `<td class="${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""}">${val}</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${opts.title}</title>
<style>${CSS}</style>
</head>
<body>
  <div class="header">
    ${buildEmpresaHtml(opts.empresa)}
    <h1>${opts.title}</h1>
    <p>${opts.subtitle ? `${opts.subtitle} &mdash; ` : ""}Gerado em ${now()}</p>
    ${opts.totalCount !== undefined ? `<p>Total de registros: ${opts.totalCount}</p>` : `<p>Total de registros: ${opts.rows.length}</p>`}
  </div>

  ${opts.summaryCards ? buildSummaryGrid(opts.summaryCards) : ""}
  ${opts.summaryCards2 ? buildSummaryGrid(opts.summaryCards2) : ""}

  <table>
    <thead><tr>${thRow}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>

  <div class="footer">
    <p>${opts.empresa ? opts.empresa.nome + " &mdash; " : ""}${opts.footerNote || "Relatório para fins de contabilidade e gestão"}</p>
    <p>Documento gerado eletronicamente em ${now()}</p>
  </div>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);

    toast.success(`${opts.title} gerado com sucesso`);
  } catch (e: any) {
    toast.error(`Erro ao gerar PDF: ${e.message}`);
  }
}
