
import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Importando componentes refatorados
import FluxoCaixaChart from "@/components/relatorios/FluxoCaixaChart";
import ResumoFinanceiro from "@/components/relatorios/ResumoFinanceiro";
import TrendAnalysis from "@/components/relatorios/TrendAnalysis";
import CategoryPieChart from "@/components/relatorios/CategoryPieChart";
import CategoryDataTable from "@/components/relatorios/CategoryDataTable";
import ExportDropdown from "@/components/common/ExportDropdown";

// Importando o hook personalizado
import { useRelatoriosData } from "@/hooks/useRelatoriosData";
import { ValuesVisibilityProvider, useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

const RelatoriosContent = () => {
  const { visible, toggle } = useValuesVisibility();
  const [periodo, setPeriodo] = useState("mes");
  
  // Utilizando o hook para gerenciar os dados
  const { loading, dataReceitas, dataDespesas, dataFluxo, fetchRelatoriosData } = useRelatoriosData(periodo);
  
  // Forçar recarga de dados quando a página é carregada
  useEffect(() => {
    console.log("Relatorios: Componente montado, buscando dados...");
    fetchRelatoriosData();
  }, []);
  
  // Cores para os gráficos
  const COLORS_RECEITAS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5", "#ecfdf5"];
  const COLORS_DESPESAS = ["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2", "#fef2f2"];
  
  // Função para exportar para CSV
  const exportToCSV = () => {
    try {
      // Identificar a guia ativa
      const activeTab = document.querySelector('[role="tabpanel"][data-state="active"]');
      const tabId = activeTab?.getAttribute("data-orientation");
      
      let data = [];
      let filename = "";
      let headers = "";
      
      // Preparar dados com base na guia ativa
      if (tabId === "fluxo" || !tabId) {
        // Exportar dados de fluxo de caixa
        data = dataFluxo.map(item => ({
          periodo: item.name,
          receitas: item.receitas,
          despesas: item.despesas,
          saldo: item.receitas - item.despesas
        }));
        headers = "Período,Receitas,Despesas,Saldo\n";
        filename = `fluxo-caixa_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (tabId === "receitas") {
        // Exportar dados de receitas
        data = dataReceitas.map(item => ({
          categoria: item.name,
          valor: item.value
        }));
        headers = "Categoria,Valor\n";
        filename = `receitas_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (tabId === "despesas") {
        // Exportar dados de despesas
        data = dataDespesas.map(item => ({
          categoria: item.name,
          valor: item.value
        }));
        headers = "Categoria,Valor\n";
        filename = `despesas_${new Date().toISOString().split('T')[0]}.csv`;
      }
      
      // Construir o conteúdo do CSV
      let csvContent = "data:text/csv;charset=utf-8," + headers;
      
      // Adicionar linhas de dados
      data.forEach(item => {
        let row = "";
        Object.values(item).forEach((value, index) => {
          // Formatar valores numéricos com vírgula para o padrão brasileiro
          if (typeof value === 'number') {
            row += value.toString().replace('.', ',');
          } else {
            row += value;
          }
          
          if (index < Object.values(item).length - 1) {
            row += ",";
          }
        });
        csvContent += row + "\n";
      });
      
      // Criar e simular clique no link de download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Relatório exportado em formato CSV`);
    } catch (error: any) {
      console.error("Erro ao exportar CSV:", error);
      toast.error(`Erro ao exportar: ${error.message}`);
    }
  };

  // Função para gerar PDF
  const generatePDF = () => {
    try {
      // Identificar a guia ativa
      const activeTab = document.querySelector('[role="tabpanel"][data-state="active"]');
      const tabId = activeTab?.getAttribute("data-orientation");
      
      // Abrir nova janela para o PDF
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error("Não foi possível abrir uma nova janela para o PDF.");
      }
      
      // Estilo para o PDF
      const style = `
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { color: #333; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .receita { color: green; }
          .despesa { color: red; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          .resumo { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
        </style>
      `;
      
      let title = "";
      let tableContent = "";
      let resumoContent = "";
      
      // Gerar conteúdo baseado na aba ativa
      if (tabId === "fluxo" || !tabId) {
        title = "Relatório de Fluxo de Caixa";
        
        // Tabela de fluxo
        tableContent = `
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th>Receitas</th>
                <th>Despesas</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        dataFluxo.forEach(item => {
          const saldo = item.receitas - item.despesas;
          tableContent += `
            <tr>
              <td>${item.name}</td>
              <td class="receita">${item.receitas.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
              <td class="despesa">${item.despesas.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
              <td class="${saldo >= 0 ? 'receita' : 'despesa'}">${saldo.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
            </tr>
          `;
        });
        
        tableContent += `
            </tbody>
          </table>
        `;
        
        // Resumo financeiro
        const totalReceitas = dataFluxo.reduce((sum, item) => sum + item.receitas, 0);
        const totalDespesas = dataFluxo.reduce((sum, item) => sum + item.despesas, 0);
        const saldoTotal = totalReceitas - totalDespesas;
        
        resumoContent = `
          <div class="resumo">
            <h2>Resumo Financeiro</h2>
            <p><strong>Total de Receitas:</strong> <span class="receita">${totalReceitas.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></p>
            <p><strong>Total de Despesas:</strong> <span class="despesa">${totalDespesas.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></p>
            <p><strong>Saldo:</strong> <span class="${saldoTotal >= 0 ? 'receita' : 'despesa'}">${saldoTotal.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></p>
          </div>
        `;
      } 
      else if (tabId === "receitas") {
        title = "Relatório de Receitas por Categoria";
        
        tableContent = `
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Percentual</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        const totalReceitas = dataReceitas.reduce((sum, item) => sum + item.value, 0);
        
        dataReceitas.forEach(item => {
          const percentual = totalReceitas > 0 ? (item.value / totalReceitas * 100).toFixed(2) : '0.00';
          tableContent += `
            <tr>
              <td>${item.name}</td>
              <td class="receita">${item.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
              <td>${percentual}%</td>
            </tr>
          `;
        });
        
        tableContent += `
            </tbody>
          </table>
        `;
        
        resumoContent = `
          <div class="resumo">
            <h2>Total de Receitas</h2>
            <p><strong>Valor Total:</strong> <span class="receita">${totalReceitas.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></p>
          </div>
        `;
      } 
      else if (tabId === "despesas") {
        title = "Relatório de Despesas por Categoria";
        
        tableContent = `
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Percentual</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        const totalDespesas = dataDespesas.reduce((sum, item) => sum + item.value, 0);
        
        dataDespesas.forEach(item => {
          const percentual = totalDespesas > 0 ? (item.value / totalDespesas * 100).toFixed(2) : '0.00';
          tableContent += `
            <tr>
              <td>${item.name}</td>
              <td class="despesa">${item.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
              <td>${percentual}%</td>
            </tr>
          `;
        });
        
        tableContent += `
            </tbody>
          </table>
        `;
        
        resumoContent = `
          <div class="resumo">
            <h2>Total de Despesas</h2>
            <p><strong>Valor Total:</strong> <span class="despesa">${totalDespesas.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></p>
          </div>
        `;
      }
      
      // Construir documento HTML para impressão/PDF
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          ${style}
        </head>
        <body>
          <h1>${title}</h1>
          <p>Período: ${periodo === "mes" ? "Último mês" : 
                       periodo === "trimestre" ? "Último trimestre" : 
                       periodo === "semestre" ? "Último semestre" : "Último ano"}</p>
          <p>Data de geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          
          ${tableContent}
          
          ${resumoContent}
          
          <div class="footer">
            <p>Sistema Financeiro - Relatório gerado automaticamente</p>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Dar tempo para os estilos carregarem antes de imprimir
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      toast.success(`Relatório exportado em formato PDF`);
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    }
  };
  
  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV();
    } else {
      generatePDF();
    }
  };
  
  // Calculate totals for summary
  const totalReceitas = dataFluxo.reduce((sum, item) => sum + item.receitas, 0);
  const totalDespesas = dataFluxo.reduce((sum, item) => sum + item.despesas, 0);

  console.log("Totais calculados para exibição:", {totalReceitas, totalDespesas});
  
  const handlePeriodoChange = (newPeriodo: string) => {
    console.log("Mudando período para:", newPeriodo);
    setPeriodo(newPeriodo);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground" title={visible ? "Ocultar valores" : "Exibir valores"}>
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Select value={periodo} onValueChange={handlePeriodoChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Último mês</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="semestre">Último semestre</SelectItem>
              <SelectItem value="ano">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <ExportDropdown onExport={handleExport} />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Carregando dados...</p>
        </div>
      ) : (
        <Tabs defaultValue="fluxo" className="space-y-4">
          <TabsList>
            <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="receitas">Receitas</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fluxo" className="space-y-4" data-orientation="fluxo">
            <FluxoCaixaChart data={dataFluxo} />
            
            <div className="grid gap-4 md:grid-cols-2">
              <ResumoFinanceiro 
                totalReceitas={totalReceitas} 
                totalDespesas={totalDespesas} 
              />
              
              <TrendAnalysis 
                dataFluxo={dataFluxo} 
                periodo={periodo}
                totalReceitas={totalReceitas}
                totalDespesas={totalDespesas}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="receitas" className="space-y-4" data-orientation="receitas">
            <CategoryPieChart 
              data={dataReceitas} 
              title="Receitas por Categoria"
              description="Distribuição das receitas por categoria"
              colors={COLORS_RECEITAS}
              emptyMessage="Nenhuma receita encontrada no período selecionado"
            />
            
            <CategoryDataTable 
              data={dataReceitas} 
              colors={COLORS_RECEITAS} 
            />
          </TabsContent>
          
          <TabsContent value="despesas" className="space-y-4" data-orientation="despesas">
            <CategoryPieChart 
              data={dataDespesas} 
              title="Despesas por Categoria"
              description="Distribuição das despesas por categoria"
              colors={COLORS_DESPESAS}
              emptyMessage="Nenhuma despesa encontrada no período selecionado"
            />
            
            <CategoryDataTable 
              data={dataDespesas} 
              colors={COLORS_DESPESAS} 
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

const Relatorios = () => (
  <ValuesVisibilityProvider>
    <RelatoriosContent />
  </ValuesVisibilityProvider>
);

export default Relatorios;
