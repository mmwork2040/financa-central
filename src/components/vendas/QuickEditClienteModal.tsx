import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFormatInput } from "@/hooks/use-format-input";
import { Cliente, initialCliente } from "@/hooks/useClientes";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import CepAddressFields, { type AddressData } from "@/components/common/CepAddressFields";

interface QuickEditClienteModalProps {
  clienteId: string;
  onSuccess: () => void;
}

export const QuickEditClienteModal = ({ clienteId, onSuccess }: QuickEditClienteModalProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cliente, setCliente] = useState<Cliente>({ ...initialCliente });

  const cpfCnpjInput = useFormatInput(cliente.cpf_cnpj || "", "document");
  const telefoneInput = useFormatInput(cliente.telefone || "", "phone");

  const fetchCliente = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", clienteId)
      .single();
    if (error) {
      toast.error("Erro ao carregar cliente");
      return;
    }
    if (data) {
      setCliente(data as unknown as Cliente);
      cpfCnpjInput.setDisplayValue(data.cpf_cnpj || "");
      telefoneInput.setDisplayValue(data.telefone || "");
    }
  };

  const handleOpen = () => {
    fetchCliente();
    setOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCliente(prev => ({ ...prev, ativo: checked }));
  };

  const handleAddressChange = (field: keyof AddressData, value: string) => {
    setCliente(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.nome) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("clientes")
        .update({
          nome: cliente.nome,
          cpf_cnpj: cpfCnpjInput.displayValue || null,
          telefone: telefoneInput.displayValue || null,
          email: cliente.email || null,
          cep: cliente.cep || null,
          rua: cliente.rua || null,
          numero: cliente.numero || null,
          complemento: cliente.complemento || null,
          bairro: cliente.bairro || null,
          cidade: cliente.cidade || null,
          estado: cliente.estado || null,
          ativo: cliente.ativo,
        } as any)
        .eq("id", clienteId);
      if (error) throw error;
      toast.success("Cliente atualizado com sucesso!");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar cliente");
    } finally {
      setSaving(false);
    }
  };

  const addressData: AddressData = {
    cep: cliente.cep || "",
    rua: cliente.rua || "",
    numero: cliente.numero || "",
    complemento: cliente.complemento || "",
    bairro: cliente.bairro || "",
    cidade: cliente.cidade || "",
    estado: cliente.estado || "",
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        title="Editar Cliente"
      >
        <Pencil size={16} />
      </button>
      <FormModal
        title="Editar Cliente"
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" name="nome" value={cliente.nome} onChange={handleInputChange} placeholder="Digite o nome do cliente" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
              <Input id="cpf_cnpj" name="cpf_cnpj" value={cpfCnpjInput.displayValue} onChange={cpfCnpjInput.handleChange} placeholder="000.000.000-00 ou 00.000.000/0001-00" />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" value={telefoneInput.displayValue} onChange={telefoneInput.handleChange} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" value={cliente.email || ""} onChange={handleInputChange} placeholder="exemplo@email.com" />
          </div>
          <CepAddressFields address={addressData} onChange={handleAddressChange} />
          <div className="flex items-center space-x-2">
            <Checkbox id="ativo" checked={cliente.ativo} onCheckedChange={handleCheckboxChange} />
            <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
          </div>
        </div>
      </FormModal>
    </>
  );
};
