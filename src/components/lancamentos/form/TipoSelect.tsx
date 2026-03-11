
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TipoSelectProps {
  value: "despesa" | "receita" | "investimento" | "resgate" | "rentabilidade";
  onChange: (value: string) => void;
}

export const TipoSelect = ({ value, onChange }: TipoSelectProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="tipo" className="text-right">Tipo</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Selecione o tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="despesa">Despesa</SelectItem>
          <SelectItem value="receita">Receita</SelectItem>
          <SelectItem value="investimento">Investimento</SelectItem>
          <SelectItem value="resgate">Resgate de Investimento</SelectItem>
          <SelectItem value="rentabilidade">Rentabilidade</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
