
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DescricaoInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DescricaoInput = ({ value, onChange }: DescricaoInputProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="descricao" className="text-right">Descrição</Label>
      <Input
        id="descricao"
        name="descricao"
        value={value}
        onChange={onChange}
        className="col-span-3"
        placeholder="Ex: Pagamento de fornecedor"
      />
    </div>
  );
};
