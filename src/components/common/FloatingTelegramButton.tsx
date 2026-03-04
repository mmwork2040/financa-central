import React from "react";
import { createPortal } from "react-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TELEGRAM_URL = "https://t.me/meu_agente_financeiro_bot";

const FloatingTelegramButton: React.FC = () => {
  const content = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => window.open(TELEGRAM_URL, "_blank")}
            className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-[9999] h-14 w-14 rounded-full shadow-xl bg-[#229ED9] hover:bg-[#1a8abf] text-white"
            size="icon"
            style={{ position: "fixed", left: "1rem" }}
          >
            <Send className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Falar com o Agente no Telegram</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
};

export default FloatingTelegramButton;
