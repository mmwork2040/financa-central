
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { useAuth } from "@/contexts/AuthContext";
import { TipoSelect } from "./form/TipoSelect";
import { InvestimentoSubtipoSelect, InvestimentoSubtipo } from "./form/InvestimentoSubtipoSelect";
import { DescricaoInput } from "./form/DescricaoInput";
import { ValorInput } from "./form/ValorInput";
import { DatePickerField } from "./form/DatePickerField";
import { StatusSelect } from "./form/StatusSelect";
import { LancamentoModoSelect, LancamentoModo } from "./form/LancamentoModoSelect";
import { CategoriaSelect } from "./form/CategoriaSelect";
import { ClienteFornecedorSelect } from "./form/ClienteFornecedorSelect";
import { GenericSelect } from "./form/GenericSelect";
import { QuickAddContaBancariaModal } from "./form/QuickAddContaBancariaModal";
import { QuickAddFormaPagamentoModal } from "./form/QuickAddFormaPagamentoModal";
import { QuickAddProjetoModal } from "./form/QuickAddProjetoModal";
import { formatCurrency } from "@/utils/formatters";

export const LancamentosFormDialog = () => {
  const { 
    openModal,
    setOpenModal,
    formData,
    handleInputChange,
    handleSave,
    handleSelectChange,
    categorias,
    clientes,
    fornecedores,
    formasPagamento,
    contasBancarias,
    projetos,
    cartoesCredito,
    selectedId,
    refreshCategorias,
    refreshFornecedores,
    refreshClientes,
    refreshFormasPagamento,
    refreshContasBancarias,
    refreshProjetos,
  } = useLancamentosContext();

  const { isPessoal } = useAuth();

  const [selectedTipo, setSelectedTipo] = useState<"despesa" | "receita" | "investimento">(
    ["despesa", "receita", "investimento"].includes(formData.tipo) ? formData.tipo as any : "despesa"
  );
  const [subtipoInvestimento, setSubtipoInvestimento] = useState<InvestimentoSubtipo>("novo");
  const [selectedStatus, setSelectedStatus] = useState<"pendente" | "pago" | "recebido" | "cancelado">(formData.status || "pendente");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modo, setModo] = useState<LancamentoModo>("unico");
  const [recorrenciaInicio, setRecorrenciaInicio] = useState<string | null>(null);

  // Detect if editing an existing recurring lancamento
  const isEditingRecorrente = !!selectedId && formData.recorrente && !!(formData as any).recorrencia_grupo_id;

  // Derived: is this an investment sub-operation that auto-sets status?
  const isAutoStatus = selectedTipo === "investimento" && ["resgate", "rentabilidade", "reajuste"].includes(subtipoInvestimento);

  // Sync selectedTipo/subtipo only when modal opens or formData.tipo changes meaningfully
  const formTipo = formData.tipo;
  const formStatus = formData.status;
  useEffect(() => {
    if (formTipo === "resgate" as any) {
      setSelectedTipo("investimento");
      setSubtipoInvestimento("resgate");
    } else if (formTipo === "rentabilidade" as any) {
      setSelectedTipo("investimento");
      setSubtipoInvestimento("rentabilidade");
    } else if (formTipo === "reajuste" as any) {
      setSelectedTipo("investimento");
      setSubtipoInvestimento("reajuste");
    } else if (["despesa", "receita", "investimento"].includes(formTipo)) {
      setSelectedTipo(formTipo as any);
      // Only reset subtipo to "novo" if not already set to a valid subtipo
      // (avoids resetting when other fields change)
    } else {
      setSelectedTipo("despesa");
    }
    setSelectedStatus(formStatus || "pendente");
  }, [formTipo, formStatus]);

  // Set initial modo when modal opens
  useEffect(() => {
    if (openModal) {
      if (formData.total_parcelas && formData.total_parcelas > 1) {
        setModo("parcelado");
      } else if (formData.recorrente) {
        setModo("recorrente");
      } else {
        setModo("unico");
      }
      setRecorrenciaInicio(null);
    }
  }, [openModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTipoChange = (value: string) => {
    if (isEditingRecorrente) return;
    const tipoValue = value as "despesa" | "receita" | "investimento";
    setSelectedTipo(tipoValue);
    if (tipoValue === "investimento") {
      setSubtipoInvestimento("novo");
      handleSelectChange('tipo', 'investimento');
    } else {
      handleSelectChange('tipo', value);
    }
  };

  const handleSubtipoChange = (value: InvestimentoSubtipo) => {
    setSubtipoInvestimento(value);
    // Map subtipo to internal tipo for context
    if (value === "novo") {
      handleSelectChange('tipo', 'investimento');
      setSelectedStatus("pendente");
      handleSelectChange('status', 'pendente');
    } else if (value === "resgate") {
      handleSelectChange('tipo', 'resgate');
      setSelectedStatus("recebido");
      handleSelectChange('status', 'recebido');
    } else if (value === "rentabilidade") {
      handleSelectChange('tipo', 'rentabilidade');
      setSelectedStatus("recebido");
      handleSelectChange('status', 'recebido');
    } else if (value === "reajuste") {
      handleSelectChange('tipo', 'reajuste');
      setSelectedStatus("recebido");
      handleSelectChange('status', 'recebido');
      // Auto-fill description
      const syntheticEvent = {
        target: { name: 'descricao', value: formData.descricao || 'Reajuste manual de investimento' }
      } as React.ChangeEvent<HTMLInputElement>;
      if (!formData.descricao) handleInputChange(syntheticEvent);
    }
  };

  const handleStatusChange = (value: string) => {
    const statusValue = value as "pendente" | "pago" | "recebido" | "cancelado";
    setSelectedStatus(statusValue);
    handleSelectChange('status', value);
  };

  const handleDateChange = (field: string, date: Date | null) => {
    if (date) {
      const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const syntheticEvent = {
        target: { name: field, value: isoDate }
      } as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(syntheticEvent);
    }
  };

  const handleModoChange = (newModo: LancamentoModo) => {
    setModo(newModo);
    if (newModo === "unico") {
      handleRecorrenciaChange(false);
      handleParcelasChange(null);
    } else if (newModo === "recorrente") {
      handleRecorrenciaChange(true);
      handleParcelasChange(null);
    } else if (newModo === "parcelado") {
      handleRecorrenciaChange(false);
      handleParcelasChange(null);
    }
  };

  const handleRecorrenciaChange = (checked: boolean) => {
    const syntheticEvent = {
      target: { name: 'recorrente', value: checked }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };

  const handleRecorrenciaTipoChange = (value: string) => {
    const syntheticEvent = {
      target: { name: 'recorrencia_tipo', value }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };

  const handleRecorrenciaFimChange = (value: string | null) => {
    const syntheticEvent = {
      target: { name: 'recorrencia_fim', value }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };

  const handleParcelasChange = (value: number | null) => {
    const syntheticEvent = {
      target: { name: 'total_parcelas', value }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };

  const handleValorChange = (value: number) => {
    const syntheticEvent = {
      target: { name: 'valor', value: value }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };

  const handleSaveWithRecorrencia = () => {
    // Inject recorrencia_inicio into formData before saving
    if (modo === "recorrente" && recorrenciaInicio) {
      const syntheticEvent = {
        target: { name: 'recorrencia_inicio', value: recorrenciaInicio }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(syntheticEvent);
    }
    setConfirmOpen(false);
    // Small delay to let state propagate
    setTimeout(() => handleSave(), 50);
  };

  // Get display label for confirmation dialog
  const getDisplayTipo = () => {
    if (selectedTipo === "investimento") {
      switch (subtipoInvestimento) {
        case "novo": return "Novo Investimento";
        case "resgate": return "Resgate de Investimento";
        case "rentabilidade": return "Rentabilidade";
        case "reajuste": return "Reajuste de Investimento";
      }
    }
    return selectedTipo === "receita" ? "Receita" : "Despesa";
  };

  // Whether to show simplified fields (no status/recurrence for special investment sub-types)
  const showFullFields = !isAutoStatus;

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{selectedId ? "Editar" : "Novo"} Lançamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <TipoSelect value={selectedTipo} onChange={handleTipoChange} />
          
          {selectedTipo === "investimento" && (
            <InvestimentoSubtipoSelect value={subtipoInvestimento} onChange={handleSubtipoChange} />
          )}

          <DescricaoInput 
            value={formData.descricao || ""} 
            onChange={handleInputChange} 
            disabled={isEditingRecorrente}
          />
          <ValorInput 
            valor={formData.valor} 
            onValorChange={handleValorChange}
          />
          <DatePickerField 
            label="Data de Vencimento"
            value={formData.data_vencimento} 
            onChange={(date) => handleDateChange('data_vencimento', date)} 
          />
          
          {showFullFields && (
            <StatusSelect value={selectedStatus} onChange={handleStatusChange} tipo={selectedTipo} />
          )}
          
          {showFullFields && (selectedStatus === "pago" || selectedStatus === "recebido") && (
            <DatePickerField 
              label={`Data de ${selectedTipo === "receita" ? "Recebimento" : "Pagamento"}`}
              value={formData.data_pagamento} 
              onChange={(date) => handleDateChange('data_pagamento', date)} 
            />
          )}
          
          {showFullFields && (
            <LancamentoModoSelect
              modo={modo}
              onModoChange={handleModoChange}
              recorrenciaTipo={(formData as any).recorrencia_tipo || "mensal"}
              onRecorrenciaTipoChange={handleRecorrenciaTipoChange}
              recorrenciaFim={(formData as any).recorrencia_fim}
              onRecorrenciaFimChange={handleRecorrenciaFimChange}
              recorrenciaInicio={recorrenciaInicio}
              onRecorrenciaInicioChange={setRecorrenciaInicio}
              totalParcelas={formData.total_parcelas}
              onTotalParcelasChange={handleParcelasChange}
              valorTotal={formData.valor || 0}
              isEditingRecorrente={isEditingRecorrente}
            />
          )}
          
          <CategoriaSelect 
            value={formData.categoria_id} 
            onChange={(value) => handleSelectChange('categoria_id', value)}
            categorias={categorias}
            tipo={selectedTipo}
            onRefresh={refreshCategorias}
          />
          
          {!isPessoal && showFullFields && (
            <ClienteFornecedorSelect 
              tipo={selectedTipo}
              clienteId={formData.cliente_id}
              fornecedorId={formData.fornecedor_id}
              onClienteChange={(value) => handleSelectChange('cliente_id', value)}
              onFornecedorChange={(value) => handleSelectChange('fornecedor_id', value)}
              clientes={clientes}
              fornecedores={fornecedores}
              onRefreshClientes={refreshClientes}
              onRefreshFornecedores={refreshFornecedores}
            />
          )}
          
          <GenericSelect 
            label="Forma de Pagamento"
            value={formData.forma_pagamento_id} 
            onChange={(value) => handleSelectChange('forma_pagamento_id', value)}
            options={formasPagamento}
            noneOptionValue="no-payment-method"
            nameField="descricao"
            placeholder="Selecione a forma de pagamento"
            customQuickAdd={refreshFormasPagamento ? <QuickAddFormaPagamentoModal onSuccess={refreshFormasPagamento} /> : undefined}
          />
          
          <GenericSelect 
            label="Conta Bancária"
            value={formData.conta_bancaria_id} 
            onChange={(value) => handleSelectChange('conta_bancaria_id', value)}
            options={contasBancarias}
            noneOptionValue="no-bank-account"
            placeholder="Selecione a conta bancária"
            customQuickAdd={refreshContasBancarias ? <QuickAddContaBancariaModal onSuccess={refreshContasBancarias} /> : undefined}
          />
          
          <GenericSelect 
            label="Projeto"
            value={formData.projeto_id} 
            onChange={(value) => handleSelectChange('projeto_id', value)}
            options={projetos}
            noneOptionValue="no-project"
            nameField="nome"
            placeholder="Selecione o projeto (opcional)"
            customQuickAdd={refreshProjetos ? <QuickAddProjetoModal onSuccess={refreshProjetos} /> : undefined}
          />

          {isPessoal && selectedTipo === "despesa" && cartoesCredito.length > 0 && (
            <GenericSelect 
              label="Cartão de Crédito"
              value={(formData as any).cartao_credito_id} 
              onChange={(value) => {
                handleSelectChange('cartao_credito_id', value);
                // Auto-adjust vencimento based on card billing cycle
                if (value && value !== "no-credit-card") {
                  const cartao = cartoesCredito.find(c => c.id === value);
                  if (cartao && formData.data_vencimento) {
                    const dataCompra = new Date(formData.data_vencimento + "T12:00:00");
                    const diaCompra = dataCompra.getDate();
                    let faturaMonth = dataCompra.getMonth();
                    let faturaYear = dataCompra.getFullYear();
                    
                    if (diaCompra > cartao.dia_fechamento) {
                      faturaMonth += 1;
                      if (faturaMonth > 11) {
                        faturaMonth = 0;
                        faturaYear += 1;
                      }
                    }
                    
                    const lastDay = new Date(faturaYear, faturaMonth + 1, 0).getDate();
                    const diaVenc = Math.min(cartao.dia_vencimento, lastDay);
                    const novaData = `${faturaYear}-${String(faturaMonth + 1).padStart(2, '0')}-${String(diaVenc).padStart(2, '0')}`;
                    
                    const syntheticEvent = {
                      target: { name: 'data_vencimento', value: novaData }
                    } as React.ChangeEvent<HTMLInputElement>;
                    handleInputChange(syntheticEvent);
                  }
                }
              }}
              options={cartoesCredito.map(c => ({ 
                id: c.id, 
                nome: `${c.nome}${c.ultimos_digitos ? ` •••• ${c.ultimos_digitos}` : ''}` 
              }))}
              noneOptionValue="no-credit-card"
              nameField="nome"
              placeholder="Selecione o cartão (opcional)"
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpenModal(false)}>
            Cancelar
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={!formData.descricao || !formData.data_vencimento}>
            {selectedId ? "Atualizar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar {selectedId ? "atualização" : "cadastro"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Deseja {selectedId ? "atualizar" : "registrar"} o seguinte lançamento?</p>
                <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                  <p><strong>Descrição:</strong> {formData.descricao}</p>
                  <p><strong>Tipo:</strong> {getDisplayTipo()}</p>
                  <p><strong>Valor:</strong> {formatCurrency(formData.valor || 0)}</p>
                  <p><strong>Vencimento:</strong> {formData.data_vencimento ? new Date(formData.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</p>
                  <p><strong>Status:</strong> {selectedStatus === "pendente" ? "Pendente" : selectedStatus === "pago" ? "Pago" : selectedStatus === "recebido" ? "Recebido" : "Cancelado"}</p>
                  {modo === "recorrente" && !isEditingRecorrente && (
                    <>
                      <p className="text-primary font-medium">
                        {formatCurrency(formData.valor || 0)}/{(formData as any).recorrencia_tipo === "mensal" ? "mês" : (formData as any).recorrencia_tipo || "mês"} — repete {(formData as any).recorrencia_tipo || "mensalmente"}
                      </p>
                      {recorrenciaInicio && (
                        <p className="text-xs text-muted-foreground">Início retroativo: {new Date(recorrenciaInicio + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                      )}
                    </>
                  )}
                  {modo === "parcelado" && formData.total_parcelas && formData.total_parcelas > 1 && (
                    <p className="text-primary font-medium">{formatCurrency(formData.valor || 0)} total → {formData.total_parcelas}x de {formatCurrency(Math.round(((formData.valor || 0) / formData.total_parcelas) * 100) / 100)}</p>
                  )}
                  {isEditingRecorrente && (
                    <p className="text-xs text-amber-600 font-medium">⚠ Apenas esta ocorrência será alterada. A cadeia recorrente não será afetada.</p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveWithRecorrencia}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
