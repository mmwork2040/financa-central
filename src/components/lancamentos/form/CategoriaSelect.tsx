
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Categoria } from "@/contexts/LancamentosContext";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CategoriaSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  categorias: Categoria[];
  tipo: "despesa" | "receita" | "investimento";
  onRefresh?: () => void;
}

const tipoLabels: Record<string, string> = {
  despesa: "Despesa",
  receita: "Receita",
  investimento: "Investimento",
};

export const CategoriaSelect = ({ value, onChange, categorias, tipo, onRefresh }: CategoriaSelectProps) => {
  const filteredCategorias = categorias.filter(cat => cat.tipo === tipo);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);
  const { empresaId } = useAuth();

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error("Preencha o nome da categoria");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("categorias").insert({
        nome: nome.trim(),
        tipo,
        empresa_id: empresaId,
      } as any);
      if (error) throw error;
      toast.success("Categoria cadastrada com sucesso!");
      setOpen(false);
      setNome("");
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar categoria");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="categoria" className="text-right">Categoria</Label>
      <div className="col-span-3 flex gap-2">
        <Select 
          value={value || "no-category"} 
          onValueChange={(value) => onChange(value === "no-category" ? "" : value)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-category">Sem categoria</SelectItem>
            {filteredCategorias.map(categoria => (
              <SelectItem key={categoria.id} value={categoria.id}>{categoria.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onRefresh && (
          <>
            <button
              type="button"
              onClick={() => { setNome(""); setOpen(true); }}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Adicionar Categoria"
            >
              <Plus size={16} />
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Nova Categoria</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Nome</Label>
                    <Input
                      className="col-span-3"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Nome da categoria"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Tipo</Label>
                    <Input
                      className="col-span-3 bg-muted"
                      value={tipoLabels[tipo] || tipo}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
};
