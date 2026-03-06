import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CreditCard } from "lucide-react";
import { CartaoCredito } from "@/hooks/useCartoesCredito";
import { formatCurrency } from "@/utils/formatters";

interface Props {
  cartoes: CartaoCredito[];
  onEdit: (cartao: CartaoCredito) => void;
  onDelete: (id: string) => void;
}

export const CartoesCreditoTable: React.FC<Props> = ({ cartoes, onEdit, onDelete }) => {
  if (cartoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CreditCard size={48} className="mb-4 opacity-30" />
        <p className="text-lg font-medium">Nenhum cartão cadastrado</p>
        <p className="text-sm">Cadastre seu primeiro cartão de crédito para começar</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cartão</TableHead>
            <TableHead>Bandeira</TableHead>
            <TableHead className="text-center">Fechamento</TableHead>
            <TableHead className="text-center">Vencimento</TableHead>
            <TableHead className="text-right">Limite</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cartoes.map((cartao) => (
            <TableRow key={cartao.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  {cartao.nome}
                  {cartao.ultimos_digitos && (
                    <span className="text-xs text-muted-foreground">
                      •••• {cartao.ultimos_digitos}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{cartao.bandeira || "—"}</TableCell>
              <TableCell className="text-center">Dia {cartao.dia_fechamento}</TableCell>
              <TableCell className="text-center">Dia {cartao.dia_vencimento}</TableCell>
              <TableCell className="text-right">{cartao.limite ? formatCurrency(cartao.limite) : "—"}</TableCell>
              <TableCell className="text-center">
                <Badge variant={cartao.ativo ? "default" : "secondary"}>
                  {cartao.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(cartao)}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(cartao.id)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
