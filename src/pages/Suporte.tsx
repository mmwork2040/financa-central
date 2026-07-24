
import React, { useState, useEffect } from "react";
import { HelpCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/common/PageHeader";
import SupportFAQ from "@/components/suporte/SupportFAQ";
import ChatwootWidget from "@/components/suporte/ChatwootWidget";
import SupportAIChat from "@/components/suporte/SupportAIChat";

const Suporte = () => {
  const { empresaId } = useAuth();
  const [chatwootConfig, setChatwootConfig] = useState<{ baseUrl: string; websiteToken: string } | null>(null);
  const [aiActive, setAiActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresaId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [{ data: chat }, { data: ai }] = await Promise.all([
          supabase
            .from("integracoes")
            .select("api_key_encrypted, api_secret_encrypted, ativo")
            .eq("empresa_id", empresaId)
            .eq("plataforma", "chatwoot")
            .eq("ativo", true)
            .maybeSingle(),
          (supabase as any)
            .from("ai_global_config")
            .select("provider, api_key, ativo")
            .eq("ativo", true)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (chat?.api_key_encrypted && chat?.api_secret_encrypted) {
          setChatwootConfig({ baseUrl: chat.api_key_encrypted, websiteToken: chat.api_secret_encrypted });
        } else {
          setChatwootConfig(null);
        }
        setAiActive(!!(ai && ai.provider && ai.api_key));
      } catch (err) {
        console.error("Erro ao carregar config de suporte:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [empresaId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Ajuda"
        description="Encontre respostas para dúvidas frequentes ou fale com nosso suporte."
        icon={HelpCircle}
      />
      <SupportFAQ />
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : chatwootConfig ? (
        <ChatwootWidget config={chatwootConfig} loading={false} />
      ) : aiActive ? (
        <SupportAIChat />
      ) : null}
    </div>
  );
};

export default Suporte;
