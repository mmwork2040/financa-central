
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  tipo: "despesa" | "receita";
}

export const StatusSelect = ({ value, onChange, tipo }: StatusSelectProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="status" className="text-right">Status</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Selecione o status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="pago">Pago</SelectItem>
          <SelectItem value="cancelado">Cancelado</SelectItem>
          {tipo === "receita" && <SelectItem value="recebido">Recebido</SelectItem>}
        </SelectContent>
      </Select>
    </div>
  );
};
