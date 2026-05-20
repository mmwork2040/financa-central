
import React, { useState, useRef, useEffect } from "react";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { Landmark, ArrowRightLeft, FileText, Calculator, History, ArrowDownToLine, ChevronLeft, ChevronRight } from "lucide-react";
import ContasBancariasTable from "@/components/contas-bancarias/ContasBancariasTable";
import ContaBancariaForm from "@/components/contas-bancarias/ContaBancariaForm";
import ContaBancariaDeleteDialog from "@/components/contas-bancarias/ContaBancariaDeleteDialog";
import ContasBancariasSearch from "@/components/contas-bancarias/ContasBancariasSearch";
import TransferenciaDialog from "@/components/contas-bancarias/TransferenciaDialog";
import ExtratoDialog from "@/components/contas-bancarias/ExtratoDialog";
import RecalcularSaldoDialog from "@/components/contas-bancarias/RecalcularSaldoDialog";
import HistoricoMovimentacoesDialog from "@/components/contas-bancarias/HistoricoMovimentacoesDialog";
import ResgateInvestimentoDialog from "@/components/contas-bancarias/ResgateInvestimentoDialog";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { ValuesVisibilityProvider } from "@/contexts/ValuesVisibilityContext";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

const ContasBancariasContent = () => {
  const { canPerformAction, empresaId } = useAuth();
  const canIncluir = canPerformAction("contas_bancarias", "pode_incluir");
  const canAlterar = canPerformAction("contas_bancarias", "pode_alterar");
  const canExcluir = canPerformAction("contas_bancarias", "pode_excluir");
  const { visible, toggle } = useValuesVisibility();
  const [openTransferencia, setOpenTransferencia] = useState(false);
  const [openExtrato, setOpenExtrato] = useState(false);
  const [openRecalcular, setOpenRecalcular] = useState(false);
  const [openHistorico, setOpenHistorico] = useState(false);
  const [openResgate, setOpenResgate] = useState(false);
  const {
    contasBancarias, loading, formData, openModal, openDeleteModal, selectedId, searchQuery,
    showPrincipalConfirm, contaPrincipalExistente,
    handleInputChange, handleOpenModal, handleCloseModal, handleOpenDeleteModal, handleCloseDeleteModal,
    handleSave, handleDelete, handleExportCSV, handleExportPDF, handleSearchChange,
    handleConfirmPrincipal, handleClosePrincipalConfirm,
  } = useContasBancarias();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 5
      );
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [contasBancarias, loading]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 150;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const contasParaDialog = contasBancarias.map(c => ({
    id: c.id, nome: c.nome, banco: c.banco, saldo_atual: c.saldo_atual || 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas Bancárias"
        description="Gerencie as contas bancárias do sistema."
        buttonLabel="Nova Conta Bancária"
        onButtonClick={() => handleOpenModal()}
        showButton={canIncluir}
        icon={Landmark}
      />
      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ContasBancariasSearch
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
        <div className="flex items-center gap-1.5 w-full overflow-x-auto pb-2 sm:pb-0 sm:overflow-x-visible sm:w-auto sm:justify-end no-scrollbar">
          <Button variant="outline" size="sm" onClick={() => setOpenHistorico(true)} className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <History className="h-3.5 w-3.5 shrink-0" />
            <span>Histórico</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpenExtrato(true)} className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span>Extrato</span>
          </Button>
          {canAlterar && (
            <Button variant="outline" size="sm" onClick={() => setOpenRecalcular(true)} className="gap-1.5 text-xs whitespace-nowrap shrink-0">
              <Calculator className="h-3.5 w-3.5 shrink-0" />
              <span>Recalcular</span>
            </Button>
          )}
          {canAlterar && contasBancarias.length >= 2 && (
            <Button variant="outline" size="sm" onClick={() => setOpenTransferencia(true)} className="gap-1.5 text-xs whitespace-nowrap shrink-0">
              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
              <span>Transferir</span>
            </Button>
          )}
          {canAlterar && contasBancarias.length >= 1 && (
            <Button variant="outline" size="sm" onClick={() => setOpenResgate(true)} className="gap-1.5 text-xs whitespace-nowrap shrink-0">
              <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" />
              <span>Resgatar</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground shrink-0 ml-auto sm:ml-0" title={visible ? "Ocultar valores" : "Exibir valores"}>
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Carregando contas bancárias...</p>
        </div>
      ) : contasBancarias.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Nenhuma conta bancária encontrada</p>
        </div>
      ) : (
        <ContasBancariasTable
          contasBancarias={contasBancarias}
          onEdit={handleOpenModal}
          onDelete={handleOpenDeleteModal}
          canEdit={canAlterar}
          canDelete={canExcluir}
        />
      )}
      
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Total de registros: {contasBancarias.length}
        </p>
      </div>

      <ContaBancariaForm
        open={openModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        formData={formData}
        handleInputChange={handleInputChange}
        isEditing={!!selectedId}
        contaPrincipalExistente={contaPrincipalExistente}
        showPrincipalConfirm={showPrincipalConfirm}
        onClosePrincipalConfirm={handleClosePrincipalConfirm}
        onConfirmPrincipal={handleConfirmPrincipal}
      />

      <ContaBancariaDeleteDialog
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        onDelete={handleDelete}
      />

      <TransferenciaDialog
        open={openTransferencia}
        onClose={() => setOpenTransferencia(false)}
        contas={contasParaDialog}
        onSuccess={() => window.location.reload()}
        empresaId={empresaId}
      />

      <ExtratoDialog
        open={openExtrato}
        onClose={() => setOpenExtrato(false)}
        contas={contasParaDialog}
        empresaId={empresaId}
      />

      <RecalcularSaldoDialog
        open={openRecalcular}
        onClose={() => setOpenRecalcular(false)}
        contas={contasBancarias.map(c => ({
          id: c.id,
          nome: c.nome,
          banco: c.banco,
          saldo_inicial: c.saldo_inicial || 0,
          saldo_atual: c.saldo_atual || 0,
        }))}
        onSuccess={() => window.location.reload()}
      />

      <HistoricoMovimentacoesDialog
        open={openHistorico}
        onClose={() => setOpenHistorico(false)}
        contas={contasParaDialog}
        empresaId={empresaId}
      />

      <ResgateInvestimentoDialog
        open={openResgate}
        onClose={() => setOpenResgate(false)}
        contas={contasParaDialog}
        onSuccess={() => window.location.reload()}
        empresaId={empresaId}
      />
    </div>
  );
};

const ContasBancarias = () => {
  return (
    <ValuesVisibilityProvider>
      <ContasBancariasContent />
    </ValuesVisibilityProvider>
  );
};

export default ContasBancarias;
