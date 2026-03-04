import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMonthFilter } from "@/contexts/MonthFilterContext";
import { addMonths, startOfMonth, format, setMonth, setYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MonthCarousel = () => {
  const { selectedMonth, setSelectedMonth } = useMonthFilter();
  const [open, setOpen] = useState(false);

  const label = format(selectedMonth, "MMMM yyyy", { locale: ptBR });

  const go = (dir: number) => {
    setSelectedMonth(startOfMonth(addMonths(selectedMonth, dir)));
  };

  const currentYear = selectedMonth.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = startOfMonth(setMonth(setYear(new Date(), currentYear), i));
    return { date: d, label: format(d, "MMMM", { locale: ptBR }) };
  });

  const pickMonth = (d: Date) => {
    setSelectedMonth(d);
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => go(-1)}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="text-sm font-medium text-foreground capitalize min-w-[120px] text-center hover:bg-accent rounded-md px-2 py-1 transition-colors cursor-pointer">
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="center">
          <div className="flex items-center justify-between mb-2 px-1">
            <button onClick={() => setSelectedMonth(startOfMonth(addMonths(selectedMonth, -12)))} className="text-muted-foreground hover:text-foreground text-xs font-medium">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-semibold text-foreground">{currentYear}</span>
            <button onClick={() => setSelectedMonth(startOfMonth(addMonths(selectedMonth, 12)))} className="text-muted-foreground hover:text-foreground text-xs font-medium">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {months.map((m) => (
              <button
                key={m.label}
                onClick={() => pickMonth(m.date)}
                className={`text-xs capitalize rounded-md px-1 py-1.5 transition-colors ${
                  m.date.getMonth() === selectedMonth.getMonth() && m.date.getFullYear() === selectedMonth.getFullYear()
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                {m.label.slice(0, 3)}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

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
