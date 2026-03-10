import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateStyledPDF } from "@/utils/pdfTemplate";
import { useAuth } from "@/contexts/AuthContext";
import { ContaBancaria } from "@/components/contas-bancarias/ContasBancariasTable";
import { formatCurrency } from "@/utils/format";

export interface ContaBancariaFormData {
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo_inicial: number;
  principal: boolean;
}

export const useContasBancarias = () => {
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [formData, setFormData] = useState<ContaBancariaFormData>({
    nome: "", banco: "", agencia: "", conta: "", saldo_inicial: 0, principal: false,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { empresaId } = useAuth();
  const [showPrincipalConfirm, setShowPrincipalConfirm] = useState(false);
  const [contaPrincipalExistente, setContaPrincipalExistente] = useState<string | null>(null);

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
      if (error) throw error;
      // Sort principal first, then by name
      const sorted = (data || []).map((d: any) => ({ ...d, principal: d.principal ?? false })) as ContaBancaria[];
      sorted.sort((a, b) => (a.principal === b.principal ? 0 : a.principal ? -1 : 1));
      setContasBancarias(sorted);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({ nome: "", banco: "", agencia: "", conta: "", saldo_inicial: 0, principal: false });
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
        principal: conta.principal || false,
      });
      setSelectedId(conta.id);
    } else {
      resetForm();
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => { setOpenModal(false); };
  const handleOpenDeleteModal = (id: string) => { setSelectedId(id); setOpenDeleteModal(true); };
  const handleCloseDeleteModal = () => { setOpenDeleteModal(false); };

  const handleSave = async (forcarPrincipal?: boolean) => {
    try {
      if (!formData.nome) {
        toast.error("Nome da conta bancária é obrigatório");
        return;
      }

      // Check if there's already a principal account (and it's not the current one being edited)
      if (formData.principal && !forcarPrincipal) {
        const contaPrincipal = contasBancarias.find(
          c => c.principal && c.id !== selectedId
        );
        if (contaPrincipal) {
          setContaPrincipalExistente(contaPrincipal.nome);
          setShowPrincipalConfirm(true);
          return;
        }
      }

      // If setting as principal, remove principal from others
      if (formData.principal) {
        const { error: resetError } = await (supabase
          .from('contas_bancarias')
          .update({ principal: false } as any) as any)
          .eq('principal', true)
          .neq('id', selectedId || '');
        if (resetError) throw resetError;
      }

      const contaData = {
        nome: formData.nome,
        banco: formData.banco || null,
        agencia: formData.agencia || null,
        conta: formData.conta || null,
        saldo_inicial: formData.saldo_inicial || 0,
        principal: formData.principal,
      };

      if (selectedId) {
        const { error } = await (supabase
          .from('contas_bancarias')
          .update(contaData as any) as any)
          .eq('id', selectedId);
        if (error) throw error;
        toast.success("Conta bancária atualizada com sucesso");
      } else {
        const { error } = await supabase
          .from('contas_bancarias')
          .insert([{ ...contaData, saldo_atual: contaData.saldo_inicial, empresa_id: empresaId } as any]);
        if (error) {
          if (error.code === '23505') throw new Error("Já existe uma conta bancária com este nome.");
          throw error;
        }
        toast.success("Conta bancária cadastrada com sucesso");
      }

      setOpenModal(false);
      resetForm();
      fetchContasBancarias();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleConfirmPrincipal = () => {
    setShowPrincipalConfirm(false);
    handleSave(true);
  };

  const handleClosePrincipalConfirm = () => {
    setShowPrincipalConfirm(false);
  };

  const handleDelete = async () => {
    try {
      if (!selectedId) return;
      const { error } = await supabase
        .from('contas_bancarias')
        .delete()
        .eq('id', selectedId);
      if (error) throw error;
      toast.success("Conta bancária excluída com sucesso");
      setOpenDeleteModal(false);
      setSelectedId(null);
      fetchContasBancarias();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = "Nome,Banco,Agência,Conta,Saldo Inicial,Saldo Atual,Principal\n";
      let csvContent = "data:text/csv;charset=utf-8," + headers;
      filteredContas.forEach(conta => {
        const row = [
          conta.nome,
          conta.banco || "",
          conta.agencia || "",
          conta.conta || "",
          formatCurrency(conta.saldo_inicial || 0).replace(/R\$\s?/g, ""),
          formatCurrency(conta.saldo_atual || 0).replace(/R\$\s?/g, ""),
          conta.principal ? "Sim" : "Não"
        ].map(value => `"${value}"`).join(",");
        csvContent += row + "\n";
      });
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
    const totalSaldoInicial = filteredContas.reduce((sum, c) => sum + (c.saldo_inicial || 0), 0);
    const totalSaldoAtual = filteredContas.reduce((sum, c) => sum + (c.saldo_atual || 0), 0);

    generateStyledPDF({
      title: "Relatório de Contas Bancárias",
      summaryCards: [
        { label: "Total de Contas", value: String(filteredContas.length) },
        { label: "Saldo Inicial Total", value: formatCurrency(totalSaldoInicial) },
        { label: "Saldo Atual Total", value: formatCurrency(totalSaldoAtual), color: totalSaldoAtual >= 0 ? "#16a34a" : "#dc2626" },
      ],
      columns: [
        { key: "nome", header: "Nome" },
        { key: "banco", header: "Banco" },
        { key: "agencia", header: "Agência" },
        { key: "conta", header: "Conta" },
        { key: "saldo_inicial", header: "Saldo Inicial", align: "right" },
        { key: "saldo_atual", header: "Saldo Atual", align: "right" },
      ],
      rows: filteredContas.map(c => ({
        nome: c.nome + (c.principal ? " ★" : ""),
        banco: c.banco || "-",
        agencia: c.agencia || "-",
        conta: c.conta || "-",
        saldo_inicial: formatCurrency(c.saldo_inicial || 0),
        saldo_atual: formatCurrency(c.saldo_atual || 0),
      })),
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

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
    showPrincipalConfirm,
    contaPrincipalExistente,
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
    handleConfirmPrincipal,
    handleClosePrincipalConfirm,
  };
};
