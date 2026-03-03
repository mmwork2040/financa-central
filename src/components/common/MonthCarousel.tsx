import React, { useRef, useEffect, useCallback } from "react";
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
  const hasMountedRef = useRef(false);

  const months = React.useMemo(() => {
    const now = startOfMonth(new Date());
    return Array.from({ length: 19 }, (_, i) => addMonths(now, i - 6));
  }, []);

  const centerActive = useCallback((smooth = true) => {
    const container = scrollRef.current;
    const el = activeRef.current;
    if (!container || !el) return;
    const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
    container.scrollTo({ left: Math.max(0, scrollLeft), behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Robust initial center: try multiple times until layout is stable
  useEffect(() => {
    let attempts = 0;
    const tryCenter = () => {
      centerActive(false);
      attempts++;
      if (attempts < 5) {
        requestAnimationFrame(tryCenter);
      } else {
        hasMountedRef.current = true;
      }
    };
    const raf = requestAnimationFrame(tryCenter);
    return () => cancelAnimationFrame(raf);
  }, [centerActive]);

  // Re-center smoothly on month change (after mount)
  useEffect(() => {
    if (hasMountedRef.current) {
      centerActive(true);
    }
  }, [selectedMonth, centerActive]);

  // Re-center on resize
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
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize",
                "transition-all duration-300 ease-out",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm scale-110 animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground scale-100 opacity-70 hover:opacity-100"
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
