import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/format";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Projeto } from "@/hooks/useProjetos";

interface Props {
  projetos: Projeto[];
  onEdit: (p: Projeto) => void;
  onDelete: (p: Projeto) => void;
}

type ProjetoSummary = { projeto_id: string; receitas: number; despesas: number };

export const ProjetosTable = ({ projetos, onEdit, onDelete }: Props) => {
  const { visible } = useValuesVisibility();
  const { canPerformAction } = useAuth();
  const canAlterar = canPerformAction("projetos", "pode_alterar");
  const canExcluir = canPerformAction("projetos", "pode_excluir");
  const [summaries, setSummaries] = useState<Record<string, ProjetoSummary>>({});

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
    if (s === "ativo") return "bg-green-100 text-green-800";
    if (s === "concluido") return "bg-blue-100 text-blue-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Orçamento</TableHead>
            <TableHead>Receitas</TableHead>
            <TableHead>Despesas</TableHead>
            <TableHead>Saldo</TableHead>
            {(canAlterar || canExcluir) && <TableHead className="w-[100px] text-center">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projetos.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhum projeto cadastrado
              </TableCell>
            </TableRow>
          )}
          {projetos.map((p) => {
            const s = summaries[p.id] || { receitas: 0, despesas: 0 };
            const saldo = s.receitas - s.despesas;
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium">{p.nome}</div>
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
                {(canAlterar || canExcluir) && (
                  <TableCell>
                    <div className="flex justify-center gap-1">
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
  );
};
