import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ContaBancaria } from "@/components/contas-bancarias/ContasBancariasTable";
import { formatCurrency } from "@/utils/format";

export interface ContaBancariaFormData {
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo_inicial: number;
}

export const useContasBancarias = () => {
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [formData, setFormData] = useState<ContaBancariaFormData>({
    nome: "",
    banco: "",
    agencia: "",
    conta: "",
    saldo_inicial: 0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast: toastOld } = useToast();
  const { empresaId } = useAuth();

  useEffect(() => {
    fetchContasBancarias();
  }, []);

  async function fetchContasBancarias() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .order('nome');

      if (error) {
        throw error;
      }

      setContasBancarias(data || []);
    } catch (error: any) {
      toastOld({
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      banco: "",
      agencia: "",
      conta: "",
      saldo_inicial: 0,
    });
    setSelectedId(null);
  };

  const handleOpenModal = (conta?: ContaBancaria) => {
    if (conta) {
      setFormData({
        nome: conta.nome,
        banco: conta.banco || "",
        agencia: conta.agencia || "",
        conta: conta.conta || "",
        saldo_inicial: conta.saldo_inicial || 0,
      });
      setSelectedId(conta.id);
    } else {
      resetForm();
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOpenDeleteModal = (id: string) => {
    setSelectedId(id);
    setOpenDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setOpenDeleteModal(false);
  };

  const handleSave = async () => {
    try {
      if (!formData.nome) {
        toastOld({
          description: "Nome da conta bancária é obrigatório",
          variant: "destructive",
        });
        return;
      }

      const contaData = {
        nome: formData.nome,
        banco: formData.banco || null,
        agencia: formData.agencia || null,
        conta: formData.conta || null,
        saldo_inicial: formData.saldo_inicial || 0,
      };

      if (selectedId) {
        // Update
        const { error } = await supabase
          .from('contas_bancarias')
          .update(contaData)
          .eq('id', selectedId);

        if (error) throw error;

        toastOld({
          description: "Conta bancária atualizada com sucesso",
        });
      } else {
        // Insert - para novas contas, o saldo atual inicialmente é igual ao saldo inicial
        const { error } = await supabase
          .from('contas_bancarias')
          .insert([{
            ...contaData,
            saldo_atual: contaData.saldo_inicial,
            empresa_id: empresaId
          }]);

        if (error) throw error;

        toastOld({
          description: "Conta bancária cadastrada com sucesso",
        });
      }

      setOpenModal(false);
      resetForm();
      fetchContasBancarias();
    } catch (error: any) {
      toastOld({
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedId) return;

      const { error } = await supabase
        .from('contas_bancarias')
        .delete()
        .eq('id', selectedId);

      if (error) throw error;

      toastOld({
        description: "Conta bancária excluída com sucesso",
      });

      setOpenDeleteModal(false);
      setSelectedId(null);
      fetchContasBancarias();
    } catch (error: any) {
      toastOld({
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    try {
      // Preparar dados para CSV
      const headers = "Nome,Banco,Agência,Conta,Saldo Inicial,Saldo Atual\n";
      let csvContent = "data:text/csv;charset=utf-8," + headers;
      
      filteredContas.forEach(conta => {
        const row = [
          conta.nome,
          conta.banco || "",
          conta.agencia || "",
          conta.conta || "",
          formatCurrency(conta.saldo_inicial || 0).replace(/R\$\s?/g, ""),
          formatCurrency(conta.saldo_atual || 0).replace(/R\$\s?/g, "")
        ].map(value => `"${value}"`).join(",");
        
        csvContent += row + "\n";
      });
      
      // Criar e simular clique no link de download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `contas_bancarias_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
      
      toast.success("Contas bancárias exportadas com sucesso");
    } catch (error: any) {
      toast.error(`Erro ao exportar: ${error.message}`);
    }
  };

  const handleExportPDF = () => {
    try {
      // Abrir nova janela para o PDF
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error("Não foi possível abrir uma nova janela para o PDF.");
      }
      
      // Estilo para o PDF
      const style = `
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .positive { color: green; }
          .negative { color: red; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          .text-right { text-align: right; }
        </style>
      `;
      
      // Gerar conteúdo da tabela
      let tableRows = "";
      
      filteredContas.forEach(conta => {
        const saldoAtualClass = (conta.saldo_atual || 0) >= 0 ? 'positive' : 'negative';
        
        tableRows += `
          <tr>
            <td>${conta.nome}</td>
            <td>${conta.banco || '-'}</td>
            <td>${conta.agencia || '-'}</td>
            <td>${conta.conta || '-'}</td>
            <td class="text-right">${formatCurrency(conta.saldo_inicial || 0)}</td>
            <td class="text-right ${saldoAtualClass}">${formatCurrency(conta.saldo_atual || 0)}</td>
          </tr>
        `;
      });

      // Calcular totais
      const totalSaldoInicial = filteredContas.reduce((sum, conta) => sum + (conta.saldo_inicial || 0), 0);
      const totalSaldoAtual = filteredContas.reduce((sum, conta) => sum + (conta.saldo_atual || 0), 0);
      const saldoAtualClass = totalSaldoAtual >= 0 ? 'positive' : 'negative';
      
      // Construir documento HTML para impressão/PDF
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Relatório de Contas Bancárias</title>
          ${style}
        </head>
        <body>
          <h1>Relatório de Contas Bancárias</h1>
          <p>Data de geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Banco</th>
                <th>Agência</th>
                <th>Conta</th>
                <th class="text-right">Saldo Inicial</th>
                <th class="text-right">Saldo Atual</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4"><strong>Total</strong></td>
                <td class="text-right"><strong>${formatCurrency(totalSaldoInicial)}</strong></td>
                <td class="text-right ${saldoAtualClass}"><strong>${formatCurrency(totalSaldoAtual)}</strong></td>
              </tr>
            </tfoot>
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
      
      // Dar tempo para os estilos carregarem antes de imprimir
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      toast.success("Visualização PDF gerada com sucesso");
    } catch (error: any) {
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filtrar contas bancárias
  const filteredContas = contasBancarias.filter(conta => 
    conta.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conta.banco && conta.banco.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (conta.agencia && conta.agencia.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (conta.conta && conta.conta.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return {
    contasBancarias: filteredContas,
    loading,
    formData,
    openModal,
    openDeleteModal,
    selectedId,
    searchQuery,
    handleInputChange,
    handleOpenModal,
    handleCloseModal,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleSave,
    handleDelete,
    handleExportCSV,
    handleExportPDF,
    handleSearchChange,
  };
};
