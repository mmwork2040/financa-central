import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface QuickAddFormaPagamentoModalProps {
  onSuccess: () => void;
}

export const QuickAddFormaPagamentoModal = ({ onSuccess }: QuickAddFormaPagamentoModalProps) => {
  const [open, setOpen] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const { empresaId } = useAuth();

  const handleOpen = () => {
    setDescricao("");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!descricao.trim()) {
      toast.error("Preencha a descrição da forma de pagamento");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("formas_pagamento").insert({
        descricao: descricao.trim(),
        empresa_id: empresaId,
      } as any);
      if (error) throw error;
      toast.success("Forma de pagamento cadastrada com sucesso!");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        title="Adicionar Forma de Pagamento"
      >
        <Plus size={16} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Forma de Pagamento</DialogTitle>
            <DialogDescription>Preencha os dados para cadastrar uma nova forma de pagamento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descricao" className="text-right">Descrição</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Digite a descrição da forma de pagamento"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
