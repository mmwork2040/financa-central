
import React, { useState } from "react";
import { MessageCircleQuestion, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const FloatingHelpButton: React.FC = () => {
  const { user, userProfile, empresaId } = useAuth();
  const [open, setOpen] = useState(false);
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!assunto.trim() || !mensagem.trim()) {
      toast.error("Preencha o assunto e a mensagem.");
      return;
    }
    if (!user || !empresaId || !userProfile) {
      toast.error("Usuário não autenticado.");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("fire-webhook", {
        body: {
          empresa_id: empresaId,
          evento: "Suporte Técnico",
          descricao: assunto.trim(),
          usuario: {
            id: user.id,
            nome: userProfile.nome,
            email: userProfile.email,
            telefone: userProfile.telefone || "",
          },
          acao: "suporte",
          assunto: assunto.trim(),
          mensagem: mensagem.trim(),
        },
      });

      if (error) throw error;

      const fired = data?.webhooks_fired || 0;
      if (fired > 0) {
        const r = data.results?.[0];
        const resultado = r?.campo_resposta_value;
        if (resultado) {
          toast.success(String(resultado));
        } else {
          toast.success("Mensagem enviada ao suporte com sucesso!");
        }
      } else {
        toast.warning("Nenhum webhook de suporte configurado. Entre em contato pelo canal oficial.");
      }

      setAssunto("");
      setMensagem("");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar mensagem ao suporte.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <MessageCircleQuestion className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Falar com o Suporte</DialogTitle>
            <DialogDescription>
              Envie sua dúvida ou solicitação para a equipe de suporte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assunto">Assunto *</Label>
              <Input
                id="assunto"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Ex: Dúvida sobre lançamento"
              />
            </div>
            <div>
              <Label htmlFor="mensagem">Mensagem *</Label>
              <Textarea
                id="mensagem"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Descreva sua dúvida ou solicitação..."
                className="min-h-[100px]"
              />
            </div>
            <Button onClick={handleSend} disabled={sending || !assunto.trim() || !mensagem.trim()} className="w-full">
              {sending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</> : "Enviar ao Suporte"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingHelpButton;
