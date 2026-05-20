import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

interface CreateEmpresaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateEmpresaDialog = ({ open, onOpenChange }: CreateEmpresaDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nomeEmpresa: "",
    cnpj: "",
    email: "",
    telefone: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nomeEmpresa.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }

    if (!form.cnpj.trim()) {
      toast.error("CNPJ é obrigatório para criar uma nova empresa");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-empresa", {
        body: {
          nomeEmpresa: form.nomeEmpresa.trim(),
          cnpj: form.cnpj.trim() || undefined,
          email: form.email.trim() || undefined,
          telefone: form.telefone.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Empresa "${form.nomeEmpresa}" criada com sucesso!`);
      onOpenChange(false);
      setForm({ nomeEmpresa: "", cnpj: "", email: "", telefone: "" });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 size={18} />
            Criar Nova Empresa
          </DialogTitle>
          <DialogDescription>
            Crie uma nova empresa independente. Você será o administrador dela.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
            <Input
              id="nomeEmpresa"
              placeholder="Ex: Minha Empresa Ltda"
              value={form.nomeEmpresa}
              onChange={e => handleChange("nomeEmpresa", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              onChange={e => handleChange("cnpj", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="emailEmpresa">E-mail</Label>
              <Input
                id="emailEmpresa"
                type="email"
                placeholder="contato@empresa.com"
                value={form.email}
                onChange={e => handleChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefoneEmpresa">Telefone</Label>
              <Input
                id="telefoneEmpresa"
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={e => handleChange("telefone", e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={loading || !form.nomeEmpresa.trim()} className="w-full">
            {loading ? "Criando..." : "Criar Empresa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
