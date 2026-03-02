import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface FormaPagamento {
  id: string;
  descricao: string;
  created_at: string;
  updated_at: string;
}

export const useFormasPagamento = () => {
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { empresaId } = useAuth();

  const fetchFormasPagamento = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('*')
        .order('descricao');

      if (error) throw error;
      setFormasPagamento(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredFormasPagamento = formasPagamento.filter(forma => 
    forma.descricao.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveFormaPagamento = async (descricao: string, id?: string) => {
    try {
      if (!descricao) {
        toast.error("Descrição é obrigatória");
        return false;
      }

      if (id) {
        const { error } = await supabase
          .from('formas_pagamento')
          .update({ descricao })
          .eq('id', id);
        if (error) throw error;
        toast.success("Forma de pagamento atualizada com sucesso");
      } else {
        const { error } = await supabase
          .from('formas_pagamento')
          .insert([{ descricao, empresa_id: empresaId }]);
        if (error) {
          if (error.code === '23505') throw new Error("Já existe uma forma de pagamento com esta descrição.");
          throw error;
        }
        toast.success("Forma de pagamento cadastrada com sucesso");
      }

      await fetchFormasPagamento();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
  };

  const deleteFormaPagamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('formas_pagamento')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("Forma de pagamento excluída com sucesso");
      await fetchFormasPagamento();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
  };

  const exportToCSV = () => {
    try {
      const headers = "Descrição,Data de Criação,Última Atualização\n";
      let csvContent = "data:text/csv;charset=utf-8," + headers;
      
      filteredFormasPagamento.forEach(forma => {
        const row = [
          forma.descricao,
          new Date(forma.created_at).toLocaleDateString(),
          new Date(forma.updated_at).toLocaleDateString()
        ].map(value => `"${value}"`).join(",");
        csvContent += row + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `formas_pagamento_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Formas de pagamento exportadas com sucesso");
    } catch (error: any) {
      toast.error(`Erro ao exportar: ${error.message}`);
    }
  };

  const exportToPDF = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error("Não foi possível abrir uma nova janela para o PDF.");
      
      const style = `
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      `;
      
      let tableRows = "";
      filteredFormasPagamento.forEach(forma => {
        tableRows += `
          <tr>
            <td>${forma.descricao}</td>
            <td>${new Date(forma.created_at).toLocaleDateString()}</td>
            <td>${new Date(forma.updated_at).toLocaleDateString()}</td>
          </tr>
        `;
      });
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Relatório de Formas de Pagamento</title>
          ${style}
        </head>
        <body>
          <h1>Relatório de Formas de Pagamento</h1>
          <p>Data de geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Data de Criação</th>
                <th>Última Atualização</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
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
      setTimeout(() => { printWindow.print(); }, 500);
      toast.success("Visualização PDF gerada com sucesso");
    } catch (error: any) {
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  const exportData = (format: 'csv' | 'pdf') => {
    if (format === 'csv') exportToCSV();
    else exportToPDF();
  };

  useEffect(() => {
    fetchFormasPagamento();
  }, []);

  return {
    loading,
    formasPagamento: filteredFormasPagamento,
    searchQuery,
    handleSearch,
    saveFormaPagamento,
    deleteFormaPagamento,
    exportData
  };
};
