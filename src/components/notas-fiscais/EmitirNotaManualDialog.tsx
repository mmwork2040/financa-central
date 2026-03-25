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
import * as XLSX from "xlsx";
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
      const term = clienteSearch.trim();
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, cpf_cnpj, email, telefone, endereco")
        .eq("empresa_id", empresaId)
        .or(`nome.ilike.%${term}%,cpf_cnpj.ilike.%${term}%,email.ilike.%${term}%,telefone.ilike.%${term}%`)
        .eq("ativo", true)
        .order("nome")
        .limit(20);
      if (error) throw error;
      setClientes(data || []);
      if ((data || []).length === 0) {
        toast.info("Nenhum cliente encontrado na base da empresa");
      }
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

  // Column alias mapping for smart detection
  const COLUMN_ALIASES: Record<string, string[]> = {
    cliente_nome: ["cliente", "nome", "customer", "nome do cliente", "nome_cliente", "razao social", "razão social", "razao_social", "comprador", "buyer", "nome completo", "name", "destinatario", "destinatário"],
    cliente_documento: ["cpf", "cnpj", "cpf_cnpj", "documento", "cpf/cnpj", "document", "doc", "cpf cnpj", "numero documento", "número documento", "nro documento", "tax_id", "federal_tax_number"],
    cliente_email: ["email", "e-mail", "e_mail", "mail", "correo", "email_cliente", "email cliente"],
    cliente_telefone: ["telefone", "phone", "tel", "celular", "fone", "whatsapp", "contato", "telefone_cliente"],
    produto: ["produto", "descricao", "descrição", "product", "item", "servico", "serviço", "nome_produto", "nome produto", "descricao_produto", "mercadoria", "service", "description", "desc"],
    valor: ["valor", "value", "preco", "preço", "amount", "valor_bruto", "valor bruto", "total", "price", "valor_total", "valor total", "vlr", "val", "montante", "valor unitario", "valor unitário", "valor_unitario", "valor (r$)", "valor r$"],
    data_venda: ["data", "date", "data_venda", "data venda", "data da venda", "dt_venda", "dt venda", "data emissao", "data emissão", "data_emissao", "created_at", "created", "purchase_date", "sale_date", "dt", "data compra", "data_compra"],
    forma_pagamento: ["forma pagamento", "forma_pagamento", "forma de pagamento", "payment method", "metodo pagamento", "método pagamento", "meio pagamento", "meio de pagamento", "payment"],
    mes_emissao: ["mes emissao nf", "mês emissão nf", "mes emissao", "mês emissão", "mes_emissao_nf", "mes_emissao", "competencia", "competência", "month"],
    status_nf: ["status nf", "status_nf", "status nota", "status nota fiscal", "situacao nf", "situação nf"],
    observacoes: ["observacoes", "observações", "obs", "notas", "notes", "comentarios", "comentários", "comments"],
    endereco: ["endereco", "endereço", "address", "logradouro", "rua", "street"],
    cidade: ["cidade", "city", "municipio", "município"],
    estado: ["estado", "state", "uf"],
    cep: ["cep", "zip", "zip_code", "codigo_postal", "código postal", "postal"],
  };

  const [detectedMapping, setDetectedMapping] = useState<Record<string, string>>({});

  const detectBestSeparator = (text: string): string => {
    const firstLine = text.split("\n")[0] || "";
    const separators = [";", ",", "\t", "|"];
    let best = ",";
    let maxCount = 0;
    for (const sep of separators) {
      const count = (firstLine.match(new RegExp(sep === "|" ? "\\|" : sep, "g")) || []).length;
      if (count > maxCount) {
        maxCount = count;
        best = sep;
      }
    }
    return best;
  };

  const findBestMatch = (header: string): { field: string; score: number } | null => {
    const normalized = header.toLowerCase().trim()
      .replace(/[_\-\.]/g, " ")
      .replace(/\s+/g, " ")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      for (const alias of aliases) {
        const normalizedAlias = alias.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (normalized === normalizedAlias) return { field, score: 100 };
        if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
          return { field, score: 80 };
        }
      }
    }
    return null;
  };

  // Spreadsheet upload
  const handleSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls", "tsv", "txt"].includes(ext || "")) {
      toast.error("Formato não suportado. Envie CSV, XLSX ou XLS.");
      return;
    }

    setUploading(true);
    try {
      let text = await file.text();
      
      // Remove BOM characters (UTF-8, UTF-16 LE/BE)
      text = text.replace(/^\uFEFF/, "").replace(/^\uFFFE/, "").replace(/^\xEF\xBB\xBF/, "");
      
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        toast.error("Planilha vazia ou sem dados");
        setUploading(false);
        return;
      }

      const separator = detectBestSeparator(text);
      const sepRegex = new RegExp(separator === "|" ? "\\|" : (separator === "\t" ? "\t" : separator));
      
      // Clean headers: remove BOM, quotes, extra whitespace, normalize
      const rawHeaders = lines[0].split(sepRegex).map(h => 
        h.trim()
          .replace(/^["']|["']$/g, "")
          .replace(/^\uFEFF/, "")
          .trim()
      );

      console.log("[NF Import] Separador detectado:", JSON.stringify(separator));
      console.log("[NF Import] Headers encontrados:", rawHeaders);

      // Auto-detect column mapping
      const mapping: Record<string, number> = {};
      const mappingLabels: Record<string, string> = {};
      const usedIndices = new Set<number>();

      // First pass: exact matches (score 100)
      rawHeaders.forEach((h, idx) => {
        if (!h) return;
        const match = findBestMatch(h);
        if (match && match.score === 100 && !mapping[match.field]) {
          mapping[match.field] = idx;
          mappingLabels[match.field] = h;
          usedIndices.add(idx);
        }
      });

      // Second pass: partial matches for unmapped fields
      rawHeaders.forEach((h, idx) => {
        if (usedIndices.has(idx) || !h) return;
        const match = findBestMatch(h);
        if (match && !mapping[match.field]) {
          mapping[match.field] = idx;
          mappingLabels[match.field] = h;
          usedIndices.add(idx);
        }
      });

      console.log("[NF Import] Mapeamento detectado:", mapping);

      // If no mapping found, show headers to help user
      if (Object.keys(mapping).length === 0) {
        toast.error(`Nenhuma coluna reconhecida. Colunas encontradas: ${rawHeaders.filter(h => h).join(", ")}`);
        setDetectedMapping({});
        setSpreadsheetRows([]);
        setUploading(false);
        return;
      }

      setDetectedMapping(mappingLabels);

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sepRegex).map(c => c.trim().replace(/^["']|["']$/g, ""));
        
        const getValue = (field: string) => {
          const idx = mapping[field];
          return idx !== undefined ? (cols[idx] || "") : "";
        };

        const row = {
          cliente_nome: getValue("cliente_nome"),
          cliente_documento: getValue("cliente_documento"),
          cliente_email: getValue("cliente_email"),
          cliente_telefone: getValue("cliente_telefone"),
          produto: getValue("produto"),
          valor: getValue("valor"),
          data_venda: getValue("data_venda"),
        };

        // Skip completely empty rows
        const hasAnyValue = Object.values(row).some(v => v && v.trim());
        if (!hasAnyValue) continue;

        rows.push(row);
      }

      setSpreadsheetRows(rows);
      setSelectedSpreadsheetRows(new Set(rows.map((_, i) => i)));

      const mappedFields = Object.keys(mapping);
      const total = Object.keys(COLUMN_ALIASES).length;
      
      if (rows.length === 0) {
        toast.warning(`Colunas detectadas mas nenhuma linha com dados. Verifique o conteúdo do arquivo.`);
      } else {
        toast.success(`${rows.length} linha(s) carregada(s) · ${mappedFields.length}/${total} campos detectados`);
      }
    } catch (err) {
      console.error("[NF Import] Erro:", err);
      toast.error("Erro ao processar planilha. Verifique o formato do arquivo.");
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
                  <FileSpreadsheet className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Importação Inteligente</p>
                    <p>O sistema detecta automaticamente as colunas da sua planilha. Aceita CSV, XLS e XLSX com qualquer separador.</p>
                    <p className="mt-1 text-xs">Campos reconhecidos: cliente, CPF/CNPJ, email, telefone, produto, valor, data</p>
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
                {uploading ? "Analisando planilha..." : "Enviar planilha"}
              </Label>
              <input
                id="spreadsheet-upload"
                type="file"
                accept=".csv,.xlsx,.xls,.tsv,.txt"
                className="hidden"
                onChange={handleSpreadsheetUpload}
                disabled={uploading}
              />
            </div>

            {/* Detected mapping badges */}
            {Object.keys(detectedMapping).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(detectedMapping).map(([field, originalHeader]) => {
                  const labels: Record<string, string> = {
                    cliente_nome: "Cliente",
                    cliente_documento: "CPF/CNPJ",
                    cliente_email: "Email",
                    cliente_telefone: "Telefone",
                    produto: "Produto",
                    valor: "Valor",
                    data_venda: "Data",
                  };
                  return (
                    <Badge key={field} variant="secondary" className="text-[10px] gap-1">
                      ✓ {labels[field] || field}
                      <span className="text-muted-foreground">← {originalHeader}</span>
                    </Badge>
                  );
                })}
              </div>
            )}

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
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spreadsheetRows.map((row, idx) => (
                        <TableRow key={idx} className={(!row.cliente_nome || !row.valor) ? "opacity-50" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSpreadsheetRows.has(idx)}
                              onCheckedChange={() => toggleSpreadsheetRow(idx)}
                            />
                          </TableCell>
                          <TableCell className="text-xs truncate max-w-[120px]">{row.cliente_nome || <span className="text-destructive">—</span>}</TableCell>
                          <TableCell className="text-xs">{row.cliente_documento || "—"}</TableCell>
                          <TableCell className="text-xs truncate max-w-[120px]">{row.produto || "—"}</TableCell>
                          <TableCell className="text-xs text-right">{row.valor || <span className="text-destructive">—</span>}</TableCell>
                          <TableCell className="text-xs">{row.data_venda || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {spreadsheetRows.some(r => !r.cliente_nome || !r.valor) && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Linhas sem cliente ou valor serão ignoradas na emissão
                  </p>
                )}
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
