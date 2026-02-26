
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormModal } from "@/components/modals/FormModal";
import { type Cliente } from "@/hooks/useClientes";
import CepAddressFields, { type AddressData } from "@/components/common/CepAddressFields";

interface ClienteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  cliente: Cliente;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCheckboxChange: (checked: boolean) => void;
  handleAddressChange: (field: keyof AddressData, value: string) => void;
  cpfCnpjInput: {
    displayValue: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  telefoneInput: {
    displayValue: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  isSaving: boolean;
}

const ClienteForm: React.FC<ClienteFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cliente,
  handleInputChange,
  handleCheckboxChange,
  handleAddressChange,
  cpfCnpjInput,
  telefoneInput,
  isSaving,
}) => {
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
    <FormModal
      title={cliente.id ? "Editar Cliente" : "Novo Cliente"}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      loading={isSaving}
    >
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              name="nome"
              value={cliente.nome}
              onChange={handleInputChange}
              placeholder="Digite o nome do cliente"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
            <Input
              id="cpf_cnpj"
              name="cpf_cnpj"
              value={cpfCnpjInput.displayValue}
              onChange={cpfCnpjInput.handleChange}
              placeholder="000.000.000-00 ou 00.000.000/0001-00"
            />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              name="telefone"
              value={telefoneInput.displayValue}
              onChange={telefoneInput.handleChange}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={cliente.email}
            onChange={handleInputChange}
            placeholder="exemplo@email.com"
          />
        </div>
        <CepAddressFields address={addressData} onChange={handleAddressChange} />
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="ativo" 
            checked={cliente.ativo}
            onCheckedChange={handleCheckboxChange}
          />
          <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
        </div>
      </div>
    </FormModal>
  );
};

export default ClienteForm;
