
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Option {
  id: string;
  nome?: string;
  descricao?: string;
}

interface GenericSelectProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  noneOptionLabel?: string;
  noneOptionValue?: string;
  nameField?: string; // field to display, default 'nome'
}

export const GenericSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = `Selecione ${label.toLowerCase()}`,
  noneOptionLabel = "Nenhum",
  noneOptionValue = `no-${label.toLowerCase().replace(/\s/g, '-')}`,
  nameField = 'nome'
}: GenericSelectProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={label.toLowerCase()} className="text-right">{label}</Label>
      <Select 
        value={value || noneOptionValue} 
        onValueChange={(val) => onChange(val === noneOptionValue ? "" : val)}
      >
        <SelectTrigger className="col-span-3">
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
    </div>
  );
};
