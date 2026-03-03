import React, { createContext, useContext, useState, useMemo } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface MonthFilterContextType {
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  monthStart: string;
  monthEnd: string;
}

const MonthFilterContext = createContext<MonthFilterContextType | undefined>(undefined);

export const useMonthFilter = () => {
  const context = useContext(MonthFilterContext);
  if (!context) {
    throw new Error("useMonthFilter must be used within a MonthFilterProvider");
  }
  return context;
};

export const MonthFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));

  const monthStart = useMemo(() => format(startOfMonth(selectedMonth), "yyyy-MM-dd"), [selectedMonth]);
  const monthEnd = useMemo(() => format(endOfMonth(selectedMonth), "yyyy-MM-dd"), [selectedMonth]);

  return (
    <MonthFilterContext.Provider value={{ selectedMonth, setSelectedMonth, monthStart, monthEnd }}>
      {children}
    </MonthFilterContext.Provider>
  );
};
