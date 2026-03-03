import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Truck, BarChart3, Landmark, ShoppingCart } from "lucide-react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";

interface Shortcut {
  label: string;
  icon: React.ComponentType<any>;
  route?: string;
  action?: string;
}

const shortcuts: Shortcut[] = [
  { label: "Novo Lançamento", icon: Plus, action: "openModal" },
  { label: "Clientes", icon: Users, route: "/clientes" },
  { label: "Fornecedores", icon: Truck, route: "/fornecedores" },
  { label: "Relatórios", icon: BarChart3, route: "/relatorios" },
  { label: "Contas Bancárias", icon: Landmark, route: "/bank-accounts" },
  { label: "Vendas Digitais", icon: ShoppingCart, route: "/vendas-digitais" },
];

export const DashboardShortcuts = () => {
  const navigate = useNavigate();
  const { handleOpenModal } = useLancamentosContext();

  const handleClick = (shortcut: typeof shortcuts[number]) => {
    if (shortcut.action === "openModal") {
      handleOpenModal();
    } else if (shortcut.route) {
      navigate(shortcut.route);
    }
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {shortcuts.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.label}
            onClick={() => handleClick(s)}
            className="glass-card flex flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-foreground text-center leading-tight">
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
