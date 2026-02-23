import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";

interface ProjetoFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjeto: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export const ProjetoForm = ({
  isOpen, onClose, currentProjeto, onInputChange, onSelectChange, onSubmit, isSaving,
}: ProjetoFormProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{currentProjeto?.id ? "Editar" : "Novo"} Projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                name="nome"
                value={currentProjeto?.nome || ""}
                onChange={onInputChange}
                placeholder="Nome do projeto"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                value={currentProjeto?.descricao || ""}
                onChange={onInputChange}
                placeholder="Descrição do projeto"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={currentProjeto?.status || "ativo"}
                  onValueChange={(v) => onSelectChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orcamento">Orçamento</Label>
                <CurrencyInput
                  id="orcamento"
                  name="orcamento"
                  value={Number(currentProjeto?.orcamento) || 0}
                  onValueChange={(val) => {
                    const synth = { target: { name: "orcamento", value: String(Number(val || "0") / 100) } } as any;
                    onInputChange(synth);
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : currentProjeto?.id ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
