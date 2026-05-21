import React, { useState, useEffect } from "react";
import { FileText, Search, ExternalLink, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, RefreshCw, Plus, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import PageHeader from "@/components/common/PageHeader";
import EmitirNotaManualDialog from "@/components/notas-fiscais/EmitirNotaManualDialog";
import NotaFiscalDetailDialog from "@/components/notas-fiscais/NotaFiscalDetailDialog";

const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ISSUED: { label: "Emitida", icon: CheckCircle2, variant: "default" },
  AUTHORIZED: { label: "Autorizada", icon: CheckCircle2, variant: "default" },
  PROCESSING: { label: "Processando", icon: Clock, variant: "secondary" },
  PENDING_EMISSION: { label: "Pendente", icon: Clock, variant: "outline" },
  REJECTED: { label: "Rejeitada", icon: XCircle, variant: "destructive" },
  ERROR: { label: "Erro", icon: AlertTriangle, variant: "destructive" },
};

const NotasFiscais = () => {
  const { empresaId } = useAuth();
  const isMobile = useIsMobile();
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [emitirOpen, setEmitirOpen] = useState(false);
  const [emittingId, setEmittingId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"todas" | "pendentes" | "emitidas">("todas");

  const fetchVendas = async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendas_digitais")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("data_venda", { ascending: false })
        .limit(500);

      if (error) throw error;
      setVendas(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar notas fiscais");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendas();
  }, [empresaId]);

  const emitOne = async (vendaId: string) => {
    setEmittingId(vendaId);
    try {
      const { data, error } = await supabase.functions.invoke("spedy-emit", {
        body: { venda_id: vendaId },
      });
      if (error || data?.error) {
        toast.error(data?.error || data?.details || error?.message || "Erro ao emitir");
      } else {
        toast.success("Nota enviada para emissão");
        fetchVendas();
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao emitir");
    } finally {
      setEmittingId(null);
    }
  };

  const isPending = (s: string | null) => !s || s === "PENDING_EMISSION" || s === "REJECTED" || s === "ERROR";
  const isIssued = (s: string | null) => s === "ISSUED" || s === "AUTHORIZED";

  const filtered = vendas.filter(v => {
    if (filterMode === "pendentes" && !isPending(v.invoice_status)) return false;
    if (filterMode === "emitidas" && !isIssued(v.invoice_status)) return false;
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      (v.cliente || "").toLowerCase().includes(term) ||
      (v.produto || "").toLowerCase().includes(term) ||
      (v.invoice_status || "").toLowerCase().includes(term)
    );
  });

  const stats = {
    total: vendas.length,
    emitidas: vendas.filter(v => isIssued(v.invoice_status)).length,
    pendentes: vendas.filter(v => !v.invoice_status || v.invoice_status === "PROCESSING" || v.invoice_status === "PENDING_EMISSION").length,
    erros: vendas.filter(v => v.invoice_status === "REJECTED" || v.invoice_status === "ERROR").length,
  };

  const renderStatus = (status: string | null) => {
    if (!status) {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> Não emitida
        </Badge>
      );
    }
    const config = statusConfig[status] || { label: status, icon: Clock, variant: "outline" as const };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notas Fiscais"
        description="Acompanhe as notas fiscais emitidas para suas vendas"
        icon={FileText}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.emitidas}</p>
            <p className="text-xs text-muted-foreground">Emitidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.pendentes}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.erros}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, produto ou status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border bg-card p-0.5">
          {(["todas", "pendentes", "emitidas"] as const).map(m => (
            <Button
              key={m}
              size="sm"
              variant={filterMode === m ? "default" : "ghost"}
              className="h-7 text-xs capitalize"
              onClick={() => setFilterMode(m)}
            >
              {m}
            </Button>
          ))}
        </div>
        <Button onClick={() => setEmitirOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> {!isMobile && "Emitir Nota"}
        </Button>
        <Button variant="outline" size="icon" onClick={fetchVendas} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Nenhuma nota fiscal encontrada</p>
              <p className="text-xs mt-1">As notas fiscais emitidas nas vendas aparecerão aqui</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    {!isMobile && <TableHead>Produto</TableHead>}
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    {!isMobile && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-sm">
                        {format(new Date(v.data_venda), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{v.cliente || "—"}</TableCell>
                      {!isMobile && <TableCell className="text-sm max-w-[150px] truncate">{v.produto || "—"}</TableCell>}
                      <TableCell className="text-sm text-right font-medium">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v.valor_bruto)}
                      </TableCell>
                      <TableCell>{renderStatus(v.invoice_status)}</TableCell>
                      {!isMobile && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {isPending(v.invoice_status) && v.invoice_status !== "PROCESSING" && (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 gap-1"
                                disabled={emittingId === v.id}
                                onClick={() => emitOne(v.id)}
                              >
                                {emittingId === v.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5" />
                                )}
                                Emitir
                              </Button>
                            )}
                            {v.invoice_pdf_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={v.invoice_pdf_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> PDF
                                </a>
                              </Button>
                            )}
                            {v.invoice_error_message && (
                              <span className="text-xs text-destructive truncate max-w-[200px]" title={v.invoice_error_message}>
                                {v.invoice_error_message}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EmitirNotaManualDialog
        open={emitirOpen}
        onOpenChange={setEmitirOpen}
        onSuccess={fetchVendas}
      />
    </div>
  );
};

export default NotasFiscais;
