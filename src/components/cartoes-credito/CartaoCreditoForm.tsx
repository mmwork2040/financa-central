import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CartaoCreditoForm as FormType } from "@/hooks/useCartoesCredito";
import { CurrencyInput } from "@/components/ui/currency-input";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormType;
  setFormData: React.Dispatch<React.SetStateAction<FormType>>;
  onSave: () => void;
  isEditing: boolean;
}

const BANDEIRAS = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard", "Outra"];

export const CartaoCreditoFormDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSave,
  isEditing,
}) => {
  const dias = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar" : "Novo"} Cartão de Crédito</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Cartão *</Label>
            <Input
              placeholder="Ex: Nubank, Itaú Platinum"
              value={formData.nome}
              onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bandeira</Label>
              <Select
                value={formData.bandeira || ""}
                onValueChange={(v) => setFormData((p) => ({ ...p, bandeira: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {BANDEIRAS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Últimos 4 dígitos</Label>
              <Input
                placeholder="1234"
                maxLength={4}
                value={formData.ultimos_digitos}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    ultimos_digitos: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Limite do Cartão</Label>
            <CurrencyInput
              value={formData.limite}
              onValueChange={(v) => setFormData((p) => ({ ...p, limite: v }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dia de Fechamento *</Label>
              <Select
                value={String(formData.dia_fechamento)}
                onValueChange={(v) => setFormData((p) => ({ ...p, dia_fechamento: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dias.map((d) => (
                    <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Dia em que a fatura fecha
              </p>
            </div>
            <div className="space-y-2">
              <Label>Dia de Vencimento *</Label>
              <Select
                value={String(formData.dia_vencimento)}
                onValueChange={(v) => setFormData((p) => ({ ...p, dia_vencimento: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dias.map((d) => (
                    <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Dia em que a fatura vence (pagamento)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={formData.ativo}
              onCheckedChange={(v) => setFormData((p) => ({ ...p, ativo: v }))}
            />
            <Label>Cartão ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={!formData.nome.trim()}>
            {isEditing ? "Atualizar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
