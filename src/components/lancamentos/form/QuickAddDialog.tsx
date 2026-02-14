import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface QuickAddField {
  name: string;
  label: string;
  type?: "text" | "select" | "number";
  options?: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string;
}

interface QuickAddDialogProps {
  title: string;
  table: string;
  fields: QuickAddField[];
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export const QuickAddDialog = ({ title, table, fields, onSuccess, trigger }: QuickAddDialogProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    fields.forEach(f => {
      if (f.defaultValue) defaults[f.name] = f.defaultValue;
    });
    return defaults;
  });
  const { empresaId } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    const requiredFields = fields.filter(f => f.required !== false);
    const missing = requiredFields.find(f => !formValues[f.name]?.trim());
    if (missing) {
      toast({ title: "Campo obrigatório", description: `Preencha o campo "${missing.label}"`, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const insertData: Record<string, any> = { ...formValues };
      if (empresaId) insertData.empresa_id = empresaId;

      // Convert number fields
      fields.forEach(f => {
        if (f.type === "number" && insertData[f.name]) {
          insertData[f.name] = Number(insertData[f.name]);
        }
      });

      const { error } = await supabase.from(table as any).insert(insertData);
      if (error) throw error;

      toast({ title: "Cadastrado com sucesso!", description: `${title} adicionado(a).` });
      setOpen(false);
      setFormValues(() => {
        const defaults: Record<string, string> = {};
        fields.forEach(f => {
          if (f.defaultValue) defaults[f.name] = f.defaultValue;
        });
        return defaults;
      });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        title={`Adicionar ${title}`}
      >
        {trigger || <Plus size={16} />}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Novo(a) {title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {fields.map(field => (
              <div key={field.name} className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{field.label}</Label>
                {field.type === "select" && field.options ? (
                  <Select
                    value={formValues[field.name] || ""}
                    onValueChange={(val) => setFormValues(prev => ({ ...prev, [field.name]: val }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={`Selecione`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="col-span-3"
                    type={field.type || "text"}
                    value={formValues[field.name] || ""}
                    onChange={(e) => setFormValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.label}
                  />
                )}
              </div>
            ))}
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
  );
};
