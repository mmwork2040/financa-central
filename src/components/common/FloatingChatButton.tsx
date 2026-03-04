
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const TELEGRAM_URL = "https://t.me/meu_agente_financeiro_bot";

const FloatingChatButton: React.FC = () => {
  const { user } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);

  // Show tooltip popup on first visit (once per session)
  useEffect(() => {
    if (!user) return;
    const key = `chat_tooltip_shown_${user.id}`;
    const alreadyShown = sessionStorage.getItem(key);
    if (!alreadyShown) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        sessionStorage.setItem(key, "true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!user) return null;

  const content = (
    <>
      <Button
        onClick={() => window.open(TELEGRAM_URL, "_blank")}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[9999] h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90"
        size="icon"
        style={{ position: 'fixed', right: '1rem' }}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Tooltip popup */}
      {showTooltip && (
        <div
          className="fixed bottom-36 md:bottom-[5.5rem] right-4 md:right-6 z-[9999] animate-fade-in pointer-events-auto"
          style={{ position: 'fixed' }}
        >
          <div
            className="bg-card border border-border shadow-2xl rounded-2xl p-4 max-w-[280px] cursor-pointer group hover:shadow-primary/10 transition-shadow relative"
            onClick={() => { setShowTooltip(false); window.open(TELEGRAM_URL, "_blank"); }}
          >
            <button
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-snug">Assistente Inteligente</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Você pode fazer lançamentos e controlar relatórios pelo seu assistente inteligente, <span className="text-primary font-medium">clique aqui para acessar</span>.
                </p>
              </div>
            </div>
            {/* Arrow pointing down to the button */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card border-r border-b border-border rotate-45" />
          </div>
        </div>
      )}
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
};

export default FloatingChatButton;
