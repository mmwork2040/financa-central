import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateStyledPDF } from "@/utils/pdfTemplate";
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
          new Date(forma.created_at).toLocaleDateString("pt-BR"),
          new Date(forma.updated_at).toLocaleDateString("pt-BR")
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
    generateStyledPDF({
      title: "Relatório de Formas de Pagamento",
      summaryCards: [
        { label: "Total", value: String(filteredFormasPagamento.length) },
      ],
      columns: [
        { key: "descricao", header: "Descrição" },
        { key: "created_at", header: "Data de Criação" },
        { key: "updated_at", header: "Última Atualização" },
      ],
      rows: filteredFormasPagamento.map(f => ({
        descricao: f.descricao,
        created_at: new Date(f.created_at).toLocaleDateString("pt-BR"),
        updated_at: new Date(f.updated_at).toLocaleDateString("pt-BR"),
      })),
    });
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
