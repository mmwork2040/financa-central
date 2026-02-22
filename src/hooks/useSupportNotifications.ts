import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useSupportNotifications = () => {
  const { user, empresaId } = useAuth();

  useEffect(() => {
    if (!user || !empresaId) return;

    const channel = supabase
      .channel("global_suporte_notifications")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "solicitacoes_suporte" },
        (payload) => {
          const updated = payload.new as any;
          if (updated.user_id === user.id && updated.empresa_id === empresaId && updated.status !== "pendente") {
            const resposta = updated.resposta ? `\n${updated.resposta}` : "";
            if (updated.status === "aprovado") {
              toast.success(`Solicitação "${updated.registro_descricao}" aprovada.${resposta}`);
            } else if (updated.status === "recusado") {
              toast.error(`Solicitação "${updated.registro_descricao}" recusada.${resposta}`);
            } else {
              toast.info(`Solicitação "${updated.registro_descricao}" atualizada para: ${updated.status}.${resposta}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, empresaId]);
};
