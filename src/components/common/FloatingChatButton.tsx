
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Loader2, X, Send, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Conversa {
  id: string;
  status: string;
  created_at: string;
}

interface Mensagem {
  id: string;
  conversa_id: string;
  remetente: string;
  conteudo: string;
  created_at: string;
}

const FloatingChatButton: React.FC = () => {
  const { user, userProfile, empresaId } = useAuth();
  const [open, setOpen] = useState(false);
  const [chatAvailable, setChatAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [activeConversa, setActiveConversa] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  // Check if Chat webhook is configured and active
  useEffect(() => {
    const checkChat = async () => {
      if (!empresaId) { setChecking(false); return; }
      try {
        const { data } = await (supabase as any)
          .from("webhooks_empresa")
          .select("id")
          .eq("empresa_id", empresaId)
          .eq("ativo", true)
          .eq("nome", "Chat")
          .limit(1);
        setChatAvailable(data && data.length > 0);
      } catch { setChatAvailable(false); }
      setChecking(false);
    };
    checkChat();
  }, [empresaId]);

  // Load conversations
  const fetchConversas = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("conversas_chat")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setConversas(data || []);
  }, [user]);

  useEffect(() => {
    if (open && user) fetchConversas();
  }, [open, user, fetchConversas]);

  // Load messages for active conversation
  const fetchMensagens = useCallback(async () => {
    if (!activeConversa) return;
    setLoadingMsgs(true);
    const { data } = await (supabase as any)
      .from("mensagens_chat")
      .select("*")
      .eq("conversa_id", activeConversa.id)
      .order("created_at", { ascending: true });
    setMensagens(data || []);
    setLoadingMsgs(false);
  }, [activeConversa]);

  useEffect(() => {
    if (activeConversa) fetchMensagens();
  }, [activeConversa, fetchMensagens]);

  // Realtime subscription for messages in active conversation
  useEffect(() => {
    if (!activeConversa) return;
    const channel = supabase
      .channel(`chat-${activeConversa.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens_chat", filter: `conversa_id=eq.${activeConversa.id}` },
        (payload: any) => {
          const newMsg = payload.new as Mensagem;
          setMensagens((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // If message is from sistema and chat is closed, auto-open and increment unread
          if (newMsg.remetente === "sistema") {
            if (!openRef.current) {
              setUnreadCount((c) => c + 1);
              setOpen(true); // Auto-open on response
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConversa]);

  // Global realtime: listen for ANY new system message across user's conversations
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chat-global-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens_chat" },
        (payload: any) => {
          const newMsg = payload.new as Mensagem;
          if (newMsg.remetente !== "sistema") return;
          // Check if this conversation belongs to the user
          const isActive = activeConversa?.id === newMsg.conversa_id;
          if (!openRef.current) {
            setUnreadCount((c) => c + 1);
            setOpen(true); // Priority: auto-open chat
          } else if (!isActive) {
            // Chat is open but viewing different conversation
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activeConversa]);

  // Clear unread when opening chat
  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      setShowTooltip(false);
    }
  }, [open]);

  // Show tooltip popup on first visit (once per session)
  useEffect(() => {
    if (!chatAvailable || checking) return;
    const key = `chat_tooltip_shown_${user?.id}`;
    const alreadyShown = sessionStorage.getItem(key);
    if (!alreadyShown) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        sessionStorage.setItem(key, "true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [chatAvailable, checking, user?.id]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const startNewConversa = async () => {
    if (!user || !empresaId) return;
    const { data, error } = await (supabase as any)
      .from("conversas_chat")
      .insert({ user_id: user.id, empresa_id: empresaId })
      .select()
      .single();
    if (error) { toast.error("Erro ao iniciar conversa"); return; }
    setConversas((prev) => [data, ...prev]);
    setActiveConversa(data);
    setMensagens([]);
  };

  const handleSend = async () => {
    if (!inputMsg.trim() || !activeConversa || sending) return;
    const msg = inputMsg.trim();
    setInputMsg("");
    setSending(true);

    try {
      // Insert user message
      await (supabase as any).from("mensagens_chat").insert({
        conversa_id: activeConversa.id,
        remetente: "usuario",
        conteudo: msg,
      });

      // Fire webhook
      const { data, error } = await supabase.functions.invoke("fire-webhook", {
        body: {
          empresa_id: empresaId,
          evento: "Chat",
          descricao: msg,
          mensagem: msg,
          conversa_id: activeConversa.id,
          usuario: {
            id: user?.id,
            nome: userProfile?.nome,
            email: userProfile?.email,
            telefone: userProfile?.evolution_webhook_url || "",
          },
          acao: "Chat",
        },
      });

      if (error) throw error;

      // Extract response
      const fired = data?.webhooks_fired || 0;
      if (fired > 0) {
        const r = data.results?.[0];
        let resposta = r?.campo_resposta_value || r?.response?.message || r?.response?.resultado || "";
        if (typeof r?.response === "string") resposta = r.response;
        if (!resposta && r?.response && typeof r.response === "object") {
          resposta = JSON.stringify(r.response);
        }
        if (resposta) {
          await (supabase as any).from("mensagens_chat").insert({
            conversa_id: activeConversa.id,
            remetente: "sistema",
            conteudo: String(resposta),
          });
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar mensagem");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const endConversa = async () => {
    if (!activeConversa) return;
    await (supabase as any)
      .from("conversas_chat")
      .update({ status: "encerrada" })
      .eq("id", activeConversa.id);
    setActiveConversa(null);
    fetchConversas();
  };

  const deleteAllConversas = async () => {
    if (!user) return;
    await (supabase as any)
      .from("conversas_chat")
      .delete()
      .eq("user_id", user.id);
    setConversas([]);
    setActiveConversa(null);
    setMensagens([]);
    setDeleteAllOpen(false);
    toast.success("Todas as conversas foram excluídas.");
  };

  if (checking || !chatAvailable) return null;

  const content = (
    <>
      <Button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[9999] h-14 w-14 rounded-full shadow-xl relative bg-primary hover:bg-primary/90"
        size="icon"
        style={{ position: 'fixed', right: '1rem' }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Tooltip popup */}
      {showTooltip && !open && (
        <div className="fixed bottom-36 md:bottom-[5.5rem] right-4 md:right-6 z-[9999] animate-fade-in" style={{ position: 'fixed' }}>
          <div
            className="bg-card border border-border shadow-2xl rounded-2xl p-4 max-w-[280px] cursor-pointer group hover:shadow-primary/10 transition-shadow relative"
            onClick={() => { setShowTooltip(false); setOpen(true); }}
          >
            <button
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-snug">Assistente Inteligente</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Você pode fazer lançamentos e controlar relatórios pelo seu assistente inteligente, <span className="text-primary font-medium">clique aqui para acessar</span>.
                </p>
              </div>
            </div>
            {/* Arrow pointing down to the button */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card border-r border-b border-border rotate-45" />
          </div>
        </div>
      )}

      {open && (
        <div className="fixed bottom-24 right-6 z-[9998] w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <h3 className="font-semibold text-sm">Chat</h3>
            <div className="flex gap-1">
              {activeConversa && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={endConversa} title="Encerrar conversa">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
              {conversas.length > 0 && !activeConversa && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteAllOpen(true)} title="Excluir todas as conversas">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {activeConversa ? (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {loadingMsgs ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : mensagens.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Envie uma mensagem para iniciar</p>
                ) : (
                  mensagens.map((m) => (
                    <div key={m.id} className={cn("flex", m.remetente === "usuario" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap",
                        m.remetente === "usuario"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}>
                        {m.conteudo}
                      </div>
                    </div>
                  ))
                )}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-md">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              {activeConversa.status === "ativa" && (
                <div className="p-3 border-t border-border flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 text-sm"
                    disabled={sending}
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={sending || !inputMsg.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {activeConversa.status === "encerrada" && (
                <div className="p-3 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">Conversa encerrada</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => { setActiveConversa(null); }}>
                    Voltar às conversas
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Conversations List */
            <div className="flex-1 overflow-y-auto">
              <div className="p-3">
                <Button onClick={startNewConversa} className="w-full" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" /> Nova Conversa
                </Button>
              </div>
              {conversas.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhuma conversa ainda</p>
              ) : (
                <div className="space-y-1 px-3 pb-3">
                  {conversas.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveConversa(c)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          Conversa
                        </span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full",
                          c.status === "ativa" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                        )}>
                          {c.status === "ativa" ? "Ativa" : "Encerrada"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(c.created_at).toLocaleString("pt-BR")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent className="z-[10000]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todas as conversas</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir todas as suas conversas? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAllConversas} className="bg-destructive hover:bg-destructive/90">
              Excluir Todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
};

export default FloatingChatButton;
