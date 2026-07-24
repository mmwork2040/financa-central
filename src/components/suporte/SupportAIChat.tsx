import React, { useEffect, useRef, useState } from "react";
import { Headphones, Send, Loader2, MessageCircle, User, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Msg = { role: "user" | "assistant"; content: string; ts: Date };

const STORAGE_KEY = "support-ai-chat:history";

const loadHistory = (): Msg[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ role: "user" | "assistant"; content: string; ts: string }>;
    return parsed.map((m) => ({ ...m, ts: new Date(m.ts) }));
  } catch {
    return [];
  }
};

const SupportAIChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  const clearHistory = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    toast.success("Conversa limpa");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: "user" as const, content: text, ts: new Date() }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("support-ai-chat", {
        body: { messages: next.map((m) => ({ role: m.role, content: m.content })) },
      });
      if (error) throw error;
      const reply = (data as any)?.reply || "Sem resposta.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply, ts: new Date() }]);
    } catch (e: any) {
      toast.error("Falha ao consultar o suporte", { description: e?.message?.slice(0, 200) });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        Agente de Suporte
      </h2>

      {!open ? (
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setOpen(true)}>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
              <Headphones className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold mb-1">Fale com o Agente de Suporte</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Tire dúvidas rápidas sobre o uso do sistema com nosso agente de suporte.
            </p>
            <Button>
              <MessageCircle className="h-4 w-4 mr-2" />
              Iniciar conversa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3 bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Headphones className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Agente de Suporte</p>
                <p className="text-[10px] text-muted-foreground">Respostas objetivas</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" title="Limpar conversa">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Iniciar nova conversa?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso apagará todo o histórico da conversa atual com o Agente de Suporte. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={clearHistory}>Limpar e iniciar nova</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Minimizar
              </Button>
            </div>
          </div>



          <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Headphones className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Pergunte sobre lançamentos, notas fiscais, integrações, relatórios...
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={cn("flex gap-2 max-w-[85%]", m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                  <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0", m.role === "user" ? "bg-primary/10" : "bg-accent")}>
                    {m.role === "user" ? <User className="h-3.5 w-3.5 text-primary" /> : <Headphones className="h-3.5 w-3.5 text-accent-foreground" />}
                  </div>
                  <div className={cn("rounded-lg px-3 py-2 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border")}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p className={cn("text-[10px] mt-1", m.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground")}>
                      {m.ts.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex gap-2 mr-auto max-w-[85%]">
                <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 bg-accent">
                  <Headphones className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
                <div className="rounded-lg px-3 py-2 text-sm bg-card border">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-3 flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Digite sua dúvida..."
              disabled={sending}
              className="text-sm"
            />
            <Button onClick={send} disabled={sending || !input.trim()} size="icon">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SupportAIChat;
