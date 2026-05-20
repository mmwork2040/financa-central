import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, FileText, ArrowRight, Loader2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PendingImport = {
  id: string;
  nome_arquivo: string;
  created_at: string;
  modelo_ia: string | null;
  dados: any[];
  resumo: string | null;
};

interface ImportacoesPendentesProps {
  items: PendingImport[];
  onLoad: (item: PendingImport) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export const ImportacoesPendentes = ({ items, onLoad, onDelete, loading }: ImportacoesPendentesProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Importações Pendentes
        </CardTitle>
        <CardDescription>
          Análises anteriores que ainda não foram finalizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-background border border-border/50 gap-3"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium truncate">{item.nome_arquivo}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(item.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 h-4">
                      {item.dados.length} itens
                    </Badge>
                    {item.modelo_ia && (
                      <span className="text-[10px] text-muted-foreground">
                        IA: {item.modelo_ia}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => onLoad(item)}
                >
                  Continuar
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
