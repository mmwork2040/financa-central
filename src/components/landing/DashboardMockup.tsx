import React from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const DashboardMockup = () => {
  const bars = [
    { h: 45, color: "bg-primary" },
    { h: 65, color: "bg-primary" },
    { h: 35, color: "bg-destructive/60" },
    { h: 80, color: "bg-primary" },
    { h: 50, color: "bg-primary" },
    { h: 30, color: "bg-destructive/60" },
    { h: 70, color: "bg-primary" },
    { h: 55, color: "bg-primary" },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Fluxo de Caixa</span>
        <span className="text-[10px] text-muted-foreground">Mar 2026</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-primary/10 p-2.5 text-center">
          <TrendingUp className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">Receitas</p>
          <p className="text-xs font-bold text-foreground">R$ 24.500</p>
        </div>
        <div className="rounded-xl bg-destructive/10 p-2.5 text-center">
          <TrendingDown className="h-3.5 w-3.5 text-destructive mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">Despesas</p>
          <p className="text-xs font-bold text-foreground">R$ 12.300</p>
        </div>
        <div className="rounded-xl bg-accent p-2.5 text-center">
          <DollarSign className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">Saldo</p>
          <p className="text-xs font-bold text-primary">R$ 12.200</p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1.5 h-20 pt-2">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`flex-1 ${bar.color} rounded-t-sm transition-all`}
            style={{ height: `${bar.h}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span>
        <span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span>
      </div>
    </div>
  );
};

export default DashboardMockup;
