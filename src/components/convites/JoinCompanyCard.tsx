import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";

const JoinCompanyCard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({ title: "Erro", description: "Insira o código de convite.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-invite-code", {
        body: { code: code.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Bem-vindo!",
        description: `Você entrou na empresa "${data.empresaNome}". Recarregando...`,
      });

      // Reload to refresh auth context with new empresa
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Entrar em uma Empresa
        </CardTitle>
        <CardDescription>Insira o código de convite recebido para participar de outra empresa</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="Código de convite (ex: A1B2C3D4)"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            className="font-mono tracking-wider uppercase"
            maxLength={8}
          />
          <Button onClick={handleRedeem} disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Entrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JoinCompanyCard;
