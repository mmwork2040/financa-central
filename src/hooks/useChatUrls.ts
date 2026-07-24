import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const CHAT_URLS_UPDATED_EVENT = "chat-urls-updated";

export const useChatUrls = () => {
  const { empresaId } = useAuth();
  const [chatLancamentosUrl, setChatLancamentosUrl] = useState<string | null>(null);
  const [chatVendasUrl, setChatVendasUrl] = useState<string | null>(null);
  const [chatLancamentosUrlGlobal, setChatLancamentosUrlGlobal] = useState<string | null>(null);
  const [chatLancamentosMensagem, setChatLancamentosMensagem] = useState<string | null>(null);
  const [chatLancamentosMensagemGlobal, setChatLancamentosMensagemGlobal] = useState<string | null>(null);

  const fetchGlobal = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke("get-global-chat-url");
      setChatLancamentosUrlGlobal(data?.url || null);
      setChatLancamentosMensagemGlobal(data?.mensagem || null);
    } catch { /* noop */ }
  }, []);

  const fetchEmpresa = useCallback(async () => {
    if (!empresaId) {
      setChatLancamentosUrl(null);
      setChatVendasUrl(null);
      setChatLancamentosMensagem(null);
      return;
    }
    const { data } = await (supabase as any)
      .from("empresas")
      .select("chat_lancamentos_url, chat_vendas_url, chat_lancamentos_mensagem")
      .eq("id", empresaId)
      .single();
    if (data) {
      setChatLancamentosUrl(data.chat_lancamentos_url || null);
      setChatVendasUrl(data.chat_vendas_url || null);
      setChatLancamentosMensagem(data.chat_lancamentos_mensagem || null);
    }
  }, [empresaId]);

  useEffect(() => { fetchGlobal(); }, [fetchGlobal]);
  useEffect(() => { fetchEmpresa(); }, [fetchEmpresa]);

  useEffect(() => {
    const onUpdate = () => { fetchGlobal(); fetchEmpresa(); };
    const onFocus = () => { fetchGlobal(); fetchEmpresa(); };
    window.addEventListener(CHAT_URLS_UPDATED_EVENT, onUpdate);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener(CHAT_URLS_UPDATED_EVENT, onUpdate);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchGlobal, fetchEmpresa]);

  return {
    chatLancamentosUrl: chatLancamentosUrl || chatLancamentosUrlGlobal,
    chatVendasUrl,
    chatLancamentosUrlGlobal,
    chatLancamentosMensagem: chatLancamentosMensagem || chatLancamentosMensagemGlobal,
    chatLancamentosMensagemGlobal,
  };
};
