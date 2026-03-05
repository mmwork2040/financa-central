import { formatCurrency, formatDate } from "@/utils/formatters";
import { toast } from "sonner";

type LancamentoExport = {
  descricao: string;
  tipo: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  categoria?: { nome: string } | null;
  fornecedor?: { nome: string } | null;
  cliente?: { nome: string } | null;
  projeto?: { nome: string } | null;
  origem?: string;
  recorrente: boolean;
  recorrencia_tipo?: string | null;
  parcela_atual?: number | null;
  total_parcelas?: number | null;
  conta_bancaria_nome?: string;
  forma_pagamento_nome?: string;
};

export type EmpresaExportInfo = {
  nome: string;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
};

const statusLabel = (s: string, tipo: string) => {
  if (s === "recebido" && tipo === "receita") return "Recebido";
  if (s === "pago") return "Pago";
  if (s === "pendente") return "Pendente";
  if (s === "cancelado") return "Cancelado";
  return s;
};

const tipoLabel = (t: string) => {
  if (t === "receita") return "Receita";
  if (t === "despesa") return "Despesa";
  if (t === "investimento") return "Investimento";
  return t;
};

const buildRows = (lancamentos: LancamentoExport[]) =>
  lancamentos.map((l) => ({
    descricao: l.descricao || "-",
    tipo: tipoLabel(l.tipo),
    valor: formatCurrency(l.valor),
    data_vencimento: formatDate(l.data_vencimento),
    data_pagamento: l.data_pagamento ? formatDate(l.data_pagamento) : "-",
    status: statusLabel(l.status, l.tipo),
    categoria: l.categoria?.nome || "-",
    cliente_fornecedor: l.tipo === "receita" ? (l.cliente?.nome || "-") : (l.fornecedor?.nome || "-"),
    conta_bancaria: l.conta_bancaria_nome || "-",
    forma_pagamento: l.forma_pagamento_nome || "-",
    projeto: l.projeto?.nome || "-",
    origem: l.origem === "manual" ? "Manual" : l.origem || "-",
    parcelas: l.total_parcelas ? `${l.parcela_atual || 1}/${l.total_parcelas}` : l.recorrente ? "Recorrente" : "-",
  }));

const csvHeaders: Record<string, string> = {
  descricao: "Descrição",
  tipo: "Tipo",
  valor: "Valor",
  data_vencimento: "Vencimento",
  data_pagamento: "Pagamento",
  status: "Status",
  categoria: "Categoria",
  cliente_fornecedor: "Cliente/Fornecedor",
  conta_bancaria: "Conta Bancária",
  forma_pagamento: "Forma de Pagamento",
  projeto: "Projeto",
  origem: "Origem",
  parcelas: "Parcelas",
};

const now = () => {
  const d = new Date();
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR")}`;
};

const empresaBlock = (e?: EmpresaExportInfo) => {
  if (!e) return "";
  const parts: string[] = [];
  parts.push(`Empresa: ${e.nome}`);
  if (e.cnpj) parts.push(`CNPJ: ${e.cnpj}`);
  if (e.email) parts.push(`Email: ${e.email}`);
  if (e.telefone) parts.push(`Telefone: ${e.telefone}`);
  if (e.endereco) parts.push(`Endereço: ${e.endereco}`);
  return parts.join(" | ");
};

// ──── CSV ────
export const exportLancamentosCSV = (lancamentos: LancamentoExport[], empresa?: EmpresaExportInfo) => {
  try {
    if (!lancamentos.length) {
      toast.error("Nenhum lançamento para exportar");
      return;
    }
    const rows = buildRows(lancamentos);
    let csv = "\uFEFF"; // BOM for Excel UTF-8

    // Company identification header
    if (empresa) {
      csv += `"IDENTIFICAÇÃO DA EMPRESA",,,,,,,,,,,,\n`;
      csv += `"Razão Social / Nome","${empresa.nome}",,,,,,,,,,\n`;
      if (empresa.cnpj) csv += `"CNPJ","${empresa.cnpj}",,,,,,,,,,\n`;
      if (empresa.email) csv += `"Email","${empresa.email}",,,,,,,,,,\n`;
      if (empresa.telefone) csv += `"Telefone","${empresa.telefone}",,,,,,,,,,\n`;
      if (empresa.endereco) csv += `"Endereço","${empresa.endereco}",,,,,,,,,,\n`;
      csv += `"Data/Hora da Geração","${now()}",,,,,,,,,,\n`;
      csv += `,,,,,,,,,,,,\n`;
    }

    const headerRow = Object.values(csvHeaders).join(",");
    csv += headerRow + "\n";

    rows.forEach((row) => {
      const line = Object.keys(csvHeaders)
        .map((k) => `"${String((row as any)[k]).replace(/"/g, '""')}"`)
        .join(",");
      csv += line + "\n";
    });

    // Summary rows
    const totalReceitas = lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
    const totalDespesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
    const totalInvestimentos = lancamentos.filter((l) => l.tipo === "investimento").reduce((s, l) => s + l.valor, 0);
    const totalPagos = lancamentos.filter((l) => ["pago", "recebido"].includes(l.status)).reduce((s, l) => s + l.valor, 0);
    const totalPendentes = lancamentos.filter((l) => l.status === "pendente").reduce((s, l) => s + l.valor, 0);

    csv += "\n";
    csv += `"RESUMO GERAL",,,,,,,,,,,,\n`;
    csv += `"Total de Lançamentos","${lancamentos.length}",,,,,,,,,,\n`;
    csv += `"Total Receitas","${formatCurrency(totalReceitas)}",,,,,,,,,,\n`;
    csv += `"Total Despesas","${formatCurrency(totalDespesas)}",,,,,,,,,,\n`;
    csv += `"Total Investimentos","${formatCurrency(totalInvestimentos)}",,,,,,,,,,\n`;
    csv += `"Saldo (Receitas - Despesas)","${formatCurrency(totalReceitas - totalDespesas)}",,,,,,,,,,\n`;
    csv += `"Total Pagos/Recebidos","${formatCurrency(totalPagos)}",,,,,,,,,,\n`;
    csv += `"Total Pendentes","${formatCurrency(totalPendentes)}",,,,,,,,,,\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lancamentos_contabil_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Exportação CSV contábil gerada com sucesso");
  } catch (e: any) {
    toast.error(`Erro ao exportar CSV: ${e.message}`);
  }
};

// ──── PDF ────
export const exportLancamentosPDF = (lancamentos: LancamentoExport[], periodoLabel?: string, empresa?: EmpresaExportInfo) => {
  try {
    if (!lancamentos.length) {
      toast.error("Nenhum lançamento para exportar");
      return;
    }

    const totalReceitas = lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
    const totalDespesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
    const totalInvestimentos = lancamentos.filter((l) => l.tipo === "investimento").reduce((s, l) => s + l.valor, 0);
    const totalPagos = lancamentos.filter((l) => ["pago", "recebido"].includes(l.status)).reduce((s, l) => s + l.valor, 0);
    const totalPendentes = lancamentos.filter((l) => l.status === "pendente").reduce((s, l) => s + l.valor, 0);
    const saldo = totalReceitas - totalDespesas;

    const rows = buildRows(lancamentos);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    const empresaHtml = empresa ? `
      <div class="empresa-info">
        <h2>${empresa.nome}</h2>
        <div class="empresa-details">
          ${empresa.cnpj ? `<span><strong>CNPJ:</strong> ${empresa.cnpj}</span>` : ""}
          ${empresa.email ? `<span><strong>Email:</strong> ${empresa.email}</span>` : ""}
          ${empresa.telefone ? `<span><strong>Tel:</strong> ${empresa.telefone}</span>` : ""}
        </div>
        ${empresa.endereco ? `<div class="empresa-details"><span><strong>Endereço:</strong> ${empresa.endereco}</span></div>` : ""}
      </div>
    ` : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Contábil de Lançamentos</title>
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
  .investimento { color: #2563eb; }
  .saldo { color: ${saldo >= 0 ? "#16a34a" : "#dc2626"}; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
  th { background: #f3f4f6; font-weight: 600; text-align: left; padding: 6px 4px; border-bottom: 2px solid #d1d5db; white-space: nowrap; }
  td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) { background: #fafafa; }
  .text-right { text-align: right; }
  .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
  .badge-receita { background: #dcfce7; color: #166534; }
  .badge-despesa { background: #fee2e2; color: #991b1b; }
  .badge-investimento { background: #dbeafe; color: #1e40af; }
  .badge-pago, .badge-recebido { background: #dcfce7; color: #166534; }
  .badge-pendente { background: #fef9c3; color: #854d0e; }
  .badge-cancelado { background: #fee2e2; color: #991b1b; }
  @media print { body { padding: 10px; } .summary-grid { grid-template-columns: repeat(4, 1fr); } }
</style>
</head>
<body>
  <div class="header">
    ${empresaHtml}
    <h1>Relatório Contábil de Lançamentos</h1>
    <p>${periodoLabel ? `Período: ${periodoLabel} &mdash; ` : ""}Gerado em ${now()}</p>
    <p>Total de registros: ${lancamentos.length}</p>
  </div>

  <div class="summary-grid">
    <div class="summary-card"><div class="label">Total Receitas</div><div class="value receita">${formatCurrency(totalReceitas)}</div></div>
    <div class="summary-card"><div class="label">Total Despesas</div><div class="value despesa">${formatCurrency(totalDespesas)}</div></div>
    <div class="summary-card"><div class="label">Total Investimentos</div><div class="value investimento">${formatCurrency(totalInvestimentos)}</div></div>
    <div class="summary-card"><div class="label">Saldo</div><div class="value saldo">${formatCurrency(saldo)}</div></div>
  </div>

  <div class="summary-grid" style="grid-template-columns: repeat(2, 1fr);">
    <div class="summary-card"><div class="label">Total Pagos / Recebidos</div><div class="value">${formatCurrency(totalPagos)}</div></div>
    <div class="summary-card"><div class="label">Total Pendentes</div><div class="value" style="color:#ca8a04;">${formatCurrency(totalPendentes)}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descrição</th><th>Tipo</th><th class="text-right">Valor</th><th>Vencimento</th><th>Pagamento</th>
        <th>Status</th><th>Categoria</th><th>Cliente/Forn.</th><th>Conta</th><th>Forma Pgto</th><th>Projeto</th><th>Parcelas</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (r) => `<tr>
        <td>${r.descricao}</td>
        <td><span class="badge badge-${r.tipo.toLowerCase()}">${r.tipo}</span></td>
        <td class="text-right">${r.valor}</td>
        <td>${r.data_vencimento}</td>
        <td>${r.data_pagamento}</td>
        <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
        <td>${r.categoria}</td>
        <td>${r.cliente_fornecedor}</td>
        <td>${r.conta_bancaria}</td>
        <td>${r.forma_pagamento}</td>
        <td>${r.projeto}</td>
        <td>${r.parcelas}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>${empresa ? empresa.nome + " &mdash; " : ""}Relatório para fins de contabilidade e conciliação bancária</p>
    <p>Documento gerado eletronicamente em ${now()}</p>
  </div>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);

    toast.success("Relatório PDF contábil gerado com sucesso");
  } catch (e: any) {
    toast.error(`Erro ao gerar PDF: ${e.message}`);
  }
};
