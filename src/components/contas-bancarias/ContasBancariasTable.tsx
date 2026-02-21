
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTableHead from "@/components/common/SortableTableHead";

export interface ContaBancaria {
  id: string;
  nome: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  saldo_inicial: number | null;
  saldo_atual: number | null;
  created_at: string;
  updated_at: string;
}

interface ContasBancariasTableProps {
  contasBancarias: ContaBancaria[];
  onEdit: (conta: ContaBancaria) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ContasBancariasTable: React.FC<ContasBancariasTableProps> = ({
  contasBancarias, onEdit, onDelete, canEdit = true, canDelete = true,
}) => {
  const showActions = canEdit || canDelete;
  const isMobile = useIsMobile();
  const { visible } = useValuesVisibility();
  const { sortedItems, sortKey, sortDir, toggleSort } = useTableSort(contasBancarias);
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(sortedItems);
  const displayCurrency = (val: number) => visible ? formatCurrency(val) : "••••••";

  if (isMobile) {
    return (
      <div className="space-y-3">
        {paginatedItems.map((conta) => (
          <Card key={conta.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{conta.nome}</p>
                  {conta.banco && <p className="text-xs text-muted-foreground">{conta.banco}</p>}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {conta.agencia && <span>Ag: {conta.agencia}</span>}
                    {conta.conta && <span>Cc: {conta.conta}</span>}
                  </div>
                  <div className="flex gap-4 pt-1">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Saldo Inicial</p>
                      <p className="text-xs font-medium">{displayCurrency(conta.saldo_inicial || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Saldo Atual</p>
                      <p className={`text-xs font-medium ${(conta.saldo_atual || 0) < 0 ? 'text-destructive' : 'text-primary'}`}>
                        {displayCurrency(conta.saldo_atual || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                {showActions && (
                  <div className="flex gap-1 ml-2">
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(conta)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(conta.id)} className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        <MobilePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead label="Nome" sortKey="nome" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
            <SortableTableHead label="Banco" sortKey="banco" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
            <SortableTableHead label="Agência" sortKey="agencia" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
            <SortableTableHead label="Conta" sortKey="conta" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
            <SortableTableHead label="Saldo Inicial" sortKey="saldo_inicial" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} className="text-right" />
            <SortableTableHead label="Saldo Atual" sortKey="saldo_atual" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} className="text-right" />
            {showActions && <TableHead className="w-[100px] text-center">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((conta) => (
            <TableRow key={conta.id}>
              <TableCell className="font-medium">{conta.nome}</TableCell>
              <TableCell>{conta.banco || '-'}</TableCell>
              <TableCell>{conta.agencia || '-'}</TableCell>
              <TableCell>{conta.conta || '-'}</TableCell>
              <TableCell className="text-right">{displayCurrency(conta.saldo_inicial || 0)}</TableCell>
              <TableCell className={`text-right font-medium ${(conta.saldo_atual || 0) < 0 ? 'text-destructive' : 'text-primary'}`}>
                {displayCurrency(conta.saldo_atual || 0)}
              </TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex justify-center space-x-2">
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(conta)} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => onDelete(conta.id)} className="h-8 w-8 p-0 text-destructive">
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

export default ContasBancariasTable;
