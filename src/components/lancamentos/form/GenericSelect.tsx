
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuickAddDialog } from "./QuickAddDialog";

interface Option {
  id: string;
  nome?: string;
  descricao?: string;
}

interface QuickAddConfig {
  title: string;
  table: string;
  fields: { name: string; label: string; type?: "text" | "select" | "number"; options?: { value: string; label: string }[]; required?: boolean; defaultValue?: string }[];
  onSuccess: () => void;
}

interface GenericSelectProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  noneOptionLabel?: string;
  noneOptionValue?: string;
  nameField?: string;
  quickAdd?: QuickAddConfig;
}

export const GenericSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = `Selecione ${label.toLowerCase()}`,
  noneOptionLabel = "Nenhum",
  noneOptionValue = `no-${label.toLowerCase().replace(/\s/g, '-')}`,
  nameField = 'nome',
  quickAdd,
}: GenericSelectProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={label.toLowerCase()} className="text-right">{label}</Label>
      <div className="col-span-3 flex gap-2">
        <Select 
          value={value || noneOptionValue} 
          onValueChange={(val) => onChange(val === noneOptionValue ? "" : val)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={noneOptionValue}>{noneOptionLabel}</SelectItem>
            {options.map(option => (
              <SelectItem key={option.id} value={option.id}>
                {option[nameField as keyof Option] || option.descricao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {quickAdd && (
          <QuickAddDialog
            title={quickAdd.title}
            table={quickAdd.table}
            fields={quickAdd.fields}
            onSuccess={quickAdd.onSuccess}
          />
        )}
      </div>
    </div>
  );
};
