import React, { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMonthFilter } from "@/contexts/MonthFilterContext";
import { addMonths, startOfMonth, isSameMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const MonthCarousel = () => {
  const { selectedMonth, setSelectedMonth } = useMonthFilter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Generate months: 6 back, current, 12 forward = 19 months
  const months = React.useMemo(() => {
    const now = startOfMonth(new Date());
    return Array.from({ length: 19 }, (_, i) => addMonths(now, i - 6));
  }, []);

  const hasMountedRef = useRef(false);

  const centerActive = React.useCallback((smooth = true) => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: smooth ? "smooth" : "instant" });
    }
  }, []);

  // Initial center (instant) after first paint
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      centerActive(false);
      hasMountedRef.current = true;
    });
    return () => cancelAnimationFrame(raf);
  }, [centerActive]);

  // Re-center smoothly on month change (after mount)
  useEffect(() => {
    if (hasMountedRef.current) {
      centerActive(true);
    }
  }, [selectedMonth, centerActive]);

  useEffect(() => {
    const handleResize = () => centerActive(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [centerActive]);

  const scroll = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 200, behavior: "smooth" });
    }
  };

  return (
    <div className="flex items-center gap-1 w-full">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 rounded-full"
        onClick={() => scroll(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto scrollbar-hide flex gap-1 py-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {months.map((month) => {
          const isActive = isSameMonth(month, selectedMonth);
          const label = format(month, "MMM yyyy", { locale: ptBR });
          return (
            <button
              key={month.toISOString()}
              ref={isActive ? activeRef : undefined}
              onClick={() => setSelectedMonth(startOfMonth(month))}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap capitalize",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 rounded-full"
        onClick={() => scroll(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MonthCarousel;
