
import React from "react";
import { useLancamentosContext, Lancamento } from "@/contexts/LancamentosContext";
import { LancamentosHeader } from "./LancamentosHeader";
import { LancamentosTable } from "./LancamentosTable";
import { LancamentosSummary } from "./LancamentosSummary";
import { LancamentosFormDialog } from "./LancamentosFormDialog";
import { LancamentosDeleteDialog } from "./LancamentosDeleteDialog";
import { LancamentosFilterDialog } from "./LancamentosFilterDialog";
import { useMonthFilter } from "@/contexts/MonthFilterContext";
import { addMonths, isBefore, isAfter, startOfMonth, endOfMonth, isSameMonth } from "date-fns";

export const LancamentosContainer = () => {
  const { loading, lancamentos, searchQuery } = useLancamentosContext();
  const { selectedMonth } = useMonthFilter();

  // Generate virtual lancamentos for recurring entries without total_parcelas
  const lancamentosWithVirtual = React.useMemo(() => {
    const virtuals: (Lancamento & { _virtual?: boolean })[] = [];
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    // For each lancamento that is recorrente, has no total_parcelas, and started before this month
    lancamentos.forEach((l) => {
      if (
        l.recorrente &&
        !l.total_parcelas &&
        l.data_vencimento
      ) {
        const originalDate = new Date(l.data_vencimento);
        // If the original is in a previous month and either no end date or end date is after this month
        if (
          isBefore(originalDate, monthStart) &&
          (!l.recorrencia_fim || isAfter(new Date(l.recorrencia_fim), monthStart))
        ) {
          // Check if there's already a real entry for this month (avoid duplicates)
          const alreadyExists = lancamentos.some(
            (existing) =>
              existing.descricao === l.descricao &&
              isSameMonth(new Date(existing.data_vencimento), selectedMonth)
          );
          if (!alreadyExists) {
            // Calculate the projected date in this month
            const dayOfMonth = originalDate.getDate();
            const projectedDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), dayOfMonth);
            virtuals.push({
              ...l,
              id: `virtual-${l.id}-${selectedMonth.toISOString()}`,
              data_vencimento: projectedDate.toISOString().split("T")[0],
              status: "pendente",
              _virtual: true,
            } as any);
          }
        }
      }
    });

    return [...lancamentos, ...virtuals];
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
