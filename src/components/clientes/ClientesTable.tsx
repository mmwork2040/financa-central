
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Lock, Clock, HelpCircle, Send } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCPFOrCNPJ, formatPhone } from "@/utils/format";
import { type Cliente } from "@/hooks/useClientes";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTableHead from "@/components/common/SortableTableHead";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

interface ClientesTableProps {
  clientes: Cliente[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
  onSupportDelete?: (cliente: Cliente) => void;
  hasPendingRequest?: (id: string) => boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ClientesTable: React.FC<ClientesTableProps> = ({
  clientes, onEdit, onDelete, onSupportDelete, hasPendingRequest, canEdit = true, canDelete = true,
}) => {
  const { isSuperAdmin } = useAuth();
  const showActions = canEdit || canDelete;
  const isMobile = useIsMobile();
  const { sortedItems, sortKey, sortDir, toggleSort } = useTableSort(clientes);
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(sortedItems);

  if (isMobile) {
    return (
      <div className="space-y-3">
        {paginatedItems.map((c) => (
          <Card key={c.id} className={hasPendingRequest && hasPendingRequest(c.id) ? "border-l-4 border-l-amber-400 bg-amber-50 dark:bg-amber-950/30" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{c.nome}</p>
                  {c.cpf_cnpj && <p className="text-xs text-muted-foreground">{formatCPFOrCNPJ(c.cpf_cnpj)}</p>}
                  {c.telefone && <p className="text-xs text-muted-foreground">{formatPhone(c.telefone)}</p>}
                  {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 ml-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                    c.ativo ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  {showActions && (
                    <div className="flex gap-1">
                      {c.origem === 'integracao' ? (
                        <div className="flex items-center gap-1">
                          <TooltipProvider><Tooltip><TooltipTrigger asChild><Lock className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Registro automático – edição bloqueada</p></TooltipContent></Tooltip></TooltipProvider>
                          {isSuperAdmin && canDelete ? (
                            <>
                              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(c)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger><TooltipContent><p>Excluir diretamente</p></TooltipContent></Tooltip></TooltipProvider>
                              {onSupportDelete && (
                                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600" onClick={() => onSupportDelete(c)}>
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger><TooltipContent><p>Solicitar exclusão via webhook</p></TooltipContent></Tooltip></TooltipProvider>
                              )}
                            </>
                          ) : canDelete && hasPendingRequest && hasPendingRequest(c.id) ? (
                            <TooltipProvider><Tooltip><TooltipTrigger asChild><Clock className="h-4 w-4 text-amber-500" /></TooltipTrigger><TooltipContent><p>Exclusão solicitada – aguardando suporte</p></TooltipContent></Tooltip></TooltipProvider>
                          ) : canDelete && onSupportDelete ? (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onSupportDelete(c)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      ) : (
                        <>
                          {canEdit && (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(c)}>
                              <Trash2 className="h-4 w-4" />
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
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="Nome" sortKey="nome" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
              <SortableTableHead label="CPF/CNPJ" sortKey="cpf_cnpj" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
              <SortableTableHead label="Telefone" sortKey="telefone" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
              <SortableTableHead label="E-mail" sortKey="email" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
              <SortableTableHead label="Status" sortKey="ativo" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
              {showActions && <TableHead className="w-20 text-center">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((cliente) => (
              <TableRow key={cliente.id} className={hasPendingRequest && hasPendingRequest(cliente.id) ? "bg-amber-50 dark:bg-amber-950/30 border-l-4 border-l-amber-400" : ""}>
                <TableCell className="font-medium">{cliente.nome}</TableCell>
                <TableCell>{cliente.cpf_cnpj ? formatCPFOrCNPJ(cliente.cpf_cnpj) : '-'}</TableCell>
                <TableCell>{cliente.telefone ? formatPhone(cliente.telefone) : '-'}</TableCell>
                <TableCell>{cliente.email || '-'}</TableCell>
                <TableCell>
                  <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                    cliente.ativo ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {cliente.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                {showActions && (
                  <TableCell>
                    {cliente.origem === 'integracao' ? (
                      <div className="flex justify-center items-center gap-2">
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Lock className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Registro automático – edição bloqueada</p></TooltipContent></Tooltip></TooltipProvider>
                        {isSuperAdmin && canDelete ? (
                          <>
                            <TooltipProvider><Tooltip><TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(cliente)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger><TooltipContent><p>Excluir diretamente</p></TooltipContent></Tooltip></TooltipProvider>
                            {onSupportDelete && (
                              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600" onClick={() => onSupportDelete(cliente)}>
                                  <Send className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger><TooltipContent><p>Solicitar exclusão via webhook</p></TooltipContent></Tooltip></TooltipProvider>
                            )}
                          </>
                        ) : canDelete && hasPendingRequest && hasPendingRequest(cliente.id) ? (
                          <TooltipProvider><Tooltip><TooltipTrigger asChild><Clock className="h-4 w-4 text-amber-500" /></TooltipTrigger><TooltipContent><p>Exclusão solicitada – aguardando suporte</p></TooltipContent></Tooltip></TooltipProvider>
                        ) : canDelete && onSupportDelete ? (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onSupportDelete(cliente)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex justify-center items-center gap-2">
                        {canEdit && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(cliente)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(cliente)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientesTable;
