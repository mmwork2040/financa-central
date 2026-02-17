
import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps {
  id: string;
  name: string;
  value?: number;
  defaultValue?: string;
  placeholder?: string;
  decimalsLimit?: number;
  onValueChange: (value: string | undefined) => void;
  prefix?: string;
  groupSeparator?: string;
  decimalSeparator?: string;
  className?: string;
}

function formatBRL(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const intPart = Math.floor(absCents / 100);
  const decPart = (absCents % 100).toString().padStart(2, "0");
  const formatted = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${isNegative ? "-" : ""}R$ ${formatted},${decPart}`;
}

function parseToCents(val: string): number {
  return parseInt(val.replace(/\D/g, "") || "0", 10);
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ id, name, value, defaultValue, onValueChange, className, placeholder }, ref) => {
    const getInitialCents = (): number => {
      if (typeof value === "number") return Math.round(value * 100);
      if (defaultValue) {
        const cleaned = defaultValue.replace(/[^\d.,\-]/g, "").replace(",", ".");
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : Math.round(num * 100);
      }
      return 0;
    };

    const [cents, setCents] = React.useState(getInitialCents);

    // Sync if value prop changes externally
    React.useEffect(() => {
      if (typeof value === "number") {
        setCents(Math.round(value * 100));
      }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const newCents = Math.floor(cents / 10);
        setCents(newCents);
        onValueChange(String(newCents));
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        setCents(0);
        onValueChange("0");
        return;
      }

      // Only allow digits
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        const newCents = cents * 10 + parseInt(e.key, 10);
        // Limit to prevent overflow (max ~999 million)
        if (newCents > 99999999999) return;
        setCents(newCents);
        onValueChange(String(newCents));
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Prevent default change, we handle via keyDown
      e.preventDefault();
    };

    return (
      <input
        ref={ref}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        value={formatBRL(cents)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "R$ 0,00"}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
