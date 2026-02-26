import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { phoneInputMask } from "@/utils/format";

interface PhoneCompletionScreenProps {
  userId: string;
  userName: string;
  onComplete: () => void;
}

const PhoneCompletionScreen = ({ userId, userName, onComplete }: PhoneCompletionScreenProps) => {
  const { logout } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
    setPhone(phoneInputMask(raw));
  };

  const getRawPhone = () => phone.replace(/\D/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawPhone = getRawPhone();

    if (rawPhone.length < 10 || rawPhone.length > 11) {
      toast.error("Informe um número de telefone válido com DDD.");
      return;
    }

    setLoading(true);
    try {
      // Check uniqueness
      const { data: existing } = await supabase
        .from("perfis")
        .select("id")
        .eq("evolution_webhook_url", rawPhone)
        .neq("id", userId)
        .maybeSingle();

      if (existing) {
        toast.error("Este número de telefone já está cadastrado por outro usuário.");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("perfis")
        .update({ evolution_webhook_url: rawPhone })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Telefone cadastrado com sucesso!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar telefone.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Quase lá, {userName}! 📱</h1>
          <p className="text-muted-foreground">
            Para continuar, informe seu número de WhatsApp. Ele será usado para identificação no sistema.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-primary" />
              Telefone WhatsApp
            </CardTitle>
            <CardDescription>
              Informe seu número com DDD. Este número deve ser único e será vinculado à sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Número <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  autoFocus
                  className="text-center text-lg font-mono tracking-wider"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Continuar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhoneCompletionScreen;
