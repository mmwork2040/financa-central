import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const LAST_ROUTE_KEY = "app:last_route";
const LAST_ACTIVITY_KEY = "app:last_activity";
const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutos
const CHECK_INTERVAL_MS = 30 * 1000; // checa a cada 30s

const PUBLIC_PATHS = new Set<string>([
  "/", "/login", "/register", "/install", "/demo",
  "/planos-expirados", "/ver-planos", "/termos",
]);

export const getSavedRoute = (): string | null => {
  try {
    const r = localStorage.getItem(LAST_ROUTE_KEY);
    if (!r || PUBLIC_PATHS.has(r)) return null;
    return r;
  } catch {
    return null;
  }
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

  // Persist last visited authenticated route
  useEffect(() => {
    if (!isAuthenticated) return;
    const path = location.pathname + location.search;
    if (!PUBLIC_PATHS.has(location.pathname)) {
      try { localStorage.setItem(LAST_ROUTE_KEY, path); } catch {}
    }
  }, [location.pathname, location.search, isAuthenticated]);

  // Restore last route once after auth loads (only if landing on public entry)
  useEffect(() => {
    if (loading || restoredRef.current) return;
    if (!isAuthenticated) return;
    restoredRef.current = true;
    const saved = getSavedRoute();
    if (saved && PUBLIC_PATHS.has(location.pathname)) {
      navigate(saved, { replace: true });
    }
  }, [loading, isAuthenticated, location.pathname, navigate]);

  // Inactivity timeout
  useEffect(() => {
    if (!isAuthenticated) return;

    markActivity();
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "visibilitychange"];
    const onActivity = () => {
      if (document.visibilityState === "hidden") return;
      markActivity();
    };
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

    const interval = window.setInterval(() => {
      let last = 0;
      try { last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0); } catch {}
      if (last && Date.now() - last > INACTIVITY_MS) {
        clearSavedRoute();
        try { localStorage.removeItem(LAST_ACTIVITY_KEY); } catch {}
        toast.info("Sessão encerrada por inatividade. Faça login novamente.");
        logout();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      window.clearInterval(interval);
    };
  }, [isAuthenticated, logout]);

  return null;
};

export default SessionManager;
