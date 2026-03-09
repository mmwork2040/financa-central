
import React, { useState, useRef, useEffect, useCallback } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Send, Loader2, MessageCircle, Bot, User, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/common/PageHeader";
import SupportFAQ from "@/components/suporte/SupportFAQ";
import SupportChat from "@/components/suporte/SupportChat";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const Suporte = () => {
  const { empresaId, user, userProfile } = useAuth();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Track if user is on this page for notification logic
  const isOnSuportePage = location.pathname === "/suporte";

  // Load or create conversa when chat opens
  const loadOrCreateConversa = useCallback(async () => {
    if (!empresaId || !user?.id) return;
    setLoadingHistory(true);
    try {
      // Try to find existing open conversa
      const { data: existing } = await supabase
        .from("conversas_chat")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("user_id", user.id)
        .eq("status", "aberta")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        setConversaId(existing.id);
        // Load messages
        const { data: msgs } = await supabase
          .from("mensagens_chat")
          .select("*")
          .eq("conversa_id", existing.id)
          .order("created_at", { ascending: true });

        if (msgs) {
          setMessages(msgs.map(m => ({
            id: m.id,
            role: m.remetente === "usuario" ? "user" : "assistant",
            content: m.conteudo,
            timestamp: new Date(m.created_at),
          })));
        }
      } else {
        // Create new conversa
        const { data: nova, error } = await supabase
          .from("conversas_chat")
          .insert({ empresa_id: empresaId, user_id: user.id, status: "aberta" })
          .select("id")
          .single();

        if (error) throw error;
        if (nova) setConversaId(nova.id);
        setMessages([]);
      }
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [empresaId, user?.id]);

  useEffect(() => {
    if (chatOpen) {
      loadOrCreateConversa();
    }
  }, [chatOpen, loadOrCreateConversa]);

  const saveMessage = async (content: string, remetente: "usuario" | "suporte") => {
    if (!conversaId) return;
    await supabase.from("mensagens_chat").insert({
      conversa_id: conversaId,
      conteudo: content,
      remetente,
    });
  };

  const handleSendMessage = async (text: string) => {
    if (!text || !empresaId) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    await saveMessage(text, "usuario");

    try {
      const { data, error } = await supabase.functions.invoke("fire-webhook", {
        body: {
          empresa_id: empresaId,
          evento: "Suporte Técnico",
          descricao: text,
          mensagem: text,
          usuario: {
            id: user?.id || "",
            nome: userProfile?.nome || "",
            email: userProfile?.email || "",
            telefone: (userProfile as any)?.evolution_webhook_url || "",
            telegram_id: (userProfile as any)?.telegram_id || "",
          },
          acao: "suporte_chat",
        },
      });

      if (error) throw error;

      const fired = data?.webhooks_fired || 0;
      let resposta = "";

      if (fired > 0) {
        const result = data.results?.[0];
        resposta = result?.campo_resposta_value || result?.response?.resultado || "";
        if (typeof resposta === "object") resposta = JSON.stringify(resposta);
      }

      if (!resposta) {
        resposta = "Sua mensagem foi recebida pelo suporte. Em breve entraremos em contato.";
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: resposta,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      await saveMessage(resposta, "suporte");

      return true;
    } catch (err) {
      toast.error("Erro ao enviar mensagem ao suporte");
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Desculpe, houve um erro ao processar sua mensagem. Tente novamente em alguns instantes.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      await saveMessage(errorMsg.content, "suporte");
      return false;
    }
  };

  const handleClearChat = async () => {
    if (!conversaId) return;
    try {
      // Delete messages
      await supabase.from("mensagens_chat").delete().eq("conversa_id", conversaId);
      // Close conversa
      await supabase.from("conversas_chat").update({ status: "encerrada" }).eq("id", conversaId);
      // Create new conversa
      setMessages([]);
      setConversaId(null);
      const { data: nova } = await supabase
        .from("conversas_chat")
        .insert({ empresa_id: empresaId!, user_id: user!.id, status: "aberta" })
        .select("id")
        .single();
      if (nova) setConversaId(nova.id);
      toast.success("Conversa limpa com sucesso");
    } catch {
      toast.error("Erro ao limpar conversa");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Ajuda"
        description="Encontre respostas para dúvidas frequentes ou fale com nosso suporte."
        icon={HelpCircle}
      />
      <SupportFAQ />
      <SupportChat
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        messages={messages}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        loadingHistory={loadingHistory}
      />
    </div>
  );
};

export default Suporte;
