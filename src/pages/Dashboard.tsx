import React from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, Clock, Activity, Eye, EyeOff, LayoutDashboard, Landmark, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LancamentosFormDialog } from "@/components/lancamentos/LancamentosFormDialog";
import { LancamentosProvider, useLancamentosContext } from "@/contexts/LancamentosContext";
import { useDashboardData, HealthStatus } from "@/hooks/useDashboardData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { ValuesVisibilityProvider, useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";
import { useSolicitacoesSaida } from "@/hooks/useSolicitacoesSaida";
import { MyExitRequests } from "@/components/solicitacoes/MyExitRequests";
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import { DashboardShortcuts } from "@/components/dashboard/DashboardShortcuts";
import { DashboardDonutChart } from "@/components/dashboard/DashboardDonutChart";
import { cn } from "@/lib/utils";

const healthConfig: Record<HealthStatus, { label: string; color: string; icon: string; bg: string }> = {
  saudavel: { label: "Saudável", color: "text-primary", icon: "🟢", bg: "glass-card border-primary/20" },
  atencao: { label: "Atenção", color: "text-amber-600", icon: "🟡", bg: "glass-card border-amber-200" },
  risco: { label: "Risco", color: "text-destructive", icon: "🔴", bg: "glass-card border-destructive/20" },
};

const DashboardContent = () => {
  const { userProfile } = useAuth();
  const { loading, summary, caixa, lancamentosRecentes, contasProximas, healthStatus, monthlyChartData } = useDashboardData();
  const { visible, toggle } = useValuesVisibility();
  const { myRequests, cancelRequest, actionLoading } = useSolicitacoesSaida();

  const health = healthConfig[healthStatus];

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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10">
            <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Olá, {userProfile?.nome?.split(' ')[0] || 'Usuário'}! 👋</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Aqui está o resumo do seu financeiro</p>
      </div>

      <MyExitRequests requests={myRequests} onCancel={cancelRequest} loading={actionLoading} />

      {/* Health Indicator with Eye toggle */}
      <div className={cn("flex items-center justify-between gap-3 rounded-xl p-3", health.bg)}>
        <div className="flex items-center gap-3">
          <span className="text-lg">{health.icon}</span>
          <div>
            <p className={cn("text-sm font-semibold", health.color)}>Saúde Financeira: {health.label}</p>
            <p className="text-xs text-muted-foreground">
              {healthStatus === 'saudavel' && "Suas contas estão em dia!"}
              {healthStatus === 'atencao' && "Fique atento aos compromissos pendentes."}
              {healthStatus === 'risco' && "Você tem contas em atraso. Regularize para evitar problemas."}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={toggle} className="shrink-0 h-8 w-8" title={visible ? "Ocultar valores" : "Exibir valores"}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-primary/10 p-1.5"><ArrowUpRight className="h-4 w-4 text-primary" /></div>
              <span className="text-xs text-muted-foreground">Você já recebeu</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-primary">
              {maskValue(formatCurrency(summary.totalReceitas), visible)}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-destructive/10 p-1.5"><ArrowDownRight className="h-4 w-4 text-destructive" /></div>
              <span className="text-xs text-muted-foreground">Você já pagou</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-destructive">
              {maskValue(formatCurrency(summary.totalDespesas), visible)}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-blue-100 p-1.5"><Wallet className="h-4 w-4 text-blue-600" /></div>
              <span className="text-xs text-muted-foreground">Saldo do mês</span>
            </div>
            <p className={cn("text-lg sm:text-xl font-bold", summary.saldoAtual >= 0 ? "text-blue-600" : "text-destructive")}>
              {maskValue(formatCurrency(summary.saldoAtual), visible)}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-amber-100 p-1.5"><AlertTriangle className="h-4 w-4 text-amber-600" /></div>
              <span className="text-xs text-muted-foreground">Contas próximas</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-600">{summary.contasProximas}</p>
            {summary.emAtraso > 0 && (
              <p className="text-[10px] text-destructive font-medium mt-0.5">{summary.emAtraso} em atraso</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Caixa Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-blue-100 p-1.5"><Landmark className="h-4 w-4 text-blue-600" /></div>
              <span className="text-xs text-muted-foreground">Caixa Atual</span>
            </div>
            <p className={cn("text-lg sm:text-xl font-bold", caixa.caixaAtual >= 0 ? "text-blue-600" : "text-destructive")}>
              {maskValue(formatCurrency(caixa.caixaAtual), visible)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Soma de todas as contas bancárias</p>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-primary/10 p-1.5"><TrendingUp className="h-4 w-4 text-primary" /></div>
              <span className="text-xs text-muted-foreground">Caixa Previsto</span>
            </div>
            <p className={cn("text-lg sm:text-xl font-bold", caixa.caixaPrevisto >= 0 ? "text-primary" : "text-destructive")}>
              {maskValue(formatCurrency(caixa.caixaPrevisto), visible)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Previsão para o mês atual</p>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-amber-100 p-1.5"><Calendar className="h-4 w-4 text-amber-600" /></div>
              <span className="text-xs text-muted-foreground">Meses de Caixa</span>
            </div>
            <p className={cn("text-lg sm:text-xl font-bold", caixa.mesesDeCaixa >= 3 ? "text-primary" : caixa.mesesDeCaixa >= 1 ? "text-amber-600" : "text-destructive")}>
              {caixa.mesesDeCaixa >= 99 ? "∞" : `${caixa.mesesDeCaixa} meses`}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Runway baseado na média de despesas</p>
          </CardContent>
        </Card>
      </div>

      <DashboardShortcuts />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardChart data={monthlyChartData} saldoAtual={summary.saldoAtual} />
        <DashboardDonutChart
          receitas={summary.totalReceitas}
          despesas={summary.totalDespesas}
          saldo={summary.saldoAtual}
        />
      </div>

      {/* Upcoming Bills + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Próximos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contasProximas.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed">
                <p className="text-sm text-muted-foreground">Nenhuma conta nos próximos 7 dias</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contasProximas.slice(0, 5).map(conta => (
                  <div key={conta.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{conta.descricao}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(conta.data_vencimento)}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={cn("text-sm font-semibold", conta.tipo === 'receita' ? 'text-primary' : 'text-destructive')}>
                        {maskValue(formatCurrency(conta.valor), visible)}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {conta.tipo === 'receita' ? 'Receber' : 'Pagar'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Últimas movimentações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lancamentosRecentes.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed">
                <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lancamentosRecentes.map(l => (
                  <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{l.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.categoria?.nome || l.tipo} • Venc: {formatDate(l.data_vencimento)}
                        {(l.status === 'pago' || l.status === 'recebido') 
                          ? <span className="ml-1 text-primary">✓</span> 
                          : <span className="ml-1 text-amber-500">🕐</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={cn(
                        "text-sm font-semibold",
                        l.tipo === 'receita' ? 'text-primary' : l.tipo === 'investimento' ? 'text-blue-600' : 'text-destructive'
                      )}>
                        {l.tipo === 'receita' ? '+' : '-'}{maskValue(formatCurrency(l.valor), visible)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LancamentosFormDialog />
    </div>
  );
};

const Dashboard = () => {
  return (
    <LancamentosProvider>
      <ValuesVisibilityProvider>
        <DashboardContent />
      </ValuesVisibilityProvider>
    </LancamentosProvider>
  );
};

export default Dashboard;
