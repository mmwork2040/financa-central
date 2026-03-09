
import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    chatwootSettings?: Record<string, unknown>;
    chatwootSDK?: { run: (opts: Record<string, unknown>) => void };
    $chatwoot?: { toggle: (state?: string) => void; isOpen?: boolean };
  }
}

const CHATWOOT_BASE_URL = "https://chatwoot.automatizaosv.com.br";
const CHATWOOT_TOKEN = "gpRRrveTVfWc9CdDFi9iVd7f";

const FloatingChatButton: React.FC = () => {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;

    window.chatwootSettings = {
      hideMessageBubble: false,
      position: "right",
      locale: "pt_BR",
      type: "standard",
      launcherTitle: "Suporte",
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

  return null;
};

export default FloatingChatButton;
