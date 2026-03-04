
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/formatters";

export type LancamentoModo = "unico" | "recorrente" | "parcelado";

interface LancamentoModoSelectProps {
  modo: LancamentoModo;
  onModoChange: (modo: LancamentoModo) => void;
  // Recorrente fields
  recorrenciaTipo?: string;
  onRecorrenciaTipoChange?: (value: string) => void;
  recorrenciaFim?: string | null;
  onRecorrenciaFimChange?: (value: string | null) => void;
  // Parcelado fields
  totalParcelas?: number | null;
  onTotalParcelasChange?: (value: number | null) => void;
  valorTotal?: number;
}

export const LancamentoModoSelect = ({
  modo,
  onModoChange,
  recorrenciaTipo = "mensal",
  onRecorrenciaTipoChange,
  recorrenciaFim,
  onRecorrenciaFimChange,
  totalParcelas,
  onTotalParcelasChange,
  valorTotal = 0,
}: LancamentoModoSelectProps) => {
  const valorParcela = totalParcelas && totalParcelas > 1
    ? Math.round((valorTotal / totalParcelas) * 100) / 100
    : valorTotal;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-1">Modo</Label>
        <div className="col-span-3">
          <RadioGroup
            value={modo}
            onValueChange={(v) => onModoChange(v as LancamentoModo)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="unico" id="modo-unico" />
              <Label htmlFor="modo-unico" className="font-normal cursor-pointer text-sm">Único</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="recorrente" id="modo-recorrente" />
              <Label htmlFor="modo-recorrente" className="font-normal cursor-pointer text-sm">Recorrente</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="parcelado" id="modo-parcelado" />
              <Label htmlFor="modo-parcelado" className="font-normal cursor-pointer text-sm">Parcelado</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {modo === "recorrente" && (
        <>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-xs">Frequência</Label>
            <div className="col-span-3">
              <Select value={recorrenciaTipo} onValueChange={onRecorrenciaTipoChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-xs">Até quando</Label>
            <div className="col-span-3">
              <Input
                type="date"
                value={recorrenciaFim || ""}
                onChange={e => onRecorrenciaFimChange?.(e.target.value || null)}
                placeholder="Infinito se vazio"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Deixe vazio para repetir indefinidamente</p>
            </div>
          </div>
        </>
      )}

      {modo === "parcelado" && (
        <>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-xs">Nº de Parcelas</Label>
            <div className="col-span-3">
              <Input
                type="number"
                min="2"
                max="360"
                placeholder="Ex: 12"
                value={totalParcelas || ""}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  onTotalParcelasChange?.(isNaN(v) ? null : v);
                }}
              />
            </div>
          </div>
          {totalParcelas && totalParcelas > 1 && valorTotal > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div />
              <div className="col-span-3 rounded-md border bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(valorTotal)} total → <strong>{totalParcelas}x de {formatCurrency(valorParcela)}</strong>
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
