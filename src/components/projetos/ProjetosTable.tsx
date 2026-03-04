import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/format";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";
import type { Projeto } from "@/hooks/useProjetos";

interface Props {
  projetos: Projeto[];
  onEdit: (p: Projeto) => void;
  onDelete: (p: Projeto) => void;
}

type ProjetoSummary = { projeto_id: string; receitas: number; despesas: number };

export const ProjetosTable = ({ projetos, onEdit, onDelete }: Props) => {
  const navigate = useNavigate();
  const { visible } = useValuesVisibility();
  const { canPerformAction } = useAuth();
  const canAlterar = canPerformAction("projetos", "pode_alterar");
  const canExcluir = canPerformAction("projetos", "pode_excluir");
  const showActions = canAlterar || canExcluir;
  const isMobile = useIsMobile();
  const [summaries, setSummaries] = useState<Record<string, ProjetoSummary>>({});
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(projetos);

  useEffect(() => {
    const fetchSummaries = async () => {
      const ids = projetos.map((p) => p.id);
      if (!ids.length) return;
      const { data } = await (supabase as any)
        .from("lancamentos")
        .select("projeto_id, tipo, valor")
        .in("projeto_id", ids);

      if (!data) return;
      const map: Record<string, ProjetoSummary> = {};
      for (const row of data) {
        if (!row.projeto_id) continue;
        if (!map[row.projeto_id]) map[row.projeto_id] = { projeto_id: row.projeto_id, receitas: 0, despesas: 0 };
        if (row.tipo === "receita") map[row.projeto_id].receitas += Number(row.valor);
        else map[row.projeto_id].despesas += Number(row.valor);
      }
      setSummaries(map);
    };
    fetchSummaries();
  }, [projetos]);

  const display = (val: number) => (visible ? formatCurrency(val) : "••••••");

  const statusLabel = (s: string) => {
    if (s === "ativo") return "Ativo";
    if (s === "concluido") return "Concluído";
    return "Cancelado";
  };

  const statusClass = (s: string) => {
    if (s === "ativo") return "bg-primary/10 text-primary";
    if (s === "concluido") return "bg-blue-100 text-blue-800";
    return "bg-destructive/10 text-destructive";
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {paginatedItems.map((p) => {
          const s = summaries[p.id] || { receitas: 0, despesas: 0 };
          const saldo = s.receitas - s.despesas;
          return (
            <Card key={p.id} className="cursor-pointer" onClick={() => navigate(`/projetos/${p.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{p.nome}</p>
                    {p.descricao && (
                      <p className="text-xs text-muted-foreground truncate">{p.descricao}</p>
                    )}
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  </div>
                  {showActions && (
                    <div className="flex gap-1 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {canAlterar && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canExcluir && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Orçamento</p>
                    <p className="text-sm font-medium">{display(p.orcamento)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Receitas</p>
                    <p className="text-sm font-medium text-primary">{display(s.receitas)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Despesas</p>
                    <p className="text-sm font-medium text-destructive">{display(s.despesas)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Saldo</p>
                    <p className={`text-sm font-medium ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>
                      {display(saldo)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <MobilePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead>Receitas</TableHead>
              <TableHead>Despesas</TableHead>
              <TableHead>Saldo</TableHead>
              {showActions && <TableHead className="w-[100px] text-center">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum projeto cadastrado
                </TableCell>
              </TableRow>
            )}
            {paginatedItems.map((p) => {
              const s = summaries[p.id] || { receitas: 0, despesas: 0 };
              const saldo = s.receitas - s.despesas;
              return (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/projetos/${p.id}`)}>
                  <TableCell>
                    <div className="font-medium text-primary hover:underline">{p.nome}</div>
                    {p.descricao && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{p.descricao}</div>}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  </TableCell>
                  <TableCell>{display(p.orcamento)}</TableCell>
                  <TableCell className="text-primary">{display(s.receitas)}</TableCell>
                  <TableCell className="text-destructive">{display(s.despesas)}</TableCell>
                  <TableCell className={saldo >= 0 ? "text-primary font-medium" : "text-destructive font-medium"}>
                    {display(saldo)}
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {canAlterar && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canExcluir && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => onDelete(p)}>
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
