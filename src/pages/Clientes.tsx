
import React, { useState } from "react";
import { useFormatInput } from "@/hooks/use-format-input";
import { Users as UsersIcon } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ClienteForm from "@/components/clientes/ClienteForm";
import ClienteDeleteDialog from "@/components/clientes/ClienteDeleteDialog";
import ClientesSearch from "@/components/clientes/ClientesSearch";
import ClientesTable from "@/components/clientes/ClientesTable";
import SupportDeleteDialog from "@/components/common/SupportDeleteDialog";
import { useClientes, initialCliente, type Cliente } from "@/hooks/useClientes";
import { useSolicitacoesSuporte } from "@/hooks/useSolicitacoesSuporte";
import { formatCPFOrCNPJ, formatPhone } from "@/utils/format";
import { toast } from "sonner";
import { generateStyledPDF } from "@/utils/pdfTemplate";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Clientes = () => {
  const { canPerformAction, user, userProfile, empresaId } = useAuth();
  const canIncluir = canPerformAction("clientes", "pode_incluir");
  const canAlterar = canPerformAction("clientes", "pode_alterar");
  const canExcluir = canPerformAction("clientes", "pode_excluir");

  const { clientes, loading, isSaving, fetchClientes, saveCliente, deleteCliente } = useClientes();
  const { criarSolicitacao, hasPendingRequest, getPendingRequestId, cancelarSolicitacao } = useSolicitacoesSuporte();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const [currentCliente, setCurrentCliente] = useState<Cliente>({ ...initialCliente });

  // Hooks para formatação dos inputs
  const cpfCnpjInput = useFormatInput(currentCliente.cpf_cnpj || "", "document");
  const telefoneInput = useFormatInput(currentCliente.telefone || "", "phone");

  const filteredClientes = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cliente.cpf_cnpj?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cliente.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (cliente?: Cliente) => {
    if (cliente) {
      setCurrentCliente({ ...cliente });
      cpfCnpjInput.setDisplayValue(cliente.cpf_cnpj || "");
      telefoneInput.setDisplayValue(cliente.telefone || "");
    } else {
      setCurrentCliente({ ...initialCliente });
      cpfCnpjInput.setDisplayValue("");
      telefoneInput.setDisplayValue("");
    }
    setIsModalOpen(true);
  };

  const confirmDelete = (cliente: Cliente) => {
    setCurrentCliente(cliente);
    setIsDeleteDialogOpen(true);
  };

  const handleSupportDelete = (cliente: Cliente) => {
    setCurrentCliente(cliente);
    setIsSupportDialogOpen(true);
  };

  const handleSupportDeleteConfirm = async (motivo: string) => {
    const success = await criarSolicitacao({
      tabela: "clientes",
      registro_id: currentCliente.id,
      registro_descricao: `Cliente: ${currentCliente.nome}`,
      motivo,
    });
    if (success) {
      setIsSupportDialogOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentCliente(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCurrentCliente(prev => ({
      ...prev,
      ativo: checked
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setCurrentCliente(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const clienteData = {
      ...currentCliente,
      cpf_cnpj: cpfCnpjInput.getRawValue() ? cpfCnpjInput.displayValue : null,
      telefone: telefoneInput.getRawValue() ? telefoneInput.displayValue : null,
    };

    const success = await saveCliente(clienteData);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    const success = await deleteCliente(currentCliente.id);
    if (success) {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  const exportToCSV = () => {
    try {
      const headers = "Nome,CPF/CNPJ,E-mail,Telefone,Endereço,Status\n";
      let csvContent = "data:text/csv;charset=utf-8," + headers;
      
      filteredClientes.forEach(cliente => {
        const row = [
          cliente.nome,
          cliente.cpf_cnpj ? formatCPFOrCNPJ(cliente.cpf_cnpj) : "",
          cliente.email || "",
          cliente.telefone ? formatPhone(cliente.telefone) : "",
          cliente.endereco || "",
          cliente.ativo ? "Ativo" : "Inativo"
        ].map(value => `"${value}"`).join(",");
        
        csvContent += row + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `clientes_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
      
      toast.success("Clientes exportados com sucesso");
    } catch (error: any) {
      toast.error(`Erro ao exportar: ${error.message}`);
    }
  };

  const exportToPDF = () => {
    const ativos = filteredClientes.filter(c => c.ativo).length;
    const inativos = filteredClientes.length - ativos;

    generateStyledPDF({
      title: "Relatório de Clientes",
      empresa: undefined,
      summaryCards: [
        { label: "Total de Clientes", value: String(filteredClientes.length) },
        { label: "Ativos", value: String(ativos), color: "#16a34a" },
        { label: "Inativos", value: String(inativos), color: "#dc2626" },
      ],
      columns: [
        { key: "nome", header: "Nome" },
        { key: "cpf_cnpj", header: "CPF/CNPJ" },
        { key: "email", header: "E-mail" },
        { key: "telefone", header: "Telefone" },
        { key: "endereco", header: "Endereço" },
        { key: "status", header: "Status" },
      ],
      rows: filteredClientes.map(c => ({
        nome: c.nome,
        cpf_cnpj: c.cpf_cnpj ? formatCPFOrCNPJ(c.cpf_cnpj) : "-",
        email: c.email || "-",
        telefone: c.telefone ? formatPhone(c.telefone) : "-",
        endereco: c.endereco || "-",
        status: c.ativo ? "Ativo" : "Inativo",
      })),
      badgeColumns: {
        status: {
          ativo: { bg: "#dcfce7", color: "#166534" },
          inativo: { bg: "#fee2e2", color: "#991b1b" },
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes do sistema."
        buttonLabel="Novo Cliente"
        onButtonClick={() => openModal()}
        showButton={canIncluir}
        icon={UsersIcon}
      />

      <ClientesSearch 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onExport={handleExport}
      />

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <ClientesTable 
          clientes={filteredClientes}
          onEdit={openModal}
          onDelete={confirmDelete}
          onSupportDelete={handleSupportDelete}
          hasPendingRequest={(id) => hasPendingRequest("clientes", id)}
          canEdit={canAlterar}
          canDelete={canExcluir}
        />
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total: {filteredClientes.length} clientes
        </p>
      </div>

      <ClienteForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        cliente={currentCliente}
        handleInputChange={handleInputChange}
        handleCheckboxChange={handleCheckboxChange}
        handleAddressChange={handleAddressChange}
        cpfCnpjInput={cpfCnpjInput}
        telefoneInput={telefoneInput}
        isSaving={isSaving}
      />

      <ClienteDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDelete}
        cliente={currentCliente}
      />

      <SupportDeleteDialog
        isOpen={isSupportDialogOpen}
        onClose={() => setIsSupportDialogOpen(false)}
        onConfirm={handleSupportDeleteConfirm}
        onCancel={
          hasPendingRequest("clientes", currentCliente.id)
            ? async () => {
                const reqId = getPendingRequestId("clientes", currentCliente.id);
                if (!reqId) return false;
                const success = await cancelarSolicitacao(reqId);
                if (success) setIsSupportDialogOpen(false);
                return success;
              }
            : undefined
        }
        recordName={currentCliente.nome}
        isPending={hasPendingRequest("clientes", currentCliente.id)}
      />
    </div>
  );
};

export default Clientes;
