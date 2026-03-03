
import React, { createContext, useContext, useState, useEffect } from "react";

interface ValuesVisibilityContextType {
  visible: boolean;
  toggle: () => void;
}

const STORAGE_KEY = "dashboard_values_visible";

const ValuesVisibilityContext = createContext<ValuesVisibilityContextType>({
  visible: false,
  toggle: () => {},
});

export const ValuesVisibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(visible));
    } catch {}
  }, [visible]);

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
