import React, { useState, useEffect } from "react";
import { ScrollText, Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LogEntry {
  id: string;
  plataforma: string;
  evento: string;
  status: string;
  payload: any;
  created_at: string;
}

const LogsIntegracoes = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPlataforma, setFiltroPlataforma] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("logs_integracoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setLogs((data as LogEntry[]) || []);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const plataformas = [...new Set(logs.map(l => l.plataforma))];

  const filteredLogs = logs.filter(log => {
    if (filtroPlataforma !== "todas" && log.plataforma !== filtroPlataforma) return false;
    if (filtroStatus !== "todos" && log.status !== filtroStatus) return false;
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

  const successCount = logs.filter(l => l.status === "success").length;
  const errorCount = logs.filter(l => l.status === "error").length;

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "success") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === "error") return <XCircle className="h-4 w-4 text-red-600" />;
    return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "success") return <Badge variant="outline" className="border-green-300 text-green-700 text-[10px]">Sucesso</Badge>;
    if (status === "error") return <Badge variant="outline" className="border-red-300 text-red-600 text-[10px]">Erro</Badge>;
    return <Badge variant="outline" className="border-amber-300 text-amber-600 text-[10px]">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ScrollText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Logs de Integrações</h1>
        </div>
        <p className="text-sm text-muted-foreground">Histórico de eventos enviados e recebidos pelas integrações</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ScrollText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Sucesso</p>
              <p className="text-lg font-bold text-green-600">{successCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Erro</p>
              <p className="text-lg font-bold text-red-600">{errorCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nos logs..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroPlataforma} onValueChange={setFiltroPlataforma}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {plataformas.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Logs Table */}
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
      ) : (
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
                {filteredLogs.map(log => (
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
    </div>
  );
};

export default LogsIntegracoes;
