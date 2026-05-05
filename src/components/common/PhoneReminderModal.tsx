
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Save, Loader2, X } from "lucide-react";
import { phoneInputMask } from "@/utils/format";

const REMINDER_INTERVAL = 12 * 60 * 60 * 1000; // 12 horas em milisegundos

export const PhoneReminderModal = () => {
  const { userProfile, user, refreshProfile, needsPhone } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (needsPhone) {
      const lastReminder = localStorage.getItem("lastPhoneReminder");
      const now = Date.now();

      if (!lastReminder || now - parseInt(lastReminder) > REMINDER_INTERVAL) {
        setIsOpen(true);
      }
    }
  }, [needsPhone]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
    setPhone(phoneInputMask(raw));
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("lastPhoneReminder", Date.now().toString());
  };

  const handleSave = async () => {
    const rawPhone = phone.replace(/\D/g, "");
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
        .neq("id", user!.id)
        .maybeSingle();

      if (existing) {
        toast.error("Este número de telefone já está cadastrado por outro usuário.");
        setLoading(false);
        return;
      }

      const { error } = await (supabase as any)
        .from("perfis")
        .update({ evolution_webhook_url: rawPhone })
        .eq("id", user!.id);

      if (error) throw error;

      toast.success("Telefone atualizado com sucesso!");
      await refreshProfile();
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar telefone");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Atualize seu Telefone</DialogTitle>
          <DialogDescription className="text-center">
            Para aproveitar ao máximo as automações e o assistente de IA via WhatsApp, precisamos que você informe seu número.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-phone">Número do WhatsApp</Label>
            <Input
              id="reminder-phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className="font-mono"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Formato: (DDD) + número. Ex: (11) 99999-9999
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleClose} className="w-full sm:w-auto">
            Lembrar depois
          </Button>
          <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Telefone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
