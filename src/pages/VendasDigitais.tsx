
import React, { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Search, RefreshCw, X, Plug, CheckCircle2, AlertTriangle } from "lucide-react";
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

const PLATAFORMAS_VENDAS = ["hotmart", "eduzz", "monetizze", "kiwify"];

const VendasDigitais = () => {
  const { empresaId } = useAuth();
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

  const filtered = vendas.filter(v => {
    const matchSearch = !search || 
      v.produto?.toLowerCase().includes(search.toLowerCase()) ||
      v.cliente?.toLowerCase().includes(search.toLowerCase()) ||
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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Vendas Digitais</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Vendas recebidas das plataformas conectadas</p>
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
                <Badge
                  key={p}
                  variant="outline"
                  className={cn(
                    "text-xs gap-1 cursor-default",
                    isConnected ? "border-green-300 bg-green-50 text-green-700" : "border-muted text-muted-foreground"
                  )}
                >
                  {isConnected ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Badge>
              );
            })}
          </div>
          {disconnectedPlatforms.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-2">
              {disconnectedPlatforms.length} plataforma(s) não conectada(s).{" "}
              <button onClick={() => navigate("/settings/integracoes")} className="text-primary underline hover:no-underline">
                Configurar integrações
              </button>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto, cliente ou plataforma..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => { setRefreshing(true); await fetchVendas(); setRefreshing(false); }}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={filtroPlataforma} onValueChange={setFiltroPlataforma}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas plataformas</SelectItem>
              {plataformas.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
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
            <h3 className="text-lg font-semibold mb-1">Nenhuma venda digital ainda</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Conecte suas plataformas em <strong>Configurações → Integrações</strong> para começar a receber vendas automaticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(venda => (
            <Card key={venda.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold truncate">{venda.produto || "Produto"}</p>
                    <Badge variant="outline" className="text-[10px] shrink-0">{venda.plataforma}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {venda.cliente || "—"} • Venda: {formatDate(venda.data_venda)}
                    {venda.created_at && ` • Registro: ${formatDate(venda.created_at)}`}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={cn("text-sm font-bold", venda.status === "reembolsada" || venda.status === "chargeback" ? "text-red-600" : "text-green-600")}>
                    {(venda.status === "reembolsada" || venda.status === "chargeback") ? "-" : ""}{formatCurrency(venda.valor_liquido)}
                  </p>
                  {venda.taxa > 0 && (
                    <p className="text-[10px] text-muted-foreground">Taxa: {formatCurrency(venda.taxa)}</p>
                  )}
                  <Badge className={cn("text-[10px] mt-1", statusColors[venda.status] || "")}>
                    {venda.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendasDigitais;
