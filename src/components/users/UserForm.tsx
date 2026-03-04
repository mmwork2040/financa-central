
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormModal } from "@/components/modals/FormModal";
import { User, FormData } from "@/types/user.types";

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  selectedUser?: User | null;
  loading: boolean;
  isPersonalOwner?: boolean;
}

export const UserForm = ({
  isOpen,
  onClose,
  onSave,
  selectedUser,
  loading,
  isPersonalOwner = false,
}: UserFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: "",
    senha: "",
    permissao: "leitura",
  });

  // Quando o usuário selecionado muda, atualiza o formulário
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        nome: selectedUser.nome || "",
        email: selectedUser.email || "",
        senha: "", // Nunca preencher a senha automaticamente
        permissao: selectedUser.permissao || "leitura",
      });
    } else {
      // Resetar o formulário quando não há usuário selecionado (novo usuário)
      setFormData({
        nome: "",
        email: "",
        senha: "",
        permissao: "leitura",
      });
    }
  }, [selectedUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, permissao: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <FormModal
      title={selectedUser ? "Editar Usuário" : "Novo Usuário"}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nome" className="text-right">
            Nome <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            className="col-span-3"
            required
            placeholder="Digite o nome completo"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className="col-span-3"
            required
            disabled={!!selectedUser} // Disable email editing for existing users
            placeholder="exemplo@email.com"
          />
        </div>
        {!selectedUser && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="senha" className="text-right">
              Senha <span className="text-red-500">*</span>
            </Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              value={formData.senha}
              onChange={handleInputChange}
              className="col-span-3"
              required
              placeholder="Digite uma senha segura"
            />
          </div>
        )}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="permissao" className="text-right">
            Permissão <span className="text-red-500">*</span>
          </Label>
          <Select
            value={isPersonalOwner ? "admin" : formData.permissao}
            onValueChange={handleSelectChange}
            disabled={isPersonalOwner}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Selecione o nível de acesso" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="leitura">Leitura</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {isPersonalOwner && (
            <p className="col-span-3 col-start-2 text-xs text-muted-foreground">
              O proprietário da empresa pessoal é sempre Administrador.
            </p>
          )}
        </div>
      </div>
    </FormModal>
  );
};
