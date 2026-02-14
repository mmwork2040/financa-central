
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface RecorrenciaToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const RecorrenciaToggle = ({ checked, onCheckedChange }: RecorrenciaToggleProps) => {
  return (
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
  );
};
