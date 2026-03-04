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
  const handleCurrencyChange = (field: string, val: string | undefined) => {
    const synth = { target: { name: field, value: String(Number(val || "0") / 100) } } as any;
    onInputChange(synth);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                rows={2}
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
                  onValueChange={(val) => handleCurrencyChange("orcamento", val)}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-1">
              <p className="text-sm font-medium text-muted-foreground mb-3">Planejamento Financeiro</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Investimento Previsto</Label>
                  <CurrencyInput
                    id="investimento_previsto"
                    name="investimento_previsto"
                    value={Number(currentProjeto?.investimento_previsto) || 0}
                    onValueChange={(val) => handleCurrencyChange("investimento_previsto", val)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Despesa Prevista</Label>
                  <CurrencyInput
                    id="despesa_prevista"
                    name="despesa_prevista"
                    value={Number(currentProjeto?.despesa_prevista) || 0}
                    onValueChange={(val) => handleCurrencyChange("despesa_prevista", val)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data Início</Label>
                  <Input
                    id="data_inicio"
                    name="data_inicio"
                    type="date"
                    value={currentProjeto?.data_inicio || ""}
                    onChange={onInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_fim">Data Fim</Label>
                  <Input
                    id="data_fim"
                    name="data_fim"
                    type="date"
                    value={currentProjeto?.data_fim || ""}
                    onChange={onInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="imposto_percentual">% Imposto</Label>
                  <Input
                    id="imposto_percentual"
                    name="imposto_percentual"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={currentProjeto?.imposto_percentual || 0}
                    onChange={onInputChange}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base do Imposto</Label>
                  <Select
                    value={currentProjeto?.imposto_base || "lucro"}
                    onValueChange={(v) => onSelectChange("imposto_base", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lucro">Sobre o Lucro</SelectItem>
                      <SelectItem value="receita">Sobre a Receita Total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
