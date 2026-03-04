import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMonthFilter } from "@/contexts/MonthFilterContext";
import { addMonths, startOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MonthCarousel = () => {
  const { selectedMonth, setSelectedMonth } = useMonthFilter();

  const label = format(selectedMonth, "MMMM yyyy", { locale: ptBR });

  const go = (dir: number) => {
    setSelectedMonth(startOfMonth(addMonths(selectedMonth, dir)));
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => go(-1)}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium text-foreground capitalize min-w-[120px] text-center">
        {label}
      </span>
      <button
        onClick={() => go(1)}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MonthCarousel;
