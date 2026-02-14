import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Switch } from "@/components/ui/switch";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data_vencimento: new Date().toISOString().split("T")[0],
    tipo: "despesa",
    categoria_id: "",
    status: "pendente",
    fornecedor_id: "",
    cliente_id: "",
    conta_bancaria_id: "",
    forma_pagamento_id: "",
    recorrente: false,
    parcela_atual: "",
    total_parcelas: "",
    data_pagamento: null
  });
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<any[]>([]);
  const [contasBancarias, setContasBancarias] = useState<any[]>([]);
  
  const [selectedTipo, setSelectedTipo] = useState<"despesa" | "receita">("despesa");
  const [selectedStatus, setSelectedStatus] = useState<"pendente" | "pago" | "recebido" | "cancelado">("pendente");

  React.useEffect(() => {
    if (isOpen) {
      fetchCategorias();
      fetchFornecedores();
      fetchClientes();
      fetchFormasPagamento();
      fetchContasBancarias();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      descricao: "",
      valor: "",
      data_vencimento: new Date().toISOString().split("T")[0],
      tipo: "despesa",
      categoria_id: "",
      status: "pendente",
      fornecedor_id: "",
      cliente_id: "",
      conta_bancaria_id: "",
      forma_pagamento_id: "",
      recorrente: false,
      parcela_atual: null,
      total_parcelas: null,
      data_pagamento: null,
    });
    setSelectedTipo("despesa");
    setSelectedStatus("pendente");
  };

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nome");

      if (error) throw error;
      setCategorias(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("nome");

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar fornecedores",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome");

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchFormasPagamento = async () => {
    try {
      const { data, error } = await supabase
        .from("formas_pagamento")
        .select("*")
        .order("descricao");

      if (error) throw error;
      setFormasPagamento(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar formas de pagamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchContasBancarias = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_bancarias")
        .select("*")
        .order("nome");

      if (error) throw error;
      setContasBancarias(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar contas bancárias",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    if (field === "tipo") {
      setSelectedTipo(value);
    }
    if (field === "status") {
      setSelectedStatus(value);
    }
  };

  const handleDateChange = (field, date) => {
    if (date) {
      const isoDate = date.toISOString().split('T')[0];
      setFormData({
        ...formData,
        [field]: isoDate
      });
    }
  };

  const handleRecorrenciaChange = (checked) => {
    setFormData({
      ...formData,
      recorrente: checked
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (!formData.descricao || !formData.valor || !formData.data_vencimento) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      // Validar dados de parcelamento
      if (formData.recorrente && (!formData.total_parcelas || !formData.parcela_atual)) {
        toast({
          title: "Dados de parcelamento",
          description: "Para lançamento recorrente, informe o número de parcelas.",
          variant: "destructive",
        });
        return;
      }

      const newTransaction = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        data_vencimento: formData.data_vencimento,
        tipo: formData.tipo,
        categoria_id: formData.categoria_id || null,
        status: formData.status,
        fornecedor_id: formData.fornecedor_id || null,
        cliente_id: formData.cliente_id || null,
        conta_bancaria_id: formData.conta_bancaria_id || null,
        forma_pagamento_id: formData.forma_pagamento_id || null,
        recorrente: formData.recorrente,
        parcela_atual: formData.recorrente ? parseInt(formData.parcela_atual as string) : null,
        total_parcelas: formData.recorrente ? parseInt(formData.total_parcelas as string) : null,
        data_pagamento: (formData.status === 'pago' || formData.status === 'recebido') ? formData.data_pagamento : null,
      };

      const { error } = await supabase
        .from("lancamentos")
        .insert([newTransaction]);

      if (error) throw error;

      toast({
        title: "Lançamento criado",
        description: "O lançamento foi criado com sucesso.",
      });
      
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro ao criar lançamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: Date | null) => {
    return date ? format(date, 'dd/MM/yyyy') : '';
  };

  // Handle valor changes
  const handleCurrencyValueChange = (value: string | undefined) => {
    const numericValue = value ? Number(value.replace(/\D/g, "")) / 100 : 0;
    setFormData({ ...formData, valor: numericValue.toString() });
  };

  // Format initial valor value for display
  const formatInitialValue = () => {
    if (formData.valor) {
      return parseFloat(formData.valor).toFixed(2);
    }
    return "0";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tipo" className="text-right">Tipo</Label>
            <Select 
              value={formData.tipo} 
              onValueChange={(value) => handleSelectChange("tipo", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="descricao" className="text-right">Descrição</Label>
            <Input
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="Ex: Pagamento de fornecedor"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="valor" className="text-right">Valor</Label>
            <div className="col-span-3">
              <CurrencyInput
                id="valor"
                name="valor"
                defaultValue={formatInitialValue()}
                decimalsLimit={2}
                onValueChange={handleCurrencyValueChange}
                prefix="R$ "
                groupSeparator="."
                decimalSeparator=","
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="data_vencimento" className="text-right">Data de Vencimento</Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_vencimento ? formatDate(new Date(formData.data_vencimento)) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.data_vencimento ? new Date(formData.data_vencimento) : undefined}
                    onSelect={(date) => handleDateChange("data_vencimento", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                {formData.tipo === "receita" && <SelectItem value="recebido">Recebido</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional data_pagamento field */}
          {(formData.status === "pago" || formData.status === "recebido") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="data_pagamento" className="text-right">Data de {formData.tipo === "receita" ? "Recebimento" : "Pagamento"}</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_pagamento ? formatDate(new Date(formData.data_pagamento)) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.data_pagamento ? new Date(formData.data_pagamento) : undefined}
                      onSelect={(date) => handleDateChange("data_pagamento", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Categoria field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="categoria" className="text-right">Categoria</Label>
            <Select 
              value={formData.categoria_id || "no-category"} 
              onValueChange={(value) => handleSelectChange('categoria_id', value === "no-category" ? "" : value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-category">Sem categoria</SelectItem>
                {categorias
                  .filter(cat => cat.tipo === formData.tipo)
                  .map(categoria => (
                    <SelectItem key={categoria.id} value={categoria.id}>{categoria.nome}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          
          {/* Cliente/Fornecedor field based on tipo */}
          {formData.tipo === "receita" ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cliente" className="text-right">Cliente</Label>
              <Select 
                value={formData.cliente_id || "no-client"}
                onValueChange={(value) => handleSelectChange('cliente_id', value === "no-client" ? "" : value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-client">Nenhum</SelectItem>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fornecedor" className="text-right">Fornecedor</Label>
              <Select 
                value={formData.fornecedor_id || "no-supplier"} 
                onValueChange={(value) => handleSelectChange('fornecedor_id', value === "no-supplier" ? "" : value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-supplier">Nenhum</SelectItem>
                  {fornecedores.map(fornecedor => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Forma de Pagamento field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="forma_pagamento" className="text-right">Forma de Pagamento</Label>
            <Select 
              value={formData.forma_pagamento_id || "no-payment-method"} 
              onValueChange={(value) => handleSelectChange('forma_pagamento_id', value === "no-payment-method" ? "" : value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-payment-method">Nenhuma</SelectItem>
                {formasPagamento.map(forma => (
                  <SelectItem key={forma.id} value={forma.id}>{forma.descricao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Conta Bancária field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="conta_bancaria" className="text-right">Conta Bancária</Label>
            <Select 
              value={formData.conta_bancaria_id || "no-bank-account"} 
              onValueChange={(value) => handleSelectChange('conta_bancaria_id', value === "no-bank-account" ? "" : value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a conta bancária" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-bank-account">Nenhuma</SelectItem>
                {contasBancarias.map(conta => (
                  <SelectItem key={conta.id} value={conta.id}>{conta.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recorrência - Atualizado para usar o mesmo estilo da página de Lançamentos */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recorrente" className="text-right">Recorrente</Label>
            <div className="flex items-center col-span-3">
              <Switch 
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={handleRecorrenciaChange}
              />
              <span className="ml-2 text-sm text-muted-foreground">
                {formData.recorrente ? "Sim" : "Não"}
              </span>
            </div>
          </div>
          
          {/* Mostrar campos de parcelas apenas quando recorrente for true */}
          {formData.recorrente && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="parcela_atual" className="text-right">Parcela Atual</Label>
                <Input
                  id="parcela_atual"
                  name="parcela_atual"
                  type="number"
                  className="col-span-3"
                  value={formData.parcela_atual}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="total_parcelas" className="text-right">Total de Parcelas</Label>
                <Input
                  id="total_parcelas"
                  name="total_parcelas"
                  type="number"
                  className="col-span-3"
                  value={formData.total_parcelas}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
