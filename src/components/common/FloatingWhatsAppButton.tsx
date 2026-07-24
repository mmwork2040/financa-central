import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatUrls } from "@/hooks/useChatUrls";
import { useAuth } from "@/contexts/AuthContext";
import { buildWhatsAppPhoneUrl, DEFAULT_WHATSAPP_PRE_MESSAGE, normalizeWhatsAppUrl } from "@/utils/whatsapp";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.214-.515.295-1.176.295-1.724 0-.244-.143-.36-.345-.476-.302-.16-1.404-.732-1.704-.732zM16.045 24.6c-2.052 0-4.06-.65-5.722-1.85l-3.996 1.275 1.302-3.9c-1.343-1.74-2.06-3.87-2.06-6.064 0-5.764 4.713-10.448 10.476-10.448a10.42 10.42 0 0 1 7.41 3.067c1.98 1.97 3.066 4.585 3.066 7.382C26.521 19.926 21.83 24.6 16.045 24.6zm0-22.86C9.097 1.74 3.45 7.39 3.45 14.32a12.5 12.5 0 0 0 1.687 6.3l-1.97 5.84c-.072.215.13.43.345.358l5.96-1.892c1.85.946 3.91 1.447 5.98 1.447 6.97 0 12.6-5.654 12.6-12.6 0-6.948-5.65-12.6-12.6-12.6z"/>
  </svg>
);

const STORAGE_KEY = "floating-wa-position";
const BUTTON_SIZE = 64;
const MARGIN = 8;

type Pos = { x: number; y: number };

const loadPos = (): Pos | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.x === "number" && typeof p?.y === "number") return p;
  } catch {}
  return null;
};

const clampPos = (p: Pos): Pos => {
  const maxX = window.innerWidth - BUTTON_SIZE - MARGIN;
  const maxY = window.innerHeight - BUTTON_SIZE - MARGIN;
  return {
    x: Math.min(Math.max(MARGIN, p.x), Math.max(MARGIN, maxX)),
    y: Math.min(Math.max(MARGIN, p.y), Math.max(MARGIN, maxY)),
  };
};

const defaultPos = (): Pos => ({
  x: window.innerWidth - BUTTON_SIZE - 32,
  y: window.innerHeight - BUTTON_SIZE - (window.innerWidth < 768 ? 96 : 32),
});

const FloatingWhatsAppButton: React.FC = () => {
  const { chatLancamentosUrl, chatLancamentosMensagem } = useChatUrls();
  const { userProfile } = useAuth();
  const preMessage = chatLancamentosMensagem || DEFAULT_WHATSAPP_PRE_MESSAGE;

  const phoneFallback = buildWhatsAppPhoneUrl(userProfile?.evolution_webhook_url, preMessage);
  const baseUrl = chatLancamentosUrl || phoneFallback;

  const [pos, setPos] = useState<Pos | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setPos(clampPos(loadPos() || defaultPos()));
    const onResize = () => setPos((p) => (p ? clampPos(p) : defaultPos()));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!pos) return;
    (e.currentTarget as HTMLAnchorElement).setPointerCapture(e.pointerId);
    draggingRef.current = true;
    movedRef.current = false;
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!draggingRef.current) return;
    const nx = e.clientX - offsetRef.current.x;
    const ny = e.clientY - offsetRef.current.y;
    if (!movedRef.current && (Math.abs(e.movementX) + Math.abs(e.movementY) > 2)) {
      movedRef.current = true;
    }
    setPos(clampPos({ x: nx, y: ny }));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try { (e.currentTarget as HTMLAnchorElement).releasePointerCapture(e.pointerId); } catch {}
    if (movedRef.current && pos) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    }
  };

  const onClick = (e: React.MouseEvent) => {
    if (movedRef.current) {
      e.preventDefault();
      movedRef.current = false;
    }
  };

  if (!baseUrl || !pos) return null;
  const finalUrl = normalizeWhatsAppUrl(baseUrl, preMessage);

  const content = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Lançar via WhatsApp (arraste para mover)"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={onClick}
            style={{ left: pos.x, top: pos.y, touchAction: "none" }}
            className="fixed z-[9999] h-16 w-16 rounded-full shadow-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white hover:scale-110 transition-transform flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          >
            <WhatsAppIcon className="h-10 w-10 pointer-events-none" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Lançar via WhatsApp — arraste para mover</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
};

export default FloatingWhatsAppButton;
