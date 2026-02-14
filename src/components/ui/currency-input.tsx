
import * as React from "react";
import ReactCurrencyInput from "react-currency-input-field";

export interface CurrencyInputProps {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  decimalsLimit?: number;
  onValueChange: (value: string | undefined) => void;
  prefix?: string;
  groupSeparator?: string;
  decimalSeparator?: string;
  className?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (props, ref) => {
    return (
      <ReactCurrencyInput
        ref={ref}
        id={props.id}
        name={props.name}
        defaultValue={props.defaultValue}
        decimalsLimit={props.decimalsLimit || 2}
        onValueChange={props.onValueChange}
        prefix={props.prefix || "R$ "}
        groupSeparator={props.groupSeparator || "."}
        decimalSeparator={props.decimalSeparator || ","}
        className={props.className || "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"}
        placeholder={props.placeholder || "R$ 0,00"}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
