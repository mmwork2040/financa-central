import React from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard, TrendingUp } from "lucide-react";

const PersonalDashboardMockup = () => {
  const chartData = [
    { month: "Out", receita: 30, despesa: 45 },
    { month: "Nov", receita: 50, despesa: 35 },
    { month: "Dez", receita: 80, despesa: 60 },
    { month: "Jan", receita: 65, despesa: 40 },
    { month: "Fev", receita: 90, despesa: 55 },
    { month: "Mar", receita: 75, despesa: 48 },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative group">
        {/* Glow */}
        <div className="absolute inset-0 opacity-60 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.08) 0%, transparent 60%)"
        }} />

        {/* Header */}
        <div className="px-5 py-3 border-b border-border/40 bg-background/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-bold text-foreground">Contabiliza AI Pessoal</span>
          </div>
          <span className="text-[9px] text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-medium">Modo Pessoa Física</span>
        </div>

        {/* Welcome */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-sm font-bold text-foreground">Olá, Lucas! 👋</p>
          <p className="text-[10px] text-muted-foreground">Suas finanças pessoais em dia</p>
        </div>

        {/* Summary Cards */}
        <div className="px-5 grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { label: "Receitas", value: "R$ 8.450", icon: ArrowUpRight, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", border: "border-l-green-500" },
            { label: "Despesas", value: "R$ 4.230", icon: ArrowDownRight, color: "text-destructive", bg: "bg-destructive/10", border: "border-l-destructive" },
            { label: "Saldo", value: "R$ 4.220", icon: Wallet, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-l-blue-500" },
            { label: "Investido", value: "R$ 12.500", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", border: "border-l-primary" },
          ].map((card) => (
            <div key={card.label} className={`rounded-lg border border-border/60 bg-background/60 p-2.5 border-l-2 ${card.border}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`rounded-full ${card.bg} p-1`}>
                  <card.icon className={`h-2.5 w-2.5 ${card.color}`} />
                </div>
                <p className="text-[8px] text-muted-foreground">{card.label}</p>
              </div>
              <p className={`text-[11px] font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Fatura do cartão */}
        <div className="px-5 mb-4">
          <div className="rounded-xl border border-border/40 bg-background/60 p-3">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-foreground">Faturas dos Cartões</span>
            </div>
            <div className="space-y-1.5">
              {[
                { nome: "Nubank •••• 4523", fatura: "R$ 1.890", venc: "10/Abr", color: "bg-purple-500" },
                { nome: "Itaú •••• 7891", fatura: "R$ 2.340", venc: "15/Abr", color: "bg-orange-500" },
              ].map((c) => (
                <div key={c.nome} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${c.color}`} />
                    <span className="text-[9px] text-foreground">{c.nome}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-semibold text-foreground">{c.fatura}</span>
                    <span className="text-[8px] text-muted-foreground ml-1.5">venc. {c.venc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="px-5 pb-4">
          <div className="rounded-xl border border-border/40 bg-background/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-foreground">Receitas vs Despesas</p>
              <div className="flex items-center gap-3 text-[8px]">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" /> Receitas</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" /> Despesas</span>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex gap-px items-end justify-center">
                  <div className="w-2/5 bg-green-500 rounded-t-sm transition-all" style={{ height: `${d.receita}%`, minHeight: d.receita ? 3 : 0 }} />
                  <div className="w-2/5 bg-destructive/70 rounded-t-sm transition-all" style={{ height: `${d.despesa}%`, minHeight: d.despesa ? 3 : 0 }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {chartData.map((d, i) => (
                <span key={i} className="flex-1 text-center text-[7px] text-muted-foreground">{d.month}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboardMockup;
