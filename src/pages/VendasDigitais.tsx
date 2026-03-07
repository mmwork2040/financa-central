import React, { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Search, RefreshCw, X, Plug, CheckCircle2, AlertTriangle, Plus, Eye, Edit, Trash2, FileText, Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ExportDropdown from "@/components/common/ExportDropdown";
import { exportVendas } from "@/components/vendas/VendasExport";
import VendaFormDialog from "@/components/vendas/VendaFormDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PLATAFORMAS_VENDAS = ["hotmart", "eduzz", "monetizze", "kiwify"];

const VendasDigitais = () => {
  const { empresaId, canPerformAction, isSuperAdmin } = useAuth();
  const canIncluir = canPerformAction("vendas_digitais", "pode_incluir");
  const canAlterar = canPerformAction("vendas_digitais", "pode_alterar");
  const canExcluir = canPerformAction("vendas_digitais", "pode_excluir");
  const navigate = useNavigate();
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroPlataforma, setFiltroPlataforma] = useState<string>("all");
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingVenda, setEditingVenda] = useState<any>(null);
  const [detailVenda, setDetailVenda] = useState<any>(null);
  const [deleteVenda, setDeleteVenda] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [emittingId, setEmittingId] = useState<string | null>(null);
  const [confirmEmitVenda, setConfirmEmitVenda] = useState<any>(null);
  const [spedyConfig, setSpedyConfig] = useState<any>(null);
  const [loadingSpedyConfig, setLoadingSpedyConfig] = useState(false);

  const plataformas = useMemo(() => {
    const set = new Set(vendas.map(v => v.plataforma).filter(Boolean));
    return Array.from(set).sort();
  }, [vendas]);

  const hasActiveFilters = filtroPlataforma !== "all" || filtroStatus !== "all" || !!dataInicio || !!dataFim;

  const clearFilters = () => {
    setFiltroPlataforma("all");
    setFiltroStatus("all");
    setDataInicio(undefined);
    setDataFim(undefined);
    setSearch("");
  };

  useEffect(() => {
    fetchVendas();
    fetchConnectedPlatforms();
  }, [empresaId]);

  const fetchConnectedPlatforms = async () => {
    if (!empresaId) return;
    try {
      const { data } = await (supabase as any)
        .from('integracoes')
        .select('plataforma, ativo')
        .eq('empresa_id', empresaId)
        .in('plataforma', PLATAFORMAS_VENDAS)
        .eq('ativo', true);
      setConnectedPlatforms((data || []).map((i: any) => i.plataforma));
    } catch (error) {
      console.error("Erro ao carregar plataformas:", error);
    }
  };

  const fetchVendas = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('vendas_digitais')
        .select('*')
        .order('data_venda', { ascending: false });
      if (error) throw error;
      setVendas(data || []);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVenda = async () => {
    if (!deleteVenda) return;
    setDeleting(true);
    try {
      // Delete linked lancamento if exists
      if (deleteVenda.lancamento_id) {
        await supabase.from("lancamentos").delete().eq("id", deleteVenda.lancamento_id);
      }
      // Delete the venda
      const { error } = await (supabase as any)
        .from("vendas_digitais")
        .delete()
        .eq("id", deleteVenda.id);
      if (error) throw error;
      setVendas(vendas.filter(v => v.id !== deleteVenda.id));
      toast.success("Venda excluída com sucesso");
      setDeleteVenda(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir venda");
    } finally {
      setDeleting(false);
    }
  };

  const validateInvoiceFields = (venda: any): string[] => {
    const missing: string[] = [];
    if (!venda.cliente?.trim()) missing.push("Nome do cliente");
    if (!venda.cliente_documento?.trim() || venda.cliente_documento.replace(/\D/g, "").length < 11) missing.push("CPF/CNPJ válido");
    if (!venda.produto?.trim()) missing.push("Produto");
    return missing;
  };

  const getInvoiceReadiness = (venda: any) => {
    const missing = validateInvoiceFields(venda);
    return { ready: missing.length === 0, missing };
  };

  const handleRequestEmitInvoice = async (vendaId: string) => {
    const venda = vendas.find(v => v.id === vendaId);
    if (!venda) return;

    const { ready, missing } = getInvoiceReadiness(venda);
    if (!ready) {
      toast.error(`Para emitir a nota fiscal, preencha: ${missing.join(", ")}`, { duration: 5000 });
      return;
    }

    // For super admins, show confirmation with Spedy config
    if (isSuperAdmin) {
      setLoadingSpedyConfig(true);
      setConfirmEmitVenda(venda);
      try {
        const { data } = await supabase
          .from("spedy_config")
          .select("*")
          .eq("ativo", true)
          .limit(1)
          .single();
        setSpedyConfig(data);
      } catch {
        setSpedyConfig(null);
      } finally {
        setLoadingSpedyConfig(false);
      }
    } else {
      // Non-super-admin: direct confirmation
      setConfirmEmitVenda(venda);
      setSpedyConfig(null);
    }
  };

  const confirmAndEmitInvoice = async () => {
    if (!confirmEmitVenda) return;
    const vendaId = confirmEmitVenda.id;
    setConfirmEmitVenda(null);
    setSpedyConfig(null);

    setEmittingId(vendaId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spedy-emit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ venda_id: vendaId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.details || result.error || "Erro ao emitir nota");
      toast.success("Nota enviada para processamento!");
      await fetchVendas();
    } catch (error: any) {
      toast.error(error.message || "Erro ao emitir nota fiscal");
    } finally {
      setEmittingId(null);
    }
  };

  const invoiceStatusBadge = (venda: any) => {
    const status = venda.invoice_status;
    if (!status || status === "PENDING_EMISSION") return null;
    const map: Record<string, { label: string; className: string }> = {
      PROCESSING: { label: "🟡 Processando NF", className: "bg-amber-100 text-amber-700" },
      AUTHORIZED: { label: "🟢 NF Emitida", className: "bg-green-100 text-green-700" },
      REJECTED: { label: "🔴 NF Rejeitada", className: "bg-red-100 text-red-700" },
      CANCELED: { label: "⚪ NF Cancelada", className: "bg-muted text-muted-foreground" },
    };
    const info = map[status] || { label: status, className: "" };
    if (status === "REJECTED" && venda.invoice_error_message) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className={cn("text-[10px] cursor-help", info.className)}>{info.label}</Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{venda.invoice_error_message}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return <Badge className={cn("text-[10px]", info.className)}>{info.label}</Badge>;
  };

  const filtered = vendas.filter(v => {
    const matchSearch = !search ||
      v.produto?.toLowerCase().includes(search.toLowerCase()) ||
      v.cliente?.toLowerCase().includes(search.toLowerCase()) ||
      v.cliente_email?.toLowerCase().includes(search.toLowerCase()) ||
      v.plataforma?.toLowerCase().includes(search.toLowerCase());
    const matchPlataforma = filtroPlataforma === "all" || v.plataforma === filtroPlataforma;
    const matchStatus = filtroStatus === "all" || v.status === filtroStatus;
    const vendaDate = new Date(v.data_venda);
    const matchInicio = !dataInicio || vendaDate >= dataInicio;
    const matchFim = !dataFim || vendaDate <= new Date(dataFim.getTime() + 86400000);
    return matchSearch && matchPlataforma && matchStatus && matchInicio && matchFim;
  });

  const statusColors: Record<string, string> = {
    aprovada: "bg-green-100 text-green-700",
    pendente: "bg-amber-100 text-amber-700",
    reembolsada: "bg-red-100 text-red-700",
    cancelada: "bg-gray-100 text-gray-700",
    chargeback: "bg-red-200 text-red-800",
    expirada: "bg-gray-100 text-gray-500",
    disputa: "bg-orange-100 text-orange-700",
  };

  const disconnectedPlatforms = PLATAFORMAS_VENDAS.filter(p => !connectedPlatforms.includes(p));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Vendas</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Registre vendas manuais e receba vendas das plataformas conectadas</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown onExport={(fmt) => exportVendas(filtered, fmt)} />
          {canIncluir && (
            <Button onClick={() => { setEditingVenda(null); setFormOpen(true); }} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova Venda
            </Button>
          )}
        </div>
      </div>

      {/* Connected platforms status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plug className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Plataformas de Vendas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PLATAFORMAS_VENDAS.map(p => {
              const isConnected = connectedPlatforms.includes(p);
              return (
                <Badge key={p} variant="outline" className={cn("text-xs gap-1 cursor-default", isConnected ? "border-green-300 bg-green-50 text-green-700" : "border-muted text-muted-foreground")}>
                  {isConnected ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Badge>
              );
            })}
          </div>
          {disconnectedPlatforms.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-2">
              {disconnectedPlatforms.length} plataforma(s) não conectada(s).{" "}
              <button onClick={() => navigate("/settings/integracoes")} className="text-primary underline hover:no-underline">Configurar integrações</button>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por produto, cliente, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" size="sm" onClick={async () => { setRefreshing(true); await fetchVendas(); setRefreshing(false); }} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={filtroPlataforma} onValueChange={setFiltroPlataforma}>
            <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Plataforma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas plataformas</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              {plataformas.filter(p => p !== "manual").map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="aprovada">Aprovada</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="reembolsada">Reembolsada</SelectItem>
              <SelectItem value="chargeback">Chargeback</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 text-xs gap-1", dataInicio && "text-primary")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Data início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 text-xs gap-1", dataFim && "text-primary")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {dataFim ? format(dataFim, "dd/MM/yyyy") : "Data fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dataFim} onSelect={setDataFim} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" /> Limpar
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhuma venda registrada</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Registre vendas manualmente ou conecte suas plataformas em <strong>Configurações → Integrações</strong>.
            </p>
            {canIncluir && (
              <Button onClick={() => { setEditingVenda(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Registrar Primeira Venda
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(venda => (
            <Card key={venda.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold truncate">{venda.produto || "Produto"}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0">{venda.plataforma}</Badge>
                      {venda.origem === "manual" && <Badge variant="secondary" className="text-[10px]">Manual</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        <span className="font-medium">{venda.cliente || "—"}</span>
                        {venda.cliente_email && <span> • {venda.cliente_email}</span>}
                        {venda.cliente_telefone && <span> • {venda.cliente_telefone}</span>}
                      </p>
                      <p>
                        Venda: {formatDate(venda.data_venda)}
                        {venda.cliente_documento && <span> • Doc: {venda.cliente_documento}</span>}
                      </p>
                      {venda.observacoes && <p className="italic text-muted-foreground/70 truncate max-w-md">"{venda.observacoes}"</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className={cn("text-sm font-bold", venda.status === "reembolsada" || venda.status === "chargeback" ? "text-destructive" : "text-green-600")}>
                      {(venda.status === "reembolsada" || venda.status === "chargeback") ? "-" : ""}{formatCurrency(venda.valor_liquido)}
                    </p>
                    {venda.taxa > 0 && <p className="text-[10px] text-muted-foreground">Taxa: {formatCurrency(venda.taxa)}</p>}
                    <Badge className={cn("text-[10px]", statusColors[venda.status] || "")}>{venda.status}</Badge>
                    {invoiceStatusBadge(venda)}
                    <div className="flex gap-1 mt-1">
                      {/* Emit invoice button */}
                      {canAlterar && venda.status === "aprovada" && (!venda.invoice_status || venda.invoice_status === "PENDING_EMISSION" || venda.invoice_status === "REJECTED") && (() => {
                        const { ready, missing } = getInvoiceReadiness(venda);
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn("h-6 w-6", ready ? "text-primary" : "text-amber-500")}
                                  disabled={emittingId === venda.id}
                                  onClick={() => handleEmitInvoice(venda.id)}
                                >
                                  {emittingId === venda.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {ready ? (
                                  <p className="text-xs">Emitir Nota Fiscal</p>
                                ) : (
                                  <div className="text-xs space-y-0.5">
                                    <p className="font-semibold">Campos obrigatórios faltando:</p>
                                    {missing.map(m => <p key={m}>• {m}</p>)}
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                      {/* PDF download */}
                      {venda.invoice_pdf_url && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" asChild>
                                <a href={venda.invoice_pdf_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-3 w-3" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Baixar DANFE (PDF)</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDetailVenda(venda)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      {canAlterar && venda.origem === "manual" && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingVenda(venda); setFormOpen(true); }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {canExcluir && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteVenda(venda)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <VendaFormDialog open={formOpen} onOpenChange={setFormOpen} onSuccess={fetchVendas} venda={editingVenda} />

      {/* Detail Dialog */}
      <Dialog open={!!detailVenda} onOpenChange={(o) => !o && setDetailVenda(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {detailVenda && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Produto:</span> <strong>{detailVenda.produto || "-"}</strong></div>
                <div><span className="text-muted-foreground">Plataforma:</span> <strong>{detailVenda.plataforma}</strong></div>
                <div><span className="text-muted-foreground">Data:</span> <strong>{formatDate(detailVenda.data_venda)}</strong></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={cn("text-[10px]", statusColors[detailVenda.status] || "")}>{detailVenda.status}</Badge></div>
                <div><span className="text-muted-foreground">Valor Bruto:</span> <strong>{formatCurrency(detailVenda.valor_bruto)}</strong></div>
                <div><span className="text-muted-foreground">Taxa:</span> <strong>{formatCurrency(detailVenda.taxa)}</strong></div>
                <div><span className="text-muted-foreground">Valor Líquido:</span> <strong className="text-green-600">{formatCurrency(detailVenda.valor_liquido)}</strong></div>
                <div><span className="text-muted-foreground">Origem:</span> <strong>{detailVenda.origem || "integracao"}</strong></div>
              </div>
              <hr />
              <p className="font-medium">Dados do Cliente</p>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Nome:</span> <strong>{detailVenda.cliente || "-"}</strong></div>
                <div><span className="text-muted-foreground">Email:</span> <strong>{detailVenda.cliente_email || "-"}</strong></div>
                <div><span className="text-muted-foreground">Telefone:</span> <strong>{detailVenda.cliente_telefone || "-"}</strong></div>
                <div><span className="text-muted-foreground">Documento:</span> <strong>{detailVenda.cliente_documento || "-"}</strong></div>
                <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> <strong>{detailVenda.cliente_endereco || "-"}</strong></div>
              </div>
              {detailVenda.observacoes && (
                <>
                  <hr />
                  <div><span className="text-muted-foreground">Observações:</span> <p className="mt-1">{detailVenda.observacoes}</p></div>
                </>
              )}
              {/* Invoice section */}
              {detailVenda.invoice_status && detailVenda.invoice_status !== "PENDING_EMISSION" && (
                <>
                  <hr />
                  <p className="font-medium">Nota Fiscal</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Status NF:</span> {invoiceStatusBadge(detailVenda)}</div>
                    <div><span className="text-muted-foreground">ID Spedy:</span> <strong className="font-mono text-xs">{detailVenda.spedy_order_id || "-"}</strong></div>
                  </div>
                  {detailVenda.invoice_pdf_url && (
                    <a href={detailVenda.invoice_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary underline">
                      <Download className="h-3 w-3" /> Baixar DANFE (PDF)
                    </a>
                  )}
                  {detailVenda.invoice_xml_url && (
                    <a href={detailVenda.invoice_xml_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary underline ml-3">
                      <Download className="h-3 w-3" /> Baixar XML
                    </a>
                  )}
                  {detailVenda.invoice_error_message && (
                    <div className="rounded border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                      {detailVenda.invoice_error_message}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteVenda} onOpenChange={(o) => !o && setDeleteVenda(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Venda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a venda <strong>"{deleteVenda?.produto || 'Produto'}"</strong> de <strong>{deleteVenda ? formatCurrency(deleteVenda.valor_liquido) : ''}</strong>?
              {deleteVenda?.lancamento_id && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ O lançamento financeiro vinculado também será excluído.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVenda} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VendasDigitais;
