import React, { useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useFormatInput } from "@/hooks/use-format-input";
import { Fornecedor, initialFornecedor } from "@/types/fornecedor.types";
import FornecedorForm from "@/components/fornecedores/FornecedorForm";
import { FormModal } from "@/components/modals/FormModal";

interface QuickAddFornecedorModalProps {
  onSuccess: () => void;
}

export const QuickAddFornecedorModal = ({ onSuccess }: QuickAddFornecedorModalProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentFornecedor, setCurrentFornecedor] = useState<Fornecedor>({ ...initialFornecedor });
  const { empresaId } = useAuth();

  const cpfCnpjInput = useFormatInput(currentFornecedor.cpf_cnpj || "", "document");
  const telefoneInput = useFormatInput(currentFornecedor.telefone || "", "phone");

  const handleOpen = () => {
    setCurrentFornecedor({ ...initialFornecedor });
    cpfCnpjInput.setDisplayValue("");
    telefoneInput.setDisplayValue("");
    setOpen(true);
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
    if (!currentFornecedor.nome) {
      toast.error("Nome do fornecedor é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const fornecedorData = {
        nome: currentFornecedor.nome,
        cpf_cnpj: cpfCnpjInput.getRawValue() ? cpfCnpjInput.displayValue : null,
        telefone: telefoneInput.getRawValue() ? telefoneInput.displayValue : null,
        email: currentFornecedor.email || null,
        cep: currentFornecedor.cep || null,
        rua: currentFornecedor.rua || null,
        numero: currentFornecedor.numero || null,
        complemento: currentFornecedor.complemento || null,
        bairro: currentFornecedor.bairro || null,
        cidade: currentFornecedor.cidade || null,
        estado: currentFornecedor.estado || null,
        ativo: currentFornecedor.ativo,
        empresa_id: empresaId,
      };

      const { error } = await supabase.from("fornecedores").insert(fornecedorData as any);
      if (error) throw error;

      toast.success("Fornecedor cadastrado com sucesso!");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar fornecedor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        title="Adicionar Fornecedor"
      >
        <Plus size={16} />
      </button>
      <FormModal
        title="Novo Fornecedor"
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <FornecedorForm
          currentFornecedor={currentFornecedor}
          handleInputChange={handleInputChange}
          handleCheckboxChange={handleCheckboxChange}
          handleAddressChange={handleAddressChange}
          cpfCnpjInput={cpfCnpjInput}
          telefoneInput={telefoneInput}
        />
      </FormModal>
    </>
  );
};
