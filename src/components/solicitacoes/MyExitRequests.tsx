import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, CheckCircle, XCircle, Ban, AlertTriangle } from "lucide-react";
import { SolicitacaoSaida } from "@/hooks/useSolicitacoesSaida";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MyExitRequestsProps {
  requests: SolicitacaoSaida[];
  onCancel: (id: string) => Promise<boolean>;
  loading?: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", icon: <Clock className="h-3 w-3" />, variant: "secondary" },
  aprovado: { label: "Aprovado", icon: <CheckCircle className="h-3 w-3" />, variant: "default" },
  rejeitado: { label: "Rejeitado", icon: <XCircle className="h-3 w-3" />, variant: "destructive" },
  cancelado: { label: "Cancelado", icon: <Ban className="h-3 w-3" />, variant: "outline" },
};

export const MyExitRequests = ({
  requests,
  onCancel,
  loading,
}: MyExitRequestsProps) => {
  // Show all non-approved requests so the user always knows their status
  const visibleRequests = requests.filter(
    (r) => r.status !== "aprovado"
  );
  if (visibleRequests.length === 0) return null;

  return (
    <Card className="border-red-300 bg-red-50/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Minhas Solicitações de Saída
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleRequests.map((req) => {
          const config = statusConfig[req.status] || statusConfig.pendente;

          return (
            <div
              key={req.id}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm sm:text-base truncate">{req.empresa_nome}</span>
                  <Badge variant={config.variant} className="gap-1 text-xs shrink-0">
                    {config.icon}
                    {config.label}
                    {req.auto_aprovado && " (auto)"}
                  </Badge>
                </div>
                {req.motivo && (
                  <p className="text-xs sm:text-sm text-muted-foreground">Motivo: {req.motivo}</p>
                )}
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {format(new Date(req.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
              {req.status === "pendente" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(req.id)}
                  disabled={loading}
                  className="w-full sm:w-auto shrink-0"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
