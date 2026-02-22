
import React, { useState, useEffect } from "react";
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
  Settings,
  ChevronsUpDown,
  UserPlus,
  Check,
  DoorOpen,
  Menu,
  X,
  ChevronDown,
  ShoppingCart,
  FolderOpen,
  Plug,
  Webhook,
  Megaphone,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSolicitacoesSaida } from "@/hooks/useSolicitacoesSaida";
import { ExitRequestDialog } from "@/components/solicitacoes/ExitRequestDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export const Sidebar = () => {
  const { isExpanded, toggle } = useSidebar();
  const location = useLocation();
  const { userProfile, logout, isSuperAdmin, isPessoal, empresaId, empresas, switchEmpresa, canAccessRoute } = useAuth();
  const navigate = useNavigate();
  
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joiningLoading, setJoiningLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [exitEmpresaId, setExitEmpresaId] = useState<string | null>(null);
  const [exitEmpresaNome, setExitEmpresaNome] = useState("");
  const { pendingCount, createRequest, hasPendingRequest, actionLoading } = useSolicitacoesSaida();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  // Auto-open submenus when on their routes
  useEffect(() => {
    const cadastrosPaths = ["/clientes", "/fornecedores", "/categorias", "/bank-accounts", "/payment-methods"];
    const configPaths = ["/settings", "/settings/integracoes", "/settings/webhooks", "/settings/logs"];
    if (cadastrosPaths.some(p => location.pathname.startsWith(p))) setCadastrosOpen(true);
    if (configPaths.some(p => location.pathname.startsWith(p))) setConfigOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!empresaId) return;
    const fetchLogo = async () => {
      const { data } = await supabase
        .from("empresas")
        .select("logo_url")
        .eq("id", empresaId)
        .single();
      setCompanyLogo(data?.logo_url || null);
    };
    fetchLogo();

    const handler = (e: Event) => {
      const logoUrl = (e as CustomEvent).detail?.logo_url ?? null;
      setCompanyLogo(logoUrl);
    };
    window.addEventListener("company-logo-changed", handler);
    return () => window.removeEventListener("company-logo-changed", handler);
  }, [empresaId]);
  
  const isActive = (path: string) => location.pathname === path;
  const activeEmpresa = empresas.find(e => e.empresa_id === empresaId);

  const showExpanded = isExpanded || isMobile;
  
  // Simplified menu structure
  const mainItems = [
    { name: "Dashboard", icon: Home, path: "/dashboard" },
    { name: "Lançamentos", icon: Files, path: "/transactions" },
    { name: "Vendas Digitais", icon: ShoppingCart, path: "/vendas-digitais" },
    { name: "Anúncios", icon: Megaphone, path: "/anuncios" },
  ];

  const cadastrosItems = [
    { name: "Clientes", icon: UsersRound, path: "/clientes" },
    { name: "Fornecedores", icon: Truck, path: "/fornecedores" },
    { name: "Categorias", icon: Tags, path: "/categorias" },
    { name: "Contas Bancárias", icon: Building2, path: "/bank-accounts" },
    { name: "Formas de Pagamento", icon: CreditCard, path: "/payment-methods" },
  ];

  const bottomItems = [
    { name: "Relatórios", icon: PieChart, path: "/reports" },
  ];

  const configItems = [
    { name: "Empresa", icon: Settings, path: "/settings" },
    { name: "Integrações", icon: Plug, path: "/settings/integracoes" },
    ...(isSuperAdmin ? [{ name: "Webhooks", icon: Webhook, path: "/settings/webhooks" }] : []),
    { name: "Logs", icon: ScrollText, path: "/settings/logs" },
  ];

  const adminItems = [
    { name: "Usuários", icon: Users, path: "/users" },
    { name: "Permissões", icon: ShieldCheck, path: "/permissions" },
  ];

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
  };

  const handleJoinCompany = async () => {
    if (!inviteCode.trim()) return;
    setJoiningLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-invite-code", {
        body: { code: inviteCode.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Bem-vindo! Você entrou na empresa "${data.empresaNome}".`);
      setJoinDialogOpen(false);
      setInviteCode("");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.message || "Erro ao entrar na empresa");
    } finally {
      setJoiningLoading(false);
    }
  };

  const renderMenuItem = (item: { name: string; icon: any; path: string }, indent = false) => {
    if (!canAccessRoute(item.path)) return null;
    return (
      <li key={item.path}>
        <Link
          to={item.path}
          className={cn(
            "sidebar-link relative",
            indent && showExpanded && "pl-8",
            isActive(item.path) && "active"
          )}
        >
          <item.icon size={18} />
          {showExpanded && <span className="text-sm">{item.name}</span>}
          {item.path === "/users" && pendingCount > 0 && (
            <span className="absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
              {pendingCount}
            </span>
          )}
        </Link>
      </li>
    );
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          {companyLogo ? (
            <img src={companyLogo} alt="Logo" className="h-7 w-7 rounded object-contain shrink-0" />
          ) : null}
          {showExpanded && (
            <h1 className="text-base font-bold text-sidebar-foreground truncate">Finança Central</h1>
          )}
        </div>
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} className="rounded-full p-1 text-sidebar-foreground hover:bg-sidebar-accent transition-all shrink-0">
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={toggle}
            className="rounded-full p-1 text-sidebar-foreground hover:bg-sidebar-accent transition-all shrink-0"
            aria-label={isExpanded ? "Recolher menu" : "Expandir menu"}
          >
            {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        )}
      </div>
      
      {/* Company switcher */}
      <div className="border-t border-b border-sidebar-border px-3 py-2.5">
        {showExpanded ? (
          <div className="space-y-1.5">
            <Link to="/profile" className="block hover:opacity-80 transition-opacity">
              <div className="text-sidebar-foreground text-sm font-medium truncate">{userProfile?.nome || "Usuário"}</div>
              <div className="text-sidebar-foreground/60 text-[10px] truncate">
                {isSuperAdmin ? "Super Admin" : activeEmpresa?.role === 'admin' ? "Administrador" : activeEmpresa?.role === 'usuario' ? "Usuário" : activeEmpresa?.role === 'leitura' ? "Leitura" : "Usuário"}
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-md border border-sidebar-border bg-sidebar-accent/50 px-2.5 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 size={13} />
                    <span className="truncate">{activeEmpresa?.empresa_nome || "Sem empresa"}</span>
                  </div>
                  <ChevronsUpDown size={13} className="shrink-0 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 z-[60]">
                {empresas.map(emp => (
                  <DropdownMenuItem
                    key={emp.empresa_id}
                    onClick={() => {
                      if (emp.empresa_id !== empresaId) switchEmpresa(emp.empresa_id);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="truncate">
                      <div className="text-sm">{emp.empresa_nome}</div>
                      <div className="text-xs text-muted-foreground">{emp.role}</div>
                    </div>
                    {emp.empresa_id === empresaId && <Check size={14} className="shrink-0 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setJoinDialogOpen(true)}>
                  <UserPlus size={14} className="mr-2" />
                  Entrar com código de convite
                </DropdownMenuItem>
                {activeEmpresa && !activeEmpresa.pessoal && !hasPendingRequest(activeEmpresa.empresa_id) && (
                  <DropdownMenuItem onSelect={() => {
                    const id = activeEmpresa.empresa_id;
                    const nome = activeEmpresa.empresa_nome || "";
                    setTimeout(() => {
                      setExitEmpresaId(id);
                      setExitEmpresaNome(nome);
                      setExitDialogOpen(true);
                    }, 150);
                  }}>
                    <DoorOpen size={14} className="mr-2" />
                    Solicitar saída da empresa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                  <Building2 size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 z-[60]">
                {empresas.map(emp => (
                  <DropdownMenuItem
                    key={emp.empresa_id}
                    onClick={() => {
                      if (emp.empresa_id !== empresaId) switchEmpresa(emp.empresa_id);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="truncate">
                      <div className="text-sm">{emp.empresa_nome}</div>
                      <div className="text-xs text-muted-foreground">{emp.role}</div>
                    </div>
                    {emp.empresa_id === empresaId && <Check size={14} className="shrink-0 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setJoinDialogOpen(true)}>
                  <UserPlus size={14} className="mr-2" />
                  Entrar com código
                </DropdownMenuItem>
                {activeEmpresa && !activeEmpresa.pessoal && !hasPendingRequest(activeEmpresa.empresa_id) && (
                  <DropdownMenuItem onSelect={() => {
                    const id = activeEmpresa.empresa_id;
                    const nome = activeEmpresa.empresa_nome || "";
                    setTimeout(() => {
                      setExitEmpresaId(id);
                      setExitEmpresaNome(nome);
                      setExitDialogOpen(true);
                    }, 150);
                  }}>
                    <DoorOpen size={14} className="mr-2" />
                    Sair da empresa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {/* Main items */}
          {mainItems.filter(item => canAccessRoute(item.path)).map(item => renderMenuItem(item))}
          
          {/* Cadastros collapsible */}
          {showExpanded ? (
            <li>
              <Collapsible open={cadastrosOpen} onOpenChange={setCadastrosOpen}>
                <CollapsibleTrigger className="sidebar-link w-full justify-between">
                  <div className="flex items-center gap-3">
                    <FolderOpen size={18} />
                    <span className="text-sm">Cadastros</span>
                  </div>
                  <ChevronDown size={14} className={cn("transition-transform", cadastrosOpen && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="space-y-0.5 mt-0.5">
                    {cadastrosItems.filter(item => canAccessRoute(item.path)).map(item => renderMenuItem(item, true))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </li>
          ) : (
            cadastrosItems.filter(item => canAccessRoute(item.path)).map(item => renderMenuItem(item))
          )}

          {/* Bottom items */}
          {bottomItems.filter(item => canAccessRoute(item.path)).map(item => renderMenuItem(item))}

          {/* Configurações collapsible */}
          {showExpanded ? (
            <li>
              <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
                <CollapsibleTrigger className="sidebar-link w-full justify-between">
                  <div className="flex items-center gap-3">
                    <Settings size={18} />
                    <span className="text-sm">Configurações</span>
                  </div>
                  <ChevronDown size={14} className={cn("transition-transform", configOpen && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="space-y-0.5 mt-0.5">
                    {configItems.map(item => renderMenuItem(item, true))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </li>
          ) : (
            <>{renderMenuItem({ name: "Configurações", icon: Settings, path: "/settings" })}</>
          )}
          
          {/* Admin items */}
          {!isPessoal && adminItems.filter(item => canAccessRoute(item.path)).map(item => renderMenuItem(item))}
        </ul>
      </nav>
      
      {/* Logout */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <button 
          onClick={handleLogout}
          className={cn("sidebar-link w-full", !showExpanded && "justify-center")}
        >
          <LogOut size={18} />
          {showExpanded && <span className="text-sm">Sair</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 rounded-lg bg-primary p-2 text-primary-foreground shadow-lg"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
      )}

      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border shadow-lg transition-all duration-300 ease-in-out",
          isMobile
            ? cn("w-72", mobileOpen ? "translate-x-0" : "-translate-x-full")
            : isExpanded ? "w-60" : "w-14"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Join Company Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Entrar em uma Empresa</DialogTitle>
            <DialogDescription>Insira o código de convite recebido para participar de outra empresa.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: A1B2C3D4"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono tracking-wider uppercase"
              maxLength={8}
              onKeyDown={e => e.key === 'Enter' && handleJoinCompany()}
            />
            <Button onClick={handleJoinCompany} disabled={joiningLoading || !inviteCode.trim()}>
              {joiningLoading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {exitDialogOpen && (
        <ExitRequestDialog
          isOpen={exitDialogOpen}
          onClose={() => setExitDialogOpen(false)}
          empresaNome={exitEmpresaNome}
          onConfirm={async (motivo) => {
            if (!exitEmpresaId) return false;
            return await createRequest(exitEmpresaId, motivo);
          }}
          loading={actionLoading}
        />
      )}
    </>
  );
};
