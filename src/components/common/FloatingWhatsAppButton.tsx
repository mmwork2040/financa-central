import React from "react";
import { createPortal } from "react-dom";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatUrls } from "@/hooks/useChatUrls";
import { useAuth } from "@/contexts/AuthContext";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.214-.515.295-1.176.295-1.724 0-.244-.143-.36-.345-.476-.302-.16-1.404-.732-1.704-.732zM16.045 24.6c-2.052 0-4.06-.65-5.722-1.85l-3.996 1.275 1.302-3.9c-1.343-1.74-2.06-3.87-2.06-6.064 0-5.764 4.713-10.448 10.476-10.448a10.42 10.42 0 0 1 7.41 3.067c1.98 1.97 3.066 4.585 3.066 7.382C26.521 19.926 21.83 24.6 16.045 24.6zm0-22.86C9.097 1.74 3.45 7.39 3.45 14.32a12.5 12.5 0 0 0 1.687 6.3l-1.97 5.84c-.072.215.13.43.345.358l5.96-1.892c1.85.946 3.91 1.447 5.98 1.447 6.97 0 12.6-5.654 12.6-12.6 0-6.948-5.65-12.6-12.6-12.6z"/>
  </svg>
);


const DEFAULT_PRE_MESSAGE = "Faça os lançamentos pelo Whatsapp";

const buildWhatsAppUrl = (url: string, message: string): string => {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const isWa = /(^|\.)wa\.me$/.test(host) || /(^|\.)whatsapp\.com$/.test(host);
    if (!isWa) return url;

    // Normaliza api.whatsapp.com/send?phone=XXX para wa.me/XXX (evita "Recusado" em desktop/apps)
    if (host === "api.whatsapp.com" || host === "web.whatsapp.com") {
      const phone = (u.searchParams.get("phone") || "").replace(/\D/g, "");
      if (phone) {
        const wa = new URL(`https://wa.me/${phone}`);
        wa.searchParams.set("text", message);
        return wa.toString();
      }
    }

    u.searchParams.set("text", message);
    return u.toString();
  } catch {
    return url;
  }
};

const FloatingWhatsAppButton: React.FC = () => {
  const { chatLancamentosUrl, chatLancamentosMensagem } = useChatUrls();
  const { userProfile } = useAuth();

  const phoneFallback = (() => {
    const raw = userProfile?.evolution_webhook_url;
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, "");
    if (digits.length < 10) return null;
    const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
    return `https://wa.me/${withCountry}`;
  })();

  const baseUrl = chatLancamentosUrl || phoneFallback;
  if (!baseUrl) return null;

  const finalUrl = buildWhatsAppUrl(baseUrl, chatLancamentosMensagem || DEFAULT_PRE_MESSAGE);

  const content = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Lançar via WhatsApp"
            className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[9999] h-16 w-16 rounded-full shadow-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white hover:scale-110 transition-transform flex items-center justify-center"
          >
            <WhatsAppIcon className="h-10 w-10" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Lançar via WhatsApp</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
};

export default FloatingWhatsAppButton;
