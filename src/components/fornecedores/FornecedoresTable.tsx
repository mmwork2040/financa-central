
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Fornecedor } from "@/types/fornecedor.types";
import { formatCPFOrCNPJ, formatPhone } from "@/utils/format";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTableHead from "@/components/common/SortableTableHead";

interface FornecedoresTableProps {
  fornecedores: Fornecedor[];
  onEdit: (fornecedor: Fornecedor) => void;
  onDelete: (fornecedor: Fornecedor) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const FornecedoresTable: React.FC<FornecedoresTableProps> = ({
  fornecedores, onEdit, onDelete, canEdit = true, canDelete = true,
}) => {
  const showActions = canEdit || canDelete;
  const isMobile = useIsMobile();
  const { sortedItems, sortKey, sortDir, toggleSort } = useTableSort(fornecedores);
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(sortedItems);

  if (isMobile) {
    return (
      <div className="space-y-3 glass-surface rounded-2xl p-3">
        {paginatedItems.map((f) => (
          <Card key={f.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{f.nome}</p>
                  {f.cpf_cnpj && <p className="text-xs text-muted-foreground">{formatCPFOrCNPJ(f.cpf_cnpj)}</p>}
                  {f.telefone && <p className="text-xs text-muted-foreground">{formatPhone(f.telefone)}</p>}
                  {f.email && <p className="text-xs text-muted-foreground truncate">{f.email}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 ml-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                    f.ativo ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {f.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  {showActions && (
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(f)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(f)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            {paginatedItems.map((fornecedor) => (
              <TableRow key={fornecedor.id}>
                <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                <TableCell>{fornecedor.cpf_cnpj ? formatCPFOrCNPJ(fornecedor.cpf_cnpj) : '-'}</TableCell>
                <TableCell>{fornecedor.telefone ? formatPhone(fornecedor.telefone) : '-'}</TableCell>
                <TableCell>{fornecedor.email || '-'}</TableCell>
                <TableCell>
                  <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                    fornecedor.ativo ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {canEdit && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(fornecedor)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(fornecedor)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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

export default FornecedoresTable;
