
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Lock } from "lucide-react";
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

interface ClientesTableProps {
  clientes: Cliente[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ClientesTable: React.FC<ClientesTableProps> = ({
  clientes, onEdit, onDelete, canEdit = true, canDelete = true,
}) => {
  const showActions = canEdit || canDelete;
  const isMobile = useIsMobile();
  const { sortedItems, sortKey, sortDir, toggleSort } = useTableSort(clientes);
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(sortedItems);

  if (isMobile) {
    return (
      <div className="space-y-3">
        {paginatedItems.map((c) => (
          <Card key={c.id}>
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
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Lock className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Cliente cadastrado automaticamente via integração</p></TooltipContent></Tooltip></TooltipProvider>
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
              {showActions && <TableHead className="w-20 text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((cliente) => (
              <TableRow key={cliente.id}>
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
                  <TableCell className="text-right">
                    {cliente.origem === 'integracao' ? (
                      <div className="flex justify-end">
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Lock className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Cliente cadastrado automaticamente via integração</p></TooltipContent></Tooltip></TooltipProvider>
                      </div>
                    ) : (
                      <div className="flex justify-end items-center gap-2">
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
