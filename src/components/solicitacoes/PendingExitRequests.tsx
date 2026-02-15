import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, AlertTriangle } from "lucide-react";
import { SolicitacaoSaida } from "@/hooks/useSolicitacoesSaida";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingExitRequestsProps {
  requests: SolicitacaoSaida[];
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  loading?: boolean;
}

export const PendingExitRequests = ({
  requests,
  onApprove,
  onReject,
  loading,
}: PendingExitRequestsProps) => {
  if (requests.length === 0) return null;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Solicitações de Saída Pendentes ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((req) => {
          const expiresIn = formatDistanceToNow(new Date(req.expira_em), {
            locale: ptBR,
            addSuffix: true,
          });

          return (
            <div
              key={req.id}
              className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="font-medium">{req.user_nome}</div>
                <div className="text-xs text-muted-foreground">{req.user_email}</div>
                {req.empresa_nome && (
                  <Badge variant="outline" className="text-xs">
                    {req.empresa_nome}
                  </Badge>
                )}
                {req.motivo && (
                  <p className="text-sm text-muted-foreground italic">"{req.motivo}"</p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Auto-aprovação {expiresIn}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(req.id)}
                  disabled={loading}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
                <Button
                  size="sm"
                  onClick={() => onApprove(req.id)}
                  disabled={loading}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
