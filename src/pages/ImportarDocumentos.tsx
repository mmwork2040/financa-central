import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, FileText, Image, Sheet, Loader2, CheckCircle2, XCircle, AlertTriangle, Trash2, ArrowRight, FileUp, Brain, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp",
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/xml", "text/xml",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type ExtractedItem = {
  descricao: string;
  valor: number;
  data: string | null;
  tipo_sugerido: string;
  destino_sugerido: string;
  categoria_sugerida: string | null;
  fornecedor_cliente: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  confianca: number;
  selected?: boolean;
};

type FileResult = {
  fileName: string;
  status: "pending" | "processing" | "done" | "error";
  items: ExtractedItem[];
  error?: string;
  provider?: string;
  model?: string;
};

const ImportarDocumentos = () => {
  const { empresaId } = useAuth();
  const [files, setFiles] = useState<FileResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [valuesVisible, setValuesVisible] = useState(true);

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

  const readFileContent = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    // For images, convert to base64 data description
    if (file.type.startsWith("image/")) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(`[Imagem ${file.name} em base64 - tipo: ${file.type}]\n\nConteúdo base64 da imagem (analise como imagem de cupom/nota fiscal):\n${base64.substring(0, 5000)}...\n\nNota: Esta é uma imagem de documento fiscal. Extraia os dados visíveis como valores, datas, itens, fornecedores, etc.`);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // For text/CSV
    if (file.type === "text/csv" || file.type === "text/plain" || ext === "csv" || ext === "txt") {
      return file.text();
    }

    // For PDF - read as text (basic extraction)
    if (file.type === "application/pdf") {
      // Send raw text representation
      const text = await file.text();
      // PDF binary will be mostly unreadable, but we send what we can
      return `[Documento PDF: ${file.name}]\n\nConteúdo extraído (pode conter caracteres especiais de PDF):\n${text.substring(0, 10000)}`;
    }

    // For Excel files
    if (ext === "xls" || ext === "xlsx") {
      return `[Planilha Excel: ${file.name}]\n\nNota: Arquivo Excel detectado. Extraia os dados tabulares visíveis.`;
    }

    return file.text();
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

  const processFiles = async () => {
    if (!empresaId) return;

    const input = fileInputRef.current;
    if (!input?.files?.length && files.every(f => f.status !== "pending")) {
      toast.error("Nenhum arquivo pendente para processar");
      return;
    }

    setProcessing(true);
    const inputFiles = input?.files;

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;

      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "processing" } : f));

      try {
        // Find matching file from input
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

        const content = await readFileContent(fileObj);

        const { data, error } = await supabase.functions.invoke("process-document-import", {
          body: { content, fileName: files[i].fileName },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const items = (data?.data?.itens || []).map((item: any) => ({ ...item, selected: true }));

        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: "done", items, provider: data?.provider, model: data?.model } : f
        ));

        if (items.length === 0) {
          toast.info(`${files[i].fileName}: nenhum dado financeiro encontrado`);
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
          const { error } = await supabase.from("lancamentos").insert({
            empresa_id: empresaId,
            descricao: item.descricao,
            valor: item.valor,
            data_vencimento: item.data || new Date().toISOString().split("T")[0],
            tipo: item.tipo_sugerido || "despesa",
            status: "pendente",
            origem: "importacao",
          });
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

    // Clear saved items
    if (successCount > 0) {
      setFiles(prev => prev.map(f => ({
        ...f,
        items: f.items.map(item => item.selected ? { ...item, selected: false } : item),
      })));
    }
  };

  const totalSelected = selectedItems.length;
  const totalValue = selectedItems.reduce((s, i) => s + (i.valor || 0), 0);

  return (
    <div className="space-y-6">
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

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
              "hover:border-primary/50 hover:bg-primary/5",
              "border-muted-foreground/25"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
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
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                  {getFileIcon(file.fileName)}
                  <span className="text-sm flex-1 truncate">{file.fileName}</span>
                  {file.status === "pending" && <Badge variant="outline" className="text-xs">Pendente</Badge>}
                  {file.status === "processing" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {file.status === "done" && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {file.items.length} item(ns)
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <Button onClick={processFiles} disabled={processing || files.every(f => f.status !== "pending")}>
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
                      {file.provider && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          {file.provider} • {file.model}
                        </Badge>
                      )}
                    </div>

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
                          {file.items.map((item, itemIdx) => (
                            <tr key={itemIdx} className={cn("border-b transition-colors", item.selected ? "bg-primary/5" : "opacity-50")}>
                              <td className="p-2">
                                <Checkbox
                                  checked={item.selected}
                                  onCheckedChange={() => toggleItem(fileIdx, itemIdx)}
                                />
                              </td>
                              <td className="p-2">
                                <div className="font-medium">{item.descricao}</div>
                                {item.fornecedor_cliente && (
                                  <div className="text-xs text-muted-foreground">{item.fornecedor_cliente}</div>
                                )}
                                {item.categoria_sugerida && (
                                  <Badge variant="outline" className="text-[10px] mt-0.5">{item.categoria_sugerida}</Badge>
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
                          ))}
                        </tbody>
                      </table>
                    </div>
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

      {/* Info card when no files */}
      {files.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-100 text-amber-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Pré-requisito: LLM Configurada</h3>
                <p className="text-sm text-muted-foreground">
                  Para utilizar a importação inteligente, é necessário configurar uma integração de Inteligência Artificial
                  (OpenAI, Google Gemini, Anthropic ou DeepSeek) na página de{" "}
                  <a href="/settings/integracoes" className="text-primary underline">Integrações</a>.
                  A Lovable AI não é utilizada para esta funcionalidade.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportarDocumentos;
