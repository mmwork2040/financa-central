import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, FolderKanban } from "lucide-react";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjetoResumo } from "@/components/projetos/ProjetoResumo";
import { ProjetoLancamentos } from "@/components/projetos/ProjetoLancamentos";
import { ValuesVisibilityProvider } from "@/contexts/ValuesVisibilityContext";
import type { Projeto } from "@/hooks/useProjetos";

const ProjetoDetalheContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { visible, toggle } = useValuesVisibility();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      const [projetoRes, lancRes] = await Promise.all([
        (supabase as any).from("projetos").select("*").eq("id", id).single(),
        (supabase as any).from("lancamentos").select("id, descricao, tipo, valor, status, data_vencimento, data_pagamento").eq("projeto_id", id).order("data_vencimento", { ascending: false }),
      ]);
      if (projetoRes.data) setProjeto(projetoRes.data);
      setLancamentos(lancRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const summary = useMemo(() => {
    const realizadoStatus = ["pago", "recebido"];
    const pendenteStatus = ["pendente", "aberto"];
    return {
      receitasRealizadas: lancamentos.filter(l => l.tipo === "receita" && realizadoStatus.includes(l.status)).reduce((s, l) => s + Number(l.valor), 0),
      despesasRealizadas: lancamentos.filter(l => l.tipo === "despesa" && realizadoStatus.includes(l.status)).reduce((s, l) => s + Number(l.valor), 0),
      receitasPendentes: lancamentos.filter(l => l.tipo === "receita" && pendenteStatus.includes(l.status)).reduce((s, l) => s + Number(l.valor), 0),
      despesasPendentes: lancamentos.filter(l => l.tipo === "despesa" && pendenteStatus.includes(l.status)).reduce((s, l) => s + Number(l.valor), 0),
    };
  }, [lancamentos]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/projetos")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <p className="text-muted-foreground text-center py-8">Projeto não encontrado</p>
      </div>
    );
  }

  const statusLabel = projeto.status === "ativo" ? "Ativo" : projeto.status === "concluido" ? "Concluído" : "Cancelado";
  const statusClass = projeto.status === "ativo" ? "bg-primary/10 text-primary" : projeto.status === "concluido" ? "bg-blue-100 text-blue-800" : "bg-destructive/10 text-destructive";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projetos")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FolderKanban className="h-5 w-5 text-primary shrink-0" />
          <h1 className="text-xl font-bold truncate">{projeto.nome}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusClass}`}>
            {statusLabel}
        </span>
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground shrink-0">
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{visible ? "Ocultar valores" : "Exibir valores"}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {projeto.descricao && (
        <p className="text-sm text-muted-foreground">{projeto.descricao}</p>
      )}

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="lancamentos">Lançamentos ({lancamentos.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo">
          <ProjetoResumo projeto={projeto} summary={summary} lancamentos={lancamentos} />
        </TabsContent>
        <TabsContent value="lancamentos">
          <ProjetoLancamentos lancamentos={lancamentos} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ProjetoDetalhe = () => (
  <ValuesVisibilityProvider>
    <ProjetoDetalheContent />
  </ValuesVisibilityProvider>
);

export default ProjetoDetalhe;
