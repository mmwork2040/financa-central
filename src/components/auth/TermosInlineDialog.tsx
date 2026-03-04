import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Shield, Loader2 } from "lucide-react";

const renderMarkdown = (text: string) => {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("# ")) return <h1 key={i} className="text-lg font-bold mt-4 mb-2">{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-base font-semibold mt-3 mb-1">{line.slice(3)}</h2>;
    if (line.startsWith("- ")) return <li key={i} className="ml-4 text-xs text-muted-foreground">{line.slice(2)}</li>;
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-xs font-semibold text-foreground">{line.slice(2, -2)}</p>;
    if (line.trim() === "" || line.trim() === "---") return <br key={i} />;
    return <p key={i} className="text-xs text-muted-foreground leading-relaxed">{line}</p>;
  });
};

interface TermosInlineDialogProps {
  defaultTab?: string;
  trigger: React.ReactNode;
}

const TermosInlineDialog = ({ defaultTab = "termos", trigger }: TermosInlineDialogProps) => {
  const [termos, setTermos] = useState("");
  const [politica, setPolitica] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && loading) {
      fetchContent();
    }
  }, [open]);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-base">Termos e Políticas</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue={defaultTab} className="px-6 pb-6">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="termos" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" />
                Termos de Uso
              </TabsTrigger>
              <TabsTrigger value="privacidade" className="gap-1.5 text-xs">
                <Shield className="h-3.5 w-3.5" />
                Política de Privacidade
              </TabsTrigger>
            </TabsList>
            <TabsContent value="termos">
              <ScrollArea className="h-[50vh] pr-4">
                {termos ? renderMarkdown(termos) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum conteúdo definido.</p>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="privacidade">
              <ScrollArea className="h-[50vh] pr-4">
                {politica ? renderMarkdown(politica) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum conteúdo definido.</p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TermosInlineDialog;
