import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Receipt, PieChart, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = {
  name: string;
  icon: React.ElementType;
  path: string;
};

const navItems: NavItem[] = [
  { name: "Início", icon: Home, path: "/dashboard" },
  { name: "Lançamentos", icon: Receipt, path: "/transactions" },
  { name: "Anúncios", icon: Megaphone, path: "/anuncios" },
  { name: "Relatórios", icon: PieChart, path: "/reports" },
];

const MobileBottomNav = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { canAccessRoute } = useAuth();

  if (!isMobile) return null;

  const visibleItems = navItems.filter(item => item.externalUrl || (item.path && canAccessRoute(item.path)));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-sidebar-border bg-white/72 backdrop-blur-[14px] dark:bg-slate-900/80 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {visibleItems.map((item, idx) => {
          if (item.externalUrl) {
            return (
              <button
                key={item.name}
                onClick={() => window.open(item.externalUrl, "_blank")}
                className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[56px] text-sidebar-foreground/70 hover:text-sidebar-foreground"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] leading-tight">{item.name}</span>
              </button>
            );
          }
          const isActive = location.pathname === item.path || 
            (item.path === "/settings" && location.pathname.startsWith("/settings"));
          return (
            <Link
              key={item.path}
              to={item.path!}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[56px]",
                isActive 
                   ? "text-primary font-semibold" 
                   : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className={cn("text-[10px] leading-tight", isActive && "font-semibold")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
