
import React from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BANCOS_INTEGRACOES = [
  { id: "banco_inter", name: "Banco Inter" },
  { id: "banco_do_brasil", name: "Banco do Brasil" },
  { id: "bradesco", name: "Bradesco" },
  { id: "santander", name: "Santander" },
  { id: "itau", name: "Itaú" },
  { id: "nubank", name: "Nubank" },
  { id: "caixa", name: "Caixa Econômica" },
  { id: "sicoob", name: "Sicoob" },
  { id: "sicredi", name: "Sicredi" },
  { id: "c6bank", name: "C6 Bank" },
  { id: "pagbank", name: "PagBank" },
  { id: "mercado_pago", name: "Mercado Pago" },
];

export interface ContaBancariaFormData {
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo_inicial: number;
  principal: boolean;
}

interface ContaBancariaFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (forcarPrincipal?: boolean) => void;
  formData: ContaBancariaFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditing: boolean;
  contaPrincipalExistente?: string | null;
  showPrincipalConfirm: boolean;
  onClosePrincipalConfirm: () => void;
  onConfirmPrincipal: () => void;
}

const ContaBancariaForm: React.FC<ContaBancariaFormProps> = ({
  open, onClose, onSave, formData, handleInputChange, isEditing,
  contaPrincipalExistente, showPrincipalConfirm, onClosePrincipalConfirm, onConfirmPrincipal,
}) => {
  const handleSaldoChange = (value: string | undefined) => {
    const cents = parseInt(value || "0", 10);
    const syntheticEvent = {
      target: { name: "saldo_inicial", value: cents / 100 },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };

  const handlePrincipalChange = (checked: boolean) => {
    const syntheticEvent = {
      target: { name: "principal", value: checked },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar" : "Nova"} Conta Bancária</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edite os detalhes da conta bancária."
                : "Preencha os dados para cadastrar uma nova conta bancária."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input id="nome" name="nome" value={formData.nome} onChange={handleInputChange} className="col-span-3" required placeholder="Ex: Conta Principal" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banco" className="text-right">Banco</Label>
              <Input id="banco" name="banco" value={formData.banco || ""} onChange={handleInputChange} className="col-span-3" placeholder="Ex: Itaú, Bradesco, Nubank" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agencia" className="text-right">Agência</Label>
              <Input id="agencia" name="agencia" value={formData.agencia || ""} onChange={handleInputChange} className="col-span-3" placeholder="Ex: 0001" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="conta" className="text-right">Conta</Label>
              <Input id="conta" name="conta" value={formData.conta || ""} onChange={handleInputChange} className="col-span-3" placeholder="Ex: 12345-6" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="saldo_inicial" className="text-right">Saldo Inicial</Label>
              <div className="col-span-3">
                <CurrencyInput
                  id="saldo_inicial"
                  name="saldo_inicial"
                  value={formData.saldo_inicial}
                  decimalsLimit={2}
                  onValueChange={handleSaldoChange}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="principal" className="text-right">Conta Principal</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch
                  id="principal"
                  checked={formData.principal}
                  onCheckedChange={handlePrincipalChange}
                />
                <span className="text-sm text-muted-foreground">
                  {formData.principal ? "Sim" : "Não"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSave()}>{isEditing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showPrincipalConfirm} onOpenChange={onClosePrincipalConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar conta principal?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta <strong>"{contaPrincipalExistente}"</strong> já está definida como conta principal. 
              Deseja substituí-la e definir esta conta como a nova conta principal?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmPrincipal}>Sim, trocar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContaBancariaForm;
