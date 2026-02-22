import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

interface ExportLancamentosDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportLancamentosDialog: React.FC<ExportLancamentosDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { empresaId } = useAuth();
  const [empresas, setEmpresas] = useState<{ id: string; nome: string }[]>([]);
  const [targetEmpresaId, setTargetEmpresaId] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchEmpresas = async () => {
      setLoadingEmpresas(true);
      try {
        const { data, error } = await supabase
          .from("empresas")
          .select("id, nome")
          .order("nome");
        if (error) throw error;
        setEmpresas((data || []).filter((e) => e.id !== empresaId));
      } catch {
        toast.error("Erro ao carregar empresas");
      } finally {
        setLoadingEmpresas(false);
      }
    };
    fetchEmpresas();
  }, [isOpen, empresaId]);

  const handleExport = async () => {
    if (!targetEmpresaId || !empresaId) return;
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-lancamentos", {
        body: {
          sourceEmpresaId: empresaId,
          targetEmpresaId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        `Exportação concluída! ${data.lancamentosCount} lançamentos, ${data.categoriasCount} categorias, ${data.clientesCount} clientes, ${data.fornecedoresCount} fornecedores, ${data.contasBancariasCount} contas bancárias e ${data.formasPagamentoCount} formas de pagamento exportados.`
      );
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao exportar lançamentos");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Exportar Lançamentos
          </DialogTitle>
          <DialogDescription>
            <span className="text-destructive font-semibold">Atenção:</span> Todos os registros existentes na empresa destino (lançamentos, categorias, clientes, fornecedores, contas bancárias e formas de pagamento) serão <span className="text-destructive font-semibold">excluídos</span> antes da importação. Em seguida, os dados da empresa atual serão copiados para a empresa destino.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="target-empresa">Empresa destino</Label>
          {loadingEmpresas ? (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando empresas...
            </div>
          ) : (
            <Select value={targetEmpresaId} onValueChange={setTargetEmpresaId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione a empresa destino" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={exporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={exporting || !targetEmpresaId}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Exportando...
              </>
            ) : (
              "Exportar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportLancamentosDialog;
