import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SYSTEM_PRIMARY_COLOR = "#f97316";

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

function generateSidebarVariants(h: number, s: number, l: number) {
  return {
    sidebar: `${h} ${s}% ${l}%`,
    sidebarPrimary: `${h} ${s}% ${Math.max(l - 8, 5)}%`,
    sidebarAccent: `${h} ${s}% ${Math.max(l - 8, 5)}%`,
    sidebarBorder: `${h} ${s}% ${Math.min(l + 7, 95)}%`,
    sidebarRing: `${h} ${s}% ${Math.max(l - 8, 5)}%`,
  };
}

export function useCompanyTheme() {
  const { empresaId } = useAuth();

  useEffect(() => {
    if (!empresaId) return;

    const applyTheme = async () => {
      const { data } = await supabase
        .from("empresas")
        .select("cor_primaria")
        .eq("id", empresaId)
        .single();

      const hex = data?.cor_primaria || SYSTEM_PRIMARY_COLOR;
      const hsl = hexToHsl(hex);
      if (!hsl) return;

      const root = document.documentElement;
      const { h, s, l } = hsl;
      const primaryHsl = `${h} ${s}% ${l}%`;

      // Primary color
      root.style.setProperty("--primary", primaryHsl);
      root.style.setProperty("--ring", primaryHsl);

      // Sidebar colors derived from primary
      const sv = generateSidebarVariants(h, s, l);
      root.style.setProperty("--sidebar-background", sv.sidebar);
      root.style.setProperty("--sidebar-primary", sv.sidebarPrimary);
      root.style.setProperty("--sidebar-accent", sv.sidebarAccent);
      root.style.setProperty("--sidebar-border", sv.sidebarBorder);
      root.style.setProperty("--sidebar-ring", sv.sidebarRing);
    };

    applyTheme();
  }, [empresaId]);
}
