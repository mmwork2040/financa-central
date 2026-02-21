
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface RecorrenciaToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  recorrenciaTipo?: string;
  onRecorrenciaTipoChange?: (value: string) => void;
  recorrenciaFim?: string | null;
  onRecorrenciaFimChange?: (value: string | null) => void;
}

export const RecorrenciaToggle = ({ 
  checked, 
  onCheckedChange, 
  recorrenciaTipo = "mensal",
  onRecorrenciaTipoChange,
  recorrenciaFim,
  onRecorrenciaFimChange
}: RecorrenciaToggleProps) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="recorrente" className="text-right">Recorrente</Label>
        <div className="flex items-center col-span-3">
          <Switch 
            id="recorrente"
            checked={checked}
            onCheckedChange={onCheckedChange}
          />
          <span className="ml-2 text-sm text-muted-foreground">
            {checked ? "Sim" : "Não"}
          </span>
        </div>
      </div>
      
      {checked && (
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
    </div>
  );
};
