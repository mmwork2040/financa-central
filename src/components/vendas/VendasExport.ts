import { exportToCSV } from "@/utils/exportUtils";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { generateStyledPDF, PdfEmpresaInfo } from "@/utils/pdfTemplate";

export type EmpresaVendaExportInfo = PdfEmpresaInfo;

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
  valor_comissao: "Minha Comissão",
  status: "Status",
  plataforma: "Plataforma",
  observacoes: "Observações",
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
    valor_comissao: formatCurrency(v.valor_comissao || v.valor_liquido),
    status: v.status || "-",
    plataforma: v.plataforma || "-",
    observacoes: v.observacoes || "-",
  }));

export const exportVendas = (vendas: any[], formato: "csv" | "pdf", empresa?: EmpresaVendaExportInfo) => {
  if (formato === "csv") {
    const mapped = mapRows(vendas);
    exportToCSV(mapped, headers as any, "vendas");
  } else {
    const totalBruto = vendas.reduce((s, v) => s + (v.valor_bruto || 0), 0);
    const totalTaxas = vendas.reduce((s, v) => s + (v.taxa || 0), 0);
    const totalLiquido = vendas.reduce((s, v) => s + (v.valor_liquido || 0), 0);
    const aprovadas = vendas.filter((v) => v.status === "aprovada").length;
    const pendentes = vendas.filter((v) => v.status === "pendente").length;
    const canceladas = vendas.filter((v) => v.status === "cancelada" || v.status === "reembolsada").length;

    generateStyledPDF({
      title: "Relatório de Vendas Digitais",
      empresa,
      summaryCards: [
        { label: "Total Bruto", value: formatCurrency(totalBruto), color: "#16a34a" },
        { label: "Total Taxas", value: formatCurrency(totalTaxas), color: "#ea580c" },
        { label: "Total Líquido", value: formatCurrency(totalLiquido), color: "#2563eb" },
        { label: "Margem Líquida", value: totalBruto > 0 ? ((totalLiquido / totalBruto) * 100).toFixed(1) + "%" : "0.0%" },
      ],
      summaryCards2: [
        { label: "Aprovadas", value: String(aprovadas), color: "#16a34a" },
        { label: "Pendentes", value: String(pendentes), color: "#ca8a04" },
        { label: "Canceladas / Reembolsadas", value: String(canceladas), color: "#dc2626" },
      ],
      columns: [
        { key: "data_venda", header: "Data" },
        { key: "produto", header: "Produto" },
        { key: "cliente", header: "Cliente" },
        { key: "cliente_documento", header: "Documento" },
        { key: "valor_bruto", header: "Bruto", align: "right" },
        { key: "taxa", header: "Taxa", align: "right" },
        { key: "valor_liquido", header: "Líquido", align: "right" },
        { key: "status", header: "Status" },
        { key: "plataforma", header: "Plataforma" },
      ],
      rows: mapRows(vendas),
      badgeColumns: {
        status: {
          aprovada: { bg: "#dcfce7", color: "#166534" },
          pendente: { bg: "#fef9c3", color: "#854d0e" },
          cancelada: { bg: "#fee2e2", color: "#991b1b" },
          reembolsada: { bg: "#fee2e2", color: "#991b1b" },
        },
      },
    });
  }
};
