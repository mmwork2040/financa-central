
import React, { useEffect, useRef } from "react";
import { MessageCircle, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ChatwootWidgetProps {
  config: { baseUrl: string; websiteToken: string } | null;
  loading: boolean;
}

// Window types already declared in FloatingChatButton.tsx

const ChatwootWidget: React.FC<ChatwootWidgetProps> = ({ config, loading }) => {
  const navigate = useNavigate();
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!config || scriptLoaded.current) return;

    // Remove trailing slash
    const baseUrl = config.baseUrl.replace(/\/+$/, "");

    window.chatwootSettings = {
      hideMessageBubble: true,
      position: "right",
      locale: "pt_BR",
      type: "expanded_bubble",
      launcherTitle: "Suporte",
    };

    const script = document.createElement("script");
    script.src = `${baseUrl}/packs/js/sdk.js`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded.current = true;
      window.chatwootSDK?.run({
        websiteToken: config.websiteToken,
        baseUrl: baseUrl,
      });
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const existingWidget = document.querySelector(".woot-widget-holder");
      if (existingWidget) existingWidget.remove();
      const bubble = document.querySelector(".woot--bubble-holder");
      if (bubble) bubble.remove();
      script.remove();
      scriptLoaded.current = false;
      delete window.chatwootSettings;
      delete window.chatwootSDK;
      delete window.$chatwoot;
    };
  }, [config]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Chat com Suporte
        </h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
              <MessageCircle className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">Chat não configurado</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              O Chatwoot ainda não foi configurado. Acesse as Integrações para ativar o canal de suporte.
            </p>
            <Button variant="outline" onClick={() => navigate("/integrations")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ir para Integrações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        Chat com Suporte
      </h2>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
            <MessageCircle className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold mb-1">Suporte via Chatwoot</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            O widget de chat do Chatwoot está ativo. Clique no botão de chat no canto inferior da tela para iniciar uma conversa.
          </p>
          <Button onClick={() => window.$chatwoot?.toggle("open")}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Abrir Chat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatwootWidget;
