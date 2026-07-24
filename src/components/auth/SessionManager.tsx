import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const LAST_ROUTE_KEY = "app:last_route";
const LAST_ACTIVITY_KEY = "app:last_activity";
const TIMEOUT_KEY = "app:inactivity_minutes";
const WARNING_SECONDS = 60; // aviso 60s antes
const CHECK_INTERVAL_MS = 5 * 1000;

export const ALLOWED_TIMEOUTS = [15, 30, 60] as const;
export const DEFAULT_TIMEOUT_MINUTES = 30;

const PUBLIC_PATHS = new Set<string>([
  "/", "/login", "/register", "/install", "/demo",
  "/planos-expirados", "/ver-planos", "/termos",
]);

export const getInactivityMinutes = (): number => {
  try {
    const v = Number(localStorage.getItem(TIMEOUT_KEY));
    if (ALLOWED_TIMEOUTS.includes(v as any)) return v;
  } catch {}
  return DEFAULT_TIMEOUT_MINUTES;
};

export const setInactivityMinutes = (mins: number) => {
  try { localStorage.setItem(TIMEOUT_KEY, String(mins)); } catch {}
};

export const getSavedRoute = (): string | null => {
  try {
    const r = localStorage.getItem(LAST_ROUTE_KEY);
    if (!r || PUBLIC_PATHS.has(r)) return null;
    return r;
  } catch { return null; }
};

export const clearSavedRoute = () => {
  try { localStorage.removeItem(LAST_ROUTE_KEY); } catch {}
};

const markActivity = () => {
  try { localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now())); } catch {}
};

export const SessionManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, logout } = useAuth();
  const restoredRef = useRef(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);

  // Persist last visited authenticated route
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!PUBLIC_PATHS.has(location.pathname)) {
      try { localStorage.setItem(LAST_ROUTE_KEY, location.pathname + location.search); } catch {}
    }
  }, [location.pathname, location.search, isAuthenticated]);

  // Restore last route once after auth loads
  useEffect(() => {
    if (loading || restoredRef.current) return;
    if (!isAuthenticated) return;
    restoredRef.current = true;
    const saved = getSavedRoute();
    if (saved && PUBLIC_PATHS.has(location.pathname)) {
      navigate(saved, { replace: true });
    }
  }, [loading, isAuthenticated, location.pathname, navigate]);

  const extendSession = useCallback(() => {
    markActivity();
    setWarningOpen(false);
    setSecondsLeft(WARNING_SECONDS);
    toast.success("Sessão estendida.");
  }, []);

  const doLogout = useCallback(() => {
    clearSavedRoute();
    try { localStorage.removeItem(LAST_ACTIVITY_KEY); } catch {}
    setWarningOpen(false);
    toast.info("Sessão encerrada por inatividade.");
    logout();
  }, [logout]);

  // Inactivity tracking + warning
  useEffect(() => {
    if (!isAuthenticated) return;
    markActivity();

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    const onActivity = () => {
      if (warningOpen) return; // não reseta enquanto aviso aberto
      markActivity();
    };
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

    const interval = window.setInterval(() => {
      let last = 0;
      try { last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0); } catch {}
      if (!last) return;
      const timeoutMs = getInactivityMinutes() * 60 * 1000;
      const elapsed = Date.now() - last;
      const remaining = timeoutMs - elapsed;

      if (remaining <= 0) {
        doLogout();
      } else if (remaining <= WARNING_SECONDS * 1000) {
        setSecondsLeft(Math.max(1, Math.ceil(remaining / 1000)));
        setWarningOpen(true);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      window.clearInterval(interval);
    };
  }, [isAuthenticated, warningOpen, doLogout]);

  return (
    <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sua sessão vai expirar</AlertDialogTitle>
          <AlertDialogDescription>
            Por segurança, você será desconectado em <strong>{secondsLeft}s</strong> devido à inatividade.
            Deseja continuar conectado?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={doLogout}>Sair agora</AlertDialogCancel>
          <AlertDialogAction onClick={extendSession}>Continuar conectado</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionManager;
