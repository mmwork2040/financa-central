import React from "react";
import FeatureBlocked from "@/components/common/FeatureBlocked";
import { ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, Clock, Activity, Eye, EyeOff, LayoutDashboard, Landmark, TrendingUp, Calendar } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { DashboardCategoryPieChart } from "@/components/dashboard/DashboardCategoryPieChart";
import { DashboardTrendLineChart } from "@/components/dashboard/DashboardTrendLineChart";
import { CaixaPrevistoDialog } from "@/components/dashboard/CaixaPrevistoDialog";
import { DashboardDetailDialog, DashboardDialogType } from "@/components/dashboard/DashboardDetailDialog";
import { cn } from "@/lib/utils";

const healthConfig: Record<HealthStatus, { label: string; color: string; icon: string; bg: string }> = {
  saudavel: { label: "Saudável", color: "text-primary", icon: "🟢", bg: "glass-card border-primary/20" },
  atencao: { label: "Atenção", color: "text-amber-600", icon: "🟡", bg: "glass-card border-amber-200" },
  risco: { label: "Risco", color: "text-destructive", icon: "🔴", bg: "glass-card border-destructive/20" },
};

const DashboardContent = () => {
  const { userProfile, isSuperAdmin, isTrialActive, trialDaysRemaining, assinaturaStatus } = useAuth();
  const { loading, summary, caixa, lancamentosRecentes, contasProximas, receitasPendentes, healthStatus, monthlyChartData, contasBancarias, projectionData, lancamentosMes } = useDashboardData();
  const { visible, toggle } = useValuesVisibility();
  const { myRequests, cancelRequest, actionLoading } = useSolicitacoesSaida();
  const navigate = useNavigate();
  const [caixaPrevistoOpen, setCaixaPrevistoOpen] = React.useState(false);
  const [activeDialog, setActiveDialog] = React.useState<DashboardDialogType>(null);

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
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">Olá, {userProfile?.nome?.split(' ')[0] || 'Usuário'}! 👋</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Aqui está o resumo do seu financeiro</p>
      </div>

      {/* Trial Banner */}
      {!isSuperAdmin && assinaturaStatus === 'trial' && isTrialActive && trialDaysRemaining !== null && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Você tem <span className="font-bold">{trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'}</span> restantes no período de teste gratuito.
          </p>
          <Button variant="link" size="sm" className="ml-auto text-xs text-amber-700 dark:text-amber-400 p-0 h-auto" onClick={() => navigate("/ver-planos")}>
            Ver planos
          </Button>
        </div>
      )}

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

      {/* Linha 1: Você já recebeu + Você já pagou */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg cursor-pointer" onClick={() => setActiveDialog('receitas')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-green-100 p-1.5"><ArrowUpRight className="h-4 w-4 text-green-600" /></div>
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
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg cursor-pointer" onClick={() => setActiveDialog('despesas')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-destructive/10 p-1.5"><ArrowDownRight className="h-4 w-4 text-destructive" /></div>
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

      {/* Linha 2: Receitas Pendentes + Contas a Pagar */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg border-l-4 border-l-orange-400 cursor-pointer" onClick={() => setActiveDialog('receita-pendente')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-orange-100 p-1.5"><Clock className="h-4 w-4 text-orange-600" /></div>
              <span className="text-xs text-muted-foreground">Receita Pendente</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-orange-600">
              {maskValue(formatCurrency(summary.receitasPrevistas), visible)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Receitas a receber</p>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg border-l-4 border-l-amber-500 cursor-pointer" onClick={() => setActiveDialog('contas-pagar')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-amber-100 p-1.5"><AlertTriangle className="h-4 w-4 text-amber-600" /></div>
              <span className="text-xs text-muted-foreground">Contas a Pagar</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-600">
              {maskValue(formatCurrency(summary.despesasPrevistas), visible)}
            </p>
            {summary.emAtraso > 0 && (
              <p className="text-[10px] text-destructive font-medium mt-0.5">{summary.emAtraso} em atraso</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha 3: Saldo do mês + Caixa Previsto + Meses de Caixa */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg cursor-pointer" onClick={() => setActiveDialog('saldo')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-blue-100 p-1.5"><Wallet className="h-4 w-4 text-blue-600" /></div>
              <span className="text-xs text-muted-foreground">Saldo do mês</span>
            </div>
            <p className={cn("text-lg sm:text-xl font-bold", summary.saldoAtual >= 0 ? "text-blue-600" : "text-destructive")}>
              {maskValue(formatCurrency(summary.saldoAtual), visible)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Soma dos saldos bancários</p>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
              <Landmark className="h-3 w-3 text-blue-500" />
              <span className="text-[10px] text-muted-foreground">Investido:</span>
              <span className={cn("text-xs font-semibold", caixa.saldoInvestido > 0 ? "text-blue-600" : "text-muted-foreground")}>
                {maskValue(formatCurrency(caixa.saldoInvestido), visible)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg border-l-4 border-l-primary cursor-pointer" onClick={() => setCaixaPrevistoOpen(true)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-primary/10 p-1.5"><TrendingUp className="h-4 w-4 text-primary" /></div>
              <span className="text-xs text-muted-foreground">Caixa Previsto</span>
            </div>
            <p className={cn("text-lg sm:text-xl font-bold", caixa.caixaPrevisto >= 0 ? "text-primary" : "text-destructive")}>
              {maskValue(formatCurrency(caixa.caixaPrevisto), visible)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Clique para ver detalhes</p>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-0.5 transition-all hover:shadow-lg border-l-4 border-l-amber-500 cursor-pointer" onClick={() => setActiveDialog('meses-caixa')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-amber-100 p-1.5"><Calendar className="h-4 w-4 text-amber-600" /></div>
              <span className="text-xs text-muted-foreground">Meses de Caixa</span>
            </div>
            <p className={cn("text-lg sm:text-xl font-bold", caixa.mesesDeCaixa >= 3 ? "text-primary" : caixa.mesesDeCaixa >= 1 ? "text-amber-600" : "text-destructive")}>
              {caixa.mesesDeCaixa >= 99 ? "∞" : `${caixa.mesesDeCaixa} meses`}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Clique para ver detalhes</p>
          </CardContent>
        </Card>
      </div>

      

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardChart data={monthlyChartData} saldoAtual={summary.saldoAtual} />
        <DashboardCategoryPieChart lancamentosMes={lancamentosMes} />
      </div>

      {/* Trend Line Chart */}
      <DashboardTrendLineChart />

      {/* Contas a Pagar + Receitas Pendentes - side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Collapsible defaultOpen={false}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-2 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 rounded-t-xl transition-colors">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Contas a Pagar
                  {contasProximas.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{contasProximas.length}</Badge>
                  )}
                </CardTitle>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {contasProximas.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-xl border border-dashed">
                    <p className="text-sm text-muted-foreground">Nenhuma conta a pagar neste mês</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contasProximas.slice(0, 8).map(conta => (
                      <div key={conta.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{conta.descricao}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(conta.data_vencimento)}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-semibold text-destructive">
                            {maskValue(formatCurrency(conta.valor), visible)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible defaultOpen={false}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-2 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 rounded-t-xl transition-colors">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  Receitas Pendentes
                  {receitasPendentes.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{receitasPendentes.length}</Badge>
                  )}
                </CardTitle>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {receitasPendentes.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-xl border border-dashed">
                    <p className="text-sm text-muted-foreground">Nenhuma receita pendente neste mês</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {receitasPendentes.slice(0, 8).map(receita => (
                      <div key={receita.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{receita.descricao}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(receita.data_vencimento)}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-semibold text-green-600">
                            {maskValue(formatCurrency(receita.valor), visible)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Últimas Movimentações - full width */}
      <Collapsible defaultOpen={false}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 rounded-t-xl transition-colors">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Últimas Movimentações
              </CardTitle>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
                          l.tipo === 'receita' ? 'text-green-600' : l.tipo === 'investimento' ? 'text-blue-600' : 'text-destructive'
                        )}>
                          {l.tipo === 'receita' ? '+' : '-'}{maskValue(formatCurrency(l.valor), visible)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <CaixaPrevistoDialog
        open={caixaPrevistoOpen}
        onOpenChange={setCaixaPrevistoOpen}
        caixaAtual={caixa.caixaAtual}
        receitasPendentes={caixa.receitasPendentesAcumuladas}
        despesasPendentes={caixa.despesasPendentesAcumuladas}
        caixaPrevisto={caixa.caixaPrevisto}
        itens={caixa.itensPendentes}
      />

      <DashboardDetailDialog
        type={activeDialog}
        onClose={() => setActiveDialog(null)}
        contasBancarias={contasBancarias}
        lancamentosMes={lancamentosMes}
        summary={summary}
        caixa={caixa}
        projectionData={projectionData}
      />

      <LancamentosFormDialog />
    </div>
  );
};

const DashboardPessoalLazy = React.lazy(() => import("@/components/dashboard/DashboardPessoal"));

const Dashboard = () => {
  const { planControles, isSuperAdmin, isPessoal } = useAuth();
  
  if (!isSuperAdmin && !planControles.dashboard_completo) {
    return <FeatureBlocked title="Dashboard Completo" description="O Dashboard Completo não está disponível no seu plano atual. Faça upgrade para acessar análises detalhadas." />;
  }

  if (isPessoal) {
    return (
      <LancamentosProvider>
        <ValuesVisibilityProvider>
          <React.Suspense fallback={<div className="flex justify-center items-center h-64"><p className="text-muted-foreground">Carregando...</p></div>}>
            <DashboardPessoalLazy />
          </React.Suspense>
        </ValuesVisibilityProvider>
      </LancamentosProvider>
    );
  }

  return (
    <LancamentosProvider>
      <ValuesVisibilityProvider>
        <DashboardContent />
      </ValuesVisibilityProvider>
    </LancamentosProvider>
  );
};

export default Dashboard;
