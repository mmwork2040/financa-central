import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Truck, BarChart3, Landmark, ShoppingCart, Tags, FileUp } from "lucide-react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { useAuth } from "@/contexts/AuthContext";

interface Shortcut {
  label: string;
  icon: React.ComponentType<any>;
  route?: string;
  action?: string;
  businessOnly?: boolean;
}

const shortcuts: Shortcut[] = [
  { label: "Novo Lançamento", icon: Plus, action: "openModal" },
  { label: "Clientes", icon: Users, route: "/clientes", businessOnly: true },
  { label: "Fornecedores", icon: Truck, route: "/fornecedores", businessOnly: true },
  { label: "Relatórios", icon: BarChart3, route: "/relatorios" },
  { label: "Contas Bancárias", icon: Landmark, route: "/bank-accounts" },
  { label: "Vendas", icon: ShoppingCart, route: "/vendas-digitais", businessOnly: true },
];

const pessoalShortcuts: Shortcut[] = [
  { label: "Novo Lançamento", icon: Plus, action: "openModal" },
  { label: "Importar", icon: FileUp, route: "/importar-documentos" },
  { label: "Contas Bancárias", icon: Landmark, route: "/bank-accounts" },
  { label: "Relatórios", icon: BarChart3, route: "/relatorios" },
];

export const DashboardShortcuts = () => {
  const navigate = useNavigate();
  const { handleOpenModal } = useLancamentosContext();
  const { isPessoal } = useAuth();

  const activeShortcuts = isPessoal ? pessoalShortcuts : shortcuts;

  const handleClick = (shortcut: Shortcut) => {
    if (shortcut.action === "openModal") {
      handleOpenModal();
    } else if (shortcut.route) {
      navigate(shortcut.route);
    }
  };

  return (
    <div className={`grid grid-cols-${isPessoal ? '4' : '3'} sm:grid-cols-${isPessoal ? '4' : '6'} gap-3`}>
      {activeShortcuts.map((s) => {
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
