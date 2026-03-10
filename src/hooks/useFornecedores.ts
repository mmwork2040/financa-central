
import { useState, useEffect } from "react";
import { Fornecedor, initialFornecedor } from "@/types/fornecedor.types";
import { fetchFornecedores, saveFornecedor, deleteFornecedor } from "@/services/fornecedorService";
import { toast } from "sonner";
import { generateStyledPDF } from "@/utils/pdfTemplate";
import { useFormatInput } from "@/hooks/use-format-input";
import { useAuth } from "@/contexts/AuthContext";

export const useFornecedores = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [currentFornecedor, setCurrentFornecedor] = useState<Fornecedor>({ ...initialFornecedor });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { empresaId } = useAuth();
  
  const cpfCnpjInput = useFormatInput(currentFornecedor.cpf_cnpj || "", "document");
  const telefoneInput = useFormatInput(currentFornecedor.telefone || "", "phone");

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      const data = await fetchFornecedores();
      setFornecedores(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFornecedores();
  }, []);

  const filteredFornecedores = fornecedores.filter(fornecedor => 
    fornecedor.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    fornecedor.cpf_cnpj?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    fornecedor.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setCurrentFornecedor({ ...fornecedor });
      cpfCnpjInput.setDisplayValue(fornecedor.cpf_cnpj || "");
      telefoneInput.setDisplayValue(fornecedor.telefone || "");
    } else {
      setCurrentFornecedor({ ...initialFornecedor });
      cpfCnpjInput.setDisplayValue("");
      telefoneInput.setDisplayValue("");
    }
    setIsModalOpen(true);
  };

  const confirmDelete = (fornecedor: Fornecedor) => {
    setCurrentFornecedor(fornecedor);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentFornecedor(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCurrentFornecedor(prev => ({ ...prev, ativo: checked }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setCurrentFornecedor(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const fornecedorData = {
        ...currentFornecedor,
        cpf_cnpj: cpfCnpjInput.getRawValue() ? cpfCnpjInput.displayValue : null,
        telefone: telefoneInput.getRawValue() ? telefoneInput.displayValue : null
      };
      
      const result = await saveFornecedor(fornecedorData, empresaId);
      toast.success(result.message);
      setIsModalOpen(false);
      loadFornecedores();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deleteFornecedor(currentFornecedor.id);
      toast.success(result.message);
      setIsDeleteDialogOpen(false);
      loadFornecedores();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = "Nome,CPF/CNPJ,Email,Telefone,Endereço,Status\n";
      let csvContent = "data:text/csv;charset=utf-8," + headers;
      
      filteredFornecedores.forEach(fornecedor => {
        const status = fornecedor.ativo ? "Ativo" : "Inativo";
        const row = [
          fornecedor.nome || "",
          fornecedor.cpf_cnpj || "",
          fornecedor.email || "",
          fornecedor.telefone || "",
          fornecedor.endereco || "",
          status
        ].map(value => `"${value}"`).join(",");
        csvContent += row + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `fornecedores_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Fornecedores exportados com sucesso");
    } catch (error: any) {
      toast.error(`Erro ao exportar: ${error.message}`);
    }
  };

  const handleExportPDF = () => {
    const ativos = filteredFornecedores.filter(f => f.ativo).length;
    const inativos = filteredFornecedores.length - ativos;

    generateStyledPDF({
      title: "Relatório de Fornecedores",
      summaryCards: [
        { label: "Total de Fornecedores", value: String(filteredFornecedores.length) },
        { label: "Ativos", value: String(ativos), color: "#16a34a" },
        { label: "Inativos", value: String(inativos), color: "#dc2626" },
      ],
      columns: [
        { key: "nome", header: "Nome" },
        { key: "cpf_cnpj", header: "CPF/CNPJ" },
        { key: "email", header: "Email" },
        { key: "telefone", header: "Telefone" },
        { key: "endereco", header: "Endereço" },
        { key: "status", header: "Status" },
      ],
      rows: filteredFornecedores.map(f => ({
        nome: f.nome || "-",
        cpf_cnpj: f.cpf_cnpj || "-",
        email: f.email || "-",
        telefone: f.telefone || "-",
        endereco: f.endereco || "-",
        status: f.ativo ? "Ativo" : "Inativo",
      })),
      badgeColumns: {
        status: {
          ativo: { bg: "#dcfce7", color: "#166534" },
          inativo: { bg: "#fee2e2", color: "#991b1b" },
        },
      },
    });
  };

  return {
    fornecedores: filteredFornecedores,
    currentFornecedor,
    loading,
    isSaving,
    isModalOpen,
    isDeleteDialogOpen,
    searchQuery,
    setSearchQuery,
    openModal,
    confirmDelete,
    handleInputChange,
    handleCheckboxChange,
    handleAddressChange,
    handleSubmit,
    handleDelete,
    setIsModalOpen,
    setIsDeleteDialogOpen,
    handleExportCSV,
    handleExportPDF,
    cpfCnpjInput,
    telefoneInput
  };
};
