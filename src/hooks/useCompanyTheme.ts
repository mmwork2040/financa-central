import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SYSTEM_PRIMARY_COLOR = "#0891B2"; // Aurora cyan

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function applyHex(hex: string) {
  const hsl = hexToHsl(hex);
  if (!hsl) return;

  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const { h, s, l } = hsl;
  const primaryHsl = `${h} ${s}% ${l}%`;

  root.style.setProperty("--primary", primaryHsl);
  root.style.setProperty("--ring", primaryHsl);
  root.style.setProperty("--aurora-cyan", primaryHsl);

  // Ensure primary-foreground has good contrast
  const fgLight = l > 55 ? `${h} ${Math.min(s, 30)}% 10%` : `0 0% 100%`;
  root.style.setProperty("--primary-foreground", fgLight);

  if (isDark) {
    // Dark mode sidebar
    root.style.setProperty("--sidebar-primary", primaryHsl);
    root.style.setProperty("--sidebar-accent", `${h} ${s}% ${l}% / 0.12`);
    root.style.setProperty("--sidebar-accent-foreground", `${h} ${Math.min(s, 60)}% 80%`);
  } else {
    // Light mode sidebar
    root.style.setProperty("--sidebar-primary", primaryHsl);
    root.style.setProperty("--sidebar-accent", `${h} ${Math.min(s, 70)}% 95%`);
    root.style.setProperty("--sidebar-accent-foreground", `${h} ${s}% ${Math.max(l - 15, 20)}%`);
  }
}

export function useCompanyTheme() {
  const { empresaId } = useAuth();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    if (!empresaId) {
      setThemeReady(true);
      return;
    }

    setThemeReady(false);

    const fetchAndApply = async () => {
      const { data } = await supabase
        .from("empresas")
        .select("cor_primaria")
        .eq("id", empresaId)
        .single();

      applyHex(data?.cor_primaria || SYSTEM_PRIMARY_COLOR);
      setThemeReady(true);
    };

    fetchAndApply();

    const handler = (e: Event) => {
      const hex = (e as CustomEvent).detail?.hex;
      if (hex) {
        applyHex(hex);
      } else {
        fetchAndApply();
      }
    };
    window.addEventListener("company-theme-changed", handler);

    // Re-apply on theme class change (dark/light toggle)
    const observer = new MutationObserver(() => {
      const stored = document.documentElement.style.getPropertyValue("--primary");
      if (stored) {
        // Re-apply to update sidebar variants
        fetchAndApply();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      window.removeEventListener("company-theme-changed", handler);
      observer.disconnect();
    };
  }, [empresaId]);

  return themeReady;
}
