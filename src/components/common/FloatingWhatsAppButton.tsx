import React from "react";
import { createPortal } from "react-dom";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatUrls } from "@/hooks/useChatUrls";

const PRE_MESSAGE = "Faça os lançamentos pelo Whatsapp";

const buildWhatsAppUrl = (url: string, message: string): string => {
  try {
    const u = new URL(url);
    const isWa = /(^|\.)wa\.me$/i.test(u.hostname) || /(^|\.)whatsapp\.com$/i.test(u.hostname);
    if (isWa) {
      u.searchParams.set("text", message);
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
};

const FloatingWhatsAppButton: React.FC = () => {
  const { chatLancamentosUrl } = useChatUrls();

  if (!chatLancamentosUrl) return null;

  const finalUrl = buildWhatsAppUrl(chatLancamentosUrl, PRE_MESSAGE);

  const content = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => window.open(finalUrl, "_blank")}
            className="fixed bottom-36 md:bottom-24 right-4 md:right-6 z-[9999] h-14 w-14 rounded-full shadow-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white"
            size="icon"
            aria-label="Lançar via WhatsApp"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
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
