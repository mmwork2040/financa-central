import React from "react";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const NotificacoesDropdown = () => {
  const {
    notificacoes,
    unreadCount,
    marcarTodasComoLidas,
    excluirTodas,
    excluirNotificacao,
    marcarComoLida,
  } = useNotificacoes();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground px-0.5">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0 z-[60]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notificações</span>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  marcarTodasComoLidas();
                }}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Marcar lidas
              </Button>
            )}
            {notificacoes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  excluirTodas();
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Excluir todas
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <ScrollArea className="max-h-[60vh] overflow-y-auto">
          {notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.map((n) => {
                const tipoTrimmed = (n.tipo || '').trim();
                const isRecusada = tipoTrimmed === 'suporte_recusada';
                const isAprovada = tipoTrimmed === 'suporte_aprovada';
                const isAtualizada = tipoTrimmed === 'suporte_atualizada' || (tipoTrimmed.startsWith('suporte') && !isRecusada && !isAprovada);
                
                const borderColor = isRecusada
                  ? "border-l-4 border-l-destructive"
                  : isAprovada
                  ? "border-l-4 border-l-green-500"
                  : isAtualizada
                  ? "border-l-4 border-l-orange-400"
                  : "";

                const dotColor = isRecusada
                  ? "bg-destructive"
                  : isAprovada
                  ? "bg-green-500"
                  : isAtualizada
                  ? "bg-orange-400"
                  : !n.lida
                  ? "bg-primary"
                  : "bg-transparent";

                return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer",
                    !n.lida && "bg-primary/5",
                    borderColor
                  )}
                  onClick={() => {
                    if (!n.lida) marcarComoLida(n.id);
                  }}
                >
                  <div
                    className={cn(
                      "mt-1.5 h-2 w-2 rounded-full shrink-0",
                      dotColor
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{n.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.mensagem}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <button
                    className="shrink-0 mt-1 rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirNotificacao(n.id);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificacoesDropdown;
