import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/format";
import { History, ArrowUpCircle, ArrowDownCircle, RefreshCw, ArrowRightLeft, Loader2 } from "lucide-react";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

interface ContaBancaria {
  id: string;
  nome: string;
  banco?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  contas: ContaBancaria[];
  empresaId: string | null;
}

interface Movimentacao {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  saldo_anterior: number;
  saldo_posterior: number;
  created_at: string;
  lancamento_id: string | null;
}

const tipoConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  receita: { label: "Receita", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <ArrowUpCircle className="h-3 w-3" /> },
  despesa: { label: "Despesa", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <ArrowDownCircle className="h-3 w-3" /> },
  transferencia_entrada: { label: "Transferência (entrada)", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <ArrowRightLeft className="h-3 w-3" /> },
  transferencia_saida: { label: "Transferência (saída)", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: <ArrowRightLeft className="h-3 w-3" /> },
  recalculo: { label: "Recálculo", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: <RefreshCw className="h-3 w-3" /> },
  ajuste: { label: "Ajuste", color: "bg-muted text-muted-foreground", icon: <RefreshCw className="h-3 w-3" /> },
};

const HistoricoMovimentacoesDialog: React.FC<Props> = ({ open, onClose, contas, empresaId }) => {
  const [contaId, setContaId] = useState("");
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(false);
  const { visible } = useValuesVisibility();

  useEffect(() => {
    if (open && contaId) {
      fetchMovimentacoes();
    }
  }, [contaId, open]);

  useEffect(() => {
    if (open && contas.length > 0 && !contaId) {
      setContaId(contas[0].id);
    }
  }, [open, contas]);

  const fetchMovimentacoes = async () => {
    if (!contaId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from("movimentacoes_conta" as any) as any)
        .select("*")
        .eq("conta_bancaria_id", contaId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setMovimentacoes(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (v: number) => (visible ? formatCurrency(v) : "••••••");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Movimentações
          </DialogTitle>
          <DialogDescription>
            Registro de todas as alterações de saldo da conta bancária.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Select value={contaId} onValueChange={setContaId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              {contas.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome} {c.banco ? `(${c.banco})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : movimentacoes.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            Nenhuma movimentação registrada para esta conta.
          </div>
        ) : (
          <div className="overflow-auto max-h-[50vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Saldo Anterior</TableHead>
                  <TableHead className="text-right">Saldo Posterior</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map(mov => {
                  const config = tipoConfig[mov.tipo] || tipoConfig.ajuste;
                  const isPositive = mov.saldo_posterior >= mov.saldo_anterior;

                  return (
                    <TableRow key={mov.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(mov.created_at).toLocaleDateString("pt-BR")}
                        <br />
                        <span className="text-muted-foreground">
                          {new Date(mov.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`gap-1 text-[10px] ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" title={mov.descricao}>
                        {mov.descricao}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                        {isPositive ? "+" : ""}{formatValue(mov.valor)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {formatValue(mov.saldo_anterior)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {formatValue(mov.saldo_posterior)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <span className="text-xs text-muted-foreground">
            {movimentacoes.length} registro(s)
          </span>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricoMovimentacoesDialog;
