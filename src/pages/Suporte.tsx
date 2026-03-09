
import React, { useState, useEffect, useCallback } from "react";
import { HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/common/PageHeader";
import SupportFAQ from "@/components/suporte/SupportFAQ";
import ChatwootWidget from "@/components/suporte/ChatwootWidget";

const Suporte = () => {
  const { empresaId } = useAuth();
  const [chatwootConfig, setChatwootConfig] = useState<{ baseUrl: string; websiteToken: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresaId) return;
    const loadConfig = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("integracoes")
          .select("api_key_encrypted, api_secret_encrypted, ativo")
          .eq("empresa_id", empresaId)
          .eq("plataforma", "chatwoot")
          .eq("ativo", true)
          .maybeSingle();

        if (data?.api_key_encrypted && data?.api_secret_encrypted) {
          setChatwootConfig({
            baseUrl: data.api_key_encrypted,
            websiteToken: data.api_secret_encrypted,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar config Chatwoot:", err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [empresaId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Ajuda"
        description="Encontre respostas para dúvidas frequentes ou fale com nosso suporte."
        icon={HelpCircle}
      />
      <SupportFAQ />
      <ChatwootWidget config={chatwootConfig} loading={loading} />
    </div>
  );
};

export default Suporte;
