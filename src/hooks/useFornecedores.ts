
import { useState, useEffect } from "react";
import { Fornecedor, initialFornecedor } from "@/types/fornecedor.types";
import { fetchFornecedores, saveFornecedor, deleteFornecedor } from "@/services/fornecedorService";
import { toast } from "sonner";
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
          .ativo { color: green; }
          .inativo { color: red; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      `;
      
      let tableRows = "";
      filteredFornecedores.forEach(fornecedor => {
        const status = fornecedor.ativo ? 
          '<span class="ativo">Ativo</span>' : 
          '<span class="inativo">Inativo</span>';
        tableRows += `
          <tr>
            <td>${fornecedor.nome || ""}</td>
            <td>${fornecedor.cpf_cnpj || ""}</td>
            <td>${fornecedor.email || ""}</td>
            <td>${fornecedor.telefone || ""}</td>
            <td>${fornecedor.endereco || ""}</td>
            <td>${status}</td>
          </tr>
        `;
      });
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Relatório de Fornecedores</title>
          ${style}
        </head>
        <body>
          <h1>Relatório de Fornecedores</h1>
          <p>Data de geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF/CNPJ</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th>Status</th>
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
