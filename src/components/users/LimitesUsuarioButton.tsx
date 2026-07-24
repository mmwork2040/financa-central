import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sliders, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LimitesUsuarioButtonProps {
  userId: string;
  userName: string;
  onSaved?: () => void;
}

export const LimitesUsuarioButton: React.FC<LimitesUsuarioButtonProps> = ({
  userId,
  userName,
  onSaved,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maxPJ, setMaxPJ] = useState<number>(1);
  const [permitePessoal, setPermitePessoal] = useState(true);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase.from("perfis") as any)
        .select("max_empresas_pj, permite_conta_pessoal")
        .eq("id", userId)
        .single();
      if (data) {
        setMaxPJ(data.max_empresas_pj ?? 1);
        setPermitePessoal(data.permite_conta_pessoal ?? true);
      }
      setLoading(false);
    })();
  }, [open, userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase.from("perfis") as any)
        .update({
          max_empresas_pj: Math.max(0, Number(maxPJ) || 0),
          permite_conta_pessoal: permitePessoal,
        })
        .eq("id", userId);
      if (error) throw error;
      toast.success("Limites atualizados.");
      setOpen(false);
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        title="Limites de empresas"
        onClick={() => setOpen(true)}
      >
        <Sliders className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Limites — {userName}</DialogTitle>
            <DialogDescription>
              Defina quantas empresas jurídicas este usuário pode ter e se pode manter uma conta pessoal.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="max-pj">Máx. de empresas (PJ)</Label>
                <Input
                  id="max-pj"
                  type="number"
                  min={0}
                  value={maxPJ}
                  onChange={(e) => setMaxPJ(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Use 0 para impedir a criação de qualquer empresa PJ.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Permitir conta pessoal</p>
                  <p className="text-xs text-muted-foreground">
                    Se desativado, o usuário só poderá acessar empresas PJ.
                  </p>
                </div>
                <Switch checked={permitePessoal} onCheckedChange={setPermitePessoal} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LimitesUsuarioButton;
