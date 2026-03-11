import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDownToLine } from "lucide-react";

interface ContaBancaria {
  id: string;
  nome: string;
  banco?: string | null;
  saldo_atual: number;
}

interface ResgateInvestimentoDialogProps {
  open: boolean;
  onClose: () => void;
  contas: ContaBancaria[];
  onSuccess: () => void;
  empresaId: string | null;
}

const ResgateInvestimentoDialog: React.FC<ResgateInvestimentoDialogProps> = ({
  open, onClose, contas, onSuccess, empresaId,
}) => {
  const [contaDestinoId, setContaDestinoId] = useState("");
  const [valor, setValor] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [saldoInvestido, setSaldoInvestido] = useState(0);
  const [loadingSaldo, setLoadingSaldo] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSaldoInvestido();
      setContaDestinoId("");
      setValor(0);
      setDescricao("");
    }
  }, [open]);

  const fetchSaldoInvestido = async () => {
    setLoadingSaldo(true);
    try {
      const { data: investimentos } = await supabase
        .from("lancamentos")
        .select("valor")
        .eq("tipo", "investimento")
        .in("status", ["pago", "recebido"]);

      const totalInvestido = investimentos?.reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      const { data: resgates } = await supabase
        .from("lancamentos")
        .select("valor")
        .eq("tipo", "receita")
        .eq("origem", "resgate_investimento")
        .in("status", ["pago", "recebido"]);

      const totalResgatado = resgates?.reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      setSaldoInvestido(totalInvestido - totalResgatado);
    } catch {
      setSaldoInvestido(0);
    } finally {
      setLoadingSaldo(false);
    }
  };

  const handleValorChange = (value: string | undefined) => {
    const cents = parseInt(value || "0", 10);
    setValor(cents / 100);
  };

  const handleResgatar = async () => {
    if (!contaDestinoId) {
      toast.error("Selecione a conta de destino");
      return;
    }
    if (valor <= 0) {
      toast.error("O valor deve ser maior que zero");
      return;
    }
    if (valor > saldoInvestido) {
      toast.error(`Saldo investido insuficiente. Disponível: R$ ${saldoInvestido.toFixed(2).replace(".", ",")}`);
      return;
    }

    setLoading(true);
    try {
      const { logMovimentacao } = await import("@/utils/logMovimentacao");
      const contaDestino = contas.find(c => c.id === contaDestinoId)!;
      const desc = descricao || "Resgate de investimento";
      const dataHoje = new Date().toISOString().split("T")[0];

      // 1. Create receita lancamento with origem resgate_investimento
      const { error: lancError } = await supabase.from("lancamentos").insert({
        empresa_id: empresaId,
        descricao: desc,
        valor,
        tipo: "receita",
        status: "recebido",
        data_vencimento: dataHoje,
        data_pagamento: dataHoje,
        conta_bancaria_id: contaDestinoId,
        origem: "resgate_investimento",
      } as any);

      if (lancError) throw lancError;

      // 2. Update conta destino saldo
      const saldoAnterior = Number(contaDestino.saldo_atual);
      const novoSaldo = saldoAnterior + valor;

      const { error: updateError } = await (supabase
        .from("contas_bancarias")
        .update({ saldo_atual: novoSaldo } as any) as any)
        .eq("id", contaDestinoId);

      if (updateError) throw updateError;

      // 3. Log movimentação
      await logMovimentacao({
        conta_bancaria_id: contaDestinoId,
        empresa_id: empresaId,
        tipo: "receita",
        descricao: `${desc} → ${contaDestino.nome}`,
        valor,
        saldo_anterior: saldoAnterior,
        saldo_posterior: novoSaldo,
      });

      toast.success(`Resgate de R$ ${valor.toFixed(2).replace(".", ",")} realizado com sucesso`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar resgate");
    } finally {
      setLoading(false);
    }
  };

  const formatBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-primary" />
            Resgate de Investimento
          </DialogTitle>
          <DialogDescription>
            Transfira valores do saldo investido para uma conta bancária.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
          <span className="text-muted-foreground">Saldo investido disponível: </span>
          <span className="font-semibold text-foreground">
            {loadingSaldo ? "Carregando..." : formatBRL(saldoInvestido)}
          </span>
        </div>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Conta destino <span className="text-destructive">*</span></Label>
            <Select value={contaDestinoId} onValueChange={setContaDestinoId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {contas.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} {c.banco ? `(${c.banco})` : ""} — {formatBRL(Number(c.saldo_atual))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Valor <span className="text-destructive">*</span></Label>
            <div className="col-span-3">
              <CurrencyInput
                id="resgate_valor"
                name="resgate_valor"
                value={valor}
                decimalsLimit={2}
                onValueChange={handleValorChange}
                placeholder="R$ 0,00"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Descrição</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Resgate para capital de giro"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleResgatar} disabled={loading || loadingSaldo || saldoInvestido <= 0}>
            {loading ? "Resgatando..." : "Resgatar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResgateInvestimentoDialog;
