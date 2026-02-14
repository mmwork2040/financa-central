
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormaPagamentoFormProps {
  isOpen: boolean;
  onClose: () => void;
  descricao: string;
  onDescricaoChange: (value: string) => void;
  onSave: () => void;
  isEditing: boolean;
}

const FormaPagamentoForm: React.FC<FormaPagamentoFormProps> = ({
  isOpen,
  onClose,
  descricao,
  onDescricaoChange,
  onSave,
  isEditing
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar" : "Nova"} Forma de Pagamento</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite os detalhes da forma de pagamento."
              : "Preencha os dados para cadastrar uma nova forma de pagamento."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="descricao" className="text-right">
              Descrição
            </Label>
            <Input
              id="descricao"
              name="descricao"
              value={descricao}
              onChange={(e) => onDescricaoChange(e.target.value)}
              placeholder="Digite a descrição da forma de pagamento"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave}>{isEditing ? "Salvar" : "Cadastrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormaPagamentoForm;
