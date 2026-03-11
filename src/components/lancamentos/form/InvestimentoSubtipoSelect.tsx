
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type InvestimentoSubtipo = "novo" | "rentabilidade" | "resgate" | "reajuste";

interface InvestimentoSubtipoSelectProps {
  value: InvestimentoSubtipo;
  onChange: (value: InvestimentoSubtipo) => void;
}

export const InvestimentoSubtipoSelect = ({ value, onChange }: InvestimentoSubtipoSelectProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="subtipo" className="text-right">Operação</Label>
      <Select value={value} onValueChange={(v) => onChange(v as InvestimentoSubtipo)}>
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Selecione a operação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="novo">Novo Investimento</SelectItem>
          <SelectItem value="rentabilidade">Rentabilidade</SelectItem>
          <SelectItem value="resgate">Resgate de Investimento</SelectItem>
          <SelectItem value="reajuste">Reajuste Manual</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
