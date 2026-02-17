
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";

interface ValorInputProps {
  valor: number | string;
  onValorChange: (valor: number) => void;
}

export const ValorInput = ({ valor, onValorChange }: ValorInputProps) => {
  const handleValueChange = (value: string | undefined) => {
    const cents = parseInt(value || "0", 10);
    onValorChange(cents / 100);
  };

  const numericValue = typeof valor === "number" ? valor : parseFloat(valor) || 0;

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="valor" className="text-right">Valor</Label>
      <div className="col-span-3">
        <CurrencyInput
          id="valor"
          name="valor"
          value={numericValue}
          decimalsLimit={2}
          onValueChange={handleValueChange}
          placeholder="R$ 0,00"
        />
      </div>
    </div>
  );
};
