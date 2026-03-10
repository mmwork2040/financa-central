
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import FeatureBlocked from "@/components/common/FeatureBlocked";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { generateStyledPDF } from "@/utils/pdfTemplate";
import { formatCurrency } from "@/utils/formatters";
import { Eye, EyeOff, BarChart3, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

import FluxoCaixaChart from "@/components/relatorios/FluxoCaixaChart";
import ResumoFinanceiro from "@/components/relatorios/ResumoFinanceiro";
import TrendAnalysis from "@/components/relatorios/TrendAnalysis";
import CategoryPieChart from "@/components/relatorios/CategoryPieChart";
import CategoryDataTable from "@/components/relatorios/CategoryDataTable";
import ExportDropdown from "@/components/common/ExportDropdown";
import PredictiveAnalysis from "@/components/relatorios/PredictiveAnalysis";
import ReconciliationView from "@/components/relatorios/ReconciliationView";
import CaixaView from "@/components/relatorios/CaixaView";
import FechamentoCiclo from "@/components/relatorios/FechamentoCiclo";

import { useRelatoriosData } from "@/hooks/useRelatoriosData";
import { ValuesVisibilityProvider, useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

const RelatoriosContent = () => {
  const { visible, toggle } = useValuesVisibility();
  const [periodo, setPeriodo] = useState("mes");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const { loading, dataReceitas, dataDespesas, dataFluxo, receitasExecutadas, receitasPrevistas, despesasExecutadas, despesasPrevistas, fetchRelatoriosData } = useRelatoriosData(
    periodo,
    customStart,
    customEnd
  );

  useEffect(() => {
    fetchRelatoriosData();
  }, []);

  const COLORS_RECEITAS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5", "#ecfdf5"];
  const COLORS_DESPESAS = ["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2", "#fef2f2"];

  const exportToCSV = () => {
    try {
      let data: any[] = [];
      let filename = "";
      let headers = "";

      // default to fluxo
      data = dataFluxo.map(item => ({
        periodo: item.name,
        receitas: item.receitas,
        despesas: item.despesas,
        saldo: item.receitas - item.despesas,
      }));
      headers = "Período,Receitas,Despesas,Saldo\n";
      filename = `fluxo-caixa_${new Date().toISOString().split("T")[0]}.csv`;

      let csvContent = "data:text/csv;charset=utf-8," + headers;
      data.forEach(item => {
        const row = Object.values(item)
          .map(v => (typeof v === "number" ? v.toString().replace(".", ",") : v))
          .join(",");
        csvContent += row + "\n";
      });

      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Relatório exportado em formato CSV");
    } catch (error: any) {
      toast.error(`Erro ao exportar: ${error.message}`);
    }
  };

  const generatePDF = () => {
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Não foi possível abrir janela");

      const totalReceitas = dataFluxo.reduce((s, i) => s + i.receitas, 0);
      const totalDespesas = dataFluxo.reduce((s, i) => s + i.despesas, 0);
      const saldo = totalReceitas - totalDespesas;

      const rows = dataFluxo
        .map(
          i => `<tr><td>${i.name}</td><td class="r">${i.receitas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td><td class="d">${i.despesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td><td class="${i.receitas - i.despesas >= 0 ? "r" : "d"}">${(i.receitas - i.despesas).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td></tr>`
        )
        .join("");

      printWindow.document.write(`<!DOCTYPE html><html><head><title>Relatório</title><style>body{font-family:Arial;margin:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f2f2f2}.r{color:green}.d{color:red}</style></head><body><h1>Relatório Financeiro</h1><table><thead><tr><th>Período</th><th>Receitas</th><th>Despesas</th><th>Saldo</th></tr></thead><tbody>${rows}</tbody></table><p><strong>Total Receitas:</strong> ${totalReceitas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><p><strong>Total Despesas:</strong> ${totalDespesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><p><strong>Saldo:</strong> ${saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></body></html>`);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
      toast.success("Relatório gerado");
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleExport = (f: "csv" | "pdf") => (f === "csv" ? exportToCSV() : generatePDF());

  const totalReceitas = receitasExecutadas + receitasPrevistas;
  const totalDespesas = despesasExecutadas + despesasPrevistas;

  const handlePeriodoChange = (v: string) => {
    setPeriodo(v);
    if (v !== "personalizado") {
      setCustomStart(undefined);
      setCustomEnd(undefined);
    }
  };

  const periodoLabel = (p: string) => {
    const map: Record<string, string> = {
      mes: "Último mês",
      trimestre: "Último trimestre",
      semestre: "Último semestre",
      ano: "Último ano",
      proximo_mes: "Próximo mês",
      proximos_3: "Próximos 3 meses",
      proximos_6: "Próximos 6 meses",
      proximos_12: "Próximos 12 meses",
      personalizado: "Personalizado",
    };
    return map[p] || p;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Relatórios</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Análise detalhada das suas finanças</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="icon" onClick={toggle} title={visible ? "Ocultar valores" : "Exibir valores"}>
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Select value={periodo} onValueChange={handlePeriodoChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Passado</SelectLabel>
                <SelectItem value="mes">Último mês</SelectItem>
                <SelectItem value="trimestre">Último trimestre</SelectItem>
                <SelectItem value="semestre">Último semestre</SelectItem>
                <SelectItem value="ano">Último ano</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Futuro</SelectLabel>
                <SelectItem value="proximo_mes">Próximo mês</SelectItem>
                <SelectItem value="proximos_3">Próximos 3 meses</SelectItem>
                <SelectItem value="proximos_6">Próximos 6 meses</SelectItem>
                <SelectItem value="proximos_12">Próximos 12 meses</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Outros</SelectLabel>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {periodo === "personalizado" && (
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[120px] justify-start text-left text-xs", !customStart && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {customStart ? format(customStart, "dd/MM/yy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customStart} onSelect={setCustomStart} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[120px] justify-start text-left text-xs", !customEnd && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {customEnd ? format(customEnd, "dd/MM/yy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <ExportDropdown onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Carregando dados...</p>
        </div>
      ) : (
        <Tabs defaultValue="fluxo" className="space-y-4">
          <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="fluxo" className="text-xs sm:text-sm">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="receitas" className="text-xs sm:text-sm">Receitas</TabsTrigger>
            <TabsTrigger value="despesas" className="text-xs sm:text-sm">Despesas</TabsTrigger>
            <TabsTrigger value="fechamento" className="text-xs sm:text-sm">Fechamento</TabsTrigger>
            <TabsTrigger value="preditivo" className="text-xs sm:text-sm">Preditivo</TabsTrigger>
            <TabsTrigger value="caixa" className="text-xs sm:text-sm">Caixa</TabsTrigger>
            <TabsTrigger value="conciliacao" className="text-xs sm:text-sm">Conciliação</TabsTrigger>
          </TabsList>

          <TabsContent value="fluxo" className="space-y-4">
            <FluxoCaixaChart data={dataFluxo} />
            <div className="grid gap-4 md:grid-cols-2">
              <ResumoFinanceiro totalReceitas={totalReceitas} totalDespesas={totalDespesas} receitasExecutadas={receitasExecutadas} receitasPrevistas={receitasPrevistas} despesasExecutadas={despesasExecutadas} despesasPrevistas={despesasPrevistas} />
              <TrendAnalysis dataFluxo={dataFluxo} periodo={periodo} totalReceitas={totalReceitas} totalDespesas={totalDespesas} />
            </div>
          </TabsContent>

          <TabsContent value="receitas" className="space-y-4">
            <CategoryPieChart data={dataReceitas} title="Receitas por Categoria" description="Distribuição das receitas" colors={COLORS_RECEITAS} emptyMessage="Nenhuma receita no período" />
            <CategoryDataTable data={dataReceitas} colors={COLORS_RECEITAS} />
          </TabsContent>

          <TabsContent value="despesas" className="space-y-4">
            <CategoryPieChart data={dataDespesas} title="Despesas por Categoria" description="Distribuição das despesas" colors={COLORS_DESPESAS} emptyMessage="Nenhuma despesa no período" />
            <CategoryDataTable data={dataDespesas} colors={COLORS_DESPESAS} />
          </TabsContent>

          <TabsContent value="fechamento" className="space-y-4">
            <FechamentoCiclo />
          </TabsContent>

          <TabsContent value="preditivo" className="space-y-4">
            <PredictiveAnalysis historicalData={dataFluxo} pendingReceitas={0} pendingDespesas={0} saldoAtual={totalReceitas - totalDespesas} />
          </TabsContent>

          <TabsContent value="caixa" className="space-y-4">
            <CaixaView />
          </TabsContent>

          <TabsContent value="conciliacao" className="space-y-4">
            <ReconciliationView />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

const Relatorios = () => {
  const { planControles, isSuperAdmin } = useAuth();
  
  if (!isSuperAdmin && !planControles.relatorios_personalizados) {
    return <FeatureBlocked title="Relatórios Personalizados" description="Os Relatórios Personalizados não estão disponíveis no seu plano atual. Faça upgrade para acessar análises avançadas." />;
  }

  return (
    <ValuesVisibilityProvider>
      <RelatoriosContent />
    </ValuesVisibilityProvider>
  );
};

export default Relatorios;
