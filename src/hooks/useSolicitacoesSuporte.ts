
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SolicitacaoSuporte {
  id: string;
  empresa_id: string;
  user_id: string;
  user_nome: string;
  user_email: string;
  user_telefone?: string;
  tabela: string;
  registro_id: string;
  registro_descricao: string;
  acao: string;
  status: string;
  motivo?: string;
  resposta?: string;
  created_at: string;
  updated_at: string;
}

export const useSolicitacoesSuporte = () => {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoSuporte[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, userProfile, empresaId } = useAuth();

  const fetchSolicitacoes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("solicitacoes_suporte")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar solicitações:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  // Listen for realtime updates on status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("solicitacoes_suporte_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "solicitacoes_suporte" },
        (payload) => {
          const updated = payload.new as SolicitacaoSuporte;
          if (updated.user_id === user.id && updated.status !== "pendente") {
            const statusMsg = updated.status === "aprovado"
              ? "Sua solicitação de exclusão foi aprovada pelo suporte."
              : "Sua solicitação de exclusão foi recusada pelo suporte.";
            toast.info(statusMsg);
          }
          setSolicitacoes((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const criarSolicitacao = async (params: {
    tabela: string;
    registro_id: string;
    registro_descricao: string;
    motivo?: string;
  }) => {
    if (!user || !empresaId || !userProfile) {
      toast.error("Usuário não autenticado");
      return false;
    }

    try {
      // First, fire the webhook for "Excluir Registro" and the specific table
      let webhookResult: any = null;
      try {
        const { data: whData } = await supabase.functions.invoke("fire-webhook", {
          body: {
            empresa_id: empresaId,
            evento: "Excluir Registro",
            tabela: params.tabela,
            descricao: params.registro_descricao,
            registro: params.registro_id,
            usuario: {
              id: user.id,
              nome: userProfile.nome,
              email: userProfile.email,
              telefone: userProfile.telefone || null,
            },
            acao: "exclusao",
          },
        });
        webhookResult = whData;
      } catch (webhookErr) {
        console.warn("Webhook de exclusão não disparado:", webhookErr);
      }

      // Check if any webhook was fired and returned a response
      const webhooksFired = webhookResult?.webhooks_fired || 0;
      const results = webhookResult?.results || [];

      // If a webhook was fired successfully, check the response and apply comportamento
      if (webhooksFired > 0 && results.length > 0) {
        const firstResult = results[0];
        
        if (firstResult.ok && firstResult.campo_resposta_value !== null && firstResult.campo_resposta_value !== undefined) {
          const respostaMsg = String(firstResult.campo_resposta_value);
          const respostaValue = respostaMsg.toLowerCase().trim();
          const comportamento = (firstResult.comportamento || "").toLowerCase();
          
          const isApproved = respostaValue === "aprovado" || respostaValue === "approved" || respostaValue === "true" || respostaValue === "sim" || respostaValue === "yes" || respostaValue === "1";
          const isRejected = respostaValue === "recusado" || respostaValue === "rejected" || respostaValue === "denied" || respostaValue === "false" || respostaValue === "não" || respostaValue === "nao" || respostaValue === "no" || respostaValue === "0";
          
          if (comportamento.includes("excluir") && isApproved) {
            try {
              const { error: deleteError } = await (supabase as any)
                .from(params.tabela)
                .delete()
                .eq("id", params.registro_id);
              if (deleteError) {
                toast.warning(`Webhook aprovou a exclusão, mas houve erro ao excluir: ${deleteError.message}`);
              } else {
                toast.success(respostaMsg);
                return true;
              }
            } catch (delErr: any) {
              toast.warning(`Webhook aprovou, mas erro ao excluir: ${delErr.message}`);
            }
          } else if (isRejected) {
            toast.warning(respostaMsg);
          } else {
            toast.info(respostaMsg);
          }
        } else if (firstResult.ok) {
          toast.info("Webhook de exclusão disparado com sucesso.");
        } else {
          toast.warning("Webhook disparado, mas retornou erro.");
        }
      }

      // Create the support request regardless
      const { error } = await (supabase as any)
        .from("solicitacoes_suporte")
        .insert({
          empresa_id: empresaId,
          user_id: user.id,
          user_nome: userProfile.nome,
          user_email: userProfile.email,
          user_telefone: userProfile.telefone || null,
          tabela: params.tabela,
          registro_id: params.registro_id,
          registro_descricao: params.registro_descricao,
          acao: "exclusao",
          status: "pendente",
          motivo: params.motivo || null,
        });

      if (error) throw error;

      toast.success("Solicitação de exclusão enviada ao suporte.");
      await fetchSolicitacoes();
      return true;
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar solicitação");
      return false;
    }
  };

  const hasPendingRequest = (tabela: string, registro_id: string) => {
    return solicitacoes.some(
      (s) => s.tabela === tabela && s.registro_id === registro_id && s.status === "pendente"
    );
  };

  return {
    solicitacoes,
    loading,
    fetchSolicitacoes,
    criarSolicitacao,
    hasPendingRequest,
  };
};
