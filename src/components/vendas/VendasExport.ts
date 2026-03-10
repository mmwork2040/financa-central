import { exportToCSV } from "@/utils/exportUtils";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { toast } from "sonner";

export type EmpresaVendaExportInfo = {
  nome: string;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
};

const headers = {
  data_venda: "Data da Venda",
  produto: "Produto",
  cliente: "Cliente",
  cliente_documento: "Documento",
  cliente_email: "Email",
  cliente_telefone: "Telefone",
  valor_bruto: "Valor Bruto",
  taxa: "Taxa",
  valor_liquido: "Valor Líquido",
  status: "Status",
  plataforma: "Plataforma",
  observacoes: "Observações",
};

const now = () => {
  const d = new Date();
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR")}`;
};

const mapRows = (vendas: any[]) =>
  vendas.map((v) => ({
    data_venda: formatDate(v.data_venda),
    produto: v.produto || "-",
    cliente: v.cliente || "-",
    cliente_documento: v.cliente_documento || "-",
    cliente_email: v.cliente_email || "-",
    cliente_telefone: v.cliente_telefone || "-",
    valor_bruto: formatCurrency(v.valor_bruto),
    taxa: formatCurrency(v.taxa),
    valor_liquido: formatCurrency(v.valor_liquido),
    status: v.status || "-",
    plataforma: v.plataforma || "-",
    observacoes: v.observacoes || "-",
  }));

export const exportVendas = (vendas: any[], formato: "csv" | "pdf", empresa?: EmpresaVendaExportInfo) => {
  if (formato === "csv") {
    const mapped = mapRows(vendas);
    exportToCSV(mapped, headers as any, "vendas");
  } else {
    exportVendasPDF(vendas, empresa);
  }
};

const exportVendasPDF = (vendas: any[], empresa?: EmpresaVendaExportInfo) => {
  try {
    if (!vendas.length) {
      toast.error("Nenhuma venda para exportar");
      return;
    }

    const totalBruto = vendas.reduce((s, v) => s + (v.valor_bruto || 0), 0);
    const totalTaxas = vendas.reduce((s, v) => s + (v.taxa || 0), 0);
    const totalLiquido = vendas.reduce((s, v) => s + (v.valor_liquido || 0), 0);
    const aprovadas = vendas.filter((v) => v.status === "aprovada");
    const pendentes = vendas.filter((v) => v.status === "pendente");
    const canceladas = vendas.filter((v) => v.status === "cancelada" || v.status === "reembolsada");

    const rows = mapRows(vendas);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    const empresaHtml = empresa
      ? `
      <div class="empresa-info">
        <h2>${empresa.nome}</h2>
        <div class="empresa-details">
          ${empresa.cnpj ? `<span><strong>CNPJ:</strong> ${empresa.cnpj}</span>` : ""}
          ${empresa.email ? `<span><strong>Email:</strong> ${empresa.email}</span>` : ""}
          ${empresa.telefone ? `<span><strong>Tel:</strong> ${empresa.telefone}</span>` : ""}
        </div>
        ${empresa.endereco ? `<div class="empresa-details"><span><strong>Endereço:</strong> ${empresa.endereco}</span></div>` : ""}
      </div>
    `
      : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Vendas Digitais</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 24px; font-size: 11px; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; }
  .header h1 { font-size: 18px; margin-bottom: 4px; }
  .header p { color: #555; font-size: 11px; }
  .empresa-info { text-align: center; margin-bottom: 8px; }
  .empresa-info h2 { font-size: 15px; color: #333; margin-bottom: 4px; }
  .empresa-details { font-size: 10px; color: #555; display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .summary-card { border: 1px solid #ddd; border-radius: 6px; padding: 10px; text-align: center; }
  .summary-card .label { font-size: 10px; color: #666; text-transform: uppercase; }
  .summary-card .value { font-size: 14px; font-weight: 700; margin-top: 2px; }
  .receita { color: #16a34a; }
  .despesa { color: #dc2626; }
  .taxa { color: #ea580c; }
  .liquido { color: #2563eb; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
  th { background: #f3f4f6; font-weight: 600; text-align: left; padding: 6px 4px; border-bottom: 2px solid #d1d5db; white-space: nowrap; }
  td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) { background: #fafafa; }
  .text-right { text-align: right; }
  .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
  .badge-aprovada { background: #dcfce7; color: #166534; }
  .badge-pendente { background: #fef9c3; color: #854d0e; }
  .badge-cancelada, .badge-reembolsada { background: #fee2e2; color: #991b1b; }
  @media print { body { padding: 10px; } .summary-grid { grid-template-columns: repeat(4, 1fr); } }
</style>
</head>
<body>
  <div class="header">
    ${empresaHtml}
    <h1>Relatório de Vendas Digitais</h1>
    <p>Gerado em ${now()}</p>
    <p>Total de registros: ${vendas.length}</p>
  </div>

  <div class="summary-grid">
    <div class="summary-card"><div class="label">Total Bruto</div><div class="value receita">${formatCurrency(totalBruto)}</div></div>
    <div class="summary-card"><div class="label">Total Taxas</div><div class="value taxa">${formatCurrency(totalTaxas)}</div></div>
    <div class="summary-card"><div class="label">Total Líquido</div><div class="value liquido">${formatCurrency(totalLiquido)}</div></div>
    <div class="summary-card"><div class="label">Margem Líquida</div><div class="value">${totalBruto > 0 ? ((totalLiquido / totalBruto) * 100).toFixed(1) : "0.0"}%</div></div>
  </div>

  <div class="summary-grid" style="grid-template-columns: repeat(3, 1fr);">
    <div class="summary-card"><div class="label">Aprovadas</div><div class="value receita">${aprovadas.length}</div></div>
    <div class="summary-card"><div class="label">Pendentes</div><div class="value" style="color:#ca8a04;">${pendentes.length}</div></div>
    <div class="summary-card"><div class="label">Canceladas / Reembolsadas</div><div class="value despesa">${canceladas.length}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Data</th><th>Produto</th><th>Cliente</th><th>Documento</th>
        <th class="text-right">Bruto</th><th class="text-right">Taxa</th><th class="text-right">Líquido</th>
        <th>Status</th><th>Plataforma</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (r) => `<tr>
        <td>${r.data_venda}</td>
        <td>${r.produto}</td>
        <td>${r.cliente}</td>
        <td>${r.cliente_documento}</td>
        <td class="text-right">${r.valor_bruto}</td>
        <td class="text-right">${r.taxa}</td>
        <td class="text-right">${r.valor_liquido}</td>
        <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
        <td>${r.plataforma}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>${empresa ? empresa.nome + " &mdash; " : ""}Relatório para fins de contabilidade e conciliação</p>
    <p>Documento gerado eletronicamente em ${now()}</p>
  </div>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);

    toast.success("Relatório PDF de vendas gerado com sucesso");
  } catch (e: any) {
    toast.error(`Erro ao gerar PDF: ${e.message}`);
  }
};
