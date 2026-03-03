
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Shield,
  Users,
  FileText,
  CreditCard,
  Building2,
  PieChart,
  ArrowRight,
  CheckCircle2,
  Zap,
  Lock,
  Globe,
  Tags,
  Truck,
  UsersRound,
  Star,
  Award,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Dashboard Inteligente",
    description: "Visão completa das suas finanças com gráficos de fluxo de caixa e resumos em tempo real.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: FileText,
    title: "Lançamentos",
    description: "Controle receitas e despesas com parcelas, recorrências, datas de vencimento e pagamento.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: PieChart,
    title: "Relatórios",
    description: "Análises detalhadas por categoria, período e tendências para decisões estratégicas.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Building2,
    title: "Contas Bancárias",
    description: "Gerencie múltiplas contas com saldos atualizados automaticamente.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: CreditCard,
    title: "Formas de Pagamento",
    description: "Cadastre e organize todas as formas de pagamento da sua empresa.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Tags,
    title: "Categorias",
    description: "Organize seus lançamentos por categorias personalizáveis de receita e despesa.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Truck,
    title: "Fornecedores",
    description: "Cadastro completo de fornecedores com dados de contato e documentos.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: UsersRound,
    title: "Clientes",
    description: "Base de clientes integrada aos seus lançamentos financeiros.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: Users,
    title: "Multi-Usuários",
    description: "Convide sua equipe com diferentes níveis de permissão: admin, usuário e leitura.",
    color: "bg-blue-100 text-blue-600",
  },
];

const highlights = [
  "Multi-empresa — participe de várias empresas com um único login",
  "Códigos de convite para adicionar membros à equipe",
  "Controle de permissões granular por usuário",
  "Personalização com logo e cores da sua marca",
  "Exportação de dados em múltiplos formatos",
  "Interface responsiva para desktop e mobile",
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen landing-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-surface glass-shadow">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-heading text-foreground">Contabiliza AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="btn-pill-secondary !px-6 !py-2 text-sm"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate("/register")}
              className="btn-pill-primary !px-6 !py-2 text-sm"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass-surface glass-shadow-lg rounded-3xl p-8 md:p-14">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left column */}
              <div className="space-y-6">
                <div className="animate-fade-in inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">+500 empresas usando</span>
                </div>

                <h1 className="animate-slide-up font-heading text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-tight">
                  Gestão financeira com{" "}
                  <span className="text-primary">Inteligência Artificial</span>
                </h1>

                <p className="animate-slide-up animate-delay-200 text-lg text-muted-foreground max-w-xl">
                  Plataforma completa para gerenciar receitas, despesas, contas bancárias e equipe.
                  Tudo com o auxílio de Inteligência Artificial.
                </p>

                <div className="animate-slide-up animate-delay-400 flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => navigate("/register")}
                    className="btn-pill-primary"
                  >
                    Começar Gratuitamente
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="btn-pill-secondary"
                  >
                    Conheça os Recursos
                  </button>
                </div>

                <div className="animate-slide-up animate-delay-600 flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">4.9/5</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Certificado</span>
                  </div>
                </div>
              </div>

              {/* Right column - visual card stack */}
              <div className="animate-slide-up animate-delay-400 hidden lg:flex flex-col gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-white p-6 glass-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Dashboard em Tempo Real</p>
                      <p className="text-sm text-muted-foreground">Métricas atualizadas automaticamente</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Receitas", value: "R$ 42.5k", color: "text-green-600" },
                      { label: "Despesas", value: "R$ 28.3k", color: "text-red-500" },
                      { label: "Saldo", value: "R$ 14.2k", color: "text-blue-600" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-white/80 p-3 text-center">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className={`font-semibold ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-white p-5 glass-shadow">
                    <PieChart className="h-8 w-8 text-blue-600 mb-2" />
                    <p className="font-semibold text-foreground text-sm">Relatórios Inteligentes</p>
                    <p className="text-xs text-muted-foreground mt-1">Análises por IA</p>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-green-50 to-white p-5 glass-shadow">
                    <Shield className="h-8 w-8 text-green-600 mb-2" />
                    <p className="font-semibold text-foreground text-sm">Multi-empresa</p>
                    <p className="text-xs text-muted-foreground mt-1">Dados isolados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "100%", label: "Gratuito" },
            { value: "Multi", label: "Empresas" },
            { value: "3", label: "Níveis de Acesso" },
            { value: "∞", label: "Lançamentos" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-surface glass-shadow rounded-2xl p-6 text-center animate-slide-up"
            >
              <div className="text-3xl md:text-4xl font-bold font-heading text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">
            Recursos completos para a gestão financeira da sua empresa.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-[#f1f2f3] p-6 transition-all duration-300 hover:bg-gray-100 hover:shadow-lg cursor-default"
            >
              <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">
              Segurança e flexibilidade para sua empresa
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Projetado para empresas que precisam de controle total sobre suas finanças e equipe.
            </p>
            <div className="space-y-4">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Lock, title: "Dados Isolados", desc: "Cada empresa tem seus dados completamente isolados", gradient: "from-blue-50 to-white" },
              { icon: Shield, title: "Permissões", desc: "Controle quem pode ver, editar ou excluir dados", gradient: "from-purple-50 to-white" },
              { icon: Globe, title: "Multi-Empresa", desc: "Alterne entre empresas com um clique", gradient: "from-orange-50 to-white" },
              { icon: Zap, title: "Tempo Real", desc: "Dados atualizados instantaneamente", gradient: "from-green-50 to-white" },
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-2xl bg-gradient-to-br ${item.gradient} p-5 glass-shadow transition-all duration-300 hover:scale-105`}
              >
                <item.icon className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass-surface glass-shadow-lg rounded-3xl p-10 md:p-14 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">
            Pronto para organizar suas finanças?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Crie sua conta em segundos e comece a usar agora. Sem cartão de crédito, sem compromisso.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="btn-pill-primary text-base !px-10 !py-4"
          >
            Criar Conta Gratuitamente
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold font-heading text-foreground">ContabilizaAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ContabilizaAI. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
