
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ParcelasInputProps {
  value: number | string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ParcelasInput = ({ value, onChange }: ParcelasInputProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="total_parcelas" className="text-right">Total de Parcelas</Label>
      <Input
        id="total_parcelas"
        name="total_parcelas"
        type="number"
        value={value || ''}
        onChange={onChange}
        className="col-span-3"
        placeholder="12"
        min="2"
      />
    </div>
  );
};
