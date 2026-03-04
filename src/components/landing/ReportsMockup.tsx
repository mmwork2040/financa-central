import React from "react";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

const ReportsMockup = () => {
  const barData = [
    { label: "Jan", receita: 72, despesa: 45 },
    { label: "Fev", receita: 85, despesa: 52 },
    { label: "Mar", receita: 60, despesa: 40 },
    { label: "Abr", receita: 90, despesa: 55 },
    { label: "Mai", receita: 78, despesa: 48 },
  ];

  const donutSegments = [
    { color: "hsl(var(--primary))", percent: 35, label: "Anúncios" },
    { color: "hsl(25, 95%, 63%)", percent: 25, label: "Equipe" },
    { color: "hsl(var(--accent-foreground))", percent: 20, label: "Ferramentas" },
    { color: "hsl(var(--muted-foreground))", percent: 20, label: "Outros" },
  ];

  return (
    <div className="px-3 py-2 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <BarChart3 className="h-3.5 w-3.5 text-primary" />
        <p className="text-[11px] font-bold text-foreground">Relatórios</p>
        <span className="ml-auto text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Fev 2025</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
          <p className="text-[8px] text-muted-foreground">Receitas</p>
          <p className="text-[11px] font-bold text-emerald-600">32.4k</p>
          <div className="flex items-center justify-center gap-0.5">
            <TrendingUp className="h-2 w-2 text-emerald-500" />
            <span className="text-[7px] text-emerald-500">+12%</span>
          </div>
        </div>
        <div className="rounded-lg bg-red-500/10 p-2 text-center">
          <p className="text-[8px] text-muted-foreground">Despesas</p>
          <p className="text-[11px] font-bold text-red-500">19.8k</p>
          <div className="flex items-center justify-center gap-0.5">
            <TrendingDown className="h-2 w-2 text-red-500" />
            <span className="text-[7px] text-red-500">+5%</span>
          </div>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-center">
          <p className="text-[8px] text-muted-foreground">Lucro</p>
          <p className="text-[11px] font-bold text-primary">12.6k</p>
          <div className="flex items-center justify-center gap-0.5">
            <TrendingUp className="h-2 w-2 text-primary" />
            <span className="text-[7px] text-primary">+18%</span>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border border-border/40 bg-card p-2.5">
        <p className="text-[9px] font-semibold text-foreground mb-2">Receitas vs Despesas</p>
        <div className="flex items-end gap-2 h-[80px]">
          {barData.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-[2px] items-end justify-center" style={{ height: 65 }}>
                <div
                  className="w-[6px] rounded-t-sm bg-emerald-500/70"
                  style={{ height: `${d.receita}%` }}
                />
                <div
                  className="w-[6px] rounded-t-sm bg-red-400/60"
                  style={{ height: `${d.despesa}%` }}
                />
              </div>
              <span className="text-[7px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
            <span className="text-[7px] text-muted-foreground">Receitas</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-red-400/60" />
            <span className="text-[7px] text-muted-foreground">Despesas</span>
          </div>
        </div>
      </div>

      {/* Donut + legend */}
      <div className="rounded-xl border border-border/40 bg-card p-2.5 flex items-center gap-3">
        <div className="relative shrink-0" style={{ width: 60, height: 60 }}>
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {(() => {
              let offset = 0;
              return donutSegments.map((seg, i) => {
                const dash = seg.percent;
                const gap = 100 - dash;
                const el = (
                  <circle
                    key={i}
                    cx="18" cy="18" r="14"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="5"
                    strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                  />
                );
                offset += dash;
                return el;
              });
            })()}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-bold text-foreground">100%</span>
          </div>
        </div>
        <div className="space-y-1 flex-1">
          <p className="text-[9px] font-semibold text-foreground">Despesas por Categoria</p>
          {donutSegments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: seg.color }} />
              <span className="text-[7px] text-muted-foreground flex-1">{seg.label}</span>
              <span className="text-[7px] font-medium text-foreground">{seg.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsMockup;
