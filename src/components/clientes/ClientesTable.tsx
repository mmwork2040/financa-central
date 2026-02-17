
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCPFOrCNPJ, formatPhone } from "@/utils/format";
import { type Cliente } from "@/hooks/useClientes";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";

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
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(clientes);

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
              <TableHead>Nome</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              {showActions && <TableHead className="w-20 text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
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
