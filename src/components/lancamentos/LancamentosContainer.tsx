
import React from "react";
import { useLancamentosContext, Lancamento } from "@/contexts/LancamentosContext";
import { LancamentosHeader } from "./LancamentosHeader";
import { LancamentosTable } from "./LancamentosTable";
import { LancamentosSummary } from "./LancamentosSummary";
import { LancamentosFormDialog } from "./LancamentosFormDialog";
import { LancamentosDeleteDialog } from "./LancamentosDeleteDialog";
import { LancamentosFilterDialog } from "./LancamentosFilterDialog";
import { useMonthFilter } from "@/contexts/MonthFilterContext";
import { addMonths, addYears, isBefore, isAfter, startOfMonth, endOfMonth, isSameMonth } from "date-fns";

export const LancamentosContainer = () => {
  const { loading, lancamentos, searchQuery } = useLancamentosContext();
  const { selectedMonth } = useMonthFilter();

  // Generate virtual lancamentos for recurring entries in other months
  const lancamentosWithVirtual = React.useMemo(() => {
    const virtuals: (Lancamento & { _virtual?: boolean })[] = [];
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    lancamentos.forEach((l) => {
      if (!l.recorrente || !l.data_vencimento) return;

      const originalDate = new Date(l.data_vencimento);

      // Skip if the original is already in this month (it's a real entry)
      if (isSameMonth(originalDate, selectedMonth)) return;

      // Skip if original is after this month (hasn't started yet)
      if (isAfter(startOfMonth(originalDate), monthStart)) return;

      // Determine the end boundary
      let endBoundary: Date | null = null;
      if (l.recorrencia_fim) {
        endBoundary = new Date(l.recorrencia_fim);
      } else if (l.total_parcelas) {
        // Calculate end based on total_parcelas from the original date
        const tipo = l.recorrencia_tipo || 'mensal';
        if (tipo === 'anual') {
          endBoundary = addYears(originalDate, l.total_parcelas - 1);
        } else {
          endBoundary = addMonths(originalDate, l.total_parcelas - 1);
        }
      }

      // If there's an end boundary and it's before this month, skip
      if (endBoundary && isBefore(endOfMonth(endBoundary), monthStart)) return;

      // Check if there's already a real entry for this month (avoid duplicates)
      const alreadyExists = lancamentos.some(
        (existing) =>
          existing.id !== l.id &&
          existing.descricao === l.descricao &&
          isSameMonth(new Date(existing.data_vencimento), selectedMonth)
      );
      if (alreadyExists) return;

      // Calculate the projected date in this month
      const dayOfMonth = originalDate.getDate();
      const projectedDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), dayOfMonth);

      // Calculate parcela number if applicable
      let parcelaAtual: number | null = null;
      if (l.total_parcelas) {
        const tipo = l.recorrencia_tipo || 'mensal';
        let diffMonths: number;
        if (tipo === 'anual') {
          diffMonths = selectedMonth.getFullYear() - originalDate.getFullYear();
        } else {
          diffMonths = (selectedMonth.getFullYear() - originalDate.getFullYear()) * 12 +
            (selectedMonth.getMonth() - originalDate.getMonth());
        }
        parcelaAtual = diffMonths + 1; // 1-indexed (original = 1)
        if (parcelaAtual > l.total_parcelas) return; // Beyond total parcels
      }

      virtuals.push({
        ...l,
        id: `virtual-${l.id}-${selectedMonth.toISOString()}`,
        data_vencimento: projectedDate.toISOString().split("T")[0],
        data_pagamento: null,
        status: "pendente",
        parcela_atual: parcelaAtual,
        _virtual: true,
      } as any);
    });

    // Only include real entries from this month + virtuals
    const realThisMonth = lancamentos.filter((l) =>
      isSameMonth(new Date(l.data_vencimento), selectedMonth)
    );

    return [...realThisMonth, ...virtuals];
  }, [lancamentos, selectedMonth]);

  const filteredLancamentos = React.useMemo(() => {
    if (!searchQuery.trim()) return lancamentosWithVirtual;
    const q = searchQuery.toLowerCase();
    return lancamentosWithVirtual.filter((l) => {
      const valorFormatado = l.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      return (
        l.descricao?.toLowerCase().includes(q) ||
        valorFormatado.includes(q) ||
        l.fornecedor?.nome?.toLowerCase().includes(q) ||
        l.cliente?.nome?.toLowerCase().includes(q) ||
        l.categoria?.nome?.toLowerCase().includes(q) ||
        l.projeto?.nome?.toLowerCase().includes(q)
      );
    });
  }, [lancamentosWithVirtual, searchQuery]);

  return (
    <>
      <LancamentosHeader />
      <LancamentosSummary />
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Carregando lançamentos...</p>
        </div>
      ) : filteredLancamentos.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            {searchQuery.trim() ? "Nenhum lançamento encontrado para esta busca" : "Nenhum lançamento encontrado neste mês"}
          </p>
        </div>
      ) : (
        <LancamentosTable lancamentosOverride={filteredLancamentos} />
      )}

      <LancamentosFormDialog />
      <LancamentosDeleteDialog />
      <LancamentosFilterDialog />
    </>
  );
};
