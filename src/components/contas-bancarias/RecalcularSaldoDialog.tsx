import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";
import { CheckCircle2, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

interface ContaInfo {
  id: string;
  nome: string;
  banco: string | null;
  saldo_inicial: number;
  saldo_atual: number;
}

interface RecalcResult {
  conta_id: string;
  saldo_calculado: number;
  diferenca: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  contas: ContaInfo[];
  onSuccess: () => void;
}

const RecalcularSaldoDialog: React.FC<Props> = ({ open, onClose, contas, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [results, setResults] = useState<Record<string, RecalcResult>>({});
  const { visible } = useValuesVisibility();

  useEffect(() => {
    if (open && contas.length > 0) {
      calcular();
    }
  }, [open, contas]);

  const calcular = async () => {
    setLoading(true);
    try {
      const contaIds = contas.map(c => c.id);

      // Fetch all paid lancamentos linked to these accounts
      const { data: lancamentos, error } = await supabase
        .from("lancamentos")
        .select("conta_bancaria_id, tipo, valor, status")
        .in("conta_bancaria_id", contaIds)
        .in("status", ["pago", "recebido"]);

      if (error) throw error;

      const newResults: Record<string, RecalcResult> = {};

      for (const conta of contas) {
        const contaLancs = (lancamentos || []).filter(l => l.conta_bancaria_id === conta.id);

        let somaReceitas = 0;
        let somaDespesas = 0;

        for (const l of contaLancs) {
          if (l.tipo === "receita") {
            somaReceitas += Number(l.valor);
          } else {
            // despesa, investimento, etc.
            somaDespesas += Number(l.valor);
          }
        }

        const saldoCalculado = conta.saldo_inicial + somaReceitas - somaDespesas;
        const diferenca = saldoCalculado - conta.saldo_atual;

        newResults[conta.id] = {
          conta_id: conta.id,
          saldo_calculado: saldoCalculado,
          diferenca,
        };
      }

      setResults(newResults);
    } catch (err: any) {
      toast.error("Erro ao calcular saldos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const recalcularConta = async (contaId: string) => {
    const result = results[contaId];
    if (!result) return;

    setSaving(contaId);
    try {
      const { error } = await (supabase
        .from("contas_bancarias")
        .update({ saldo_atual: result.saldo_calculado } as any) as any)
        .eq("id", contaId);

      if (error) throw error;
      toast.success("Saldo atualizado com sucesso");
      // Update local result to show 0 difference
      setResults(prev => ({
        ...prev,
        [contaId]: { ...prev[contaId], diferenca: 0 },
      }));
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao atualizar: " + err.message);
    } finally {
      setSaving(null);
    }
  };

  const recalcularTodos = async () => {
    const divergentes = contas.filter(c => {
      const r = results[c.id];
      return r && Math.abs(r.diferenca) > 0.01;
    });

    if (divergentes.length === 0) {
      toast.info("Nenhuma conta com divergência");
      return;
    }

    setSavingAll(true);
    try {
      for (const conta of divergentes) {
        const result = results[conta.id];
        const { error } = await (supabase
          .from("contas_bancarias")
          .update({ saldo_atual: result.saldo_calculado } as any) as any)
          .eq("id", conta.id);
        if (error) throw error;
      }

      toast.success(`${divergentes.length} conta(s) atualizada(s) com sucesso`);
      onSuccess();
      await calcular();
    } catch (err: any) {
      toast.error("Erro ao atualizar: " + err.message);
    } finally {
      setSavingAll(false);
    }
  };

  const formatValue = (value: number) => {
    return visible ? formatCurrency(value) : "••••••";
  };

  const totalDivergentes = contas.filter(c => {
    const r = results[c.id];
    return r && Math.abs(r.diferenca) > 0.01;
  }).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Recalcular Saldos
          </DialogTitle>
          <DialogDescription>
            Compara o saldo atual de cada conta com o saldo calculado a partir dos lançamentos pagos/recebidos.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Calculando...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[50vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Saldo Atual</TableHead>
                    <TableHead className="text-right">Saldo Calculado</TableHead>
                    <TableHead className="text-right">Divergência</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contas.map(conta => {
                    const r = results[conta.id];
                    const hasDiff = r && Math.abs(r.diferenca) > 0.01;

                    return (
                      <TableRow key={conta.id}>
                        <TableCell>
                          <div className="font-medium">{conta.nome}</div>
                          {conta.banco && (
                            <div className="text-xs text-muted-foreground">{conta.banco}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatValue(conta.saldo_atual)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {r ? formatValue(r.saldo_calculado) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {r ? (
                            hasDiff ? (
                              <Badge variant="destructive" className="font-mono gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {visible ? formatCurrency(r.diferenca) : "••••"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                OK
                              </Badge>
                            )
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {hasDiff && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => recalcularConta(conta.id)}
                              disabled={saving === conta.id || savingAll}
                              className="text-xs"
                            >
                              {saving === conta.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Corrigir"
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalDivergentes > 0 && (
              <div className="text-sm text-muted-foreground">
                {totalDivergentes} conta(s) com divergência encontrada(s).
              </div>
            )}
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          {totalDivergentes > 0 && (
            <Button onClick={recalcularTodos} disabled={savingAll || loading}>
              {savingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Corrigir Todos ({totalDivergentes})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecalcularSaldoDialog;
