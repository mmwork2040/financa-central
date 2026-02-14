
import { useState, useCallback } from 'react';
import { 
  phoneInputMask, 
  documentInputMask, 
  formatCurrencyInput,
  extractNumericValue
} from '@/utils/format';

type FormatType = 'phone' | 'document' | 'currency';

export const useFormatInput = (initialValue: string = '', type: FormatType) => {
  const [displayValue, setDisplayValue] = useState(
    type === 'phone' ? phoneInputMask(initialValue) : 
    type === 'document' ? documentInputMask(initialValue) : 
    type === 'currency' ? formatCurrencyInput(initialValue) : initialValue
  );
  
  // Get the raw value (unformatted)
  const getRawValue = useCallback(() => {
    switch (type) {
      case 'phone':
      case 'document':
        return displayValue.replace(/\D/g, '');
      case 'currency':
        return extractNumericValue(displayValue);
      default:
        return displayValue;
    }
  }, [displayValue, type]);
  
  // Handle input change with formatting
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    switch (type) {
      case 'phone':
        setDisplayValue(phoneInputMask(value));
        break;
      case 'document':
        setDisplayValue(documentInputMask(value));
        break;
      case 'currency':
        setDisplayValue(formatCurrencyInput(value));
        break;
      default:
        setDisplayValue(value);
    }
  }, [type]);
  
  return {
    displayValue,
    setDisplayValue,
    handleChange,
    getRawValue
  };
};
