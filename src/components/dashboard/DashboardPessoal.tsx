import React from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, Landmark, Eye, EyeOff, LayoutDashboard, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import { DashboardShortcuts } from "@/components/dashboard/DashboardShortcuts";
import { LancamentosFormDialog } from "@/components/lancamentos/LancamentosFormDialog";
import { cn } from "@/lib/utils";

const DashboardPessoal = () => {
  const { userProfile } = useAuth();
  const { loading, summary, caixa, lancamentosRecentes, monthlyChartData } = useDashboardData();
  const { visible, toggle } = useValuesVisibility();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10">
              <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Olá, {userProfile?.nome?.split(" ")[0] || "Usuário"}! 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Suas finanças pessoais</p>
        </div>
        <Button variant="ghost" size="icon" onClick={toggle} className="shrink-0 h-8 w-8" title={visible ? "Ocultar valores" : "Exibir valores"}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Shortcuts */}
      <DashboardShortcuts />

      {/* Cards: Receitas, Despesas, Saldo */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1.5">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-xs text-muted-foreground">Receitas</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-green-600">
              {maskValue(formatCurrency(summary.totalReceitas + summary.receitasPrevistas), visible)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {maskValue(formatCurrency(summary.totalReceitas), visible)} já recebido
            </p>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-destructive/10 p-1.5">
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-xs text-muted-foreground">Despesas</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-destructive">
              {maskValue(formatCurrency(summary.totalDespesas + summary.despesasPrevistas), visible)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {maskValue(formatCurrency(summary.totalDespesas), visible)} já pago
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Saldo + Investido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-xs text-muted-foreground">Saldo do mês</span>
            </div>
            <p className={cn("text-lg sm:text-xl font-bold", summary.saldoAtual >= 0 ? "text-blue-600" : "text-destructive")}>
              {maskValue(formatCurrency(summary.saldoAtual), visible)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Soma dos saldos bancários</p>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5">
                <Landmark className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-xs text-muted-foreground">Saldo Investido</span>
            </div>
            <p className={cn("text-lg sm:text-xl font-bold", caixa.saldoInvestido > 0 ? "text-blue-600" : "text-muted-foreground")}>
              {maskValue(formatCurrency(caixa.saldoInvestido), visible)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Reserva total acumulada</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <DashboardChart data={monthlyChartData} saldoAtual={summary.saldoAtual} />

      {/* Últimas Movimentações */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-base font-semibold">Últimas Movimentações</span>
          </div>
          {lancamentosRecentes.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed">
              <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lancamentosRecentes.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.categoria?.nome || l.tipo} • {formatDate(l.data_vencimento)}
                      {l.status === "pago" || l.status === "recebido" ? (
                        <span className="ml-1 text-primary">✓</span>
                      ) : (
                        <span className="ml-1 text-amber-500">🕐</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={cn(
                      "text-sm font-semibold",
                      l.tipo === "receita" ? "text-green-600" : l.tipo === "investimento" ? "text-blue-600" : "text-destructive"
                    )}>
                      {l.tipo === "receita" ? "+" : "-"}{maskValue(formatCurrency(l.valor), visible)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LancamentosFormDialog />
    </div>
  );
};

export default DashboardPessoal;
