
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Fornecedor } from "@/types/fornecedor.types";
import { useFormatInput } from "@/hooks/use-format-input";

interface FornecedorFormProps {
  currentFornecedor: Fornecedor;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCheckboxChange: (checked: boolean) => void;
  cpfCnpjInput?: {
    displayValue: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  telefoneInput?: {
    displayValue: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
}

const FornecedorForm: React.FC<FornecedorFormProps> = ({
  currentFornecedor,
  handleInputChange,
  handleCheckboxChange,
  cpfCnpjInput,
  telefoneInput,
}) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            name="nome"
            value={currentFornecedor.nome}
            onChange={handleInputChange}
            placeholder="Digite o nome do fornecedor"
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
            value={cpfCnpjInput ? cpfCnpjInput.displayValue : currentFornecedor.cpf_cnpj || ''}
            onChange={cpfCnpjInput ? cpfCnpjInput.handleChange : handleInputChange}
            placeholder="000.000.000-00 ou 00.000.000/0001-00"
          />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            value={telefoneInput ? telefoneInput.displayValue : currentFornecedor.telefone || ''}
            onChange={telefoneInput ? telefoneInput.handleChange : handleInputChange}
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
          value={currentFornecedor.email || ''}
          onChange={handleInputChange}
          placeholder="exemplo@email.com"
        />
      </div>
      <div>
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          name="endereco"
          value={currentFornecedor.endereco || ''}
          onChange={handleInputChange}
          placeholder="Rua, número, bairro, cidade - UF"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="ativo" 
          checked={currentFornecedor.ativo}
          onCheckedChange={handleCheckboxChange}
        />
        <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
      </div>
    </div>
  );
};

export default FornecedorForm;
