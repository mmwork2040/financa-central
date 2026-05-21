import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, FileText, Image, Sheet, Loader2, CheckCircle2, XCircle, AlertTriangle, Trash2, ArrowRight, FileUp, Brain, Eye, EyeOff, RefreshCw, Settings, FlaskConical, Copy, Pencil, Undo2, History, Plus } from "lucide-react";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { extractEdgeError } from "@/lib/edgeFunctionError";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EditImportItemDialog, EntityOption, CategoriaOption } from "@/components/importacao/EditImportItemDialog";
import { ImportacoesPendentes } from "@/components/importacao/ImportacoesPendentes";

const ACCEPTED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp",
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/xml", "text/xml",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const LLM_LABELS: Record<string, string> = {
  openai: "OpenAI",
  google_gemini: "Google Gemini",
  anthropic: "Anthropic",
  deepseek: "DeepSeek",
};

type DuplicateMatch = {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string | null;
  tipo: string;
  motivo: string; // "valor + data próximos", "descrição semelhante", etc
};

type ExtractedItem = {
  descricao: string;
  valor: number;
  data: string | null;
  tipo_sugerido: string;
  destino_sugerido: string;
  categoria_sugerida: string | null;
  categoria_id?: string | null;
  fornecedor_cliente: string | null;
  fornecedor_id?: string | null;
  cliente_id?: string | null;
  forma_pagamento: string | null;
  forma_pagamento_id?: string | null;
  projeto_id?: string | null;
  observacoes: string | null;
  confianca: number;
  selected?: boolean;
  possibleDuplicates?: DuplicateMatch[];
  original?: Omit<ExtractedItem, "selected" | "possibleDuplicates" | "original">;
};

type FileResult = {
  id?: string;
  fileName: string;
  status: "pending" | "processing" | "done" | "error";
  items: ExtractedItem[];
  error?: string;
  modelUsed?: string;
  resumo?: string;
};

type ActiveLLM = {
  id: string;
  plataforma: string;
};

type PendingImport = {
  id: string;
  nome_arquivo: string;
  created_at: string;
  modelo_ia: string | null;
  dados: any[];
  resumo: string | null;
};

const ImportarDocumentos = () => {
  const { empresaId, user } = useAuth();
  const [files, setFiles] = useState<FileResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [valuesVisible, setValuesVisible] = useState(true);
  const [activeLLMs, setActiveLLMs] = useState<ActiveLLM[]>([]);
  const [selectedLLM, setSelectedLLM] = useState<string>("");
  const [loadingLLMs, setLoadingLLMs] = useState(true);
  
  const [pendingImports, setPendingImports] = useState<PendingImport[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [showPending, setShowPending] = useState(false);

  // Cadastros existentes para edição
  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [fornecedores, setFornecedores] = useState<EntityOption[]>([]);
  const [clientes, setClientes] = useState<EntityOption[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<EntityOption[]>([]);
  const [projetos, setProjetos] = useState<EntityOption[]>([]);

  // Edit dialog
  const [editingRef, setEditingRef] = useState<{ fileIdx: number; itemIdx: number } | null>(null);
  const editingItem = editingRef ? files[editingRef.fileIdx]?.items[editingRef.itemIdx] : null;
  const [revertRef, setRevertRef] = useState<{ fileIdx: number; itemIdx: number } | null>(null);
  const [deletePendingRef, setDeletePendingRef] = useState<string | null>(null);

  // Paginação
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<Record<number, number>>({});


  const EDIT_KEYS: (keyof ExtractedItem)[] = [
    "descricao", "valor", "data", "tipo_sugerido", "destino_sugerido",
    "categoria_sugerida", "categoria_id", "fornecedor_cliente", "fornecedor_id",
    "cliente_id", "forma_pagamento", "forma_pagamento_id", "projeto_id", "observacoes",
  ];
  const isEdited = (item: ExtractedItem) => {
    if (!item.original) return false;
    return EDIT_KEYS.some(k => (item as any)[k] !== (item.original as any)[k]);
  };
  const revertItem = (fileIdx: number, itemIdx: number) => {
    const it = files[fileIdx]?.items[itemIdx];
    if (!it?.original) return;
    const patch: Partial<ExtractedItem> = {};
    EDIT_KEYS.forEach(k => { (patch as any)[k] = (it.original as any)[k]; });
    updateItem(fileIdx, itemIdx, patch);
    toast.success("Lançamento revertido aos valores extraídos pela IA");
  };

  const fetchPendingImports = async () => {
    if (!empresaId) return;
    setLoadingPending(true);
    const { data, error } = await supabase
      .from("importacoes_temporarias" as any)
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("status", "pendente")
      .order("created_at", { ascending: false });
    
    if (!error && data) setPendingImports(data as any as PendingImport[]);
    setLoadingPending(false);
  };

  const deletePendingImport = async (id: string) => {
    const { error } = await supabase
      .from("importacoes_temporarias" as any)
      .delete()
      .eq("id", id);
    
    if (!error) {
      setPendingImports(prev => prev.filter(p => p.id !== id));
      toast.success("Importação removida");
    } else {
      toast.error("Erro ao remover importação");
    }
  };
  const loadPendingImport = async (item: PendingImport) => {
    const newFiles: FileResult[] = [{
      id: item.id,
      fileName: item.nome_arquivo,
      status: "done",
      items: item.dados as any as ExtractedItem[],
      modelUsed: item.modelo_ia || undefined,
      resumo: item.resumo || undefined
    }];
    
    setFiles(prev => [...prev, ...newFiles]);
    setShowPending(false);
    toast.success(`Carregado: ${item.nome_arquivo}`);
  };

  useEffect(() => {
    if (!empresaId) return;
    fetchPendingImports();
    (async () => {
      const [cat, forn, cli, fp, proj] = await Promise.all([
        supabase.from("categorias").select("id, nome, tipo").eq("empresa_id", empresaId).order("nome"),
        supabase.from("fornecedores").select("id, nome").eq("empresa_id", empresaId).eq("ativo", true).order("nome"),
        supabase.from("clientes").select("id, nome").eq("empresa_id", empresaId).eq("ativo", true).order("nome"),
        supabase.from("formas_pagamento").select("id, descricao").eq("empresa_id", empresaId).order("descricao"),
        (supabase as any).from("projetos").select("id, nome").eq("empresa_id", empresaId).eq("status", "ativo").order("nome"),
      ]);
      setCategorias((cat.data || []) as any);
      setFornecedores((forn.data || []) as any);
      setClientes((cli.data || []) as any);
      setFormasPagamento(((fp.data || []) as any[]).map(f => ({ id: f.id, nome: f.descricao })));
      setProjetos((proj.data || []) as any);
    })();
  }, [empresaId]);

  const updateItem = (fileIdx: number, itemIdx: number, patch: Partial<ExtractedItem>) => {
    setFiles(prev => prev.map((f, fi) =>
      fi === fileIdx ? {
        ...f,
        items: f.items.map((it, ii) => ii === itemIdx ? { ...it, ...patch } : it),
      } : f
    ));
  };

  const existingLancamentosRef = useRef<Array<{ id: string; descricao: string; valor: number; data_vencimento: string | null; tipo: string }>>([]);

  // Normaliza string para comparação case-insensitive (ex: Pix = PIX)
  const normalize = (s: string) =>
    (s || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove acentos


  const tokenOverlap = (a: string, b: string): number => {
    const ta = new Set(normalize(a).split(" ").filter(t => t.length >= 3));
    const tb = new Set(normalize(b).split(" ").filter(t => t.length >= 3));
    if (ta.size === 0 || tb.size === 0) return 0;
    let common = 0;
    ta.forEach(t => { if (tb.has(t)) common++; });
    return common / Math.min(ta.size, tb.size);
  };

  const findDuplicates = (item: ExtractedItem): DuplicateMatch[] => {
    const results: DuplicateMatch[] = [];
    const itemDate = item.data ? new Date(item.data).getTime() : null;
    for (const l of existingLancamentosRef.current) {
      const valorDelta = Math.abs(l.valor - item.valor);
      const valorRel = item.valor > 0 ? valorDelta / item.valor : 1;
      const sameValor = valorDelta < 0.01 || valorRel <= 0.01; // exato ou 1%
      let dateDiffDays: number | null = null;
      if (itemDate && l.data_vencimento) {
        dateDiffDays = Math.abs((itemDate - new Date(l.data_vencimento).getTime()) / 86400000);
      }
      const closeDate = dateDiffDays !== null && dateDiffDays <= 15;
      const descSim = tokenOverlap(item.descricao, l.descricao);
      const sameDesc = descSim >= 0.6;

      let motivo = "";
      if (sameValor && closeDate) motivo = `Valor idêntico e data próxima (${Math.round(dateDiffDays!)}d)`;
      else if (sameValor && sameDesc) motivo = "Valor e descrição muito semelhantes";
      else if (sameDesc && closeDate) motivo = "Descrição semelhante e data próxima";
      else if (sameValor && item.valor > 0) motivo = "Valor exato";
      else if (descSim >= 0.8) motivo = "Descrição muito semelhante";

      if (motivo) {
        results.push({
          id: l.id,
          descricao: l.descricao,
          valor: l.valor,
          data_vencimento: l.data_vencimento,
          tipo: l.tipo,
          motivo,
        });
        if (results.length >= 3) break;
      }
    }
    return results;
  };

  const loadExistingLancamentos = async () => {
    if (!empresaId) return;
    const since = new Date();
    since.setDate(since.getDate() - 180);
    const { data } = await supabase
      .from("lancamentos")
      .select("id, descricao, valor, data_vencimento, tipo")
      .eq("empresa_id", empresaId)
      .gte("data_vencimento", since.toISOString().split("T")[0])
      .order("data_vencimento", { ascending: false })
      .limit(1000);
    existingLancamentosRef.current = (data || []) as any;
  };

  // Load active LLMs (excluding lovable_ai)
  useEffect(() => {
    if (!empresaId) return;
    const fetchLLMs = async () => {
      setLoadingLLMs(true);
      const { data } = await supabase
        .from("integracoes")
        .select("id, plataforma")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .in("plataforma", ["openai", "google_gemini", "anthropic", "deepseek"]);

      const llms = (data || []) as ActiveLLM[];
      setActiveLLMs(llms);
      if (llms.length === 1) {
        setSelectedLLM(llms[0].plataforma);
      }
      setLoadingLLMs(false);
    };
    fetchLLMs();
  }, [empresaId]);

  const normalizedCategorias = useMemo(() => categorias.map(c => ({ ...c, norm: normalize(c.nome) })), [categorias]);
  const normalizedFornecedores = useMemo(() => fornecedores.map(f => ({ ...f, norm: normalize(f.nome) })), [fornecedores]);
  const normalizedClientes = useMemo(() => clientes.map(c => ({ ...c, norm: normalize(c.nome) })), [clientes]);
  const normalizedFormasPagamento = useMemo(() => formasPagamento.map(f => ({ ...f, norm: normalize(f.nome) })), [formasPagamento]);

  const isNewEntity = (name: string | null, type: "categoria" | "fornecedor" | "cliente" | "forma_pagamento") => {
    if (!name) return false;
    const norm = normalize(name);
    let list: any[] = [];
    if (type === "categoria") list = normalizedCategorias;
    else if (type === "fornecedor") list = normalizedFornecedores;
    else if (type === "cliente") list = normalizedClientes;
    else if (type === "forma_pagamento") list = normalizedFormasPagamento;
    return !list.some(item => item.norm === norm);
  };

  const formatCurrency = (val: number) => {
    if (!valuesVisible) return "R$ •••••";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(ext || "")) return <Image className="h-4 w-4" />;
    if (["csv", "xls", "xlsx"].includes(ext || "")) return <Sheet className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const readFileContent = async (file: File): Promise<{ textContent?: string; imageBase64?: string; mimeType: string }> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const mimeType = file.type || "application/octet-stream";

    // Imagens: enviar como visão (base64 completo)
    if (file.type.startsWith("image/")) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return { imageBase64: base64, mimeType };
    }

    // CSV/TXT: texto direto
    if (file.type === "text/csv" || file.type === "text/plain" || ext === "csv" || ext === "txt") {
      return { textContent: await file.text(), mimeType };
    }

    // PDF: extrai texto com pdfjs; se vier muito pouco texto, renderiza 1a página como imagem
    if (file.type === "application/pdf" || ext === "pdf") {
      const pdfjs: any = await import("pdfjs-dist");
      // worker via CDN para evitar bundling
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let textContent = "";
      const maxPages = Math.min(pdf.numPages, 10);
      for (let p = 1; p <= maxPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const pageText = content.items.map((it: any) => it.str).join(" ");
        textContent += `\n--- Página ${p} ---\n${pageText}`;
      }

      if (textContent.replace(/\s/g, "").length < 50) {
        // Fallback: renderiza primeira página como imagem para análise visual
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const dataUrl = canvas.toDataURL("image/png");
        return { imageBase64: dataUrl.split(",")[1], mimeType: "image/png" };
      }
      return { textContent, mimeType: "application/pdf" };
    }

    // Excel: SheetJS converte para CSV
    if (ext === "xls" || ext === "xlsx" || file.type.includes("spreadsheet") || file.type.includes("excel")) {
      const XLSX: any = await import("xlsx");
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      let textContent = "";
      wb.SheetNames.forEach((name: string) => {
        const sheet = wb.Sheets[name];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        textContent += `\n--- Planilha: ${name} ---\n${csv}`;
      });
      return { textContent, mimeType };
    }

    return { textContent: await file.text(), mimeType };
  };

  const handleFilesSelected = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileResult[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} excede o limite de 10MB`);
        continue;
      }

      if (file.type.startsWith("video/")) {
        toast.error(`${file.name}: vídeos não são suportados`);
        continue;
      }

      newFiles.push({
        fileName: file.name,
        status: "pending",
        items: [],
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFilesSelected(e.dataTransfer.files);
  }, []);

  const retryFile = (idx: number) => {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: "pending", items: [], error: undefined } : f));
  };

  const processFiles = async () => {
    if (!empresaId) return;

    if (activeLLMs.length === 0) {
      toast.error("Configure uma integração de IA nas Integrações antes de continuar.");
      return;
    }

    if (activeLLMs.length > 1 && !selectedLLM) {
      toast.error("Selecione qual IA deseja usar para a análise.");
      return;
    }

    const input = fileInputRef.current;
    if (!input?.files?.length && files.every(f => f.status !== "pending")) {
      toast.error("Nenhum arquivo pendente para processar");
      return;
    }

    setProcessing(true);
    const inputFiles = input?.files;

    // Carrega lançamentos existentes (últimos 180 dias) para detecção de duplicatas
    await loadExistingLancamentos();

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;

      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "processing" } : f));

      try {
        let fileObj: File | undefined;
        if (inputFiles) {
          for (let j = 0; j < inputFiles.length; j++) {
            if (inputFiles[j].name === files[i].fileName) {
              fileObj = inputFiles[j];
              break;
            }
          }
        }

        if (!fileObj) {
          throw new Error("Arquivo não encontrado no input");
        }

        const { textContent, imageBase64, mimeType } = await readFileContent(fileObj);

        const body: any = { fileName: files[i].fileName, textContent, imageBase64, mimeType };
        if (selectedLLM) {
          body.preferredLLM = selectedLLM;
        }

        const { data, error } = await supabase.functions.invoke("process-document-import", {
          body,
        });

        if (error) {
          const msg = await extractEdgeError(error, "Erro ao processar documento");
          throw new Error(msg);
        }
        if (data?.error) throw new Error(data.error);

        const rawItems = (data?.data?.itens || []) as any[];
        const items: ExtractedItem[] = rawItems.map((item: any) => {
          // Garantir que campos obrigatórios existam (AI às vezes usa nomes em inglês)
          const normalized: ExtractedItem = {
            descricao: item.descricao || item.description || item.name || "Sem descrição",
            valor: parseFloat(item.valor || item.amount || item.value || 0),
            data: item.data || item.date || null,
            tipo_sugerido: item.tipo_sugerido || item.type || "despesa",
            destino_sugerido: item.destino_sugerido || "lancamento",
            categoria_sugerida: item.categoria_sugerida || item.category || null,
            fornecedor_cliente: item.fornecedor_cliente || item.merchant || item.vendor || item.client || item.customer || null,
            forma_pagamento: item.forma_pagamento || item.payment_method || null,
            observacoes: item.observacoes || item.notes || item.observations || null,
            confianca: item.confianca || item.confidence || 100,
          };

          const dups = findDuplicates(normalized);
          const { selected: _s, possibleDuplicates: _p, original: _o, ...snapshot } = normalized;
          return { ...normalized, possibleDuplicates: dups, selected: dups.length === 0, original: snapshot };
        });
        const modelLabel = data?.model || "desconhecido";
        const resumo = data?.resumo || data?.data?.resumo || null;

        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: "done", items, modelUsed: modelLabel, resumo } : f
        ));

        // Salvar na tabela temporária
        if (items.length > 0 && empresaId && user) {
          await supabase.from("importacoes_temporarias" as any).insert({
            empresa_id: empresaId,
            usuario_id: user.id,
            nome_arquivo: files[i].fileName,
            dados: items as any,
            resumo: resumo,
            modelo_ia: modelLabel,
            status: "pendente"
          });
          fetchPendingImports();
        }

        const dupCount = items.filter(it => (it.possibleDuplicates?.length || 0) > 0).length;
        if (dupCount > 0) {
          toast.warning(`${files[i].fileName}: ${dupCount} possível(eis) duplicata(s) — revise antes de importar`);
        }

        if (items.length === 0) {
          toast.info(`${files[i].fileName}: nenhum dado relevante encontrado`);
        } else {
          toast.success(`${files[i].fileName}: ${items.length} item(ns) encontrado(s)`);
        }
      } catch (err: any) {
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: "error", error: err.message } : f
        ));
        toast.error(`Erro ao processar ${files[i].fileName}: ${err.message}`);
      }
    }

    setProcessing(false);
  };

  const toggleItem = (fileIdx: number, itemIdx: number) => {
    setFiles(prev => prev.map((f, fi) =>
      fi === fileIdx ? {
        ...f,
        items: f.items.map((item, ii) =>
          ii === itemIdx ? { ...item, selected: !item.selected } : item
        ),
      } : f
    ));
  };

  const changeDestino = (fileIdx: number, itemIdx: number, destino: string) => {
    setFiles(prev => prev.map((f, fi) =>
      fi === fileIdx ? {
        ...f,
        items: f.items.map((item, ii) =>
          ii === itemIdx ? { ...item, destino_sugerido: destino } : item
        ),
      } : f
    ));
  };

  const changeTipo = (fileIdx: number, itemIdx: number, tipo: string) => {
    setFiles(prev => prev.map((f, fi) =>
      fi === fileIdx ? {
        ...f,
        items: f.items.map((item, ii) =>
          ii === itemIdx ? { ...item, tipo_sugerido: tipo } : item
        ),
      } : f
    ));
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const selectedItems = files.flatMap((f, fi) =>
    f.items.filter(item => item.selected).map((item, ii) => ({ ...item, fileIdx: fi, itemIdx: ii }))
  );

  const handleSaveSelected = async () => {
    if (!empresaId || selectedItems.length === 0) return;
    setSaving(true);

    // Cache em memória de categorias/fornecedores/clientes para evitar duplicação
    const catCache: Record<string, string> = {};
    const fornCache: Record<string, string> = {};
    const cliCache: Record<string, string> = {};

    const findOrCreateCategoria = async (nome: string, tipo: string): Promise<string | null> => {
      const key = `${nome.toLowerCase()}|${tipo}`;
      if (catCache[key]) return catCache[key];
      const { data: existing } = await supabase
        .from("categorias").select("id").eq("empresa_id", empresaId)
        .ilike("nome", nome).eq("tipo", tipo).maybeSingle();
      if (existing?.id) { catCache[key] = existing.id; return existing.id; }
      const { data: created, error } = await supabase
        .from("categorias").insert({ empresa_id: empresaId, nome, tipo }).select("id").single();
      if (error || !created) return null;
      catCache[key] = created.id;
      return created.id;
    };

    const findOrCreateFornecedor = async (nome: string): Promise<string | null> => {
      const key = nome.toLowerCase();
      if (fornCache[key]) return fornCache[key];
      const { data: existing } = await supabase
        .from("fornecedores").select("id").eq("empresa_id", empresaId).ilike("nome", nome).maybeSingle();
      if (existing?.id) { fornCache[key] = existing.id; return existing.id; }
      const { data: created, error } = await supabase
        .from("fornecedores").insert({ empresa_id: empresaId, nome }).select("id").single();
      if (error || !created) return null;
      fornCache[key] = created.id;
      return created.id;
    };

    const findOrCreateCliente = async (nome: string): Promise<string | null> => {
      const key = nome.toLowerCase();
      if (cliCache[key]) return cliCache[key];
      const { data: existing } = await supabase
        .from("clientes").select("id").eq("empresa_id", empresaId).ilike("nome", nome).maybeSingle();
      if (existing?.id) { cliCache[key] = existing.id; return existing.id; }
      const { data: created, error } = await supabase
        .from("clientes").insert({ empresa_id: empresaId, nome, origem: "importacao" }).select("id").single();
      if (error || !created) return null;
      cliCache[key] = created.id;
      return created.id;
    };

    let successCount = 0;
    let errorCount = 0;

    for (const item of selectedItems) {
      try {
        if (item.destino_sugerido === "venda") {
          const { error } = await supabase.from("vendas_digitais").insert({
            empresa_id: empresaId,
            plataforma: "importacao",
            produto: item.descricao,
            valor_bruto: item.valor,
            valor_liquido: item.valor,
            taxa: 0,
            data_venda: item.data || new Date().toISOString(),
            status: "aprovada",
            cliente: item.fornecedor_cliente,
            observacoes: item.observacoes,
            origem: "importacao",
          });
          if (error) throw error;
        } else {
          const tipo = item.tipo_sugerido || "despesa";
          const payload: any = {
            empresa_id: empresaId,
            descricao: item.descricao,
            valor: item.valor,
            data_vencimento: item.data || new Date().toISOString().split("T")[0],
            tipo,
            status: "pendente",
            origem: "importacao",
          };
          if (item.categoria_id && item.categoria_id !== "__new__") {
            payload.categoria_id = item.categoria_id;
          } else if (item.categoria_sugerida) {
            const catId = await findOrCreateCategoria(item.categoria_sugerida, tipo);
            if (catId) payload.categoria_id = catId;
          }
          if (item.forma_pagamento_id && item.forma_pagamento_id !== "__new__") {
            payload.forma_pagamento_id = item.forma_pagamento_id;
          } else if (item.forma_pagamento) {
            // cria forma de pagamento se não existir
            const { data: existing } = await supabase
              .from("formas_pagamento").select("id").eq("empresa_id", empresaId)
              .ilike("descricao", item.forma_pagamento).maybeSingle();
            if (existing?.id) payload.forma_pagamento_id = existing.id;
            else {
              const { data: created } = await supabase
                .from("formas_pagamento").insert({ empresa_id: empresaId, descricao: item.forma_pagamento }).select("id").single();
              if (created?.id) payload.forma_pagamento_id = created.id;
            }
          }
          if (tipo === "receita") {
            if (item.cliente_id && item.cliente_id !== "__new__") payload.cliente_id = item.cliente_id;
            else if (item.fornecedor_cliente) {
              const cliId = await findOrCreateCliente(item.fornecedor_cliente);
              if (cliId) payload.cliente_id = cliId;
            }
          } else {
            if (item.fornecedor_id && item.fornecedor_id !== "__new__") payload.fornecedor_id = item.fornecedor_id;
            else if (item.fornecedor_cliente) {
              const fId = await findOrCreateFornecedor(item.fornecedor_cliente);
              if (fId) payload.fornecedor_id = fId;
            }
          }
          if (item.projeto_id) payload.projeto_id = item.projeto_id;
          const { error } = await supabase.from("lancamentos").insert(payload);
          if (error) throw error;
        }
        successCount++;
      } catch (err: any) {
        errorCount++;
        console.error("Erro ao salvar item:", err);
      }
    }

    setSaving(false);

    if (successCount > 0) toast.success(`${successCount} item(ns) importado(s) com sucesso!`);
    if (errorCount > 0) toast.error(`${errorCount} item(ns) falharam ao importar`);

    if (successCount > 0) {
      setFiles(prev => {
        const next = prev.map(f => ({
          ...f,
          items: f.items.map(item => item.selected ? { ...item, selected: false } : item),
        }));
        
        // Remove arquivos que não possuem mais itens pendentes de seleção
        return next.filter(f => f.items.some(item => item.selected === false || !item.selected));
      });
      
      // Remove da base temporária os registros que foram importados (arquivos carregados de pendentes)
      const importedFileIds = files
        .filter(f => f.id && f.items.every(item => item.selected))
        .map(f => f.id as string);

      if (importedFileIds.length > 0) {
        await Promise.all(importedFileIds.map(id => deletePendingImport(id)));
      }

      fetchPendingImports();
    }
  };


  const totalSelected = selectedItems.length;
  const totalValue = selectedItems.reduce((s, i) => s + (i.valor || 0), 0);
  const hasNoLLM = !loadingLLMs && activeLLMs.length === 0;
  const hasMultipleLLMs = activeLLMs.length > 1;
  const hasPendingFiles = files.some(f => f.status === "pending");
  const hasEmptyResults = files.some(f => f.status === "done" && f.items.length === 0);
  const hasErrors = files.some(f => f.status === "error");

  return (
    <div className="space-y-6">
      {/* Banner em desenvolvimento */}
      <Alert className="border-amber-500/40 bg-amber-500/10">
        <FlaskConical className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-700 dark:text-amber-400 font-semibold">Recurso em desenvolvimento</AlertTitle>
        <AlertDescription className="text-amber-600/90 dark:text-amber-300/80 text-xs">
          A importação inteligente de documentos está em fase de testes. Os resultados podem variar conforme o tipo e a qualidade do arquivo enviado. Utilize os dados extraídos como sugestão e revise antes de confirmar.
        </AlertDescription>
      </Alert>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
              <FileUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Importar Documentos</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Importe dados de cupons, notas fiscais, PDFs e planilhas usando IA
          </p>
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setValuesVisible(v => !v)}>
                {valuesVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{valuesVisible ? "Ocultar valores" : "Exibir valores"}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* No LLM configured warning */}
      {hasNoLLM && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400 shrink-0">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Configuração necessária</h3>
                <p className="text-sm text-muted-foreground">
                  Para utilizar a importação inteligente, é necessário configurar uma integração de Inteligência Artificial na página de{" "}
                  <a href="/settings/integracoes" className="text-primary underline hover:text-primary/80">Integrações</a>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão para mostrar pendentes */}
      {!showPending && pendingImports.length > 0 && (
        <Button 
          variant="outline" 
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
          onClick={() => setShowPending(true)}
        >
          <History className="h-4 w-4" />
          Ver {pendingImports.length} importações pendentes anteriores
        </Button>
      )}

      {/* Lista de Pendentes */}
      {showPending && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Importações não finalizadas</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowPending(false)}>Ocultar</Button>
          </div>
          <ImportacoesPendentes 
            items={pendingImports} 
            loading={loadingPending}
            onLoad={loadPendingImport}
            onDelete={(id) => setDeletePendingRef(id)}
          />
        </div>
      )}


      {/* LLM Selection - show when at least 1 LLM is active */}
      {!loadingLLMs && activeLLMs.length >= 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1 text-sm">Inteligência Artificial para análise</h3>
                {activeLLMs.length === 1 ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      Modelo ativo:
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {LLM_LABELS[activeLLMs[0].plataforma] || activeLLMs[0].plataforma}
                    </Badge>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      Você possui mais de uma integração de IA configurada. Escolha qual deseja utilizar.
                    </p>
                    <Select value={selectedLLM} onValueChange={setSelectedLLM}>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Selecionar IA..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeLLMs.map(llm => (
                          <SelectItem key={llm.id} value={llm.plataforma}>
                            {LLM_LABELS[llm.plataforma] || llm.plataforma}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
              "hover:border-primary/50 hover:bg-primary/5",
              "border-muted-foreground/25",
              hasNoLLM && "opacity-50 pointer-events-none"
            )}
            onClick={() => !hasNoLLM && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={hasNoLLM ? undefined : handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Arraste arquivos aqui ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground">
              Imagens (JPG, PNG), PDFs, Planilhas (CSV, XLS, XLSX) — Máx. 10MB por arquivo
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{files.length} arquivo(s)</span>
                <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive hover:text-destructive" onClick={() => { setFiles([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Limpar tudo
                </Button>
              </div>
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                  {getFileIcon(file.fileName)}
                  <span className="text-sm flex-1 truncate">{file.fileName}</span>
                  {file.status === "pending" && <Badge variant="outline" className="text-xs">Pendente</Badge>}
                  {file.status === "processing" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {file.status === "done" && file.items.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-green-100 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {file.items.length} item(ns)
                      </Badge>
                      {file.modelUsed && (
                        <Badge variant="outline" className="text-[10px]">{file.modelUsed}</Badge>
                      )}
                    </div>
                  )}
                  {file.status === "done" && file.items.length === 0 && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Sem dados
                    </Badge>
                  )}
                  {file.status === "error" && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />Erro
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs"><p>{file.error}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {/* Retry button for errors or empty results */}
                  {(file.status === "error" || (file.status === "done" && file.items.length === 0)) && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => retryFile(idx)}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Tentar novamente</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={processFiles}
                  disabled={processing || !hasPendingFiles || (hasMultipleLLMs && !selectedLLM)}
                >
                  {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                  {processing ? "Analisando..." : "Analisar com IA"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Results */}
      {files.some(f => f.items.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Dados Extraídos
            </CardTitle>
            <CardDescription>
              Revise os dados encontrados e selecione os itens para importar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file, fileIdx) =>
                file.items.length > 0 && (
                  <div key={fileIdx} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      {getFileIcon(file.fileName)}
                      <span>{file.fileName}</span>
                      {file.modelUsed && (
                        <Badge variant="outline" className="text-[10px] ml-auto">{file.modelUsed}</Badge>
                      )}
                    </div>
                    {file.resumo && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 italic">{file.resumo}</p>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="p-2 w-8"></th>
                            <th className="p-2">Descrição</th>
                            <th className="p-2">Valor</th>
                            <th className="p-2">Data</th>
                            <th className="p-2">Destino</th>
                            <th className="p-2">Tipo</th>
                            <th className="p-2">Confiança</th>
                          </tr>
                        </thead>
                        <tbody>
                          {file.items
                            .slice(
                              ((currentPage[fileIdx] || 1) - 1) * ITEMS_PER_PAGE,
                              (currentPage[fileIdx] || 1) * ITEMS_PER_PAGE
                            )
                            .map((item, itemIdxInPage) => {
                              const itemIdx = ((currentPage[fileIdx] || 1) - 1) * ITEMS_PER_PAGE + itemIdxInPage;
                              return (
                                <tr key={itemIdx} className={cn(
                                  "border-b transition-colors",
                                  item.selected ? "bg-primary/5" : "opacity-50",
                                  (item.possibleDuplicates?.length || 0) > 0 && "bg-amber-500/5"
                                )}>
                                  <td className="p-2">
                                    <Checkbox
                                      checked={item.selected}
                                      onCheckedChange={() => toggleItem(fileIdx, itemIdx)}
                                    />
                                  </td>
                                  <td className="p-2">
                                    <div className="font-medium flex items-center gap-1.5 flex-wrap">
                                      <Button
                                        variant="ghost" size="icon" className="h-6 w-6 -ml-1"
                                        onClick={() => setEditingRef({ fileIdx, itemIdx })}
                                        title="Editar lançamento"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      {isEdited(item) && (
                                        <Button
                                          variant="ghost" size="icon" className="h-6 w-6 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                                          onClick={() => setRevertRef({ fileIdx, itemIdx })}
                                          title="Desfazer edição e voltar aos valores da IA"
                                        >
                                          <Undo2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <span>{item.descricao}</span>
                                      {(item.possibleDuplicates?.length || 0) > 0 && (
                                        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                                          <Copy className="h-3 w-3 mr-1" />
                                          Possível duplicata ({item.possibleDuplicates!.length})
                                        </Badge>
                                      )}
                                    </div>
                                    {item.fornecedor_cliente && (
                                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <span className={cn(
                                          isNewEntity(item.fornecedor_cliente, item.tipo_sugerido === "receita" ? "cliente" : "fornecedor") && 
                                          "px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-medium"
                                        )}>
                                          {item.fornecedor_cliente}
                                        </span>
                                        {isNewEntity(item.fornecedor_cliente, item.tipo_sugerido === "receita" ? "cliente" : "fornecedor") && (
                                          <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <Badge variant="outline" className="h-4 px-1 text-[9px] border-amber-500/30 text-amber-600 bg-amber-500/5">
                                                  NOVO
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent className="text-[10px]">Este {item.tipo_sugerido === "receita" ? "cliente" : "fornecedor"} não foi encontrado no sistema e será cadastrado automaticamente.</TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    )}
                                    {item.categoria_sugerida && (
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-[10px] mt-0.5",
                                          isNewEntity(item.categoria_sugerida, "categoria") && "border-amber-500/40 text-amber-700 bg-amber-500/10 font-semibold"
                                        )}
                                      >
                                        {isNewEntity(item.categoria_sugerida, "categoria") && <Plus className="h-2 w-2 mr-1" />}
                                        {item.categoria_sugerida}
                                      </Badge>
                                    )}
                                    {item.forma_pagamento && (
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-[10px] mt-0.5 ml-1",
                                          isNewEntity(item.forma_pagamento, "forma_pagamento") && "border-amber-500/40 text-amber-700 bg-amber-500/10 font-semibold"
                                        )}
                                      >
                                        {isNewEntity(item.forma_pagamento, "forma_pagamento") && <Plus className="h-2 w-2 mr-1" />}
                                        {item.forma_pagamento}
                                      </Badge>
                                    )}
                                    {item.observacoes && (
                                      <div className="text-[10px] text-muted-foreground mt-0.5 italic">{item.observacoes}</div>
                                    )}
                                    {(item.possibleDuplicates?.length || 0) > 0 && (
                                      <div className="mt-2 rounded-md border border-amber-400/40 bg-amber-500/5 p-2">
                                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                                          <Copy className="h-3 w-3" />
                                          Lançamento(s) já existente(s) semelhante(s) — confira antes de importar:
                                        </div>
                                        <ul className="space-y-1.5">
                                          {item.possibleDuplicates!.map(d => (
                                            <li key={d.id} className="text-[11px] border-l-2 border-amber-400 pl-2 bg-background/40 rounded-sm py-1 pr-2">
                                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <span className="font-medium">{d.descricao}</span>
                                                <span className="font-mono flex items-center gap-2">
                                                  {d.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                                  {d.data_vencimento && <span>• {new Date(d.data_vencimento).toLocaleDateString("pt-BR")}</span>}
                                                  <Badge variant="outline" className="text-[9px] py-0">{d.tipo}</Badge>
                                                </span>
                                              </div>
                                              <div className="text-[10px] italic text-amber-700 dark:text-amber-400 mt-0.5">{d.motivo}</div>
                                            </li>
                                          ))}
                                        </ul>
                                        <p className="text-[10px] mt-1.5 text-muted-foreground">Marque a caixa de seleção apenas se confirmar que NÃO é o mesmo lançamento.</p>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-2 font-mono font-medium whitespace-nowrap">{formatCurrency(item.valor)}</td>
                                  <td className="p-2 whitespace-nowrap">{item.data || "—"}</td>
                                  <td className="p-2">
                                    <Select value={item.destino_sugerido} onValueChange={(v) => changeDestino(fileIdx, itemIdx, v)}>
                                      <SelectTrigger className="h-7 text-xs w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="lancamento">Lançamento</SelectItem>
                                        <SelectItem value="venda">Venda</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="p-2">
                                    <Select value={item.tipo_sugerido} onValueChange={(v) => changeTipo(fileIdx, itemIdx, v)}>
                                      <SelectTrigger className="h-7 text-xs w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="receita">Receita</SelectItem>
                                        <SelectItem value="despesa">Despesa</SelectItem>
                                        <SelectItem value="investimento">Investimento</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="p-2">
                                    <div className="flex items-center gap-1.5">
                                      <Progress value={item.confianca} className="h-1.5 w-12" />
                                      <span className="text-xs text-muted-foreground">{item.confianca}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {file.items.length > ITEMS_PER_PAGE && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={(currentPage[fileIdx] || 1) === 1}
                          onClick={() => setCurrentPage(prev => ({ ...prev, [fileIdx]: (prev[fileIdx] || 1) - 1 }))}
                        >
                          Anterior
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Página {currentPage[fileIdx] || 1} de {Math.ceil(file.items.length / ITEMS_PER_PAGE)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={(currentPage[fileIdx] || 1) === Math.ceil(file.items.length / ITEMS_PER_PAGE)}
                          onClick={() => setCurrentPage(prev => ({ ...prev, [fileIdx]: (prev[fileIdx] || 1) + 1 }))}
                        >
                          Próxima
                        </Button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Summary & Save */}
            {totalSelected > 0 && (
              <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-sm">
                  <span className="font-medium">{totalSelected} item(ns) selecionado(s)</span>
                  <span className="text-muted-foreground ml-2">• Total: {formatCurrency(totalValue)}</span>
                </div>
                <Button onClick={handleSaveSelected} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Importar Selecionados
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <EditImportItemDialog
        open={!!editingRef}
        onOpenChange={(v) => { if (!v) setEditingRef(null); }}
        item={editingItem ? {
          descricao: editingItem.descricao,
          valor: editingItem.valor,
          data: editingItem.data,
          tipo_sugerido: editingItem.tipo_sugerido,
          destino_sugerido: editingItem.destino_sugerido,
          categoria_sugerida: editingItem.categoria_sugerida,
          categoria_id: editingItem.categoria_id ?? null,
          fornecedor_cliente: editingItem.fornecedor_cliente,
          fornecedor_id: editingItem.fornecedor_id ?? null,
          cliente_id: editingItem.cliente_id ?? null,
          forma_pagamento: editingItem.forma_pagamento,
          forma_pagamento_id: editingItem.forma_pagamento_id ?? null,
          projeto_id: editingItem.projeto_id ?? null,
          observacoes: editingItem.observacoes,
        } : null}
        categorias={categorias}
        fornecedores={fornecedores}
        clientes={clientes}
        formasPagamento={formasPagamento}
        projetos={projetos}
        onSave={(patch) => {
          if (editingRef) updateItem(editingRef.fileIdx, editingRef.itemIdx, patch as Partial<ExtractedItem>);
        }}
      />

      <AlertDialog open={!!revertRef} onOpenChange={(v) => { if (!v) setRevertRef(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer edição?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os campos editados deste lançamento serão substituídos pelos valores originalmente extraídos pela IA. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (revertRef) revertItem(revertRef.fileIdx, revertRef.itemIdx);
                setRevertRef(null);
              }}
            >
              Sim, restaurar valores da IA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletePendingRef} onOpenChange={(v) => { if (!v) setDeletePendingRef(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover importação pendente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente os dados desta análise que ainda não foram importados. Você terá que processar o arquivo novamente se precisar destes dados no futuro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletePendingRef) deletePendingImport(deletePendingRef);
                setDeletePendingRef(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImportarDocumentos;
