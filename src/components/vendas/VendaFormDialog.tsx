import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, UserPlus } from "lucide-react";
import { QuickAddClienteModal } from "@/components/lancamentos/form/QuickAddClienteModal";
import { QuickEditClienteModal } from "@/components/vendas/QuickEditClienteModal";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf_cnpj?: string;
  endereco?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  complemento?: string;
}

interface VendaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  venda?: any;
}

const VendaFormDialog: React.FC<VendaFormDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  venda,
}) => {
  const { empresaId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showNewCliente, setShowNewCliente] = useState(false);

  // Form fields
  const [produto, setProduto] = useState("");
  const [valorBruto, setValorBruto] = useState(0);
  const [taxa, setTaxa] = useState(0);
  const [dataVenda, setDataVenda] = useState<Date>(new Date());
  const [status, setStatus] = useState("aprovada");
  const [clienteId, setClienteId] = useState<string>("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteDocumento, setClienteDocumento] = useState("");
  const [clienteEndereco, setClienteEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // New client fields
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteTelefone, setNovoClienteTelefone] = useState("");
  const [novoClienteEmail, setNovoClienteEmail] = useState("");
  const [novoClienteDocumento, setNovoClienteDocumento] = useState("");
  const [novoClienteEndereco, setNovoClienteEndereco] = useState("");

  const valorLiquido = valorBruto - taxa;

  useEffect(() => {
    if (open) {
      fetchClientes();
      if (venda) {
        setProduto(venda.produto || "");
        setValorBruto(venda.valor_bruto || 0);
        setTaxa(venda.taxa || 0);
        setDataVenda(new Date(venda.data_venda));
        setStatus(venda.status || "aprovada");
        setClienteId(venda.cliente_id || "");
        setClienteNome(venda.cliente || "");
        setClienteTelefone(venda.cliente_telefone || "");
        setClienteEmail(venda.cliente_email || "");
        setClienteDocumento(venda.cliente_documento || "");
        setClienteEndereco(venda.cliente_endereco || "");
        setObservacoes(venda.observacoes || "");
      } else {
        resetForm();
      }
    }
  }, [open, venda]);

  const resetForm = () => {
    setProduto("");
    setValorBruto(0);
    setTaxa(0);
    setDataVenda(new Date());
    setStatus("aprovada");
    setClienteId("");
    setClienteNome("");
    setClienteTelefone("");
    setClienteEmail("");
    setClienteDocumento("");
    setClienteEndereco("");
    setObservacoes("");
    setShowNewCliente(false);
    setNovoClienteNome("");
    setNovoClienteTelefone("");
    setNovoClienteEmail("");
    setNovoClienteDocumento("");
    setNovoClienteEndereco("");
  };

  const fetchClientes = async () => {
    const { data } = await supabase
      .from("clientes")
      .select("id, nome, telefone, email, cpf_cnpj, endereco")
      .order("nome");
    setClientes((data as Cliente[]) || []);
  };

  const handleClienteSelect = (id: string) => {
    setClienteId(id);
    if (id === "new") {
      setShowNewCliente(true);
      setClienteNome("");
      setClienteTelefone("");
      setClienteEmail("");
      setClienteDocumento("");
      setClienteEndereco("");
      return;
    }
    setShowNewCliente(false);
    const c = clientes.find((c) => c.id === id);
    if (c) {
      setClienteNome(c.nome);
      setClienteTelefone(c.telefone || "");
      setClienteEmail(c.email || "");
      setClienteDocumento(c.cpf_cnpj || "");
      setClienteEndereco(c.endereco || "");
    }
  };

  const handleSaveNewCliente = async (): Promise<string | null> => {
    if (!novoClienteNome.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return null;
    }
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nome: novoClienteNome,
        telefone: novoClienteTelefone || null,
        email: novoClienteEmail || null,
        cpf_cnpj: novoClienteDocumento || null,
        endereco: novoClienteEndereco || null,
        empresa_id: empresaId,
        ativo: true,
        origem: "venda",
      } as any)
      .select("id")
      .single();
    if (error) {
      toast.error("Erro ao cadastrar cliente: " + error.message);
      return null;
    }
    toast.success("Cliente cadastrado!");
    return data.id;
  };

  const handleSave = async () => {
    if (!produto.trim()) {
      toast.error("Produto é obrigatório");
      return;
    }
    if (valorBruto <= 0) {
      toast.error("Valor bruto deve ser maior que zero");
      return;
    }

    setSaving(true);
    try {
      let finalClienteId = clienteId === "new" ? null : clienteId || null;
      let finalClienteNome = clienteNome;
      let finalClienteTelefone = clienteTelefone;
      let finalClienteEmail = clienteEmail;
      let finalClienteDocumento = clienteDocumento;
      let finalClienteEndereco = clienteEndereco;

      if (showNewCliente && novoClienteNome.trim()) {
        const newId = await handleSaveNewCliente();
        if (!newId) { setSaving(false); return; }
        finalClienteId = newId;
        finalClienteNome = novoClienteNome;
        finalClienteTelefone = novoClienteTelefone;
        finalClienteEmail = novoClienteEmail;
        finalClienteDocumento = novoClienteDocumento;
        finalClienteEndereco = novoClienteEndereco;
      }

      // Map venda status to lancamento status
      const statusMap: Record<string, string> = {
        aprovada: "recebido",
        pendente: "pendente",
        reembolsada: "cancelado",
        cancelada: "cancelado",
      };

      const record = {
        empresa_id: empresaId,
        produto,
        valor_bruto: valorBruto,
        taxa,
        valor_liquido: valorBruto - taxa,
        data_venda: dataVenda.toISOString(),
        status,
        plataforma: "manual",
        cliente: finalClienteNome || null,
        cliente_id: finalClienteId,
        cliente_telefone: finalClienteTelefone || null,
        cliente_email: finalClienteEmail || null,
        cliente_documento: finalClienteDocumento || null,
        cliente_endereco: finalClienteEndereco || null,
        observacoes: observacoes || null,
        origem: "manual",
      };

      if (venda?.id) {
        // Update existing venda
        const { error } = await (supabase as any)
          .from("vendas_digitais")
          .update(record)
          .eq("id", venda.id);
        if (error) throw error;

        // Update linked lancamento if exists
        if (venda.lancamento_id) {
          await (supabase as any)
            .from("lancamentos")
            .update({
              descricao: `Venda - ${produto}`,
              valor: valorBruto - taxa,
              data_vencimento: dataVenda.toISOString().split("T")[0],
              status: statusMap[status] || "pendente",
              cliente_id: finalClienteId,
            })
            .eq("id", venda.lancamento_id);
        }

        toast.success("Venda atualizada!");
      } else {
        // Create lancamento first
        const { data: lancamento, error: lancError } = await (supabase as any)
          .from("lancamentos")
          .insert({
            empresa_id: empresaId,
            descricao: `Venda - ${produto}`,
            tipo: "receita",
            valor: valorBruto - taxa,
            data_vencimento: dataVenda.toISOString().split("T")[0],
            data_pagamento: status === "aprovada" ? dataVenda.toISOString().split("T")[0] : null,
            status: statusMap[status] || "pendente",
            origem: "venda",
            cliente_id: finalClienteId,
          })
          .select("id")
          .single();

        if (lancError) {
          console.error("Erro ao criar lançamento:", lancError);
        }

        // Insert venda with lancamento_id
        const { error } = await (supabase as any)
          .from("vendas_digitais")
          .insert({
            ...record,
            lancamento_id: lancamento?.id || null,
          });
        if (error) throw error;
        toast.success("Venda registrada!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar venda");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{venda ? "Editar Venda" : "Nova Venda"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Produto e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Produto *</Label>
              <Input value={produto} onChange={(e) => setProduto(e.target.value)} placeholder="Nome do produto" />
            </div>
            <div className="space-y-1.5">
              <Label>Data da Venda</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataVenda, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataVenda} onSelect={(d) => d && setDataVenda(d)} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Valor Bruto *</Label>
              <CurrencyInput id="valor_bruto" name="valor_bruto" value={valorBruto} onValueChange={(v) => setValorBruto(v ? parseInt(v, 10) / 100 : 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Taxa</Label>
              <CurrencyInput id="taxa" name="taxa" value={taxa} onValueChange={(v) => setTaxa(v ? parseInt(v, 10) / 100 : 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor Líquido</Label>
              <Input value={`R$ ${valorLiquido.toFixed(2).replace(".", ",")}`} disabled className="bg-muted" />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aprovada">Aprovada</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="reembolsada">Reembolsada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={clienteId || "none"} onValueChange={(v) => handleClienteSelect(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                    <SelectItem value="new">
                      <span className="flex items-center gap-1"><UserPlus className="h-3 w-3" /> Novo cliente</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <QuickAddClienteModal onSuccess={fetchClientes} />
              {clienteId && clienteId !== "new" && clienteId !== "none" && (
                <QuickEditClienteModal clienteId={clienteId} onSuccess={fetchClientes} />
              )}
            </div>
          </div>

          {/* New client inline */}
          {showNewCliente && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-medium flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Cadastrar novo cliente</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome *</Label>
                  <Input value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telefone</Label>
                  <Input value={novoClienteTelefone} onChange={(e) => setNovoClienteTelefone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={novoClienteEmail} onChange={(e) => setNovoClienteEmail(e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CPF/CNPJ</Label>
                  <Input value={novoClienteDocumento} onChange={(e) => setNovoClienteDocumento(e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Endereço</Label>
                  <Input value={novoClienteEndereco} onChange={(e) => setNovoClienteEndereco(e.target.value)} placeholder="Endereço completo" />
                </div>
              </div>
            </div>
          )}

          {/* Existing client data (when selected) */}
          {clienteId && clienteId !== "new" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Telefone do cliente</Label>
                <Input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email do cliente</Label>
                <Input value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Documento</Label>
                <Input value={clienteDocumento} onChange={(e) => setClienteDocumento(e.target.value)} placeholder="CPF/CNPJ" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Endereço</Label>
                <Input value={clienteEndereco} onChange={(e) => setClienteEndereco(e.target.value)} placeholder="Endereço" />
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações sobre a venda..." rows={3} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : venda ? "Salvar" : "Registrar Venda"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendaFormDialog;
