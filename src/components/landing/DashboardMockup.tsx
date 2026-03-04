import React from "react";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Building2 } from "lucide-react";

const DashboardMockup = () => {
  const chartData = [
    { month: "Out", receita: 0, despesa: 0 },
    { month: "Nov", receita: 0, despesa: 0 },
    { month: "Dez", receita: 0, despesa: 0 },
    { month: "Jan", receita: 0, despesa: 0 },
    { month: "Fev", receita: 5, despesa: 3 },
    { month: "Mar", receita: 65, despesa: 40 },
  ];

  return (
    <div className="w-full max-w-lg space-y-3">
      <div className="glass-card rounded-2xl overflow-hidden shadow-xl relative group hover:-translate-y-1 transition-all duration-300">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 0%, hsla(187, 92%, 41%, 0.08) 0%, transparent 70%)"
        }} />

        <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between bg-background/80">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
              <Building2 className="h-3 w-3 text-primary" />
            </div>
            <span className="text-[10px] font-semibold text-foreground">Dashboard</span>
          </div>
          <span className="text-[9px] text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Mar 2026</span>
        </div>

        <div className="px-4 pt-3 pb-2">
          <p className="text-xs font-bold text-foreground">Olá, Lucas! 👋</p>
          <p className="text-[9px] text-muted-foreground">Aqui está o resumo do seu financeiro</p>
        </div>

        <div className="px-4 grid grid-cols-4 gap-1.5 mb-3">
          {[
            { label: "Receitas", value: "R$ 1.497", icon: TrendingUp, border: "border-l-primary", color: "text-primary" },
            { label: "Despesas", value: "R$ 976", icon: TrendingDown, border: "border-l-destructive", color: "text-destructive" },
            { label: "Saldo", value: "R$ 8.062", icon: DollarSign, border: "border-l-secondary", color: "text-secondary" },
            { label: "A Pagar", value: "25", icon: AlertTriangle, border: "border-l-accent", color: "text-accent" },
          ].map((card) => (
            <div key={card.label} className={`rounded-lg border border-border/60 bg-background/60 p-2 border-l-2 ${card.border}`}>
              <div className="flex items-center gap-1 mb-0.5">
                <card.icon className={`h-2.5 w-2.5 ${card.color}`} />
                <p className="text-[8px] text-muted-foreground">{card.label}</p>
              </div>
              <p className={`text-[10px] font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="px-4 grid grid-cols-3 gap-1.5 mb-3">
          {[
            { label: "Saldo Investido", value: "R$ 0,00", border: "border-l-primary" },
            { label: "Caixa Previsto", value: "-R$ 11.689", border: "border-l-destructive" },
            { label: "Meses de Caixa", value: "1 meses", border: "border-l-primary" },
          ].map((card) => (
            <div key={card.label} className={`rounded-lg border border-border/60 bg-background/60 p-2 border-l-2 ${card.border}`}>
              <p className="text-[8px] text-muted-foreground">{card.label}</p>
              <p className="text-[10px] font-bold text-foreground">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="px-4 pb-3">
          <div className="rounded-xl border border-border/40 bg-background/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[9px] text-muted-foreground">Saldo atual</p>
                <p className="text-xs font-bold text-foreground">R$ 8.062,83</p>
              </div>
              <div className="flex items-center gap-2 text-[8px]">
                <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" /> Receitas</span>
                <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" /> Despesas</span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-16">
              {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex gap-px items-end justify-center">
                  <div className="w-1/3 bg-primary rounded-t-sm transition-all" style={{ height: `${d.receita}%`, minHeight: d.receita ? 2 : 0 }} />
                  <div className="w-1/3 bg-destructive/70 rounded-t-sm transition-all" style={{ height: `${d.despesa}%`, minHeight: d.despesa ? 2 : 0 }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {chartData.map((d, i) => (
                <span key={i} className="flex-1 text-center text-[7px] text-muted-foreground">{d.month}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute top-3 right-3 glass-card rounded-xl px-2.5 py-1.5 shadow-lg text-[9px] z-10">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-2.5 w-2.5 text-primary" />
            <span className="font-semibold text-foreground">+23%</span>
            <span className="text-muted-foreground">vs mês anterior</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <p className="text-[10px] font-semibold text-foreground mb-3">Distribuição</p>
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="30" fill="none" stroke="hsl(var(--primary))" strokeWidth="10" strokeDasharray="115 73" strokeLinecap="round" transform="rotate(-90 40 40)" />
              <circle cx="40" cy="40" r="30" fill="none" stroke="hsl(var(--destructive))" strokeWidth="10" strokeDasharray="73 115" strokeLinecap="round" transform="rotate(120 40 40)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[7px] text-muted-foreground">Saldo</p>
              <p className="text-[9px] font-bold text-primary">R$ 8.062</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[9px] text-muted-foreground">Receitas</span>
              <span className="text-[9px] font-semibold text-foreground ml-auto">R$ 1.497</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-[9px] text-muted-foreground">Despesas</span>
              <span className="text-[9px] font-semibold text-foreground ml-auto">R$ 976</span>
            </div>
            <p className="text-[8px] text-muted-foreground mt-1">Receitas 61%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
