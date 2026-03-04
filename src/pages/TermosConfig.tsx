import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileText, Shield, Loader2, Save, Eye } from "lucide-react";
import FeatureBlocked from "@/components/common/FeatureBlocked";

const TermosConfig = () => {
  const { isSuperAdmin } = useAuth();
  const [termos, setTermos] = useState("");
  const [politica, setPolitica] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewTab, setPreviewTab] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data } = await (supabase as any)
        .from("termos_politica")
        .select("tipo, conteudo");
      if (data) {
        for (const item of data) {
          if (item.tipo === "termos_uso") setTermos(item.conteudo || "");
          if (item.tipo === "politica_privacidade") setPolitica(item.conteudo || "");
        }
      }
    } catch (e) {
      console.error("Erro ao carregar termos:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (tipo: string, conteudo: string) => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("termos_politica")
        .upsert({ tipo, conteudo, updated_at: new Date().toISOString() }, { onConflict: "tipo" });
      if (error) throw error;
      toast.success("Conteúdo salvo com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 text-sm text-muted-foreground">{line.slice(2)}</li>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>;
    });
  };

  if (!isSuperAdmin) {
    return <FeatureBlocked title="Termos e Políticas" description="Apenas super administradores podem editar os termos de uso e política de privacidade." />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Termos e Políticas</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Edite os Termos de Uso e Política de Privacidade exibidos aos usuários</p>
      </div>

      <Tabs defaultValue="termos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="termos" className="gap-2">
            <FileText className="h-4 w-4" />
            Termos de Uso
          </TabsTrigger>
          <TabsTrigger value="privacidade" className="gap-2">
            <Shield className="h-4 w-4" />
            Política de Privacidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="termos" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Conteúdo (Markdown)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setPreviewTab(previewTab === "termos" ? null : "termos")}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {previewTab === "termos" ? "Editar" : "Pré-visualizar"}
                </Button>
              </div>
              {previewTab === "termos" ? (
                <div className="border rounded-lg p-4 min-h-[400px] bg-muted/20">
                  {renderMarkdown(termos)}
                </div>
              ) : (
                <Textarea
                  value={termos}
                  onChange={(e) => setTermos(e.target.value)}
                  rows={20}
                  className="font-mono text-xs"
                  placeholder="# Termos de Uso&#10;&#10;Escreva aqui os termos de uso..."
                />
              )}
              <div className="flex justify-end">
                <Button onClick={() => handleSave("termos_uso", termos)} disabled={saving} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar Termos"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacidade" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Conteúdo (Markdown)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setPreviewTab(previewTab === "privacidade" ? null : "privacidade")}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {previewTab === "privacidade" ? "Editar" : "Pré-visualizar"}
                </Button>
              </div>
              {previewTab === "privacidade" ? (
                <div className="border rounded-lg p-4 min-h-[400px] bg-muted/20">
                  {renderMarkdown(politica)}
                </div>
              ) : (
                <Textarea
                  value={politica}
                  onChange={(e) => setPolitica(e.target.value)}
                  rows={20}
                  className="font-mono text-xs"
                  placeholder="# Política de Privacidade&#10;&#10;Escreva aqui a política..."
                />
              )}
              <div className="flex justify-end">
                <Button onClick={() => handleSave("politica_privacidade", politica)} disabled={saving} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar Política"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TermosConfig;
