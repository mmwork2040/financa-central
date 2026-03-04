import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TermosPublico = () => {
  const [searchParams] = useSearchParams();
  const [termos, setTermos] = useState("");
  const [politica, setPolitica] = useState("");
  const [loading, setLoading] = useState(true);
  const defaultTab = searchParams.get("tab") || "termos";

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

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 text-sm text-muted-foreground">{line.slice(2)}</li>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="termos" className="gap-2">
              <FileText className="h-4 w-4" />
              Termos de Uso
            </TabsTrigger>
            <TabsTrigger value="privacidade" className="gap-2">
              <Shield className="h-4 w-4" />
              Política de Privacidade
            </TabsTrigger>
          </TabsList>
          <TabsContent value="termos">
            <div className="prose prose-sm max-w-none">
              {renderMarkdown(termos)}
            </div>
          </TabsContent>
          <TabsContent value="privacidade">
            <div className="prose prose-sm max-w-none">
              {renderMarkdown(politica)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TermosPublico;
