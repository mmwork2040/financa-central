import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCcw } from "lucide-react";

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
const LONG_PRESS_MS = 350;
const DRAG_THRESHOLD = 6;

type Pos = { x: number; y: number };

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (("ontouchstart" in window) || (navigator.maxTouchPoints ?? 0) > 0);

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

const posEquals = (a: Pos, b: Pos) => Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;

const FloatingWhatsAppButton: React.FC = () => {
  const { chatLancamentosUrl, chatLancamentosMensagem } = useChatUrls();
  const { userProfile } = useAuth();
  const preMessage = chatLancamentosMensagem || DEFAULT_WHATSAPP_PRE_MESSAGE;

  const phoneFallback = buildWhatsAppPhoneUrl(userProfile?.evolution_webhook_url, preMessage);
  const baseUrl = chatLancamentosUrl || phoneFallback;

  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const pointerTypeRef = useRef<string>("mouse");

  useEffect(() => {
    setPos(clampPos(loadPos() || defaultPos()));
    const onResize = () => setPos((p) => (p ? clampPos(p) : defaultPos()));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const startDragging = (el: HTMLAnchorElement) => {
    draggingRef.current = true;
    setDragging(true);
    // haptic feedback on mobile
    if (pointerTypeRef.current === "touch" && "vibrate" in navigator) {
      try { (navigator as any).vibrate?.(15); } catch {}
    }
    // prevent link click after a drag gesture
    movedRef.current = true;
    try { el.style.touchAction = "none"; } catch {}
  };

  const onPointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!pos) return;
    pointerTypeRef.current = e.pointerType || "mouse";
    startRef.current = { x: e.clientX, y: e.clientY };
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    movedRef.current = false;
    draggingRef.current = false;

    // Mouse / pen: start drag on movement (threshold in pointermove).
    // Touch: require long-press to avoid conflicting with page scroll gestures.
    if (e.pointerType === "touch") {
      const el = e.currentTarget as HTMLAnchorElement;
      clearLongPress();
      longPressTimer.current = window.setTimeout(() => {
        try { el.setPointerCapture(e.pointerId); } catch {}
        startDragging(el);
      }, LONG_PRESS_MS);
    } else {
      try { (e.currentTarget as HTMLAnchorElement).setPointerCapture(e.pointerId); } catch {}
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    if (!draggingRef.current) {
      if (pointerTypeRef.current === "touch") {
        // If finger moves before long-press fires, cancel drag intent so scroll can happen.
        if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) clearLongPress();
        return;
      }
      // Mouse: enter drag only after crossing threshold.
      if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
      startDragging(e.currentTarget as HTMLAnchorElement);
    }

    const nx = e.clientX - offsetRef.current.x;
    const ny = e.clientY - offsetRef.current.y;
    setPos(clampPos({ x: nx, y: ny }));
  };

  const finishPointer = (e: React.PointerEvent<HTMLAnchorElement>) => {
    clearLongPress();
    startRef.current = null;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    try { (e.currentTarget as HTMLAnchorElement).releasePointerCapture(e.pointerId); } catch {}
    if (pos) localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  };

  const onClick = (e: React.MouseEvent) => {
    if (movedRef.current) {
      e.preventDefault();
      movedRef.current = false;
    }
  };

  const resetPosition = () => {
    const p = clampPos(defaultPos());
    setPos(p);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!baseUrl || !pos) return null;
  const finalUrl = normalizeWhatsAppUrl(baseUrl, preMessage);

  const storedPos = loadPos();
  const isCustomPos = !!storedPos && !posEquals(storedPos, clampPos(defaultPos()));

  const content = (
    <div
      style={{ left: pos.x, top: pos.y, width: BUTTON_SIZE, height: BUTTON_SIZE }}
      className="fixed z-[9999]"
    >
      {isCustomPos && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); resetPosition(); }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Redefinir posição"
          className="absolute -top-2 -left-2 h-7 w-7 rounded-full bg-background border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Lançar via WhatsApp"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={finishPointer}
              onPointerCancel={finishPointer}
              onClick={onClick}
              style={{ touchAction: dragging ? "none" : "auto" }}
              className={`block h-full w-full rounded-full shadow-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white transition-transform flex items-center justify-center select-none ${
                dragging ? "scale-110 cursor-grabbing ring-4 ring-[#25D366]/40" : "hover:scale-110 cursor-pointer md:cursor-grab"
              }`}
            >
              <WhatsAppIcon className="h-10 w-10 pointer-events-none" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>
              Lançar via WhatsApp
              <br />
              <span className="text-xs opacity-70">
                {isTouchDevice() ? "Segure para arrastar" : "Arraste para reposicionar"}
              </span>
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
};

export default FloatingWhatsAppButton;
