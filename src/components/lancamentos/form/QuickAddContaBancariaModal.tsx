import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ContaBancariaForm, { ContaBancariaFormData } from "@/components/contas-bancarias/ContaBancariaForm";

interface QuickAddContaBancariaModalProps {
  onSuccess: () => void;
}

export const QuickAddContaBancariaModal = ({ onSuccess }: QuickAddContaBancariaModalProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ContaBancariaFormData>({
    nome: "", banco: "", agencia: "", conta: "", saldo_inicial: 0, principal: false,
  });
  const [showPrincipalConfirm, setShowPrincipalConfirm] = useState(false);
  const [contaPrincipalExistente, setContaPrincipalExistente] = useState<string | null>(null);
  const { empresaId } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpen = () => {
    setFormData({ nome: "", banco: "", agencia: "", conta: "", saldo_inicial: 0, principal: false });
    setOpen(true);
  };

  const handleSave = async (forcarPrincipal?: boolean) => {
    if (!formData.nome) {
      toast.error("Nome da conta bancária é obrigatório");
      return;
    }

    // Check principal conflict
    if (formData.principal && !forcarPrincipal) {
      const { data } = await supabase
        .from("contas_bancarias")
        .select("nome")
        .eq("principal", true)
        .limit(1);
      if (data && data.length > 0) {
        setContaPrincipalExistente(data[0].nome);
        setShowPrincipalConfirm(true);
        return;
      }
    }

    try {
      if (formData.principal) {
        await (supabase.from("contas_bancarias").update({ principal: false } as any) as any).eq("principal", true);
      }

      const { error } = await supabase.from("contas_bancarias").insert([{
        nome: formData.nome,
        banco: formData.banco || null,
        agencia: formData.agencia || null,
        conta: formData.conta || null,
        saldo_inicial: formData.saldo_inicial || 0,
        saldo_atual: formData.saldo_inicial || 0,
        principal: formData.principal,
        empresa_id: empresaId,
      } as any]);
      if (error) {
        if (error.code === '23505') throw new Error("Já existe uma conta bancária com este nome.");
        throw error;
      }

      toast.success("Conta bancária cadastrada com sucesso!");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar conta bancária");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        title="Adicionar Conta Bancária"
      >
        <Plus size={16} />
      </button>
      <ContaBancariaForm
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        formData={formData}
        handleInputChange={handleInputChange}
        isEditing={false}
        contaPrincipalExistente={contaPrincipalExistente}
        showPrincipalConfirm={showPrincipalConfirm}
        onClosePrincipalConfirm={() => setShowPrincipalConfirm(false)}
        onConfirmPrincipal={() => {
          setShowPrincipalConfirm(false);
          handleSave(true);
        }}
      />
    </>
  );
};
