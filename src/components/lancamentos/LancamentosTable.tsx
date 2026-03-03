
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Check, Lock, Clock, Pencil, Trash2, Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

  // Check if there's an active "Excluir Registro" webhook
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
    getStatusBadgeClass, getStatusLabel, getTipoBadgeClass
  } = useLancamentosContext();

  const lancamentos = lancamentosOverride || contextLancamentos;
  const showActions = canAlterar || canExcluir;
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(lancamentos);

  if (isMobile) {
    return (
      <div className="space-y-3 overflow-hidden glass-surface rounded-2xl p-3">
        {paginatedItems.map((l) => (
          <Card key={l.id} className={hasPendingRequest("lancamentos", l.id!) ? "border-l-4 border-l-destructive bg-destructive/5" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {l.descricao}
                    {(l as any)._virtual && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-700">Previsto</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getTipoBadgeClass(l.tipo)}`}>
                      {l.tipo === "receita" ? "Receita" : l.tipo === "investimento" ? "Investimento" : "Despesa"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadgeClass(l.status)}`}>
                      {getStatusLabel(l.status, l.tipo)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registro: {new Date(l.created_at).toLocaleDateString()} {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · '}Venc: {new Date(l.data_vencimento).toLocaleDateString()}
                    {l.categoria?.nome ? ` · ${l.categoria.nome}` : ''}
                  </p>
                  {(l.fornecedor || l.cliente) && (
                    <p className="text-xs text-muted-foreground">
                      {l.fornecedor ? `Forn: ${l.fornecedor.nome}` : `Cli: ${l.cliente?.nome}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <p className={`text-sm font-semibold ${l.tipo === "receita" ? "text-primary" : l.tipo === "investimento" ? "text-accent-foreground" : "text-destructive"}`}>
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
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleOpenDeleteModal(l.id!)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger><TooltipContent><p>Excluir diretamente</p></TooltipContent></Tooltip></TooltipProvider>
                              {hasActiveDeleteWebhook && (
                                <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" onClick={() => {
                                    setSupportTarget({ id: l.id!, descricao: l.descricao });
                                    setSupportDialogOpen(true);
                                  }}>
                                    <Send className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger><TooltipContent><p>Solicitar exclusão via webhook</p></TooltipContent></Tooltip></TooltipProvider>
                              )}
                            </>
                          ) : canExcluir && hasActiveDeleteWebhook ? (
                            hasPendingRequest("lancamentos", l.id!) ? (
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><Clock className="h-3.5 w-3.5 text-amber-500" /></TooltipTrigger><TooltipContent><p>Exclusão solicitada – aguardando suporte</p></TooltipContent></Tooltip></TooltipProvider>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                                setSupportTarget({ id: l.id!, descricao: l.descricao });
                                setSupportDialogOpen(true);
                              }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )
                          ) : null}
                        </div>
                      ) : (
                        <>
                          {canAlterar && l.status === "pendente" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary"
                              onClick={() => handleUpdateStatus(l.id!, l.tipo === "receita" ? "recebido" : "pago")}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canAlterar && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenModal(l)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canExcluir && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleOpenDeleteModal(l.id!)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <MobilePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
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
          {paginatedItems.map((lancamento) => (
            <TableRow key={lancamento.id} className={hasPendingRequest("lancamentos", lancamento.id!) ? "bg-destructive/5 border-l-4 border-l-destructive" : ""}>
              <TableCell>
                <div className="leading-tight">
                  <span>{new Date(lancamento.created_at).toLocaleDateString()}</span>
                  <span className="block text-[10px] text-muted-foreground">{new Date(lancamento.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {lancamento.descricao}
                {(lancamento as any)._virtual && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-700">Previsto</span>
                )}
                <div className="text-xs text-muted-foreground">
                  {lancamento.fornecedor ? `Fornecedor: ${lancamento.fornecedor.nome}` : 
                    lancamento.cliente ? `Cliente: ${lancamento.cliente.nome}` : ''}
                </div>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoBadgeClass(lancamento.tipo)}`}>
                  {lancamento.tipo === "receita" ? "Receita" : lancamento.tipo === "investimento" ? "Investimento" : "Despesa"}
                </span>
              </TableCell>
              <TableCell>{lancamento.categoria?.nome || '-'}</TableCell>
              <TableCell className={`font-medium ${lancamento.tipo === "receita" ? "text-primary" : lancamento.tipo === "investimento" ? "text-accent-foreground" : "text-destructive"}`}>
                {displayCurrency(lancamento.valor)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(lancamento.status)}`}>
                    {getStatusLabel(lancamento.status, lancamento.tipo)}
                  </span>
                  {(lancamento.status === 'pago' || lancamento.status === 'recebido') ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-primary/10 text-primary">✓ Executado</span>
                  ) : lancamento.status === 'pendente' ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-700">🕐 Previsto</span>
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
                              <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteModal(lancamento.id!)} className="h-8 w-8 p-0 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger><TooltipContent><p>Excluir diretamente</p></TooltipContent></Tooltip></TooltipProvider>
                            {hasActiveDeleteWebhook && (
                              <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setSupportTarget({ id: lancamento.id!, descricao: lancamento.descricao });
                                  setSupportDialogOpen(true);
                                }} className="h-8 w-8 p-0 text-amber-600">
                                  <Send className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger><TooltipContent><p>Solicitar exclusão via webhook</p></TooltipContent></Tooltip></TooltipProvider>
                            )}
                          </>
                        ) : canExcluir && hasActiveDeleteWebhook ? (
                          hasPendingRequest("lancamentos", lancamento.id!) ? (
                            <TooltipProvider><Tooltip><TooltipTrigger asChild><Clock className="h-4 w-4 text-amber-500" /></TooltipTrigger><TooltipContent><p>Exclusão solicitada – aguardando suporte</p></TooltipContent></Tooltip></TooltipProvider>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSupportTarget({ id: lancamento.id!, descricao: lancamento.descricao });
                              setSupportDialogOpen(true);
                            }} className="h-8 w-8 p-0 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )
                        ) : null}
                      </div>
                    ) : (
                      <>
                        {canAlterar && lancamento.status === "pendente" && (
                          <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(lancamento.id!, lancamento.tipo === "receita" ? "recebido" : "pago")} className="h-8 w-8 p-0 text-primary">
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {canAlterar && (
                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(lancamento)} className="h-8 w-8 p-0">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canExcluir && (
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteModal(lancamento.id!)} className="h-8 w-8 p-0 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
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
  );
};
