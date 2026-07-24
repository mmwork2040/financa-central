
import React, { useState, useEffect } from "react";
import { HelpCircle, Loader2, ChevronDown, MessageCircleQuestion, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/common/PageHeader";
import SupportFAQ from "@/components/suporte/SupportFAQ";
import ChatwootWidget from "@/components/suporte/ChatwootWidget";
import SupportAIChat from "@/components/suporte/SupportAIChat";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const Suporte = () => {
  const { empresaId } = useAuth();
  const [chatwootConfig, setChatwootConfig] = useState<{ baseUrl: string; websiteToken: string } | null>(null);
  const [aiActive, setAiActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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
      <Collapsible open={faqOpen} onOpenChange={setFaqOpen}>
        <Card className="overflow-hidden">
          <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircleQuestion className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Perguntas Frequentes</p>
                <p className="text-xs text-muted-foreground">Respostas rápidas para dúvidas comuns</p>
              </div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", faqOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t p-4">
            <SupportFAQ />
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : chatwootConfig ? (
        <Collapsible open={chatOpen} onOpenChange={setChatOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Agente de Suporte</p>
                  <p className="text-xs text-muted-foreground">Fale diretamente com nosso suporte</p>
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", chatOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t p-4">
              <ChatwootWidget config={chatwootConfig} loading={false} />
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ) : aiActive ? (
        <Collapsible open={chatOpen} onOpenChange={setChatOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Agente de Suporte</p>
                  <p className="text-xs text-muted-foreground">Tire dúvidas rápidas sobre o sistema</p>
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", chatOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t p-4">
              <SupportAIChat />
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ) : null}
    </div>
  );
};

export default Suporte;
