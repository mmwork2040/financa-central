
import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { type Categoria } from "@/hooks/useCategorias";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";

interface CategoriasTableProps {
  categorias: Categoria[];
  onEdit: (categoria: Categoria) => void;
  onDelete: (categoria: Categoria) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const getTipoBadge = (tipo: string) => {
  const map: Record<string, { label: string; className: string }> = {
    receita: { label: "Receita", className: "bg-primary/10 text-primary" },
    investimento: { label: "Investimento", className: "bg-accent text-accent-foreground" },
    despesa: { label: "Despesa", className: "bg-destructive/10 text-destructive" },
  };
  return map[tipo] || { label: tipo, className: "bg-muted text-muted-foreground" };
};

const CategoriasTable: React.FC<CategoriasTableProps> = ({
  categorias, onEdit, onDelete, canEdit = true, canDelete = true,
}) => {
  const showActions = canEdit || canDelete;
  const isMobile = useIsMobile();
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(categorias);

  if (isMobile) {
    return (
      <div className="space-y-3">
        {paginatedItems.map((cat) => {
          const badge = getTipoBadge(cat.tipo);
          return (
            <Card key={cat.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{cat.nome}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${badge.className}`}>{badge.label}</span>
                </div>
                {showActions && (
                  <div className="flex gap-1">
                    {canEdit && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(cat)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
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
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              {showActions && <TableHead className="w-20 text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.map((categoria) => {
              const badge = getTipoBadge(categoria.tipo);
              return (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nome}</TableCell>
                  <TableCell>
                    <span className={`inline-block rounded-full px-2 py-1 text-xs ${badge.className}`}>{badge.label}</span>
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        {canEdit && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(categoria)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(categoria)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CategoriasTable;
