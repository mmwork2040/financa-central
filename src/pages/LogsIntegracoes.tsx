import React, { useState, useEffect } from "react";
import { ScrollText, Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Search, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";
import { useIsMobile } from "@/hooks/use-mobile";

interface LogEntry {
  id: string;
  plataforma: string;
  evento: string;
  status: string;
  payload: any;
  created_at: string;
}

const LogsIntegracoes = () => {
  const { empresaId, userRole, isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [filtroPlataforma, setFiltroPlataforma] = useState("todas");
  const [filtroEvento, setFiltroEvento] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [logsEnabled, setLogsEnabled] = useState(true);
  const [togglingLogs, setTogglingLogs] = useState(false);
  const isMobile = useIsMobile();
  const isAdmin = userRole === "admin" || isSuperAdmin;

  useEffect(() => {
    fetchLogs();
    fetchLogsEnabled();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("logs_integracoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setLogs((data as LogEntry[]) || []);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogsEnabled = async () => {
    if (!empresaId) return;
    try {
      const { data } = await (supabase as any)
        .from("empresas")
        .select("logs_enabled")
        .eq("id", empresaId)
        .single();
      if (data) setLogsEnabled(data.logs_enabled ?? true);
    } catch (e) {
      console.error("Erro ao verificar status de logs:", e);
    }
  };

  const toggleLogsEnabled = async (value: boolean) => {
    if (!empresaId) return;
    setTogglingLogs(true);
    try {
      const { error } = await (supabase as any)
        .from("empresas")
        .update({ logs_enabled: value })
        .eq("id", empresaId);
      if (error) throw error;
      setLogsEnabled(value);
      toast.success(value ? "Geração de logs ativada." : "Geração de logs desativada.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao alterar configuração");
    } finally {
      setTogglingLogs(false);
    }
  };

  const handleClearLogs = async () => {
    if (!empresaId) return;
    setClearing(true);
    try {
      const { data, error } = await supabase.functions.invoke("clear-logs", {
        body: { empresa_id: empresaId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLogs([]);
      toast.success("Logs limpos com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao limpar logs");
    } finally {
      setClearing(false);
    }
  };

  const plataformas = [...new Set(logs.map(l => l.plataforma))];
  const eventos = [...new Set([...logs.map(l => l.evento), "Suporte Técnico"])].sort();

  const filteredLogs = logs.filter(log => {
    if (filtroPlataforma !== "todas" && log.plataforma !== filtroPlataforma) return false;
    if (filtroEvento !== "todos" && log.evento !== filtroEvento) return false;
    if (filtroStatus !== "todos") {
      if (filtroStatus === "success" && !isSuccess(log.status)) return false;
      if (filtroStatus === "error" && !isError(log.status)) return false;
    }
    if (busca) {
      const search = busca.toLowerCase();
      return (
        log.plataforma.toLowerCase().includes(search) ||
        log.evento.toLowerCase().includes(search) ||
        JSON.stringify(log.payload || {}).toLowerCase().includes(search)
      );
    }
    return true;
  });

  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(filteredLogs, 10);

  const successCount = logs.filter(l => l.status === "success" || l.status === "sucesso").length;
  const errorCount = logs.filter(l => l.status === "error" || l.status === "erro").length;

  const isSuccess = (s: string) => s === "success" || s === "sucesso";
  const isError = (s: string) => s === "error" || s === "erro";

  const StatusIcon = ({ status }: { status: string }) => {
    if (isSuccess(status)) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (isError(status)) return <XCircle className="h-4 w-4 text-destructive" />;
    return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (isSuccess(status)) return <Badge variant="outline" className="border-green-300 text-green-700 text-[10px]">Sucesso</Badge>;
    if (isError(status)) return <Badge variant="outline" className="border-destructive/30 text-destructive text-[10px]">Erro</Badge>;
    return <Badge variant="outline" className="border-amber-300 text-amber-600 text-[10px]">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
              <ScrollText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Logs de Integrações</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Histórico de eventos enviados e recebidos</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <div className="flex items-center gap-2">
            <Switch
              id="logs-toggle"
              checked={logsEnabled}
              onCheckedChange={toggleLogsEnabled}
              disabled={togglingLogs}
            />
            <Label htmlFor="logs-toggle" className="text-sm text-muted-foreground cursor-pointer">
              {logsEnabled ? "Logs ativados" : "Logs desativados"}
            </Label>
          </div>
          {isAdmin && logs.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpar Logs
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar todos os logs?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá remover todos os {logs.length} registros de log. Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearLogs} disabled={clearing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {clearing ? "Limpando..." : "Limpar Tudo"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Summary Cards - Clickable as filters */}
      <div className="grid grid-cols-3 gap-3">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${filtroStatus === "todos" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFiltroStatus("todos")}
        >
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <ScrollText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${filtroStatus === "success" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => setFiltroStatus(filtroStatus === "success" ? "todos" : "success")}
        >
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Sucesso</p>
              <p className="text-lg font-bold text-green-600">{successCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${filtroStatus === "error" ? "ring-2 ring-destructive" : ""}`}
          onClick={() => setFiltroStatus(filtroStatus === "error" ? "todos" : "error")}
        >
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Erro</p>
              <p className="text-lg font-bold text-destructive">{errorCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nos logs..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filtroPlataforma} onValueChange={setFiltroPlataforma}>
            <SelectTrigger className="w-[130px] sm:w-[160px]">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {plataformas.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroEvento} onValueChange={setFiltroEvento}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <SelectValue placeholder="Evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos eventos</SelectItem>
              {eventos.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[110px] sm:w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading} title="Atualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum log encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">Os logs aparecerão aqui quando as integrações forem utilizadas</p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* Mobile: Card layout */
        <div className="space-y-3">
          {paginatedItems.map(log => (
            <Card key={log.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={log.status} />
                    <span className="font-medium text-sm capitalize">{log.plataforma}</span>
                  </div>
                  <StatusBadge status={log.status} />
                </div>
                <p className="text-sm mb-1">{log.evento}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </p>
                {log.payload && (
                  <div className="text-xs mt-2">
                    <p className="font-semibold text-muted-foreground mb-1">Payload/Resposta:</p>
                    <pre className="p-2 bg-muted rounded text-[10px] overflow-auto max-h-48 whitespace-pre-wrap">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop: Table layout */
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="text-right">Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <StatusIcon status={log.status} />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm capitalize">{log.plataforma}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                      <span className="ml-2 text-sm">{log.evento}</span>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {log.payload ? (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            {log.payload?.message || log.payload?.url || "Ver detalhes"}
                          </summary>
                          <pre className="mt-1 p-2 bg-muted rounded text-[10px] overflow-auto max-h-32 whitespace-pre-wrap">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Mostrando {paginatedItems.length} de {filteredLogs.length} registros
        </p>
        <MobilePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default LogsIntegracoes;
