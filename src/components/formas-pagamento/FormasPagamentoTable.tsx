
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { FormaPagamento } from "@/hooks/useFormasPagamento";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTableHead from "@/components/common/SortableTableHead";

interface FormasPagamentoTableProps {
  formasPagamento: FormaPagamento[];
  onEdit: (forma: FormaPagamento) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const FormasPagamentoTable: React.FC<FormasPagamentoTableProps> = ({
  formasPagamento, onEdit, onDelete, canEdit = true, canDelete = true,
}) => {
  const showActions = canEdit || canDelete;
  const isMobile = useIsMobile();
  const { sortedItems, sortKey, sortDir, toggleSort } = useTableSort(formasPagamento);
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(sortedItems);

  if (isMobile) {
    return (
      <div className="space-y-3 glass-surface rounded-2xl p-3">
        {paginatedItems.map((forma) => (
          <Card key={forma.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <p className="font-medium text-foreground">{forma.descricao}</p>
              {showActions && (
                <div className="flex gap-1">
                  {canEdit && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(forma)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(forma.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
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
            <SortableTableHead label="Descrição" sortKey="descricao" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
            {showActions && <TableHead className="w-[100px] text-center">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((forma) => (
            <TableRow key={forma.id}>
              <TableCell>{forma.descricao}</TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex justify-center space-x-2">
                    {canEdit && (
                      <Button size="icon" variant="ghost" onClick={() => onEdit(forma)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="icon" variant="ghost" onClick={() => onDelete(forma.id)} className="h-8 w-8 text-destructive">
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
  );
};

export default FormasPagamentoTable;
