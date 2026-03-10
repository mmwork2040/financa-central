
import React, { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    chatwootSettings?: Record<string, unknown>;
    chatwootSDK?: { run: (opts: Record<string, unknown>) => void };
    $chatwoot?: {
      toggle: (state?: string) => void;
      isOpen?: boolean;
      setUser: (id: string, opts: Record<string, unknown>) => void;
    };
  }
}

const CHATWOOT_BASE_URL = "https://chatwoot.automatizaosv.com.br";
const CHATWOOT_TOKEN = "gpRRrveTVfWc9CdDFi9iVd7f";

const FloatingChatButton: React.FC = () => {
  const { user, userProfile } = useAuth();
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;

    window.chatwootSettings = {
      hideMessageBubble: false,
      position: "right",
      locale: "pt_BR",
      type: "standard",
      launcherTitle: "Falar com o Suporte",
    };

    const script = document.createElement("script");
    script.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded.current = true;
      window.chatwootSDK?.run({
        websiteToken: CHATWOOT_TOKEN,
        baseUrl: CHATWOOT_BASE_URL,
      });

      // Set user identity once widget is ready
      window.addEventListener("chatwoot:ready", () => {
        if (user && userProfile?.nome) {
          window.$chatwoot?.setUser(user.id, {
            name: userProfile.nome,
            email: userProfile.email || "",
            phone_number: userProfile.evolution_webhook_url || "",
          });
        }
      });
    };
    document.head.appendChild(script);

    return () => {
      const widget = document.querySelector(".woot-widget-holder");
      if (widget) widget.remove();
      const bubble = document.querySelector(".woot--bubble-holder");
      if (bubble) bubble.remove();
      script.remove();
      scriptLoaded.current = false;
      delete window.chatwootSettings;
      delete window.chatwootSDK;
      delete window.$chatwoot;
    };
  }, []);

  // Update user info when profile loads after widget init
  useEffect(() => {
    if (scriptLoaded.current && user && userProfile?.nome && window.$chatwoot) {
      window.$chatwoot.setUser(user.id, {
        name: userProfile.nome,
        email: userProfile.email || "",
        phone_number: userProfile.evolution_webhook_url || "",
      });
    }
  }, [user, userProfile]);

  return null;
};

export default FloatingChatButton;
