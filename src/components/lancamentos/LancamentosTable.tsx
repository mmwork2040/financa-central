
import React, { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Check, Lock, Clock, Pencil, Trash2, Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { formatCurrency } from "@/utils/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import SupportDeleteDialog from "@/components/common/SupportDeleteDialog";
import { useSolicitacoesSuporte } from "@/hooks/useSolicitacoesSuporte";
import { BulkActionsBar } from "./BulkActionsBar";
import { SelectionSummaryPopup } from "./SelectionSummaryPopup";
import { isPending } from "@/utils/lancamentoStatus";
import { toast } from "sonner";

export const LancamentosTable = ({ lancamentosOverride }: { lancamentosOverride?: any[] } = {}) => {
  const { canPerformAction, isSuperAdmin } = useAuth();
  const canAlterar = canPerformAction("lancamentos", "pode_alterar");
  const canExcluir = canPerformAction("lancamentos", "pode_excluir");
  const isMobile = useIsMobile();
  const { visible } = useValuesVisibility();
  const displayCurrency = (val: number) => visible ? formatCurrency(val) : "••••••";
  const { criarSolicitacao, hasPendingRequest, getPendingRequestId, cancelarSolicitacao } = useSolicitacoesSuporte();
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [supportTarget, setSupportTarget] = useState<{ id: string; descricao: string } | null>(null);
  const [hasActiveDeleteWebhook, setHasActiveDeleteWebhook] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    const checkWebhook = async () => {
      try {
        const { data } = await (supabase as any)
          .from("webhooks_empresa")
          .select("id")
          .eq("nome", "Excluir Registro")
          .eq("ativo", true)
          .limit(1);
        setHasActiveDeleteWebhook(!!(data && data.length > 0));
      } catch {
        setHasActiveDeleteWebhook(false);
      }
    };
    checkWebhook();
  }, []);

  const { 
    lancamentos: contextLancamentos, handleSort, handleOpenModal, handleOpenDeleteModal, handleUpdateStatus,
    getStatusBadgeClass, getStatusLabel, getTipoBadgeClass, refreshLancamentos
  } = useLancamentosContext();

  const lancamentos = lancamentosOverride || contextLancamentos;
  const showActions = canAlterar || canExcluir;
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(lancamentos);

  // Only real (non-virtual) pending items can be selected
  const selectableItems = lancamentos.filter(
    (l) => isPending(l.status) && !l.id?.startsWith("virtual-")
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === selectableItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableItems.map((l) => l.id!)));
    }
  }, [selectedIds.size, selectableItems]);

  const selectedLancamentos = lancamentos.filter((l) => selectedIds.has(l.id!));
  const selectedTotal = selectedLancamentos.reduce((sum, l) => sum + l.valor, 0);

  const handleBulkPay = async () => {
    setBulkLoading(true);
    try {
      for (const l of selectedLancamentos) {
        if (l.status !== "pendente") continue;

        // Adjust bank account balance if linked
        if (l.conta_bancaria_id) {
          const delta = l.tipo === "receita" ? l.valor : -l.valor;
          const { data: conta } = await supabase
            .from("contas_bancarias")
            .select("saldo_atual")
            .eq("id", l.conta_bancaria_id)
            .single();

          if (conta) {
            const saldoAnterior = Number(conta.saldo_atual || 0);
            const saldoPosterior = saldoAnterior + delta;
            await supabase
              .from("contas_bancarias")
              .update({ saldo_atual: saldoPosterior })
              .eq("id", l.conta_bancaria_id);
            
            const { logMovimentacao } = await import("@/utils/logMovimentacao");
            await logMovimentacao({
              conta_bancaria_id: l.conta_bancaria_id,
              empresa_id: l.empresa_id || null,
              tipo: l.tipo === "receita" ? "receita" : "despesa",
              descricao: `Baixa em massa: ${l.descricao}`,
              valor: delta,
              saldo_anterior: saldoAnterior,
              saldo_posterior: saldoPosterior,
              lancamento_id: l.id || null,
            });
          }
        }

        const newStatus = l.tipo === "receita" ? "recebido" : "pago";
        await supabase
          .from("lancamentos")
          .update({ status: newStatus, data_pagamento: new Date().toISOString().split("T")[0] })
          .eq("id", l.id!);
      }
      toast.success(`${selectedLancamentos.length} lançamento(s) atualizado(s) com sucesso.`);
      setSelectedIds(new Set());
      refreshLancamentos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao dar baixa em massa");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      for (const l of selectedLancamentos) {
        await supabase.from("lancamentos").delete().eq("id", l.id!);
      }
      toast.success(`${selectedLancamentos.length} lançamento(s) excluído(s) com sucesso.`);
      setSelectedIds(new Set());
      refreshLancamentos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir em massa");
    } finally {
      setBulkLoading(false);
    }
  };

  // Clear selection when lancamentos change
  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(lancamentos.map((l) => l.id!));
      const next = new Set<string>();
      prev.forEach((id) => { if (validIds.has(id)) next.add(id); });
      return next;
    });
  }, [lancamentos]);

  const bulkBar = (canAlterar || canExcluir) && (
    <>
      <BulkActionsBar
        selectedCount={selectedIds.size}
        totalValue={selectedTotal}
        onBulkPay={handleBulkPay}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds(new Set())}
        loading={bulkLoading}
      />
      <SelectionSummaryPopup
        selected={selectedLancamentos}
        onClear={() => setSelectedIds(new Set())}
      />
    </>
  );

  if (isMobile) {
    return (
      <div className="space-y-3 overflow-hidden">
        {bulkBar}
        <div className="glass-surface rounded-2xl p-3 space-y-3">
          {paginatedItems.map((l) => {
            const isSelectable = l.status === "pendente" && !l.id?.startsWith("virtual-");
            return (
              <Card key={l.id} className={hasPendingRequest("lancamentos", l.id!) ? "border-l-4 border-l-destructive bg-destructive/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {(canAlterar || canExcluir) && isSelectable && (
                        <Checkbox
                          checked={selectedIds.has(l.id!)}
                          onCheckedChange={() => toggleSelect(l.id!)}
                          className="mt-0.5"
                        />
                      )}
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {l.descricao}
                          {(l as any)._virtual && (
                            <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-700 cursor-help">Previsto</span>
                            </TooltipTrigger><TooltipContent><p>Data prevista: {new Date(l.data_vencimento).toLocaleDateString('pt-BR')}</p></TooltipContent></Tooltip></TooltipProvider>
                          )}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getTipoBadgeClass(l.tipo, l.origem)}`}>
                            {l.origem === "resgate_investimento" ? "Resgate" : l.origem === "rentabilidade_investimento" ? "Rentabilidade" : l.origem === "reajuste_investimento" ? "Reajuste" : l.tipo === "receita" ? "Receita" : l.tipo === "investimento" ? "Investimento" : "Despesa"}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadgeClass(l.status)}`}>
                            {getStatusLabel(l.status, l.tipo)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Registro: {new Date(l.created_at).toLocaleDateString("pt-BR")} {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' · '}Venc: {new Date(l.data_vencimento).toLocaleDateString("pt-BR")}
                        {l.categoria?.nome ? ` · ${l.categoria.nome}` : ''}
                        {(l as any).forma_pagamento?.descricao ? ` · ${(l as any).forma_pagamento.descricao}` : ''}
                        </p>
                        {(l.fornecedor || l.cliente) && (
                          <p className="text-xs text-muted-foreground">
                            {l.fornecedor ? `Forn: ${l.fornecedor.nome}` : `Cli: ${l.cliente?.nome}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <p className={`text-sm font-semibold ${l.tipo === "receita" ? "text-green-600" : l.tipo === "investimento" ? "text-accent-foreground" : "text-destructive"}`}>
                        {displayCurrency(l.valor)}
                      </p>
                      {showActions && (
                        <div className="flex gap-0.5">
                          {l.origem === 'integracao' ? (
                            <div className="flex items-center gap-0.5">
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center h-7 px-1.5 text-muted-foreground">
                                      <Lock className="h-3.5 w-3.5" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Lançamento automático – edição bloqueada</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {isSuperAdmin && canExcluir ? (
                                <>
                                  <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleOpenDeleteModal(l.id!)} title="Excluir diretamente">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger><TooltipContent><p>Excluir diretamente</p></TooltipContent></Tooltip></TooltipProvider>
                                  {hasActiveDeleteWebhook && (
                                    <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" onClick={() => {
                                        setSupportTarget({ id: l.id!, descricao: l.descricao });
                                        setSupportDialogOpen(true);
                                      }} title="Solicitar exclusão via webhook">
                                        <Send className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger><TooltipContent><p>Solicitar exclusão via webhook</p></TooltipContent></Tooltip></TooltipProvider>
                                  )}
                                </>
                              ) : canExcluir && hasActiveDeleteWebhook ? (
                                hasPendingRequest("lancamentos", l.id!) ? (
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><Clock className="h-3.5 w-3.5 text-amber-500" /></TooltipTrigger><TooltipContent><p>Exclusão solicitada – aguardando suporte</p></TooltipContent></Tooltip></TooltipProvider>
                                ) : (
                                  <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                                      setSupportTarget({ id: l.id!, descricao: l.descricao });
                                      setSupportDialogOpen(true);
                                    }} title="Solicitar exclusão">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger><TooltipContent><p>Solicitar exclusão</p></TooltipContent></Tooltip></TooltipProvider>
                                )
                              ) : null}
                            </div>
                          ) : (
                            <>
                              {canAlterar && l.status === "pendente" && (
                                <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary"
                                    onClick={() => handleUpdateStatus(l.id!, l.tipo === "receita" ? "recebido" : "pago")} title="Confirmar pagamento/recebimento">
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger><TooltipContent><p>{l.tipo === "receita" ? "Confirmar recebimento" : "Confirmar pagamento"}</p></TooltipContent></Tooltip></TooltipProvider>
                              )}
                              {canAlterar && (
                                <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenModal(l)} title="Editar lançamento">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger><TooltipContent><p>Editar lançamento</p></TooltipContent></Tooltip></TooltipProvider>
                              )}
                              {canExcluir && (
                                <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleOpenDeleteModal(l.id!)} title="Excluir lançamento">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger><TooltipContent><p>Excluir lançamento</p></TooltipContent></Tooltip></TooltipProvider>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <MobilePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    );
  }

  const allPageSelectableChecked = selectableItems.length > 0 && selectedIds.size === selectableItems.length;

  return (
    <div className="space-y-3">
      {bulkBar}
      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {(canAlterar || canExcluir) && (
                <TableHead className="w-[40px]">
                  <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                    <div>
                      <Checkbox
                        checked={allPageSelectableChecked}
                        onCheckedChange={toggleSelectAll}
                      />
                    </div>
                  </TooltipTrigger><TooltipContent><p>Selecionar todos os pendentes</p></TooltipContent></Tooltip></TooltipProvider>
                </TableHead>
              )}
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort('created_at')}>
                  Registro <ArrowUpDown className="ml-2 h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort('descricao')}>
                  Descrição <ArrowUpDown className="ml-2 h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Forma Pgto</TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort('valor')}>
                  Valor <ArrowUpDown className="ml-2 h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              {showActions && <TableHead className="w-[150px] text-center">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((lancamento) => {
              const isSelectable = lancamento.status === "pendente" && !lancamento.id?.startsWith("virtual-");
              return (
                <TableRow key={lancamento.id} className={hasPendingRequest("lancamentos", lancamento.id!) ? "bg-destructive/5 border-l-4 border-l-destructive" : ""}>
                  {(canAlterar || canExcluir) && (
                    <TableCell>
                      {isSelectable ? (
                        <Checkbox
                          checked={selectedIds.has(lancamento.id!)}
                          onCheckedChange={() => toggleSelect(lancamento.id!)}
                        />
                      ) : <div className="w-4" />}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="leading-tight">
                      <span>{new Date(lancamento.created_at).toLocaleDateString("pt-BR")}</span>
                      <span className="block text-[10px] text-muted-foreground">{new Date(lancamento.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {lancamento.descricao}
                    {(lancamento as any)._virtual && (
                      <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-700 cursor-help">Previsto</span>
                      </TooltipTrigger><TooltipContent><p>Data prevista: {new Date(lancamento.data_vencimento).toLocaleDateString('pt-BR')}</p></TooltipContent></Tooltip></TooltipProvider>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {lancamento.fornecedor ? `Fornecedor: ${lancamento.fornecedor.nome}` : 
                        lancamento.cliente ? `Cliente: ${lancamento.cliente.nome}` : ''}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoBadgeClass(lancamento.tipo, lancamento.origem)}`}>
                      {lancamento.origem === "resgate_investimento" ? "Resgate" : lancamento.origem === "rentabilidade_investimento" ? "Rentabilidade" : lancamento.origem === "reajuste_investimento" ? "Reajuste" : lancamento.tipo === "receita" ? "Receita" : lancamento.tipo === "investimento" ? "Investimento" : "Despesa"}
                    </span>
                  </TableCell>
                  <TableCell>{lancamento.categoria?.nome || '-'}</TableCell>
                  <TableCell>{(lancamento as any).forma_pagamento?.descricao || '-'}</TableCell>
                  <TableCell className={`font-medium ${lancamento.tipo === "receita" ? "text-green-600" : lancamento.tipo === "investimento" ? "text-accent-foreground" : "text-destructive"}`}>
                    {displayCurrency(lancamento.valor)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(lancamento.status)}`}>
                        {getStatusLabel(lancamento.status, lancamento.tipo)}
                      </span>
                      {(lancamento.status === 'pago' || lancamento.status === 'recebido') ? (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${lancamento.tipo === "receita" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>✓ Executado</span>
                      ) : lancamento.status === 'pendente' ? (
                        <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-700 cursor-help">🕐 Previsto</span>
                        </TooltipTrigger><TooltipContent><p>Data prevista: {new Date(lancamento.data_vencimento).toLocaleDateString('pt-BR')}</p></TooltipContent></Tooltip></TooltipProvider>
                      ) : null}
                    </div>
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <div className="flex justify-center space-x-1">
                        {lancamento.origem === 'integracao' ? (
                          <div className="flex items-center justify-center gap-1">
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center h-8 px-2 text-muted-foreground">
                                    <Lock className="h-4 w-4" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent><p>Lançamento automático – edição bloqueada</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {isSuperAdmin && canExcluir ? (
                              <>
                                <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteModal(lancamento.id!)} className="h-8 w-8 p-0 text-destructive" title="Excluir diretamente">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger><TooltipContent><p>Excluir diretamente</p></TooltipContent></Tooltip></TooltipProvider>
                                {hasActiveDeleteWebhook && (
                                  <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                      setSupportTarget({ id: lancamento.id!, descricao: lancamento.descricao });
                                      setSupportDialogOpen(true);
                                    }} className="h-8 w-8 p-0 text-amber-600" title="Solicitar exclusão via webhook">
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger><TooltipContent><p>Solicitar exclusão via webhook</p></TooltipContent></Tooltip></TooltipProvider>
                                )}
                              </>
                            ) : canExcluir && hasActiveDeleteWebhook ? (
                              hasPendingRequest("lancamentos", lancamento.id!) ? (
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Clock className="h-4 w-4 text-amber-500" /></TooltipTrigger><TooltipContent><p>Exclusão solicitada – aguardando suporte</p></TooltipContent></Tooltip></TooltipProvider>
                              ) : (
                                <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setSupportTarget({ id: lancamento.id!, descricao: lancamento.descricao });
                                    setSupportDialogOpen(true);
                                  }} className="h-8 w-8 p-0 text-destructive" title="Solicitar exclusão">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger><TooltipContent><p>Solicitar exclusão</p></TooltipContent></Tooltip></TooltipProvider>
                              )
                            ) : null}
                          </div>
                        ) : (
                          <>
                            {canAlterar && lancamento.status === "pendente" && (
                              <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(lancamento.id!, lancamento.tipo === "receita" ? "recebido" : "pago")} className="h-8 w-8 p-0 text-primary" title="Confirmar pagamento/recebimento">
                                  <Check className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger><TooltipContent><p>{lancamento.tipo === "receita" ? "Confirmar recebimento" : "Confirmar pagamento"}</p></TooltipContent></Tooltip></TooltipProvider>
                            )}
                            {canAlterar && (
                              <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleOpenModal(lancamento)} className="h-8 w-8 p-0" title="Editar lançamento">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger><TooltipContent><p>Editar lançamento</p></TooltipContent></Tooltip></TooltipProvider>
                            )}
                            {canExcluir && (
                              <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteModal(lancamento.id!)} className="h-8 w-8 p-0 text-destructive" title="Excluir lançamento">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger><TooltipContent><p>Excluir lançamento</p></TooltipContent></Tooltip></TooltipProvider>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <MobilePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

        <SupportDeleteDialog
          isOpen={supportDialogOpen}
          onClose={() => setSupportDialogOpen(false)}
          onConfirm={async (motivo) => {
            if (!supportTarget) return;
            const success = await criarSolicitacao({
              tabela: "lancamentos",
              registro_id: supportTarget.id,
              registro_descricao: `Lançamento: ${supportTarget.descricao}`,
              motivo,
            });
            if (success) {
              setSupportDialogOpen(false);
              setSupportTarget(null);
            }
          }}
          onCancel={
            supportTarget && hasPendingRequest("lancamentos", supportTarget.id)
              ? async () => {
                  const reqId = getPendingRequestId("lancamentos", supportTarget.id);
                  if (!reqId) return false;
                  const success = await cancelarSolicitacao(reqId);
                  if (success) {
                    setSupportDialogOpen(false);
                    setSupportTarget(null);
                  }
                  return success;
                }
              : undefined
          }
          recordName={supportTarget?.descricao || ""}
          isPending={supportTarget ? hasPendingRequest("lancamentos", supportTarget.id) : false}
        />
      </div>
    </div>
  );
};
