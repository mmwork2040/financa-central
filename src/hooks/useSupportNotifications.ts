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
          if (updated.user_id === user.id && updated.empresa_id === empresaId) {
            if (updated.status === "aprovado") {
              toast.success(`Sua solicitação de exclusão "${updated.registro_descricao}" foi aprovada pelo suporte.`);
            } else if (updated.status === "recusado") {
              toast.error(`Sua solicitação de exclusão "${updated.registro_descricao}" foi recusada pelo suporte.`);
            } else if (updated.status !== "pendente") {
              toast.info(`Sua solicitação "${updated.registro_descricao}" foi atualizada para: ${updated.status}`);
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
