import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Ticket, Loader2, ArrowRight, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingScreenProps {
  userName: string;
}

const OnboardingScreen = ({ userName }: OnboardingScreenProps) => {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [mode, setMode] = useState<"choose" | "create" | "invite">("choose");
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [empresa, setEmpresa] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
  });

  const handleChange = (field: string, value: string) => {
    setEmpresa(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateEmpresa = async () => {
    if (!empresa.nome.trim()) {
      toast({ title: "Erro", description: "O nome da empresa é obrigatório.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-empresa", {
        body: {
          nomeEmpresa: empresa.nome.trim(),
          cnpj: empresa.cnpj.trim() || null,
          email: empresa.email.trim() || null,
          telefone: empresa.telefone.trim() || null,
          endereco: empresa.endereco.trim() || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Empresa criada!", description: `"${empresa.nome}" foi criada com sucesso.` });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemInvite = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-invite-code", {
        body: { code: inviteCode.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Bem-vindo!", description: `Você entrou na empresa "${data.empresaNome}".` });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {userName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Para começar, escolha como deseja acessar o sistema.
          </p>
        </div>

        {mode === "choose" && (
          <div className="grid gap-4">
            <Card
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => setMode("create")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Criar minha empresa
                </CardTitle>
                <CardDescription>
                  Crie uma nova empresa e comece a gerenciar suas finanças.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-end">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => setMode("invite")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ticket className="h-5 w-5 text-primary" />
                  Tenho um código de convite
                </CardTitle>
                <CardDescription>
                  Insira o código recebido para entrar em uma empresa existente.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-end">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center pt-2">
              <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                Sair do sistema
              </Button>
            </div>
          </div>
        )}

        {mode === "create" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Cadastrar Empresa
              </CardTitle>
              <CardDescription>Preencha os dados da sua empresa para começar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa <span className="text-destructive">*</span></Label>
                <Input
                  id="nome"
                  placeholder="Nome da sua empresa"
                  value={empresa.nome}
                  onChange={e => handleChange("nome", e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CPF/CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={empresa.cnpj}
                  onChange={e => handleChange("cnpj", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="empresa@email.com"
                  value={empresa.email}
                  onChange={e => handleChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={empresa.telefone}
                  onChange={e => handleChange("telefone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  placeholder="Rua, número, cidade - UF"
                  value={empresa.endereco}
                  onChange={e => handleChange("endereco", e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setMode("choose")} disabled={loading}>
                  Voltar
                </Button>
                <Button onClick={handleCreateEmpresa} disabled={loading || !empresa.nome.trim()} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Empresa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === "invite" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Código de Convite
              </CardTitle>
              <CardDescription>Insira o código de 8 caracteres recebido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Ex: A1B2C3D4"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                className="font-mono tracking-wider uppercase text-center text-lg"
                maxLength={8}
                onKeyDown={e => e.key === "Enter" && handleRedeemInvite()}
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode("choose")} disabled={loading}>
                  Voltar
                </Button>
                <Button onClick={handleRedeemInvite} disabled={loading || !inviteCode.trim()} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Entrar na Empresa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;
