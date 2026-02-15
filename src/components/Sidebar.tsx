
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Users, 
  ShieldCheck, 
  Truck, 
  UsersRound, 
  Tags, 
  Building2, 
  CreditCard, 
  Files, 
  PieChart,
  LogOut,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const { isExpanded, toggle } = useSidebar();
  const location = useLocation();
  const { userProfile, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  
  const isActive = (path: string) => location.pathname === path;
  
  const menuItems = [
    { name: "Página Inicial", icon: Home, path: "/dashboard" },
    { name: "Fornecedores", icon: Truck, path: "/fornecedores" },
    { name: "Clientes", icon: UsersRound, path: "/clientes" },
    { name: "Categorias", icon: Tags, path: "/categorias" },
    { name: "Formas de Pagamento", icon: CreditCard, path: "/payment-methods" },
    { name: "Contas Bancárias", icon: Building2, path: "/bank-accounts" },
    { name: "Lançamentos", icon: Files, path: "/transactions" },
    { name: "Relatórios", icon: PieChart, path: "/reports" },
    { name: "Usuários", icon: Users, path: "/users" },
    { name: "Permissões", icon: ShieldCheck, path: "/permissions" },
    { name: "Configurações", icon: Settings, path: "/settings" },
  ];

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border shadow-lg transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      {/* Header com logo */}
      <div className="flex h-16 items-center justify-between px-4 py-4">
        {isExpanded && (
          <h1 className="text-lg font-bold text-sidebar-foreground">Fluxo de Contas</h1>
        )}
        <button
          onClick={toggle}
          className="rounded-full p-1 text-sidebar-foreground hover:bg-sidebar-accent transition-all"
          aria-label={isExpanded ? "Recolher menu" : "Expandir menu"}
        >
          {isExpanded ? (
            <ChevronLeft size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </button>
      </div>
      
      {/* Informações do usuário */}
      {isExpanded && (
        <div className="border-t border-b border-sidebar-border p-4">
          <div className="text-sidebar-foreground text-sm font-medium">{userProfile?.nome || "Usuário"}</div>
          <div className="text-sidebar-foreground/80 text-xs">{userProfile?.email || ""}</div>
          {isSuperAdmin && (
            <div className="mt-1 inline-block rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              Super Admin
            </div>
          )}
        </div>
      )}
      
      {/* Menu de navegação */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "sidebar-link",
                  isActive(item.path) && "active"
                )}
              >
                <item.icon size={20} />
                {isExpanded && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Logout button */}
      <div className="px-2 py-4 border-t border-sidebar-border">
        <button 
          onClick={handleLogout}
          className={cn(
            "sidebar-link",
            !isExpanded && "justify-center"
          )}
        >
          <LogOut size={20} />
          {isExpanded && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};
