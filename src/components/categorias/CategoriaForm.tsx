
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormModal } from "@/components/modals/FormModal";
import { type Categoria } from "@/hooks/useCategorias";

interface CategoriaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  currentCategoria: Categoria;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (value: "receita" | "despesa" | "investimento") => void;
  isSaving: boolean;
}

const CategoriaForm: React.FC<CategoriaFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentCategoria,
  handleInputChange,
  handleSelectChange,
  isSaving,
}) => {
  return (
    <FormModal
      title={currentCategoria.id ? "Editar Categoria" : "Nova Categoria"}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      loading={isSaving}
    >
      <div className="grid gap-4 py-4">
        <div>
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            name="nome"
            value={currentCategoria.nome}
            onChange={handleInputChange}
            placeholder="Digite o nome da categoria"
            required
          />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo *</Label>
          <Select 
            value={currentCategoria.tipo}
            onValueChange={(value) => handleSelectChange(value as "receita" | "despesa" | "investimento")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
              <SelectItem value="investimento">Investimento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormModal>
  );
};

export default CategoriaForm;
