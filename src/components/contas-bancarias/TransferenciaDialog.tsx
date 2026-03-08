import React, { useState } from "react";
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
import { ArrowRightLeft } from "lucide-react";

interface ContaBancaria {
  id: string;
  nome: string;
  banco?: string | null;
  saldo_atual: number;
}

interface TransferenciaDialogProps {
  open: boolean;
  onClose: () => void;
  contas: ContaBancaria[];
  onSuccess: () => void;
  empresaId: string | null;
}

const TransferenciaDialog: React.FC<TransferenciaDialogProps> = ({
  open, onClose, contas, onSuccess, empresaId,
}) => {
  const [origemId, setOrigemId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [valor, setValor] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  const handleValorChange = (value: string | undefined) => {
    const cents = parseInt(value || "0", 10);
    setValor(cents / 100);
  };

  const handleTransferir = async () => {
    if (!origemId || !destinoId) {
      toast.error("Selecione as contas de origem e destino");
      return;
    }
    if (origemId === destinoId) {
      toast.error("As contas de origem e destino devem ser diferentes");
      return;
    }
    if (valor <= 0) {
      toast.error("O valor deve ser maior que zero");
      return;
    }

    setLoading(true);
    try {
      const { logMovimentacao } = await import("@/utils/logMovimentacao");
      const contaOrigem = contas.find(c => c.id === origemId)!;
      const contaDestino = contas.find(c => c.id === destinoId)!;
      const desc = descricao || "Transferência entre contas";

      // Update balances
      const saldoAnteriorOrigem = Number(contaOrigem.saldo_atual);
      const saldoAnteriorDestino = Number(contaDestino.saldo_atual);
      const novoSaldoOrigem = saldoAnteriorOrigem - valor;
      const novoSaldoDestino = saldoAnteriorDestino + valor;

      await (supabase.from("contas_bancarias").update({ saldo_atual: novoSaldoOrigem } as any) as any).eq("id", origemId);
      await (supabase.from("contas_bancarias").update({ saldo_atual: novoSaldoDestino } as any) as any).eq("id", destinoId);

      await logMovimentacao({
        conta_bancaria_id: origemId,
        empresa_id: empresaId,
        tipo: "transferencia_saida",
        descricao: `${desc} → ${contaDestino.nome}`,
        valor: -valor,
        saldo_anterior: saldoAnteriorOrigem,
        saldo_posterior: novoSaldoOrigem,
      });
      await logMovimentacao({
        conta_bancaria_id: destinoId,
        empresa_id: empresaId,
        tipo: "transferencia_entrada",
        descricao: `${desc} ← ${contaOrigem.nome}`,
        valor: valor,
        saldo_anterior: saldoAnteriorDestino,
        saldo_posterior: novoSaldoDestino,
      });

      const dataHoje = new Date().toISOString().split("T")[0];

      // Create 2 lancamentos
      await supabase.from("lancamentos").insert([
        {
          empresa_id: empresaId,
          descricao: `${desc} → ${contaDestino.nome}`,
          valor,
          tipo: "despesa",
          status: "pago",
          data_vencimento: dataHoje,
          data_pagamento: dataHoje,
          conta_bancaria_id: origemId,
          origem: "transferencia",
        } as any,
        {
          empresa_id: empresaId,
          descricao: `${desc} ← ${contaOrigem.nome}`,
          valor,
          tipo: "receita",
          status: "recebido",
          data_vencimento: dataHoje,
          data_pagamento: dataHoje,
          conta_bancaria_id: destinoId,
          origem: "transferencia",
        } as any,
      ]);

      toast.success(`Transferência de R$ ${valor.toFixed(2).replace(".", ",")} realizada com sucesso`);
      setOrigemId("");
      setDestinoId("");
      setValor(0);
      setDescricao("");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar transferência");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transferência entre Contas
          </DialogTitle>
          <DialogDescription>
            Transfira valores entre suas contas bancárias.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Origem <span className="text-destructive">*</span></Label>
            <Select value={origemId} onValueChange={setOrigemId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a conta de origem" />
              </SelectTrigger>
              <SelectContent>
                {contas.filter(c => c.id !== destinoId).map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} {c.banco ? `(${c.banco})` : ""} — R$ {Number(c.saldo_atual).toFixed(2).replace(".", ",")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Destino <span className="text-destructive">*</span></Label>
            <Select value={destinoId} onValueChange={setDestinoId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {contas.filter(c => c.id !== origemId).map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} {c.banco ? `(${c.banco})` : ""} — R$ {Number(c.saldo_atual).toFixed(2).replace(".", ",")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Valor <span className="text-destructive">*</span></Label>
            <div className="col-span-3">
              <CurrencyInput
                id="transferencia_valor"
                name="transferencia_valor"
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
              placeholder="Ex: Transferência para reserva"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleTransferir} disabled={loading}>
            {loading ? "Transferindo..." : "Transferir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferenciaDialog;
