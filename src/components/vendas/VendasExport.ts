import { exportToCSV, generatePDFView } from "@/utils/exportUtils";
import { formatCurrency, formatDate } from "@/utils/formatters";

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

export const exportVendas = (vendas: any[], formato: "csv" | "pdf") => {
  const mapped = vendas.map((v) => ({
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

  if (formato === "csv") {
    exportToCSV(mapped, headers as any, "vendas");
  } else {
    generatePDFView(mapped, headers as any, "Relatório de Vendas", "Exportação para contabilidade");
  }
};
