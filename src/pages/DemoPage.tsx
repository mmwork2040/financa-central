import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DemoProvider, useDemo } from "@/contexts/DemoContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import { DashboardDonutChart } from "@/components/dashboard/DashboardDonutChart";
import {
  ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, Clock, Activity,
  LayoutDashboard, Landmark, TrendingUp, Calendar, ChevronDown, Eye, EyeOff,
  Home, Files, Briefcase, Users, Truck, PieChart, BarChart3, ArrowRight,
  Sparkles, UserPlus, X, Menu, ShoppingCart,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type DemoSection = "dashboard" | "lancamentos" | "projetos" | "clientes" | "fornecedores" | "relatorios";

const sectionItems: { key: DemoSection; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "lancamentos", label: "Lançamentos", icon: Files },
  { key: "projetos", label: "Projetos", icon: Briefcase },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "fornecedores", label: "Fornecedores", icon: Truck },
  { key: "relatorios", label: "Relatórios", icon: PieChart },
];

const DemoCTABanner = () => {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium truncate">Modo Demonstração — dados fictícios</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="secondary" className="h-7 text-xs rounded-full" onClick={() => navigate("/register")}>
          <UserPlus className="h-3 w-3 mr-1" />
          Criar Conta Grátis
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/")}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

const DemoActionOverlay = ({ label = "Crie sua conta para usar esta função" }: { label?: string }) => {
  const navigate = useNavigate();
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-xl">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <Button size="sm" className="rounded-full" onClick={() => navigate("/register")}>
          <ArrowRight className="h-3 w-3 mr-1" />
          Começar agora
        </Button>
      </div>
    </div>
  );
};

// ===== DASHBOARD SECTION =====
const DemoDashboard = () => {
  const { data } = useDemo();
  const [visible, setVisible] = useState(true);
  const mask = (v: string) => visible ? v : "••••••";

  const healthConfig = {
    saudavel: { label: "Saudável", color: "text-primary", icon: "🟢", bg: "glass-card border-primary/20" },
    atencao: { label: "Atenção", color: "text-amber-600", icon: "🟡", bg: "glass-card border-amber-200" },
    risco: { label: "Risco", color: "text-destructive", icon: "🔴", bg: "glass-card border-destructive/20" },
  };
  const health = healthConfig[data.healthStatus];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10">
            <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">Olá, {data.userName}! 👋</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Aqui está o resumo do seu financeiro</p>
      </div>

      <div className={cn("flex items-center justify-between gap-3 rounded-xl p-3", health.bg)}>
        <div className="flex items-center gap-3">
          <span className="text-lg">{health.icon}</span>
          <div>
            <p className={cn("text-sm font-semibold", health.color)}>Saúde Financeira: {health.label}</p>
            <p className="text-xs text-muted-foreground">Suas contas estão em dia!</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setVisible(!visible)} className="shrink-0 h-8 w-8">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-green-100 p-1.5"><ArrowUpRight className="h-4 w-4 text-green-600" /></div>
              <span className="text-xs text-muted-foreground">Receitas</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-green-600">
              {mask(formatCurrency(data.summary.totalReceitas + data.summary.receitasPrevistas))}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{mask(formatCurrency(data.summary.totalReceitas))} já recebido</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-destructive/10 p-1.5"><ArrowDownRight className="h-4 w-4 text-destructive" /></div>
              <span className="text-xs text-muted-foreground">Despesas</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-destructive">
              {mask(formatCurrency(data.summary.totalDespesas + data.summary.despesasPrevistas))}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{mask(formatCurrency(data.summary.totalDespesas))} já pago</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-l-4 border-l-orange-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-orange-100 p-1.5"><Clock className="h-4 w-4 text-orange-600" /></div>
              <span className="text-xs text-muted-foreground">Receita Pendente</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-orange-600">{mask(formatCurrency(data.summary.receitasPrevistas))}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-amber-100 p-1.5"><AlertTriangle className="h-4 w-4 text-amber-600" /></div>
              <span className="text-xs text-muted-foreground">Contas a Pagar</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-600">{mask(formatCurrency(data.summary.despesasPrevistas))}</p>
            {data.summary.emAtraso > 0 && (
              <p className="text-[10px] text-destructive font-medium mt-0.5">{data.summary.emAtraso} em atraso</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-blue-100 p-1.5"><Wallet className="h-4 w-4 text-blue-600" /></div>
              <span className="text-xs text-muted-foreground">Saldo do mês</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-blue-600">{mask(formatCurrency(data.summary.saldoAtual))}</p>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
              <Landmark className="h-3 w-3 text-blue-500" />
              <span className="text-[10px] text-muted-foreground">Investido:</span>
              <span className="text-xs font-semibold text-blue-600">{mask(formatCurrency(data.caixa.saldoInvestido))}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-primary/10 p-1.5"><TrendingUp className="h-4 w-4 text-primary" /></div>
              <span className="text-xs text-muted-foreground">Caixa Previsto</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-primary">{mask(formatCurrency(data.caixa.caixaPrevisto))}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-amber-100 p-1.5"><Calendar className="h-4 w-4 text-amber-600" /></div>
              <span className="text-xs text-muted-foreground">Meses de Caixa</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-primary">{data.caixa.mesesDeCaixa} meses</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardChart data={data.monthlyChartData} saldoAtual={data.summary.saldoAtual} />
        <DashboardDonutChart receitas={data.summary.totalReceitas} despesas={data.summary.totalDespesas} saldo={data.summary.saldoAtual} />
      </div>

      {/* Contas a Pagar */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 rounded-t-xl transition-colors">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" /> Contas a Pagar
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{data.contasProximas.length}</Badge>
              </CardTitle>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-2">
                {data.contasProximas.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{c.descricao}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(c.data_vencimento)}</p>
                    </div>
                    <p className="text-sm font-semibold text-destructive">{mask(formatCurrency(c.valor))}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Últimas Movimentações */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 rounded-t-xl transition-colors">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Últimas Movimentações
              </CardTitle>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-2">
                {data.lancamentosRecentes.map(l => (
                  <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{l.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.categoria?.nome || l.tipo} • {formatDate(l.data_vencimento)}
                        {(l.status === "pago" || l.status === "recebido") ? <span className="ml-1 text-primary">✓</span> : <span className="ml-1 text-amber-500">🕐</span>}
                      </p>
                    </div>
                    <p className={cn("text-sm font-semibold", l.tipo === "receita" ? "text-green-600" : "text-destructive")}>
                      {l.tipo === "receita" ? "+" : "-"}{mask(formatCurrency(l.valor))}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

// ===== LANÇAMENTOS SECTION =====
const DemoLancamentos = () => {
  const { data } = useDemo();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Lançamentos</h1>
          <p className="text-sm text-muted-foreground">Controle de receitas e despesas</p>
        </div>
        <div className="relative">
          <Button className="rounded-full">+ Novo Lançamento</Button>
          <DemoActionOverlay label="Cadastre-se para criar lançamentos" />
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lancamentos.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.descricao}</TableCell>
                  <TableCell>
                    <Badge variant={l.tipo === "receita" ? "default" : "destructive"} className="text-[10px]">
                      {l.tipo === "receita" ? "Receita" : "Despesa"}
                    </Badge>
                  </TableCell>
                  <TableCell>{l.categoria}</TableCell>
                  <TableCell>{formatDate(l.data_vencimento)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn("text-[10px]",
                      (l.status === "pago" || l.status === "recebido") ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {l.status === "pago" ? "Pago" : l.status === "recebido" ? "Recebido" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold", l.tipo === "receita" ? "text-green-600" : "text-destructive")}>
                    {formatCurrency(l.valor)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

// ===== PROJETOS SECTION =====
const DemoProjetos = () => {
  const { data } = useDemo();
  const statusColors: Record<string, string> = { ativo: "bg-green-100 text-green-700", concluido: "bg-blue-100 text-blue-700", cancelado: "bg-destructive/10 text-destructive" };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground">Gerencie projetos e acompanhe o financeiro por projeto</p>
        </div>
        <div className="relative">
          <Button className="rounded-full">+ Novo Projeto</Button>
          <DemoActionOverlay label="Cadastre-se para criar projetos" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.projetos.map(p => (
          <Card key={p.id} className="hover:-translate-y-0.5 transition-all hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">{p.nome}</h3>
                <Badge className={cn("text-[10px]", statusColors[p.status] || "")}>
                  {p.status === "ativo" ? "Ativo" : p.status === "concluido" ? "Concluído" : "Cancelado"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{p.descricao}</p>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">Orçamento</span>
                <span className="text-sm font-bold text-primary">{formatCurrency(p.orcamento)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ===== CLIENTES SECTION =====
const DemoClientes = () => {
  const { data } = useDemo();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
        <div className="relative">
          <Button className="rounded-full">+ Novo Cliente</Button>
          <DemoActionOverlay label="Cadastre-se para gerenciar clientes" />
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.clientes.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.telefone}</TableCell>
                  <TableCell>{c.cpf_cnpj}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

// ===== FORNECEDORES SECTION =====
const DemoFornecedores = () => {
  const { data } = useDemo();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus fornecedores</p>
        </div>
        <div className="relative">
          <Button className="rounded-full">+ Novo Fornecedor</Button>
          <DemoActionOverlay label="Cadastre-se para gerenciar fornecedores" />
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.fornecedores.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell>{f.email}</TableCell>
                  <TableCell>{f.telefone || "—"}</TableCell>
                  <TableCell>{f.cpf_cnpj}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

// ===== RELATÓRIOS SECTION =====
const DemoRelatorios = () => {
  const { data } = useDemo();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Análise completa do seu financeiro</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Receitas</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalReceitas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Despesas</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(data.summary.totalDespesas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">Resultado</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(data.summary.totalReceitas - data.summary.totalDespesas)}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardChart data={data.monthlyChartData} saldoAtual={data.summary.saldoAtual} />
        <DashboardDonutChart receitas={data.summary.totalReceitas} despesas={data.summary.totalDespesas} saldo={data.summary.saldoAtual} />
      </div>
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-sm mb-3">Contas Bancárias</h3>
          <div className="space-y-3">
            {data.contasBancarias.map(cb => (
              <div key={cb.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{cb.nome}</p>
                  <p className="text-xs text-muted-foreground">{cb.banco}</p>
                </div>
                <p className="text-sm font-bold text-primary">{formatCurrency(cb.saldo_atual)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ===== MAIN DEMO PAGE =====
const DemoContent = () => {
  const [section, setSection] = useState<DemoSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const renderSection = () => {
    switch (section) {
      case "dashboard": return <DemoDashboard />;
      case "lancamentos": return <DemoLancamentos />;
      case "projetos": return <DemoProjetos />;
      case "clientes": return <DemoClientes />;
      case "fornecedores": return <DemoFornecedores />;
      case "relatorios": return <DemoRelatorios />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DemoCTABanner />

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-sidebar-border bg-sidebar shrink-0">
          <div className="px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-extrabold text-sidebar-foreground">Contabiliza AI</span>
            </div>
          </div>
          <nav className="flex-1 px-2 py-2 space-y-0.5">
            {sectionItems.map(item => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={cn(
                  "sidebar-link w-full",
                  section === item.key && "active"
                )}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-sidebar-border">
            <Button variant="outline" size="sm" className="w-full text-xs rounded-full" onClick={() => navigate("/register")}>
              <UserPlus className="h-3 w-3 mr-1" />
              Criar Conta Grátis
            </Button>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-sidebar-border bg-white/72 backdrop-blur-[14px] dark:bg-slate-900/80 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-14">
            {sectionItems.slice(0, 5).map(item => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[56px]",
                  section === item.key ? "text-primary font-semibold" : "text-sidebar-foreground/70"
                )}
              >
                <item.icon className={cn("h-5 w-5", section === item.key && "stroke-[2.5]")} />
                <span className={cn("text-[10px] leading-tight", section === item.key && "font-semibold")}>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-6">
          <div className="w-full px-3 py-4 md:px-6 md:py-6 max-w-full">
            <div className="animate-fade-in">
              {renderSection()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const DemoPage = () => (
  <DemoProvider>
    <DemoContent />
  </DemoProvider>
);

export default DemoPage;
