
import React from "react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { LancamentosHeader } from "./LancamentosHeader";
import { LancamentosTable } from "./LancamentosTable";
import { LancamentosSummary } from "./LancamentosSummary";
import { LancamentosFormDialog } from "./LancamentosFormDialog";
import { LancamentosDeleteDialog } from "./LancamentosDeleteDialog";
import { LancamentosFilterDialog } from "./LancamentosFilterDialog";

export const LancamentosContainer = () => {
  const { loading, lancamentos, searchQuery } = useLancamentosContext();

  const filteredLancamentos = React.useMemo(() => {
    if (!searchQuery.trim()) return lancamentos;
    const q = searchQuery.toLowerCase();
    return lancamentos.filter((l) => {
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
  }, [lancamentos, searchQuery]);

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
            {searchQuery.trim() ? "Nenhum lançamento encontrado para esta busca" : "Nenhum lançamento encontrado"}
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
