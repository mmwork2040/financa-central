
import React from "react";
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, Clock, Activity, Eye, EyeOff, LayoutDashboard } from "lucide-react";
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
import { cn } from "@/lib/utils";

const healthConfig: Record<HealthStatus, { label: string; color: string; icon: string; bg: string }> = {
  saudavel: { label: "Saudável", color: "text-emerald-600 dark:text-emerald-400", icon: "🟢", bg: "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/20" },
  atencao: { label: "Atenção", color: "text-amber-600 dark:text-amber-400", icon: "🟡", bg: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/20" },
  risco: { label: "Risco", color: "text-red-600 dark:text-red-400", icon: "🔴", bg: "bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-500/20" },
};

const DashboardContent = () => {
  const { userProfile, empresaId } = useAuth();
  const { loading, summary, lancamentosRecentes, contasProximas, healthStatus } = useDashboardData();
  const { handleOpenModal } = useLancamentosContext();
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
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 glow-sm">
            <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Olá, <span className="gradient-text">{userProfile?.nome?.split(' ')[0] || 'Usuário'}</span>! 👋</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Aqui está o resumo do seu financeiro</p>
      </div>

      {/* Exit Requests Alert */}
      <MyExitRequests requests={myRequests} onCancel={cancelRequest} loading={actionLoading} />

      {/* Health Indicator with Eye toggle */}
      <div className={cn("flex items-center justify-between gap-3 rounded-2xl border p-3 backdrop-blur-sm", health.bg)}>
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
        <Card className="group">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-emerald-500/10 p-1.5 group-hover:bg-emerald-500/20 transition-colors"><ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
              <span className="text-xs text-muted-foreground">Você já recebeu</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {maskValue(formatCurrency(summary.totalReceitas), visible)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="group">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-red-500/10 p-1.5 group-hover:bg-red-500/20 transition-colors"><ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" /></div>
              <span className="text-xs text-muted-foreground">Você já pagou</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
              {maskValue(formatCurrency(summary.totalDespesas), visible)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="group">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors"><Wallet className="h-4 w-4 text-primary" /></div>
              <span className="text-xs text-muted-foreground">Seu saldo hoje</span>
            </div>
            <p className={cn("text-lg sm:text-xl font-bold", summary.saldoAtual >= 0 ? "text-primary" : "text-red-600 dark:text-red-400")}>
              {maskValue(formatCurrency(summary.saldoAtual), visible)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="group">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-amber-500/10 p-1.5 group-hover:bg-amber-500/20 transition-colors"><AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
              <span className="text-xs text-muted-foreground">Contas próximas</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">{summary.contasProximas}</p>
            {summary.emAtraso > 0 && (
              <p className="text-[10px] text-red-500 font-medium mt-0.5">{summary.emAtraso} em atraso</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bills */}
      {contasProximas.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Próximos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contasProximas.slice(0, 5).map(conta => (
                <div key={conta.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{conta.descricao}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(conta.data_vencimento)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={cn("text-sm font-semibold", conta.tipo === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                      {maskValue(formatCurrency(conta.valor), visible)}
                    </p>
                    <Badge variant="outline" className="text-[10px]">
                      {conta.tipo === 'receita' ? 'Receber' : 'Pagar'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Últimas movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lancamentosRecentes.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/50">
              <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lancamentosRecentes.map(l => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.categoria?.nome || l.tipo} • Venc: {formatDate(l.data_vencimento)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Registro: {new Date(l.created_at).toLocaleDateString('pt-BR')} {new Date(l.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={cn(
                      "text-sm font-semibold",
                      l.tipo === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : l.tipo === 'investimento' ? 'text-primary' : 'text-red-600 dark:text-red-400'
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
