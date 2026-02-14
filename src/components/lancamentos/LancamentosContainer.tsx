
import React from "react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { LancamentosHeader } from "./LancamentosHeader";
import { LancamentosTable } from "./LancamentosTable";
import { LancamentosSummary } from "./LancamentosSummary";
import { LancamentosFormDialog } from "./LancamentosFormDialog";
import { LancamentosDeleteDialog } from "./LancamentosDeleteDialog";
import { LancamentosFilterDialog } from "./LancamentosFilterDialog";

export const LancamentosContainer = () => {
  const { loading, lancamentos } = useLancamentosContext();

  return (
    <>
      <LancamentosHeader />
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Carregando lançamentos...</p>
        </div>
      ) : lancamentos.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
        </div>
      ) : (
        <>
          <LancamentosTable />
          <LancamentosSummary />
        </>
      )}

      <LancamentosFormDialog />
      <LancamentosDeleteDialog />
      <LancamentosFilterDialog />
    </>
  );
};
