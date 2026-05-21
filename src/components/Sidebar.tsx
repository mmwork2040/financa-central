
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
  FileUp,
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
  Briefcase,
  Code2,
  UserCircle,
  HelpCircle,
  UserCog,
  FileText,
  Brain,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { extractEdgeError } from "@/lib/edgeFunctionError";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { CreateEmpresaDialog } from "@/components/sidebar/CreateEmpresaDialog";
import NotificacoesDropdown from "@/components/common/NotificacoesDropdown";

export const Sidebar = () => {
  const { isExpanded, toggle } = useSidebar();
  const location = useLocation();
  const { userProfile, logout, isSuperAdmin, isPessoal, empresaId, empresas, switchEmpresa, switchingEmpresa, canAccessRoute, planControles } = useAuth();
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
  const [adminOpen, setAdminOpen] = useState(false);
  const [createEmpresaOpen, setCreateEmpresaOpen] = useState(false);
  const [creatingPessoal, setCreatingPessoal] = useState(false);
  const [confirmSwitchEmpresa, setConfirmSwitchEmpresa] = useState<{ id: string; nome: string } | null>(null);
  const [hasAdsIntegration, setHasAdsIntegration] = useState(false);
  const [hasSalesIntegration, setHasSalesIntegration] = useState(false);
  const [fiscalConfigured, setFiscalConfigured] = useState(false);



  const hasPessoalEmpresa = empresas.some(e => e.pessoal === true);

  const handleCreatePessoal = async () => {
    setCreatingPessoal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-personal-empresa");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Conta pessoal criada com sucesso!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta pessoal");
    } finally {
      setCreatingPessoal(false);
    }
  };

  // Auto-open submenus when on their routes
  useEffect(() => {
    const cadastrosPaths = ["/clientes", "/fornecedores", "/categorias", "/bank-accounts", "/payment-methods", "/users", "/cartoes-credito"];
    const configPaths = ["/settings", "/settings/integracoes", "/settings/termos"];
    const adminPaths = ["/settings/webhooks", "/settings/logs", "/settings/n8n-templates", "/settings/assinaturas", "/admin/ia-global"];
    if (cadastrosPaths.some(p => location.pathname.startsWith(p))) setCadastrosOpen(true);
    if (configPaths.some(p => location.pathname === p || location.pathname.startsWith(p + "/"))) setConfigOpen(true);
    if (adminPaths.some(p => location.pathname.startsWith(p))) setAdminOpen(true);
  }, [location.pathname]);

  // Check if empresa has any ads / sales integrations and fiscal setup
  useEffect(() => {
    if (!empresaId || isPessoal) {
      setHasAdsIntegration(false);
      setHasSalesIntegration(false);
      setFiscalConfigured(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: ints }, { data: emp }] = await Promise.all([
        supabase
          .from("integracoes")
          .select("plataforma")
          .eq("empresa_id", empresaId)
          .eq("ativo", true),
        supabase
          .from("empresas")
          .select("fiscal_configurado")
          .eq("id", empresaId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      const plats = (ints || []).map((i: any) => i.plataforma);
      setHasAdsIntegration(plats.some((p: string) => ["google_ads", "meta_ads"].includes(p)));
      setHasSalesIntegration(plats.some((p: string) => ["hotmart", "eduzz", "monetizze", "kiwify", "hubla"].includes(p)));
      setFiscalConfigured(!!emp?.fiscal_configurado);
    })();
    return () => { cancelled = true; };
  }, [empresaId, isPessoal]);


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

    const logoHandler = (e: Event) => {
      const logoUrl = (e as CustomEvent).detail?.logo_url ?? null;
      setCompanyLogo(logoUrl);
    };
    window.addEventListener("company-logo-changed", logoHandler);

    const dataHandler = async () => {
      // Re-fetch empresa data to update the sidebar name
      if (empresaId) {
        const { data } = await supabase
          .from("empresas")
          .select("logo_url, nome")
          .eq("id", empresaId)
          .single();
        if (data) {
          setCompanyLogo(data.logo_url || null);
        }
        // Reload to refresh empresas list in AuthContext
        window.location.reload();
      }
    };
    window.addEventListener("company-data-changed", dataHandler);

    return () => {
      window.removeEventListener("company-logo-changed", logoHandler);
      window.removeEventListener("company-data-changed", dataHandler);
    };
  }, [empresaId, empresas]);
  
  const isActive = (path: string) => location.pathname === path;
  const activeEmpresa = empresas.find(e => e.empresa_id === empresaId);

  const showExpanded = isExpanded || isMobile;
  
  // Simplified menu structure

  const allMainItems = [
    { name: "Dashboard", icon: Home, path: "/dashboard" },
    { name: "Lançamentos", icon: Files, path: "/transactions" },
    { name: "Importar", icon: FileUp, path: "/importar-documentos" },
    { name: "Vendas", icon: ShoppingCart, path: "/vendas-digitais", businessOnly: true },
    { name: "Notas Fiscais", icon: FileText, path: "/notas-fiscais", businessOnly: true },
    { name: "Anúncios", icon: Megaphone, path: "/anuncios", businessOnly: true, requiresAds: true },
    { name: "Projetos", icon: Briefcase, path: "/projetos", businessOnly: true },
  ];
  const mainItems = (isPessoal ? allMainItems.filter(i => !i.businessOnly) : allMainItems)
    .filter((i: any) => !i.requiresAds || hasAdsIntegration || isSuperAdmin);

  const allCadastrosItems = [
    { name: "Clientes", icon: UsersRound, path: "/clientes", businessOnly: true },
    { name: "Fornecedores", icon: Truck, path: "/fornecedores", businessOnly: true },
    { name: "Categorias", icon: Tags, path: "/categorias" },
    { name: "Contas Bancárias", icon: Building2, path: "/bank-accounts" },
    { name: "Formas de Pagamento", icon: CreditCard, path: "/payment-methods" },
    { name: "Cartões de Crédito", icon: CreditCard, path: "/cartoes-credito", pessoalOnly: true },
    { name: "Usuários", icon: Users, path: "/users", businessOnly: true },
  ];
  const cadastrosItems = isPessoal 
    ? allCadastrosItems.filter(i => !(i as any).businessOnly)
    : allCadastrosItems.filter(i => !(i as any).pessoalOnly);

  const bottomItems = [
    { name: "Relatórios", icon: PieChart, path: "/reports" },
  ];

  // Configurações: apenas itens da empresa/usuário
  const configItems = [
    { name: isPessoal ? "Pessoal" : "Empresa", icon: isPessoal ? UserCircle : Building2, path: "/settings" },
    { name: "Integrações", icon: Plug, path: "/settings/integracoes" },
    { name: "Termos e Políticas", icon: ScrollText, path: "/settings/termos" },
  ];

  // Administração: apenas Super Admin
  const adminGlobalItems = isSuperAdmin ? [
    { name: "IA Global", icon: Brain, path: "/admin/ia-global" },
    { name: "Assinaturas", icon: CreditCard, path: "/settings/assinaturas" },
    { name: "Webhooks", icon: Webhook, path: "/settings/webhooks" },
    { name: "n8n Templates", icon: Code2, path: "/settings/n8n-templates" },
    { name: "Logs", icon: ScrollText, path: "/settings/logs" },
  ] : [];

  const adminItems = [
    { name: "Permissões", icon: ShieldCheck, path: "/permissions" },
    { name: "Perfis de Acesso", icon: UserCog, path: "/perfis-acesso" },
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
      if (error) throw new Error(await extractEdgeError(error, "Erro ao entrar na empresa"));
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
            !showExpanded && "justify-center px-0",
            isActive(item.path) && "active"
          )}
          title={!showExpanded ? item.name : undefined}
        >
          <item.icon size={18} className="shrink-0" />
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
      <div className={cn("flex h-14 items-center px-4", showExpanded ? "justify-between" : "justify-center flex-col gap-1 h-auto py-2")}>
        {showExpanded ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" className="h-7 w-7 rounded object-contain shrink-0" />
              ) : null}
              <h1 className="text-base font-extrabold tracking-tight text-sidebar-foreground truncate">Contabiliza AI</h1>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <NotificacoesDropdown />
              {isMobile ? (
                <button onClick={() => setMobileOpen(false)} className="rounded-full p-1 text-sidebar-foreground hover:bg-sidebar-accent transition-all">
                  <X size={18} />
                </button>
              ) : (
                <button
                  onClick={toggle}
                  className="rounded-full p-1.5 text-sidebar-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent transition-all"
                  aria-label="Recolher menu"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <NotificacoesDropdown />
            <button
              onClick={toggle}
              className="rounded-full p-1.5 text-sidebar-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent transition-all"
              aria-label="Expandir menu"
            >
              <ChevronRight size={18} />
            </button>
          </>
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
                      if (emp.empresa_id !== empresaId) {
                        setConfirmSwitchEmpresa({ id: emp.empresa_id, nome: emp.empresa_nome });
                      }
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="truncate">
                      <div className="text-sm">{emp.empresa_nome}</div>
                      <div className="text-xs text-muted-foreground">{emp.role === 'admin' ? 'Administrador' : emp.role === 'usuario' ? 'Usuário' : emp.role === 'leitura' ? 'Leitura' : emp.role}</div>
                    </div>
                    {emp.empresa_id === empresaId && <Check size={14} className="shrink-0 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {!hasPessoalEmpresa && (
                  <DropdownMenuItem onClick={handleCreatePessoal} disabled={creatingPessoal}>
                    <Users size={14} className="mr-2" />
                    {creatingPessoal ? "Criando..." : "Criar conta pessoal"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setCreateEmpresaOpen(true)}>
                  <Building2 size={14} className="mr-2" />
                  Criar nova empresa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setJoinDialogOpen(true)}>
                  <UserPlus size={14} className="mr-2" />
                  Entrar com código de convite
                </DropdownMenuItem>
                {activeEmpresa && !activeEmpresa.pessoal && activeEmpresa.role !== 'admin' && !hasPendingRequest(activeEmpresa.empresa_id) && (
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
                      if (emp.empresa_id !== empresaId) {
                        setConfirmSwitchEmpresa({ id: emp.empresa_id, nome: emp.empresa_nome });
                      }
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="truncate">
                      <div className="text-sm">{emp.empresa_nome}</div>
                      <div className="text-xs text-muted-foreground">{emp.role === 'admin' ? 'Administrador' : emp.role === 'usuario' ? 'Usuário' : emp.role === 'leitura' ? 'Leitura' : emp.role}</div>
                    </div>
                    {emp.empresa_id === empresaId && <Check size={14} className="shrink-0 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {!hasPessoalEmpresa && (
                  <DropdownMenuItem onClick={handleCreatePessoal} disabled={creatingPessoal}>
                    <Users size={14} className="mr-2" />
                    {creatingPessoal ? "Criando..." : "Conta pessoal"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setCreateEmpresaOpen(true)}>
                  <Building2 size={14} className="mr-2" />
                  Criar empresa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setJoinDialogOpen(true)}>
                  <UserPlus size={14} className="mr-2" />
                  Entrar com código
                </DropdownMenuItem>
                {activeEmpresa && !activeEmpresa.pessoal && activeEmpresa.role !== 'admin' && !hasPendingRequest(activeEmpresa.empresa_id) && (
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

          {/* Chat item removed - buttons now in Lançamentos and Vendas pages */}
          
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
          
          {/* Admin items (Permissões, Perfis de Acesso) */}
          {adminItems.filter(item => canAccessRoute(item.path)).map(item => renderMenuItem(item))}

          {/* Administração (Super Admin) */}
          {isSuperAdmin && adminGlobalItems.length > 0 && (
            showExpanded ? (
              <li>
                <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
                  <CollapsibleTrigger className="sidebar-link w-full justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} />
                      <span className="text-sm">Administração</span>
                    </div>
                    <ChevronDown size={14} className={cn("transition-transform", adminOpen && "rotate-180")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="space-y-0.5 mt-0.5">
                      {adminGlobalItems.map(item => renderMenuItem(item, true))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              </li>
            ) : (
              adminGlobalItems.map(item => renderMenuItem(item))
            )
          )}

          {/* Suporte - always last */}
          {renderMenuItem({ name: "Suporte", icon: HelpCircle, path: "/suporte" })}
        </ul>
      </nav>
      
      
      {/* Logout */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <button 
          onClick={handleLogout}
          className={cn("sidebar-link w-full", !showExpanded && "justify-center px-0")}
          title={!showExpanded ? "Sair" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
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
          className="fixed top-3 left-3 z-50 rounded-full bg-primary p-2 text-primary-foreground shadow-lg"
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
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border shadow-lg transition-all duration-300 ease-in-out",
          "bg-white dark:bg-slate-900",
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

      <CreateEmpresaDialog open={createEmpresaOpen} onOpenChange={setCreateEmpresaOpen} />

      {/* Confirmation dialog for switching empresa */}
      <AlertDialog open={!!confirmSwitchEmpresa} onOpenChange={(open) => { if (!open) setConfirmSwitchEmpresa(null); }}>
        <AlertDialogContent className="sm:max-w-sm max-w-[calc(100vw-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar de empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja trocar para a empresa <span className="font-semibold text-foreground">{confirmSwitchEmpresa?.nome}</span>? Você será redirecionado ao painel desta empresa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={switchingEmpresa}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={switchingEmpresa}
              onClick={async (e) => {
                e.preventDefault();
                if (confirmSwitchEmpresa) {
                  await switchEmpresa(confirmSwitchEmpresa.id);
                  setConfirmSwitchEmpresa(null);
                }
              }}
            >
              {switchingEmpresa ? "Alternando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading overlay during empresa switch */}
      {switchingEmpresa && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-muted-foreground">Alternando empresa...</p>
          </div>
        </div>
      )}
    </>
  );
};
