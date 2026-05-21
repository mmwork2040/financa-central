import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Perfis de Acesso", to: "/perfis-acesso" },
  { label: "Permissões por Usuário", to: "/permissions" },
];

export const AcessoTabs = () => (
  <div className="flex gap-1 border-b border-border">
    {tabs.map((t) => (
      <NavLink
        key={t.to}
        to={t.to}
        end
        className={({ isActive }) =>
          cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            isActive
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )
        }
      >
        {t.label}
      </NavLink>
    ))}
  </div>
);
