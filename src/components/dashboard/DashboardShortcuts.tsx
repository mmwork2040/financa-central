import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Truck, BarChart3, Landmark, ShoppingCart } from "lucide-react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";

interface Shortcut {
  label: string;
  icon: React.ComponentType<any>;
  route?: string;
  action?: string;
  iconBg: string;
  iconColor: string;
}

const shortcuts: Shortcut[] = [
  { label: "Novo Lançamento", icon: Plus, action: "openModal", iconBg: "bg-primary/10", iconColor: "text-primary" },
  { label: "Clientes", icon: Users, route: "/clientes", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { label: "Fornecedores", icon: Truck, route: "/fornecedores", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { label: "Relatórios", icon: BarChart3, route: "/relatorios", iconBg: "bg-green-100", iconColor: "text-green-600" },
  { label: "Contas Bancárias", icon: Landmark, route: "/contas-bancarias", iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  { label: "Vendas Digitais", icon: ShoppingCart, route: "/vendas-digitais", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
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
            className="flex flex-col items-center gap-2.5 rounded-2xl bg-card border p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.03] hover:bg-accent/50 active:scale-[0.97]"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${s.iconBg}`}>
              <Icon className={`h-5 w-5 ${s.iconColor}`} />
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
