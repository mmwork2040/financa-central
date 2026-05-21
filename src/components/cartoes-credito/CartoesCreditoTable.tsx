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
    <>
      {/* Desktop */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
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

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {cartoes.map((cartao) => (
          <div key={cartao.id} className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CreditCard size={18} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{cartao.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {cartao.bandeira || "—"}
                    {cartao.ultimos_digitos && <> • •••• {cartao.ultimos_digitos}</>}
                  </div>
                </div>
              </div>
              <Badge variant={cartao.ativo ? "default" : "secondary"} className="shrink-0">
                {cartao.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Fechamento</div>
                <div className="font-medium">Dia {cartao.dia_fechamento}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Vencimento</div>
                <div className="font-medium">Dia {cartao.dia_vencimento}</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground">Limite</div>
                <div className="font-medium">{cartao.limite ? formatCurrency(cartao.limite) : "—"}</div>
              </div>
            </div>
            <div className="flex justify-end gap-1 border-t pt-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(cartao)}>
                <Pencil size={14} className="mr-1" /> Editar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(cartao.id)} className="text-destructive">
                <Trash2 size={14} className="mr-1" /> Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
