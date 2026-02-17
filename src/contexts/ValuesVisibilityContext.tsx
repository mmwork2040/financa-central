
import React, { createContext, useContext, useState } from "react";

interface ValuesVisibilityContextType {
  visible: boolean;
  toggle: () => void;
}

const ValuesVisibilityContext = createContext<ValuesVisibilityContextType>({
  visible: false,
  toggle: () => {},
});

export const ValuesVisibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState(false);
  return (
    <ValuesVisibilityContext.Provider value={{ visible, toggle: () => setVisible((v) => !v) }}>
      {children}
    </ValuesVisibilityContext.Provider>
  );
};

export const useValuesVisibility = () => useContext(ValuesVisibilityContext);

export const maskValue = (value: string | number, visible: boolean): string => {
  if (visible) return String(value);
  return "••••••";
};
