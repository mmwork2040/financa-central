import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";
import { ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, Clock, Calendar, Landmark, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { isPending } from "@/utils/lancamentoStatus";

export type DashboardDialogType = 'saldo' | 'receitas' | 'despesas' | 'receita-pendente' | 'contas-pagar' | 'meses-caixa' | null;

interface DashboardDetailDialogProps {
  type: DashboardDialogType;
  onClose: () => void;
  contasBancarias: Array<{ id: string; nome: string; saldo_atual: number; saldo_inicial: number }>;
  lancamentosMes: any[];
  summary: {
    totalReceitas: number;
    totalDespesas: number;
    receitasExecutadas: number;
    despesasExecutadas: number;
    receitasPrevistas: number;
    despesasPrevistas: number;
    emAtraso: number;
    saldoAtual: number;
  };
  caixa: {
    caixaAtual: number;
    mesesDeCaixa: number;
  };
  projectionData: Array<{ name: string; caixa: number }>;
}

export const DashboardDetailDialog = ({
  type,
  onClose,
  contasBancarias,
  lancamentosMes,
  summary,
  caixa,
  projectionData,
}: DashboardDetailDialogProps) => {
  const { visible } = useValuesVisibility();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const renderContent = () => {
    switch (type) {
      case 'saldo':
        return <SaldoContent contasBancarias={contasBancarias} visible={visible} saldoTotal={summary.saldoAtual} summary={summary} />;
      case 'receitas':
        return <ReceitasContent lancamentosMes={lancamentosMes} visible={visible} executado={summary.receitasExecutadas} previsto={summary.receitasPrevistas} />;
      case 'despesas':
        return <DespesasContent lancamentosMes={lancamentosMes} visible={visible} executado={summary.despesasExecutadas} previsto={summary.despesasPrevistas} />;
      case 'receita-pendente':
        return <ReceitaPendenteContent lancamentosMes={lancamentosMes} visible={visible} />;
      case 'contas-pagar':
        return <ContasPagarContent lancamentosMes={lancamentosMes} visible={visible} hoje={hoje} />;
      case 'meses-caixa':
        return <MesesCaixaContent caixaAtual={caixa.caixaAtual} mesesDeCaixa={caixa.mesesDeCaixa} projectionData={projectionData} visible={visible} lancamentosMes={lancamentosMes} />;
      default:
        return null;
    }
  };

  const titles: Record<string, { label: string; icon: React.ReactNode }> = {
    saldo: { label: "Saldo do Mês", icon: <Wallet className="h-5 w-5 text-blue-600" /> },
    receitas: { label: "Receitas do Mês", icon: <ArrowUpRight className="h-5 w-5 text-green-600" /> },
    despesas: { label: "Despesas do Mês", icon: <ArrowDownRight className="h-5 w-5 text-destructive" /> },
    'receita-pendente': { label: "Receitas Pendentes", icon: <Clock className="h-5 w-5 text-orange-600" /> },
    'contas-pagar': { label: "Contas a Pagar", icon: <AlertTriangle className="h-5 w-5 text-amber-600" /> },
    'meses-caixa': { label: "Meses de Caixa (Runway)", icon: <Calendar className="h-5 w-5 text-amber-600" /> },
  };

  const title = type ? titles[type] : null;

  return (
    <Dialog open={!!type} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title?.icon}
            {title?.label}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

/* ─── Saldo ─── */
const SaldoContent = ({ contasBancarias, visible, saldoTotal, summary }: { contasBancarias: Array<{ id: string; nome: string; saldo_atual: number; saldo_inicial: number }>; visible: boolean; saldoTotal: number; summary: { receitasExecutadas: number; despesasExecutadas: number } }) => {
  const saldoInicialTotal = contasBancarias.reduce((s, c) => s + ((c as any).saldo_inicial || 0), 0);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Saldo inicial (todas as contas)</span>
          </div>
          <span className="text-sm font-semibold text-blue-600">
            {maskValue(formatCurrency(saldoInicialTotal), visible)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">+ Receitas recebidas no mês</span>
          </div>
          <span className="text-sm font-semibold text-green-600">
            {maskValue(formatCurrency(summary.receitasExecutadas), visible)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">− Despesas pagas no mês</span>
          </div>
          <span className="text-sm font-semibold text-destructive">
            {maskValue(formatCurrency(summary.despesasExecutadas), visible)}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold">= Saldo do mês</span>
          <span className={cn("text-base font-bold", saldoTotal >= 0 ? "text-blue-600" : "text-destructive")}>
            {maskValue(formatCurrency(saldoTotal), visible)}
          </span>
        </div>
      </div>

      {contasBancarias.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Landmark className="h-3.5 w-3.5 text-blue-500" />
            Contas Bancárias
          </h4>
          <div className="space-y-1">
            {contasBancarias.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 text-sm">
                <span>{c.nome}</span>
                <span className={cn("font-medium", c.saldo_atual >= 0 ? "text-blue-600" : "text-destructive")}>
                  {maskValue(formatCurrency(c.saldo_atual), visible)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Receitas ─── */
const ReceitasContent = ({ lancamentosMes, visible, executado, previsto }: { lancamentosMes: any[]; visible: boolean; executado: number; previsto: number }) => {
  const receitas = lancamentosMes.filter((l: any) => l.tipo === 'receita' && l.origem !== 'transferencia');
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">✓ Recebido</span>
          <span className="text-sm font-semibold text-green-600">{maskValue(formatCurrency(executado), visible)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">🕐 Previsto</span>
          <span className="text-sm font-semibold text-orange-600">{maskValue(formatCurrency(previsto), visible)}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-sm font-semibold">Total do mês</span>
          <span className="text-base font-bold text-green-600">{maskValue(formatCurrency(executado + previsto), visible)}</span>
        </div>
      </div>
      <ItemList items={receitas} visible={visible} colorClass="text-green-600" sign="+" />
    </div>
  );
};

/* ─── Despesas ─── */
const DespesasContent = ({ lancamentosMes, visible, executado, previsto }: { lancamentosMes: any[]; visible: boolean; executado: number; previsto: number }) => {
  const despesas = lancamentosMes.filter((l: any) => l.tipo === 'despesa' && l.origem !== 'transferencia');
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">✓ Pago</span>
          <span className="text-sm font-semibold text-destructive">{maskValue(formatCurrency(executado), visible)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">🕐 Previsto</span>
          <span className="text-sm font-semibold text-orange-600">{maskValue(formatCurrency(previsto), visible)}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-sm font-semibold">Total do mês</span>
          <span className="text-base font-bold text-destructive">{maskValue(formatCurrency(executado + previsto), visible)}</span>
        </div>
      </div>
      <ItemList items={despesas} visible={visible} colorClass="text-destructive" sign="-" />
    </div>
  );
};

/* ─── Receita Pendente ─── */
const ReceitaPendenteContent = ({ lancamentosMes, visible }: { lancamentosMes: any[]; visible: boolean }) => {
  const pendentes = lancamentosMes.filter((l: any) => l.tipo === 'receita' && isPending(l.status) && l.origem !== 'transferencia');
  const total = pendentes.reduce((s: number, l: any) => s + (l.valor || 0), 0);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex justify-between">
          <span className="text-sm font-semibold">Total pendente ({pendentes.length})</span>
          <span className="text-base font-bold text-orange-600">{maskValue(formatCurrency(total), visible)}</span>
        </div>
      </div>
      {pendentes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma receita pendente neste mês.</p>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {pendentes.sort((a: any, b: any) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()).map((l: any) => (
            <div key={l.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate">{l.descricao}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(l.data_vencimento)}</p>
              </div>
              <span className="text-sm font-medium text-orange-600 shrink-0 ml-3">
                +{maskValue(formatCurrency(l.valor), visible)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Contas a Pagar ─── */
const ContasPagarContent = ({ lancamentosMes, visible, hoje }: { lancamentosMes: any[]; visible: boolean; hoje: Date }) => {
  const pendentes = lancamentosMes.filter((l: any) => l.tipo === 'despesa' && isPending(l.status) && l.origem !== 'transferencia');
  const total = pendentes.reduce((s: number, l: any) => s + (l.valor || 0), 0);
  const emAtraso = pendentes.filter((l: any) => new Date(l.data_vencimento) < hoje);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-semibold">Total a pagar ({pendentes.length})</span>
          <span className="text-base font-bold text-amber-600">{maskValue(formatCurrency(total), visible)}</span>
        </div>
        {emAtraso.length > 0 && (
          <p className="text-xs text-destructive font-medium">⚠ {emAtraso.length} em atraso</p>
        )}
      </div>
      {pendentes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conta a pagar neste mês.</p>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {pendentes.sort((a: any, b: any) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()).map((l: any) => {
            const atrasado = new Date(l.data_vencimento) < hoje;
            return (
              <div key={l.id} className={cn("flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 text-sm", atrasado && "bg-destructive/5")}>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{l.descricao} {atrasado && <span className="text-destructive text-[10px]">(atrasado)</span>}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(l.data_vencimento)}</p>
                </div>
                <span className={cn("text-sm font-medium shrink-0 ml-3", atrasado ? "text-destructive" : "text-amber-600")}>
                  -{maskValue(formatCurrency(l.valor), visible)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Meses de Caixa ─── */
const MesesCaixaContent = ({ caixaAtual, mesesDeCaixa, projectionData, visible, lancamentosMes }: { caixaAtual: number; mesesDeCaixa: number; projectionData: Array<{ name: string; caixa: number }>; visible: boolean; lancamentosMes: any[] }) => {
  // Calculate avg monthly expenses from last 3 months projection or from lancamentosMes
  const despesasMes = lancamentosMes
    .filter((l: any) => l.tipo === 'despesa' && (l.status === 'pago') && l.origem !== 'transferencia')
    .reduce((s: number, l: any) => s + (l.valor || 0), 0);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Caixa Atual</span>
          <span className="text-sm font-semibold text-blue-600">{maskValue(formatCurrency(caixaAtual), visible)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Despesas pagas no mês</span>
          <span className="text-sm font-semibold text-destructive">{maskValue(formatCurrency(despesasMes), visible)}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-sm font-semibold">Runway estimado</span>
          <span className={cn("text-base font-bold", mesesDeCaixa >= 3 ? "text-primary" : mesesDeCaixa >= 1 ? "text-amber-600" : "text-destructive")}>
            {mesesDeCaixa >= 99 ? "∞" : `${mesesDeCaixa} meses`}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Simulação mês a mês considerando receitas e despesas futuras (incluindo recorrências):
      </p>

      {projectionData.length > 0 && (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {projectionData.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 text-sm">
              <span className="text-sm">{p.name}</span>
              <span className={cn("text-sm font-semibold", p.caixa >= 0 ? "text-primary" : "text-destructive")}>
                {maskValue(formatCurrency(p.caixa), visible)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Shared item list ─── */
const ItemList = ({ items, visible, colorClass, sign }: { items: any[]; visible: boolean; colorClass: string; sign: string }) => {
  if (items.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Nenhum lançamento neste mês.</p>;
  return (
    <div className="space-y-1 max-h-60 overflow-y-auto">
      {items.sort((a: any, b: any) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()).map((l: any) => {
        const executado = l.status === 'pago' || l.status === 'recebido';
        return (
          <div key={l.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate">
                {executado ? <CheckCircle2 className="inline h-3 w-3 text-primary mr-1" /> : <Clock className="inline h-3 w-3 text-amber-500 mr-1" />}
                {l.descricao}
              </p>
              <p className="text-[10px] text-muted-foreground">{formatDate(l.data_vencimento)} • {executado ? "Realizado" : "Pendente"}</p>
            </div>
            <span className={cn("text-sm font-medium shrink-0 ml-3", colorClass)}>
              {sign}{maskValue(formatCurrency(l.valor), visible)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
