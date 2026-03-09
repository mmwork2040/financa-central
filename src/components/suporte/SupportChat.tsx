
import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageCircle, Bot, User, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
export interface ChatMessage {
  id: string;
  remetente: string;
  conteudo: string;
  created_at: string;
}
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

interface SupportChatProps {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<boolean>;
  onClearChat: () => Promise<void>;
  loadingHistory: boolean;
}

const SupportChat = ({ chatOpen, setChatOpen, messages, onSendMessage, onClearChat, loadingHistory }: SupportChatProps) => {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (chatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    await onSendMessage(text);
    setSending(false);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        Chat com Suporte
      </h2>

      {!chatOpen ? (
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setChatOpen(true)}>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
              <MessageCircle className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold mb-1">Precisa de ajuda?</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Inicie uma conversa com nosso suporte e receba uma resposta em tempo real.
            </p>
            <Button>
              <MessageCircle className="h-4 w-4 mr-2" />
              Iniciar Conversa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3 bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Suporte Técnico</p>
                <p className="text-[10px] text-muted-foreground">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Limpar conversa">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Limpar conversa?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Todas as mensagens serão apagadas permanentemente. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onClearChat}>Limpar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>
                Minimizar
              </Button>
            </div>
          </div>

          <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Envie sua dúvida e nosso suporte responderá em instantes.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 max-w-[85%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                    msg.role === "user" ? "bg-primary/10" : "bg-accent"
                  )}>
                    {msg.role === "user" ? (
                      <User className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-accent-foreground" />
                    )}
                  </div>
                  <div className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border"
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={cn(
                      "text-[10px] mt-1",
                      msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}>
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="flex gap-2 mr-auto max-w-[85%]">
                <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 bg-accent">
                  <Bot className="h-3.5 w-3.5 text-accent-foreground" />
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
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Digite sua mensagem..."
              disabled={sending}
              className="text-sm"
            />
            <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SupportChat;
