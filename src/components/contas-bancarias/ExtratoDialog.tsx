import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
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
import { FileText, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

interface ContaBancaria {
  id: string;
  nome: string;
  banco?: string | null;
  saldo_atual: number;
}

interface ExtratoDialogProps {
  open: boolean;
  onClose: () => void;
  contas: ContaBancaria[];
  empresaId: string | null;
}

const ExtratoDialog: React.FC<ExtratoDialogProps> = ({ open, onClose, contas, empresaId }) => {
  const [contaId, setContaId] = useState("");
  const [periodo, setPeriodo] = useState("mes");
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState({ entradas: 0, saidas: 0 });
  const { visible } = useValuesVisibility();

  const maskedValue = "••••••";

  useEffect(() => {
    if (open && contaId) {
      fetchExtrato();
    }
  }, [contaId, periodo, open]);

  const getDateRange = (p: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const fim = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    let inicio: string;
    switch (p) {
      case "semana": {
        const d = new Date(year, month, day - 7);
        inicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        break;
      }
      case "mes":
        inicio = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        break;
      case "trimestre": {
        const d = new Date(year, month - 2, 1);
        inicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
        break;
      }
      case "semestre": {
        const d = new Date(year, month - 5, 1);
        inicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
        break;
      }
      case "ano":
        inicio = `${year}-01-01`;
        break;
      default:
        inicio = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    }
    return { inicio, fim };
  };

  const fetchExtrato = async () => {
    setLoading(true);
    try {
      const { inicio, fim } = getDateRange(periodo);
      const { data, error } = await (supabase as any)
        .from("lancamentos")
        .select("id, descricao, valor, tipo, status, data_vencimento, data_pagamento, categoria:categorias(nome), cliente:clientes(nome), fornecedor:fornecedores(nome), origem")
        .eq("conta_bancaria_id", contaId)
        .gte("data_vencimento", inicio)
        .lte("data_vencimento", fim)
        .order("data_vencimento", { ascending: false });

      if (error) throw error;
      const items = data || [];
      setMovimentacoes(items);

      const entradas = items.filter((l: any) => l.tipo === "receita").reduce((s: number, l: any) => s + Number(l.valor), 0);
      const saidas = items.filter((l: any) => l.tipo === "despesa").reduce((s: number, l: any) => s + Number(l.valor), 0);
      setResumo({ entradas, saidas });
    } catch (error: any) {
      console.error("Erro ao buscar extrato:", error);
    } finally {
      setLoading(false);
    }
  };

  const contaSelecionada = contas.find(c => c.id === contaId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Extrato Bancário
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Select value={contaId} onValueChange={setContaId}>
            <SelectTrigger className="flex-1">
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

          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Última semana</SelectItem>
              <SelectItem value="mes">Este mês</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="semestre">Semestre</SelectItem>
              <SelectItem value="ano">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {contaId && contaSelecionada && (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <ArrowUpCircle className="h-3.5 w-3.5 text-green-600" />
                  Entradas
                </div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {visible ? formatCurrency(resumo.entradas) : maskedValue}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <ArrowDownCircle className="h-3.5 w-3.5 text-red-600" />
                  Saídas
                </div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  {visible ? formatCurrency(resumo.saidas) : maskedValue}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/40">
                <div className="text-xs text-muted-foreground mb-1">Saldo Atual</div>
                <p className={`text-sm font-semibold ${Number(contaSelecionada.saldo_atual) >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                  {visible ? formatCurrency(Number(contaSelecionada.saldo_atual)) : maskedValue}
                </p>
              </div>
            </div>

            {/* Tabela */}
            {loading ? (
              <div className="flex h-20 items-center justify-center">
                <p className="text-muted-foreground text-sm">Carregando extrato...</p>
              </div>
            ) : movimentacoes.length === 0 ? (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground text-sm">Nenhuma movimentação no período</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoes.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(m.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {m.descricao}
                          {m.origem === "transferencia" && (
                            <Badge variant="outline" className="ml-1 text-[9px] px-1">Transf.</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{m.categoria?.nome || "—"}</TableCell>
                        <TableCell className={`text-xs text-right font-medium ${m.tipo === "receita" ? "text-green-600" : "text-red-600"}`}>
                          {visible ? `${m.tipo === "receita" ? "+" : "-"} ${formatCurrency(Number(m.valor))}` : maskedValue}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] ${
                            ["pago", "recebido"].includes(m.status) ? "bg-green-100 text-green-800" :
                            m.status === "pendente" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {m.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {movimentacoes.length} movimentação(ões) no período
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExtratoDialog;
