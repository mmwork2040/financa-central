import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  UsersRound } from
"lucide-react";

const features = [
{
  icon: BarChart3,
  title: "Dashboard Inteligente",
  description: "Visão completa das suas finanças com gráficos de fluxo de caixa e resumos em tempo real."
},
{
  icon: FileText,
  title: "Lançamentos",
  description: "Controle receitas e despesas com parcelas, recorrências, datas de vencimento e pagamento."
},
{
  icon: PieChart,
  title: "Relatórios",
  description: "Análises detalhadas por categoria, período e tendências para decisões estratégicas."
},
{
  icon: Building2,
  title: "Contas Bancárias",
  description: "Gerencie múltiplas contas com saldos atualizados automaticamente."
},
{
  icon: CreditCard,
  title: "Formas de Pagamento",
  description: "Cadastre e organize todas as formas de pagamento da sua empresa."
},
{
  icon: Tags,
  title: "Categorias",
  description: "Organize seus lançamentos por categorias personalizáveis de receita e despesa."
},
{
  icon: Truck,
  title: "Fornecedores",
  description: "Cadastro completo de fornecedores com dados de contato e documentos."
},
{
  icon: UsersRound,
  title: "Clientes",
  description: "Base de clientes integrada aos seus lançamentos financeiros."
},
{
  icon: Users,
  title: "Multi-Usuários",
  description: "Convide sua equipe com diferentes níveis de permissão: admin, usuário e leitura."
}];


const highlights = [
"Multi-empresa — participe de várias empresas com um único login",
"Códigos de convite para adicionar membros à equipe",
"Controle de permissões granular por usuário",
"Personalização com logo e cores da sua marca",
"Exportação de dados em múltiplos formatos",
"Interface responsiva para desktop e mobile"];


const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Fluxo de Contas</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Entrar
            </Button>
            <Button onClick={() => navigate("/register")}>
              Criar Conta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              Gestão financeira simplificada
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
              Controle suas finanças com{" "}
              <span className="text-primary">clareza e eficiência</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Plataforma completa para gerenciar receitas, despesas, contas bancárias e equipe.
              Multi-empresa, multi-usuário, totalmente personalizável.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button size="lg" onClick={() => navigate("/register")} className="text-base px-8">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }} className="text-base px-8">
                Conheça os Recursos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
            { value: "100%", label: "Gratuito" },
            { value: "Multi", label: "Empresas" },
            { value: "3", label: "Níveis de Acesso" },
            { value: "∞", label: "Lançamentos" }].
            map((stat) =>
            <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">
            Recursos completos para a gestão financeira da sua empresa.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) =>
          <Card key={feature.title} className="group hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Segurança e flexibilidade para sua empresa
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Projetado para empresas que precisam de controle total sobre suas finanças e equipe.
              </p>
              <div className="space-y-4">
                {highlights.map((item) =>
                <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
              { icon: Lock, title: "Dados Isolados", desc: "Cada empresa tem seus dados completamente isolados" },
              { icon: Shield, title: "Permissões", desc: "Controle quem pode ver, editar ou excluir dados" },
              { icon: Globe, title: "Multi-Empresa", desc: "Alterne entre empresas com um clique" },
              { icon: Zap, title: "Tempo Real", desc: "Dados atualizados instantaneamente" }].
              map((item) =>
              <Card key={item.title} className="p-4">
                  <item.icon className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Pronto para organizar suas finanças?
          </h2>
          <p className="text-muted-foreground text-lg">
            Crie sua conta em segundos e comece a usar agora. Sem cartão de crédito, sem compromisso.
          </p>
          <Button size="lg" onClick={() => navigate("/register")} className="text-base px-10">
            Criar Conta Gratuitamente
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Cntabiliza AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Fluxo de Contas. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>);

};

export default LandingPage;