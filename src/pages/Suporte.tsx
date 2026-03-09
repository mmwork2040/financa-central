
import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Send, Loader2, MessageCircle, Bot, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/common/PageHeader";

const FAQ_ITEMS = [
  {
    pergunta: "Como cadastrar um novo lançamento?",
    resposta: "Acesse o menu Lançamentos, clique em 'Novo Lançamento', preencha os campos obrigatórios (descrição, valor, data de vencimento e tipo) e clique em Salvar. Você também pode criar lançamentos via chat no Telegram.",
  },
  {
    pergunta: "Como emitir uma nota fiscal?",
    resposta: "Na página de Vendas Digitais, localize a venda desejada e clique no botão 'Emitir NF'. Para utilizar essa funcionalidade, é necessário ter a integração fiscal configurada nas Configurações da Empresa.",
  },
  {
    pergunta: "Como adicionar uma nova conta bancária?",
    resposta: "Vá em Cadastros > Contas Bancárias e clique em 'Nova Conta Bancária'. Preencha o nome, selecione o banco (ou digite manualmente), informe agência, conta e saldo inicial.",
  },
  {
    pergunta: "Como configurar integrações?",
    resposta: "Acesse Configurações > Integrações. Lá você encontrará as plataformas disponíveis (Hotmart, Kiwify, Shopify, etc). Insira a API Key da plataforma desejada e ative a integração.",
  },
  {
    pergunta: "Como convidar outros usuários para a empresa?",
    resposta: "Em Cadastros > Usuários, clique em 'Gerar Código de Convite'. Defina o perfil de acesso e compartilhe o código gerado com o novo usuário, que poderá usá-lo ao fazer login.",
  },
  {
    pergunta: "Como funciona o controle de permissões?",
    resposta: "Administradores podem acessar a página Permissões pelo menu lateral. Lá é possível definir, para cada usuário, quais telas ele pode acessar e quais ações (incluir, alterar, excluir) são permitidas.",
  },
  {
    pergunta: "Como ver meus relatórios financeiros?",
    resposta: "Acesse o menu Relatórios para visualizar resumos financeiros, gráficos de fluxo de caixa, análise por categoria, tendências e análise preditiva. Use os filtros de período para refinar os dados.",
  },
  {
    pergunta: "Como funciona a recorrência de lançamentos?",
    resposta: "Ao criar um lançamento, ative a opção 'Recorrente' e defina o tipo (mensal, semanal, etc.) e a data de término. O sistema gerará automaticamente os lançamentos futuros.",
  },
  {
    pergunta: "Como transferir valores entre contas bancárias?",
    resposta: "Na página Contas Bancárias, clique no botão 'Transferir' (disponível quando há 2+ contas). Selecione a conta de origem, a conta de destino e o valor da transferência.",
  },
  {
    pergunta: "Como alterar meu plano de assinatura?",
    resposta: "Clique em 'Ver Planos' no banner superior ou acesse o menu de configurações. Escolha o plano desejado e siga as instruções de pagamento.",
  },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const Suporte = () => {
  const { empresaId, user, userProfile } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !empresaId) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("fire-webhook", {
        body: {
          empresa_id: empresaId,
          evento: "Suporte Técnico",
          descricao: text,
          mensagem: text,
          usuario: {
            id: user?.id || "",
            nome: userProfile?.nome || "",
            email: userProfile?.email || "",
            telefone: (userProfile as any)?.evolution_webhook_url || "",
            telegram_id: (userProfile as any)?.telegram_id || "",
          },
          acao: "suporte_chat",
        },
      });

      if (error) throw error;

      const fired = data?.webhooks_fired || 0;
      let resposta = "";

      if (fired > 0) {
        const result = data.results?.[0];
        resposta = result?.campo_resposta_value || result?.response?.resultado || "";

        if (typeof resposta === "object") {
          resposta = JSON.stringify(resposta);
        }
      }

      if (!resposta) {
        resposta = "Sua mensagem foi recebida pelo suporte. Em breve entraremos em contato.";
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: resposta,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error("Erro ao enviar mensagem ao suporte");
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Desculpe, houve um erro ao processar sua mensagem. Tente novamente em alguns instantes.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Ajuda"
        description="Encontre respostas para dúvidas frequentes ou fale com nosso suporte."
        icon={HelpCircle}
      />

      {/* FAQ Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Perguntas Frequentes
        </h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, index) => (
            <Card key={index} className="overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium text-sm pr-4">{item.pergunta}</span>
                {openFaq === index ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {openFaq === index && (
                <CardContent className="pt-0 pb-4 px-4 border-t">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.resposta}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Chat Section */}
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
              <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>
                Minimizar
              </Button>
            </div>

            <div
              ref={scrollRef}
              className="h-80 overflow-y-auto p-4 space-y-3 bg-muted/20"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Envie sua dúvida e nosso suporte responderá em instantes.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
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
              ))}

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
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                disabled={sending}
                className="text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={sending || !input.trim()}
                size="icon"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Suporte;
