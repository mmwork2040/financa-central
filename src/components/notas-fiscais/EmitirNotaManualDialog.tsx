import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Search, Upload, FileText, Loader2, User, FileSpreadsheet, PenLine, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmitirNotaManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ClienteResult {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
}

interface VendaResult {
  id: string;
  produto: string | null;
  valor_bruto: number;
  data_venda: string;
  cliente: string | null;
  invoice_status: string | null;
}

const EmitirNotaManualDialog = ({ open, onOpenChange, onSuccess }: EmitirNotaManualDialogProps) => {
  const { empresaId } = useAuth();
  const [tab, setTab] = useState("cliente");
  const [emitting, setEmitting] = useState(false);

  // --- Cliente search ---
  const [clienteSearch, setClienteSearch] = useState("");
  const [clientes, setClientes] = useState<ClienteResult[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteResult | null>(null);
  const [vendas, setVendas] = useState<VendaResult[]>([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [selectedVendaIds, setSelectedVendaIds] = useState<Set<string>>(new Set());

  // --- Manual form ---
  const [manual, setManual] = useState({
    cliente_nome: "",
    cliente_documento: "",
    cliente_email: "",
    cliente_telefone: "",
    produto: "",
    valor: "",
    data_venda: new Date().toISOString().slice(0, 10),
    observacoes: "",
  });

  // --- Spreadsheet ---
  const [uploading, setUploading] = useState(false);
  const [spreadsheetRows, setSpreadsheetRows] = useState<any[]>([]);
  const [selectedSpreadsheetRows, setSelectedSpreadsheetRows] = useState<Set<number>>(new Set());

  // Search clientes
  const searchClientes = async () => {
    if (!clienteSearch.trim() || !empresaId) return;
    setLoadingClientes(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, cpf_cnpj, email, telefone, endereco")
        .eq("empresa_id", empresaId)
        .ilike("nome", `%${clienteSearch.trim()}%`)
        .limit(20);
      if (error) throw error;
      setClientes(data || []);
    } catch {
      toast.error("Erro ao buscar clientes");
    } finally {
      setLoadingClientes(false);
    }
  };

  // Load vendas for selected cliente
  useEffect(() => {
    if (!selectedCliente || !empresaId) {
      setVendas([]);
      return;
    }
    const load = async () => {
      setLoadingVendas(true);
      try {
        const { data, error } = await supabase
          .from("vendas_digitais")
          .select("id, produto, valor_bruto, data_venda, cliente, invoice_status")
          .eq("empresa_id", empresaId)
          .eq("cliente_id", selectedCliente.id)
          .order("data_venda", { ascending: false });
        if (error) throw error;
        setVendas(data || []);
      } catch {
        toast.error("Erro ao buscar vendas do cliente");
      } finally {
        setLoadingVendas(false);
      }
    };
    load();
  }, [selectedCliente, empresaId]);

  const toggleVenda = (id: string) => {
    setSelectedVendaIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Emit from selected vendas
  const emitFromVendas = async () => {
    if (selectedVendaIds.size === 0) {
      toast.error("Selecione pelo menos uma venda");
      return;
    }
    setEmitting(true);
    let success = 0;
    let errors = 0;
    for (const vendaId of selectedVendaIds) {
      try {
        const { data, error } = await supabase.functions.invoke("spedy-emit", {
          body: { venda_id: vendaId },
        });
        if (error || data?.error) {
          errors++;
          console.error("Emit error:", data?.error || error);
        } else {
          success++;
        }
      } catch {
        errors++;
      }
    }
    setEmitting(false);
    if (success > 0) toast.success(`${success} nota(s) enviada(s) para emissão`);
    if (errors > 0) toast.error(`${errors} nota(s) com erro. Verifique dados obrigatórios.`);
    if (success > 0) {
      onSuccess();
      onOpenChange(false);
    }
  };

  // Emit manual
  const emitManual = async () => {
    if (!manual.cliente_nome.trim() || !manual.produto.trim() || !manual.valor) {
      toast.error("Preencha nome do cliente, produto e valor");
      return;
    }
    const valor = parseFloat(manual.valor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      toast.error("Valor inválido");
      return;
    }
    if (!empresaId) return;
    setEmitting(true);
    try {
      // Create venda record then emit
      const { data: venda, error: insertError } = await supabase
        .from("vendas_digitais")
        .insert({
          empresa_id: empresaId,
          plataforma: "manual",
          produto: manual.produto.trim(),
          cliente: manual.cliente_nome.trim(),
          cliente_documento: manual.cliente_documento.trim() || null,
          cliente_email: manual.cliente_email.trim() || null,
          cliente_telefone: manual.cliente_telefone.trim() || null,
          valor_bruto: valor,
          valor_liquido: valor,
          taxa: 0,
          valor_comissao: 0,
          data_venda: manual.data_venda || new Date().toISOString().slice(0, 10),
          observacoes: manual.observacoes.trim() || null,
          origem: "manual",
          status: "aprovada",
          invoice_status: "PENDING_EMISSION",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const { data, error } = await supabase.functions.invoke("spedy-emit", {
        body: { venda_id: venda.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Nota fiscal enviada para emissão!");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao emitir nota fiscal");
    } finally {
      setEmitting(false);
    }
  };

  // Spreadsheet upload
  const handleSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!validTypes.includes(file.type) && !["csv", "xlsx", "xls"].includes(ext || "")) {
      toast.error("Formato não suportado. Envie CSV ou XLSX.");
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) {
        toast.error("Planilha vazia ou sem dados");
        setUploading(false);
        return;
      }

      const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase().replace(/"/g, ""));
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/).map(c => c.trim().replace(/"/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx] || "";
        });

        // Try to map common column names
        rows.push({
          cliente_nome: row["cliente"] || row["nome"] || row["customer"] || row["nome do cliente"] || "",
          cliente_documento: row["cpf"] || row["cnpj"] || row["cpf_cnpj"] || row["documento"] || row["cpf/cnpj"] || "",
          cliente_email: row["email"] || row["e-mail"] || "",
          cliente_telefone: row["telefone"] || row["phone"] || row["tel"] || "",
          produto: row["produto"] || row["descricao"] || row["descrição"] || row["product"] || row["item"] || "",
          valor: row["valor"] || row["value"] || row["preco"] || row["preço"] || row["amount"] || row["valor_bruto"] || "",
          data_venda: row["data"] || row["date"] || row["data_venda"] || "",
        });
      }

      setSpreadsheetRows(rows);
      setSelectedSpreadsheetRows(new Set(rows.map((_, i) => i)));
      toast.success(`${rows.length} linha(s) carregada(s)`);
    } catch {
      toast.error("Erro ao processar planilha");
    } finally {
      setUploading(false);
    }
  };

  const emitFromSpreadsheet = async () => {
    if (selectedSpreadsheetRows.size === 0) {
      toast.error("Selecione pelo menos uma linha");
      return;
    }
    if (!empresaId) return;
    setEmitting(true);
    let success = 0;
    let errors = 0;

    for (const idx of selectedSpreadsheetRows) {
      const row = spreadsheetRows[idx];
      if (!row.cliente_nome || !row.produto || !row.valor) {
        errors++;
        continue;
      }
      const valor = parseFloat(String(row.valor).replace(",", "."));
      if (isNaN(valor) || valor <= 0) {
        errors++;
        continue;
      }

      try {
        const { data: venda, error: insertError } = await supabase
          .from("vendas_digitais")
          .insert({
            empresa_id: empresaId,
            plataforma: "manual",
            produto: row.produto,
            cliente: row.cliente_nome,
            cliente_documento: row.cliente_documento || null,
            cliente_email: row.cliente_email || null,
            cliente_telefone: row.cliente_telefone || null,
            valor_bruto: valor,
            valor_liquido: valor,
            taxa: 0,
            valor_comissao: 0,
            data_venda: row.data_venda || new Date().toISOString().slice(0, 10),
            origem: "importacao",
            status: "aprovada",
            invoice_status: "PENDING_EMISSION",
          })
          .select("id")
          .single();

        if (insertError) {
          errors++;
          continue;
        }

        const { data, error } = await supabase.functions.invoke("spedy-emit", {
          body: { venda_id: venda.id },
        });
        if (error || data?.error) errors++;
        else success++;
      } catch {
        errors++;
      }
    }

    setEmitting(false);
    if (success > 0) toast.success(`${success} nota(s) enviada(s) para emissão`);
    if (errors > 0) toast.error(`${errors} linha(s) com erro ou dados incompletos`);
    if (success > 0) {
      onSuccess();
      onOpenChange(false);
    }
  };

  const toggleSpreadsheetRow = (idx: number) => {
    setSelectedSpreadsheetRows(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Emitir Nota Fiscal
          </DialogTitle>
          <DialogDescription>
            Escolha como deseja gerar a nota fiscal: buscando clientes, enviando uma planilha ou preenchendo manualmente.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cliente" className="gap-1.5 text-xs sm:text-sm">
              <User className="h-3.5 w-3.5" /> Cliente
            </TabsTrigger>
            <TabsTrigger value="planilha" className="gap-1.5 text-xs sm:text-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Planilha
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5 text-xs sm:text-sm">
              <PenLine className="h-3.5 w-3.5" /> Manual
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB: CLIENTE ===== */}
          <TabsContent value="cliente" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nome..."
                  value={clienteSearch}
                  onChange={e => setClienteSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchClientes()}
                  className="pl-9"
                />
              </div>
              <Button onClick={searchClientes} disabled={loadingClientes} variant="outline">
                {loadingClientes ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>

            {clientes.length > 0 && !selectedCliente && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {clientes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCliente(c); setSelectedVendaIds(new Set()); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.cpf_cnpj || "Sem documento"} · {c.email || "Sem e-mail"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">Selecionar</Badge>
                  </button>
                ))}
              </div>
            )}

            {selectedCliente && (
              <>
                <Card>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedCliente.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedCliente.cpf_cnpj || "—"} · {selectedCliente.email || "—"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedCliente(null); setVendas([]); }}>
                      Trocar
                    </Button>
                  </CardContent>
                </Card>

                {loadingVendas ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : vendas.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Nenhuma venda encontrada para este cliente
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Selecione as vendas para emitir nota fiscal:
                    </p>
                    <div className="border rounded-lg overflow-x-auto max-h-52 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Status NF</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendas.map(v => {
                            const canEmit = !v.invoice_status || v.invoice_status === "PENDING_EMISSION" || v.invoice_status === "REJECTED";
                            return (
                              <TableRow key={v.id} className={!canEmit ? "opacity-50" : ""}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedVendaIds.has(v.id)}
                                    onCheckedChange={() => toggleVenda(v.id)}
                                    disabled={!canEmit}
                                  />
                                </TableCell>
                                <TableCell className="text-xs">
                                  {format(new Date(v.data_venda), "dd/MM/yy", { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-xs truncate max-w-[150px]">{v.produto || "—"}</TableCell>
                                <TableCell className="text-xs text-right font-medium">
                                  {formatCurrency(v.valor_bruto)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={canEmit ? "outline" : "secondary"} className="text-[10px]">
                                    {v.invoice_status || "Pendente"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <Button onClick={emitFromVendas} disabled={emitting || selectedVendaIds.size === 0} className="w-full">
                      {emitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                      Emitir {selectedVendaIds.size} nota(s)
                    </Button>
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* ===== TAB: PLANILHA ===== */}
          <TabsContent value="planilha" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Formato da planilha (CSV)</p>
                    <p>Colunas esperadas: <strong>cliente</strong>, <strong>documento</strong> (CPF/CNPJ), <strong>email</strong>, <strong>telefone</strong>, <strong>produto</strong>, <strong>valor</strong>, <strong>data</strong></p>
                    <p className="mt-1">Separe por vírgula, ponto-e-vírgula ou tab.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <Label
                htmlFor="spreadsheet-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Processando..." : "Enviar planilha (.csv)"}
              </Label>
              <input
                id="spreadsheet-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleSpreadsheetUpload}
                disabled={uploading}
              />
            </div>

            {spreadsheetRows.length > 0 && (
              <>
                <div className="border rounded-lg overflow-x-auto max-h-56 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spreadsheetRows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSpreadsheetRows.has(idx)}
                              onCheckedChange={() => toggleSpreadsheetRow(idx)}
                            />
                          </TableCell>
                          <TableCell className="text-xs truncate max-w-[120px]">{row.cliente_nome || "—"}</TableCell>
                          <TableCell className="text-xs">{row.cliente_documento || "—"}</TableCell>
                          <TableCell className="text-xs truncate max-w-[120px]">{row.produto || "—"}</TableCell>
                          <TableCell className="text-xs text-right">{row.valor || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={emitFromSpreadsheet} disabled={emitting || selectedSpreadsheetRows.size === 0} className="w-full">
                  {emitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                  Emitir {selectedSpreadsheetRows.size} nota(s)
                </Button>
              </>
            )}
          </TabsContent>

          {/* ===== TAB: MANUAL ===== */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome do Cliente <span className="text-destructive">*</span></Label>
                <Input
                  value={manual.cliente_nome}
                  onChange={e => setManual(p => ({ ...p, cliente_nome: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label>CPF/CNPJ</Label>
                <Input
                  value={manual.cliente_documento}
                  onChange={e => setManual(p => ({ ...p, cliente_documento: e.target.value }))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={manual.cliente_email}
                  onChange={e => setManual(p => ({ ...p, cliente_email: e.target.value }))}
                  placeholder="cliente@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={manual.cliente_telefone}
                  onChange={e => setManual(p => ({ ...p, cliente_telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Produto/Serviço <span className="text-destructive">*</span></Label>
                <Input
                  value={manual.produto}
                  onChange={e => setManual(p => ({ ...p, produto: e.target.value }))}
                  placeholder="Descrição do produto ou serviço"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$) <span className="text-destructive">*</span></Label>
                <Input
                  value={manual.valor}
                  onChange={e => setManual(p => ({ ...p, valor: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Data da Venda</Label>
                <Input
                  type="date"
                  value={manual.data_venda}
                  onChange={e => setManual(p => ({ ...p, data_venda: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={manual.observacoes}
                onChange={e => setManual(p => ({ ...p, observacoes: e.target.value }))}
                placeholder="Observações opcionais..."
                rows={2}
              />
            </div>
            <Button onClick={emitManual} disabled={emitting} className="w-full">
              {emitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
              Emitir Nota Fiscal
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EmitirNotaManualDialog;
