import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, FileText, Loader2, Copy, FileCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  venda: any | null;
}

const NotaFiscalDetailDialog: React.FC<Props> = ({ open, onOpenChange, venda }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !venda) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("logs_integracoes")
          .select("*")
          .eq("plataforma", "spedy")
          .eq("empresa_id", venda.empresa_id)
          .order("created_at", { ascending: false })
          .limit(50);
        const related = (data || []).filter(
          (l: any) => l.payload?.venda_id === venda.id
        );
        setLogs(related);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, venda]);

  if (!venda) return null;

  const copyJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    toast.success("Copiado");
  };

  const lastLog = logs[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Detalhes da Nota Fiscal
          </DialogTitle>
          <DialogDescription>
            Visualize a nota emitida e o retorno bruto da API para conferência.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo */}
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-medium">{venda.cliente || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Documento</p>
            <p className="font-medium">{venda.cliente_documento || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Produto</p>
            <p className="font-medium">{venda.produto || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="font-medium">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(venda.valor_bruto || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Data da venda</p>
            <p className="font-medium">
              {venda.data_venda ? format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant="outline">{venda.invoice_status || "Não emitida"}</Badge>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">ID Spedy (order)</p>
            <p className="font-mono text-xs break-all">{venda.spedy_order_id || "—"}</p>
          </div>
          {venda.invoice_error_message && (
            <div className="sm:col-span-2 rounded-md border border-destructive/40 bg-destructive/5 p-2">
              <p className="text-xs text-destructive font-medium">Mensagem de erro</p>
              <p className="text-xs">{venda.invoice_error_message}</p>
            </div>
          )}
        </div>

        {/* Documentos */}
        <div className="flex flex-wrap gap-2">
          {venda.invoice_pdf_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={venda.invoice_pdf_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Ver DANFE (PDF)
              </a>
            </Button>
          )}
          {venda.invoice_xml_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={venda.invoice_xml_url} target="_blank" rel="noopener noreferrer">
                <FileCode className="h-3.5 w-3.5 mr-1.5" /> Baixar XML
              </a>
            </Button>
          )}
        </div>

        {/* PDF Preview */}
        {venda.invoice_pdf_url && (
          <div className="rounded-md border overflow-hidden bg-muted">
            <iframe
              src={venda.invoice_pdf_url}
              title="DANFE"
              className="w-full h-[500px]"
            />
          </div>
        )}

        {/* API logs */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Retorno da API (Spedy)</h3>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">
              Nenhum log de API encontrado para esta nota.
            </p>
          ) : (
            <Tabs defaultValue="response">
              <TabsList>
                <TabsTrigger value="response">Resposta</TabsTrigger>
                <TabsTrigger value="request">Requisição</TabsTrigger>
                <TabsTrigger value="history">Histórico ({logs.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="response">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Status HTTP: {lastLog?.payload?.response_status} · {format(new Date(lastLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => copyJson(lastLog?.payload?.response_body)}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                  </Button>
                </div>
                <pre className="text-[11px] bg-muted rounded p-3 overflow-x-auto max-h-72">
                  {JSON.stringify(lastLog?.payload?.response_body, null, 2)}
                </pre>
              </TabsContent>
              <TabsContent value="request">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground break-all">{lastLog?.payload?.request_url}</span>
                  <Button variant="ghost" size="sm" onClick={() => copyJson(lastLog?.payload?.request_payload)}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                  </Button>
                </div>
                <pre className="text-[11px] bg-muted rounded p-3 overflow-x-auto max-h-72">
                  {JSON.stringify(lastLog?.payload?.request_payload, null, 2)}
                </pre>
              </TabsContent>
              <TabsContent value="history" className="space-y-2">
                {logs.map((l) => (
                  <div key={l.id} className="rounded border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{l.evento}</span>
                      <Badge variant={l.status === "success" ? "default" : "destructive"} className="text-[10px]">
                        {l.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      {format(new Date(l.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })} · HTTP {l.payload?.response_status}
                    </p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotaFiscalDetailDialog;
