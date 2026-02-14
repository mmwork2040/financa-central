
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";

interface ValorInputProps {
  valor: number | string;
  onValorChange: (valor: number) => void;
}

export const ValorInput = ({ valor, onValorChange }: ValorInputProps) => {
  const handleValueChange = (value: string | undefined) => {
    const numericValue = value ? Number(value.replace(/\D/g, "")) / 100 : 0;
    onValorChange(numericValue);
  };

  // Format initial value for currency display
  const formatInitialValue = () => {
    if (typeof valor === 'number') {
      return valor.toFixed(2);
    }
    return typeof valor === 'string' ? valor : '0';
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="valor" className="text-right">Valor</Label>
      <div className="col-span-3">
        <CurrencyInput
          id="valor"
          name="valor"
          defaultValue={formatInitialValue()}
          decimalsLimit={2}
          onValueChange={handleValueChange}
          prefix="R$ "
          groupSeparator="."
          decimalSeparator=","
          placeholder="R$ 0,00"
        />
      </div>
    </div>
  );
};
