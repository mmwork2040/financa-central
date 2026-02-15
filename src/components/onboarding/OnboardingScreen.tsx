import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Ticket, Loader2, ArrowRight } from "lucide-react";

interface OnboardingScreenProps {
  userName: string;
}

const OnboardingScreen = ({ userName }: OnboardingScreenProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"choose" | "create" | "invite">("choose");
  const [loading, setLoading] = useState(false);
  const [empresaNome, setEmpresaNome] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreateEmpresa = async () => {
    if (!empresaNome.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-empresa", {
        body: { nomeEmpresa: empresaNome.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Empresa criada!", description: `"${empresaNome}" foi criada com sucesso.` });
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
          </div>
        )}

        {mode === "create" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Criar Empresa
              </CardTitle>
              <CardDescription>Informe o nome da sua empresa para começar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Nome da empresa"
                value={empresaNome}
                onChange={e => setEmpresaNome(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateEmpresa()}
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode("choose")} disabled={loading}>
                  Voltar
                </Button>
                <Button onClick={handleCreateEmpresa} disabled={loading || !empresaNome.trim()} className="flex-1">
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
