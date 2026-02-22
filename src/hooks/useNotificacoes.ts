import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notificacao {
  id: string;
  user_id: string;
  empresa_id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  tipo: string;
  referencia_id: string | null;
  created_at: string;
}

export const useNotificacoes = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotificacoes(data || []);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notificacoes_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificacoes" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotificacoes((prev) => [payload.new as Notificacao, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Notificacao;
            setNotificacoes((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setNotificacoes((prev) => prev.filter((n) => n.id !== deleted.id));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  const marcarTodasComoLidas = async () => {
    if (!user) return;
    try {
      const { error } = await (supabase as any)
        .from("notificacoes")
        .update({ lida: true })
        .eq("lida", false);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao marcar como lidas:", err);
    }
  };

  const excluirTodas = async () => {
    if (!user) return;
    try {
      const { error } = await (supabase as any)
        .from("notificacoes")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao excluir notificações:", err);
    }
  };

  const excluirNotificacao = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("notificacoes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao excluir notificação:", err);
    }
  };

  const marcarComoLida = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("notificacoes")
        .update({ lida: true })
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    }
  };

  return {
    notificacoes,
    loading,
    unreadCount,
    marcarTodasComoLidas,
    excluirTodas,
    excluirNotificacao,
    marcarComoLida,
  };
};
