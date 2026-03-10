import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useChatUrls = () => {
  const { empresaId } = useAuth();
  const [chatLancamentosUrl, setChatLancamentosUrl] = useState<string | null>(null);
  const [chatVendasUrl, setChatVendasUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("empresas")
        .select("chat_lancamentos_url, chat_vendas_url")
        .eq("id", empresaId)
        .single();
      if (data) {
        setChatLancamentosUrl(data.chat_lancamentos_url || null);
        setChatVendasUrl(data.chat_vendas_url || null);
      }
    })();
  }, [empresaId]);

  return { chatLancamentosUrl, chatVendasUrl };
};
