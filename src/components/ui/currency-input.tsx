
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

function parseToNumber(raw: string): number {
  // Remove everything except digits, comma, dot, minus
  let cleaned = raw.replace(/[^\d.,-]/g, "");
  if (!cleaned) return 0;

  // Detect format: if last separator is comma and has <=2 digits after → comma is decimal
  // e.g. "1.234,56" or "1234,5" → comma is decimal
  // e.g. "1,234.56" → dot is decimal
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma > lastDot) {
    // Comma is the decimal separator (Brazilian format)
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // Dot is the decimal separator
    cleaned = cleaned.replace(/,/g, "");
  } else {
    // No separators or only one type
    cleaned = cleaned.replace(",", ".");
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function toRawDisplay(value: number): string {
  if (value === 0) return "";
  // Show as "1234,56" for easy editing
  return value.toFixed(2).replace(".", ",");
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ id, name, value, defaultValue, onValueChange, className, placeholder }, ref) => {
    const getInitialValue = (): number => {
      if (typeof value === "number") return value;
      if (defaultValue) {
        return parseToNumber(defaultValue);
      }
      return 0;
    };

    const [focused, setFocused] = React.useState(false);
    const [displayText, setDisplayText] = React.useState(() => {
      const v = getInitialValue();
      return v === 0 ? "" : formatBRL(v);
    });
    const lastExternalValue = React.useRef(value);

    // Sync when value prop changes externally
    React.useEffect(() => {
      if (typeof value === "number" && value !== lastExternalValue.current) {
        lastExternalValue.current = value;
        if (!focused) {
          setDisplayText(value === 0 ? "" : formatBRL(value));
        }
      }
    }, [value, focused]);

    const handleFocus = () => {
      setFocused(true);
      const currentValue = typeof value === "number" ? value : parseToNumber(displayText);
      setDisplayText(toRawDisplay(currentValue));
    };

    const handleBlur = () => {
      setFocused(false);
      const parsed = parseToNumber(displayText);
      const cents = Math.round(parsed * 100);
      lastExternalValue.current = parsed;
      setDisplayText(parsed === 0 ? "" : formatBRL(parsed));
      onValueChange(String(cents));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayText(e.target.value);
    };

    return (
      <input
        ref={ref}
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        value={displayText}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
