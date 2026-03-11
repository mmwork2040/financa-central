// LancamentosContext — manages lancamentos state and CRUD
import { logMovimentacao } from "@/utils/logMovimentacao";
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useMonthFilter } from "@/contexts/MonthFilterContext";
import { addMonths, format } from "date-fns";

// Define the types for the data
export type Lancamento = {
  id?: string;
  created_at?: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  tipo: "receita" | "despesa" | "investimento" | "resgate" | "rentabilidade" | "reajuste";
  status: "pendente" | "pago" | "recebido" | "cancelado";
  categoria_id: string | null;
  fornecedor_id: string | null;
  cliente_id: string | null;
  conta_bancaria_id: string | null;
  forma_pagamento_id: string | null;
  projeto_id?: string | null;
  cartao_credito_id?: string | null;
  recorrente: boolean;
  recorrencia_fim?: string | null;
  recorrencia_tipo?: string | null;
  recorrencia_grupo_id?: string | null;
  parcela_atual: number | null;
  total_parcelas: number | null;
  data_pagamento: string | null;
  recorrencia_inicio?: string | null;
  // Add these for join data
  fornecedor?: { id: string; nome: string };
  cliente?: { id: string; nome: string };
  categoria?: { id: string; nome: string; tipo: string };
  forma_pagamento?: { id: string; descricao: string } | null;
  projeto?: { id: string; nome: string } | null;
  origem?: string;
};

export type Categoria = {
  id: string;
  created_at?: string;
  nome: string;
  tipo: string;
};

export type Fornecedor = {
  id: string;
  created_at?: string;
  nome: string;
};

export type Cliente = {
  id: string;
  created_at?: string;
  nome: string;
};

export type FormaPagamento = {
  id: string;
  created_at?: string;
  descricao: string;
};

export type ProjetoSimple = {
  id: string;
  nome: string;
};

export type ContaBancaria = {
  id: string;
  created_at?: string;
  nome: string;
  principal?: boolean;
};

export type CartaoCreditoSimple = {
  id: string;
  nome: string;
  dia_fechamento: number;
  dia_vencimento: number;
  bandeira?: string | null;
  ultimos_digitos?: string | null;
};

type FiltrosType = {
  tipo?: "receita" | "despesa" | "investimento" | "resgate" | "rentabilidade" | "reajuste" | null;
  status?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  categoria_id?: string | null;
  valor_min?: number | null;
  valor_max?: number | null;
  fornecedor_id?: string | null;
  cliente_id?: string | null;
  projeto_id?: string | null;
  forma_pagamento_id?: string | null;
};

type LancamentoFormData = Omit<Lancamento, 'id' | 'created_at' | 'fornecedor' | 'cliente' | 'categoria' | 'origem'>;

interface LancamentosContextType {
  lancamentos: Lancamento[];
  filtros: FiltrosType;
  formData: LancamentoFormData;
  openModal: boolean;
  selectedId: string | null;
  setOpenModal: (open: boolean) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (field: string, value: string) => void;
  handleFilterInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFilterSelectChange: (field: string, value: string | null) => void;
  handleDelete: () => Promise<void>;
  handleEdit: (lancamento: Lancamento) => void;
  handleSave: () => Promise<void>;
  handleStatus: (id: string, status: "pendente" | "pago" | "recebido" | "cancelado") => Promise<void>;
  aplicarFiltros: () => void;
  resetFilters: () => void;
  openFilterModal: boolean;
  setOpenFilterModal: (open: boolean) => void;
  loading: boolean;
  categorias: Categoria[];
  fornecedores: Fornecedor[];
  clientes: Cliente[];
  formasPagamento: FormaPagamento[];
  contasBancarias: ContaBancaria[];
  projetos: ProjetoSimple[];
  cartoesCredito: CartaoCreditoSimple[];
  handleDateChange: (field: string, date: Date | null) => void;
  openDeleteModal: boolean;
  setOpenDeleteModal: (open: boolean) => void;
  handleOpenModal: (lancamento?: Lancamento) => void;
  handleOpenDeleteModal: (id: string) => void;
  handleUpdateStatus: (id: string, status: "pendente" | "pago" | "recebido" | "cancelado") => void;
  getStatusBadgeClass: (status: string) => string;
  getStatusLabel: (status: string, tipo: string) => string;
  getTipoBadgeClass: (tipo: string, origem?: string) => string;
  exportToCSV: () => void;
  exportToPDF: () => void;
  handleSort: (field: string) => void;
  refreshCategorias: () => void;
  refreshFornecedores: () => void;
  refreshClientes: () => void;
  refreshFormasPagamento: () => void;
  refreshContasBancarias: () => void;
  refreshProjetos: () => void;
  refreshCartoesCredito: () => void;
  refreshLancamentos: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const LancamentosContext = createContext<LancamentosContextType | undefined>(
  undefined
);

export const useLancamentosContext = () => {
  const context = useContext(LancamentosContext);
  if (!context) {
    throw new Error(
      "useLancamentosContext must be used within a LancamentosProvider"
    );
  }
  return context;
};

export const LancamentosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [projetos, setProjetos] = useState<ProjetoSimple[]>([]);
  const [cartoesCredito, setCartoesCredito] = useState<CartaoCreditoSimple[]>([]);
  const { empresaId, user, userProfile, planControles, isSuperAdmin } = useAuth();
  const { monthStart, monthEnd } = useMonthFilter();

  // Add sort state
  const [sortField, setSortField] = useState<string>('data_vencimento');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState("");

  const [filtros, setFiltros] = useState<FiltrosType>({
    tipo: null,
    status: null,
    data_inicio: null,
    data_fim: null,
    categoria_id: null,
    valor_min: null,
    valor_max: null,
    fornecedor_id: null,
    cliente_id: null,
    projeto_id: null,
    forma_pagamento_id: null,
  });

  const [formData, setFormData] = useState<LancamentoFormData>({
    descricao: "",
    valor: 0,
    data_vencimento: new Date().toISOString().split("T")[0],
    tipo: "despesa",
    status: "pendente",
    categoria_id: null,
    fornecedor_id: null,
    cliente_id: null,
    conta_bancaria_id: null,
    forma_pagamento_id: null,
    projeto_id: null,
    cartao_credito_id: null,
    recorrente: false,
    parcela_atual: null,
    total_parcelas: null,
    data_pagamento: null,
  });

  const fetchLancamentos = useCallback(async () => {
    setLoading(true);
    try {
      // Recurring generation removed from here — only triggered on status change

      // Query 1: lancamentos do mês selecionado
      let query = (supabase as any).from("lancamentos").select(`
        *,
        categoria:categorias(*),
        fornecedor:fornecedores(*),
        cliente:clientes(*),
        projeto:projetos(id, nome),
        forma_pagamento:formas_pagamento(id, descricao)
      `).order(sortField, { ascending: sortDirection === 'asc' });

      // Always filter by selected month
      query = query.gte("data_vencimento", monthStart).lte("data_vencimento", monthEnd);

      if (filtros.tipo) {
        query = query.eq("tipo", filtros.tipo);
      }
      if (filtros.status) {
        query = query.eq("status", filtros.status);
      }
      if (filtros.data_inicio) {
        query = query.gte("data_vencimento", filtros.data_inicio);
      }
      if (filtros.data_fim) {
        query = query.lte("data_vencimento", filtros.data_fim);
      }
      if (filtros.categoria_id) {
        query = query.eq("categoria_id", filtros.categoria_id);
      }
      if (filtros.valor_min) {
        query = query.gte("valor", filtros.valor_min);
      }
      if (filtros.valor_max) {
        query = query.lte("valor", filtros.valor_max);
      }
      if (filtros.fornecedor_id) {
        query = query.eq("fornecedor_id", filtros.fornecedor_id);
      }
      if (filtros.cliente_id) {
        query = query.eq("cliente_id", filtros.cliente_id);
      }
      if (filtros.projeto_id) {
        query = query.eq("projeto_id", filtros.projeto_id);
      }
      if (filtros.forma_pagamento_id) {
        query = query.eq("forma_pagamento_id", filtros.forma_pagamento_id);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setLancamentos((data || []) as unknown as Lancamento[]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar lançamentos");
    } finally {
      setLoading(false);
    }
  }, [filtros, sortField, sortDirection, monthStart, monthEnd]);

  const fetchCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nome");

      if (error) {
        throw error;
      }

      setCategorias(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar categorias");
    }
  }, []);

  const fetchFornecedores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("nome");

      if (error) {
        throw error;
      }

      setFornecedores(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar fornecedores");
    }
  }, []);

  const fetchClientes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome");

      if (error) {
        throw error;
      }

      setClientes(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar clientes");
    }
  }, []);

  const fetchFormasPagamento = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("formas_pagamento")
        .select("*")
        .order("descricao");

      if (error) {
        throw error;
      }

      setFormasPagamento(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar formas de pagamento");
    }
  }, []);

  const fetchContasBancarias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("contas_bancarias")
        .select("*")
        .order("nome");

      if (error) {
        throw error;
      }

      setContasBancarias(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar contas bancárias");
    }
  }, []);

  const fetchProjetos = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("projetos")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      setProjetos(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar projetos:", error);
    }
  }, []);

  const fetchCartoesCredito = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("cartoes_credito")
        .select("id, nome, dia_fechamento, dia_vencimento, bandeira, ultimos_digitos")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      setCartoesCredito(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar cartões de crédito:", error);
    }
  }, []);

  useEffect(() => {
    fetchLancamentos();
    fetchCategorias();
    fetchFornecedores();
    fetchClientes();
    fetchFormasPagamento();
    fetchContasBancarias();
    fetchProjetos();
    fetchCartoesCredito();
  }, [
    fetchLancamentos,
    fetchCategorias,
    fetchFornecedores,
    fetchClientes,
    fetchFormasPagamento,
    fetchContasBancarias,
    fetchProjetos,
    fetchCartoesCredito,
  ]);

  // Realtime: auto-remove deleted lancamentos from UI
  useEffect(() => {
    const channel = supabase
      .channel("lancamentos_realtime")
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "lancamentos" },
        (payload) => {
          const deleted = payload.old as { id: string };
          if (deleted?.id) {
            setLancamentos((prev) => prev.filter((l) => l.id !== deleted.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lancamentos" },
        () => {
          fetchLancamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLancamentos]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value === "no-category" || value === "no-client" || value === "no-supplier" || value === "no-payment-method" || value === "no-bank-account" || value === "no-project" || value === "no-credit-card" ? null : value });
  };

  const handleFilterInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleFilterSelectChange = (field: string, value: string | null) => {
    setFiltros({ ...filtros, [field]: value });
  };

  const handleDateChange = (field: string, date: Date | null) => {
    if (date) {
      const isoDate = date.toISOString().split('T')[0];
      setFormData({
        ...formData,
        [field]: isoDate
      });
    }
  };

  const handleOpenDeleteModal = (id: string) => {
    setSelectedId(id);
    setOpenDeleteModal(true);
  };
  
  const handleDelete = async () => {
    if (!selectedId) return;
    
    try {
      // Find the lancamento to revert balance if needed
      const lancamento = lancamentos.find(l => l.id === selectedId);

      // Revert bank account balance if the lancamento was paid/received
      if (lancamento && lancamento.conta_bancaria_id && ["pago", "recebido"].includes(lancamento.status)) {
        const isCredit = lancamento.tipo === "receita" || lancamento.origem === "resgate_investimento" || lancamento.origem === "rentabilidade_investimento";
        const delta = isCredit ? -lancamento.valor : lancamento.valor;
        const { data: contaAtual } = await supabase
          .from("contas_bancarias")
          .select("saldo_atual")
          .eq("id", lancamento.conta_bancaria_id)
          .single();
        if (contaAtual) {
          const saldoAnterior = Number(contaAtual.saldo_atual);
          const saldoPosterior = saldoAnterior + delta;
          await (supabase.from("contas_bancarias").update({ saldo_atual: saldoPosterior } as any) as any)
            .eq("id", lancamento.conta_bancaria_id);
          await logMovimentacao({
            conta_bancaria_id: lancamento.conta_bancaria_id,
            empresa_id: empresaId || null,
            tipo: "ajuste",
            descricao: `Estorno (exclusão): ${lancamento.descricao}`,
            valor: delta,
            saldo_anterior: saldoAnterior,
            saldo_posterior: saldoPosterior,
            lancamento_id: lancamento.id,
          });
        }
      }

      // Remove pending support requests for this record
      await supabase
        .from('solicitacoes_suporte')
        .delete()
        .eq('registro_id', selectedId)
        .eq('tabela', 'lancamentos')
        .eq('status', 'pendente');

      // Clear lancamento_id on any linked venda before deleting
      await (supabase as any)
        .from('vendas_digitais')
        .update({ lancamento_id: null })
        .eq('lancamento_id', selectedId);

      const { error } = await supabase.from("lancamentos").delete().eq("id", selectedId);

      if (error) {
        throw error;
      }

      toast.success("O lançamento foi excluído com sucesso.");
      setOpenDeleteModal(false);
      await fetchLancamentos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir lançamento");
    }
  };

  const handleOpenModal = (lancamento?: Lancamento) => {
    if (lancamento) {
      handleEdit(lancamento);
    } else {
      // Lógica de fallback: principal > única conta > nenhuma
      let contaId: string | null = null;
      const contaPrincipal = contasBancarias.find(c => c.principal);
      if (contaPrincipal) {
        contaId = contaPrincipal.id;
      } else if (contasBancarias.length === 1) {
        contaId = contasBancarias[0].id;
      }
      // Se múltiplas contas sem principal, não define nenhuma
      setSelectedId(null);
      setFormData({
        descricao: "",
        valor: 0,
        data_vencimento: new Date().toISOString().split("T")[0],
        tipo: "despesa",
        status: "pendente",
        categoria_id: null,
        fornecedor_id: null,
        cliente_id: null,
        conta_bancaria_id: contaId,
        forma_pagamento_id: null,
        projeto_id: null,
        cartao_credito_id: null,
        recorrente: false,
        parcela_atual: null,
        total_parcelas: null,
        data_pagamento: null,
      });
      setOpenModal(true);
    }
  };

  const handleEdit = (lancamento: Lancamento) => {
    setSelectedId(lancamento.id || null);
    // Map origin-based types back to their UI type for editing
    let editTipo = lancamento.tipo;
    if (lancamento.origem === "resgate_investimento") editTipo = "resgate" as any;
    if (lancamento.origem === "rentabilidade_investimento") editTipo = "rentabilidade" as any;
    if (lancamento.origem === "reajuste_investimento") editTipo = "reajuste" as any;
    setFormData({
      descricao: lancamento.descricao,
      valor: lancamento.valor,
      data_vencimento: lancamento.data_vencimento,
      tipo: editTipo,
      status: lancamento.status,
      categoria_id: lancamento.categoria_id,
      fornecedor_id: lancamento.fornecedor_id,
      cliente_id: lancamento.cliente_id,
      conta_bancaria_id: lancamento.conta_bancaria_id,
      forma_pagamento_id: lancamento.forma_pagamento_id,
      projeto_id: lancamento.projeto_id || null,
      cartao_credito_id: (lancamento as any).cartao_credito_id || null,
      recorrente: lancamento.recorrente,
      recorrencia_grupo_id: lancamento.recorrencia_grupo_id || null,
      parcela_atual: lancamento.parcela_atual,
      total_parcelas: lancamento.total_parcelas,
      data_pagamento: lancamento.data_pagamento,
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      // Ensure proper typing — convert "resgate" and "rentabilidade" to receita with special origem
      const isResgate = formData.tipo === "resgate";
      const isRentabilidade = formData.tipo === ("rentabilidade" as any);
      const isReajuste = formData.tipo === ("reajuste" as any);
      const isSpecialInvestment = isResgate || isRentabilidade || isReajuste;
      const dataToSave: LancamentoFormData = {
        ...formData,
        tipo: isSpecialInvestment ? "receita" as any : formData.tipo as "receita" | "despesa" | "investimento",
        status: isSpecialInvestment ? "recebido" as any : formData.status as "pendente" | "pago" | "recebido" | "cancelado",
      };

      if (!selectedId && (!empresaId || empresaId.trim() === '')) {
        toast.error("Empresa não selecionada. Tente recarregar a página.");
        return;
      }

      // Check max_lancamentos limit for new lancamentos
      if (!selectedId && !isSuperAdmin && planControles.max_lancamentos > 0) {
        try {
          const { count, error: countError } = await supabase
            .from("lancamentos")
            .select("id", { count: "exact", head: true })
            .eq("empresa_id", empresaId!);
          
          if (!countError && count !== null) {
            const newCount = dataToSave.total_parcelas && dataToSave.total_parcelas > 1 
              ? dataToSave.total_parcelas 
              : 1;
            if (count + newCount > planControles.max_lancamentos) {
              toast.error(`Limite de ${planControles.max_lancamentos} lançamentos atingido no seu plano. Faça upgrade para continuar.`);
              return;
            }
          }
        } catch (e) {
          console.warn("Erro ao verificar limite de lançamentos:", e);
        }
      }

      if (selectedId) {
        // Fetch the old lancamento to revert balance if needed
        const oldLancamento = lancamentos.find(l => l.id === selectedId);
        
        // Revert old balance impact if was paid/received
        if (oldLancamento && oldLancamento.conta_bancaria_id && ["pago", "recebido"].includes(oldLancamento.status)) {
          const oldIsCredit = oldLancamento.tipo === "receita" || oldLancamento.origem === "resgate_investimento" || oldLancamento.origem === "rentabilidade_investimento" || oldLancamento.origem === "reajuste_investimento";
          const revertDelta = oldIsCredit ? -oldLancamento.valor : oldLancamento.valor;
          const { data: contaOld } = await supabase
            .from("contas_bancarias")
            .select("saldo_atual")
            .eq("id", oldLancamento.conta_bancaria_id)
            .single();
          if (contaOld) {
            const saldoAnt = Number(contaOld.saldo_atual);
            const saldoPos = saldoAnt + revertDelta;
            await (supabase.from("contas_bancarias").update({ saldo_atual: saldoPos } as any) as any)
              .eq("id", oldLancamento.conta_bancaria_id);
            await logMovimentacao({
              conta_bancaria_id: oldLancamento.conta_bancaria_id,
              empresa_id: empresaId || null,
              tipo: "ajuste",
              descricao: `Estorno (edição): ${oldLancamento.descricao}`,
              valor: revertDelta,
              saldo_anterior: saldoAnt,
              saldo_posterior: saldoPos,
              lancamento_id: oldLancamento.id,
            });
          }
        }

        // Update existing lancamento
        const updatePayload = { ...dataToSave } as any;
        if (isResgate) {
          updatePayload.origem = "resgate_investimento";
          updatePayload.tipo = "receita";
          updatePayload.status = "recebido";
        }
        if (isRentabilidade) {
          updatePayload.origem = "rentabilidade_investimento";
          updatePayload.tipo = "receita";
          updatePayload.status = "recebido";
        }
        if (isReajuste) {
          updatePayload.origem = "reajuste_investimento";
          updatePayload.tipo = "receita";
          updatePayload.status = "recebido";
        }

        const { error } = await supabase
          .from("lancamentos")
          .update(updatePayload)
          .eq("id", selectedId);

        if (error) {
          throw error;
        }

        // Apply new balance impact if now paid/received
        const newStatus = updatePayload.status || dataToSave.status;
        const newContaId = dataToSave.conta_bancaria_id;
        if (newContaId && ["pago", "recebido"].includes(newStatus)) {
          const newIsCredit = (isResgate || isRentabilidade || dataToSave.tipo === "receita");
          const newDelta = newIsCredit ? dataToSave.valor : -dataToSave.valor;
          const { data: contaNew } = await supabase
            .from("contas_bancarias")
            .select("saldo_atual")
            .eq("id", newContaId)
            .single();
          if (contaNew) {
            const saldoAnt = Number(contaNew.saldo_atual);
            const saldoPos = saldoAnt + newDelta;
            await (supabase.from("contas_bancarias").update({ saldo_atual: saldoPos } as any) as any)
              .eq("id", newContaId);
            await logMovimentacao({
              conta_bancaria_id: newContaId,
              empresa_id: empresaId || null,
              tipo: dataToSave.tipo === "receita" ? "receita" : "despesa",
              descricao: `Edição: ${dataToSave.descricao}`,
              valor: newDelta,
              saldo_anterior: saldoAnt,
              saldo_posterior: saldoPos,
              lancamento_id: selectedId,
            });
          }
        }

        // Fire webhook for edit
        try {
          await supabase.functions.invoke("fire-webhook", {
            body: {
              empresa_id: empresaId,
              evento: "Editar Registro",
              tabela: "lancamentos",
              descricao: dataToSave.descricao,
              registro: selectedId,
              valor: dataToSave.valor?.toString(),
              data: dataToSave.data_vencimento,
              usuario: {
                id: user?.id,
                nome: userProfile?.nome,
                email: userProfile?.email,
                telefone: userProfile?.evolution_webhook_url || null,
              },
              acao: "edicao",
            },
          });
        } catch (err) {
          console.warn("Webhook de edição não disparado:", err);
        }

        setLancamentos(
          lancamentos.map((lancamento) =>
            lancamento.id === selectedId ? { ...lancamento, ...dataToSave } : lancamento
          )
        );
        toast.success("O lançamento foi atualizado com sucesso.");
      } else {
        // Create new lancamento
        const totalParcelas = dataToSave.total_parcelas;
        
        if (!dataToSave.recorrente && totalParcelas && totalParcelas > 1) {
          // PARCELADO: divide valor total em N parcelas independentes
          const valorParcela = Math.round((dataToSave.valor / totalParcelas) * 100) / 100;
          const baseDate = new Date(dataToSave.data_vencimento);
          const parcelas = Array.from({ length: totalParcelas }, (_, i) => ({
            ...dataToSave,
            valor: valorParcela,
            parcela_atual: i + 1,
            total_parcelas: totalParcelas,
            recorrente: false,
            data_vencimento: format(addMonths(baseDate, i), "yyyy-MM-dd"),
            descricao: `${dataToSave.descricao} (${i + 1}/${totalParcelas})`,
            empresa_id: empresaId,
          }));

          const { data, error } = await supabase
            .from("lancamentos")
            .insert(parcelas)
            .select();

          if (error) throw error;
          setLancamentos([...lancamentos, ...(data as unknown as Lancamento[])]);
          toast.success(`${totalParcelas} parcelas criadas com sucesso.`);
        } else {
          // ÚNICO ou RECORRENTE: insere um único registro
          const insertData: any = { ...dataToSave, empresa_id: empresaId };
          
          // Se resgate, marcar origem
          if (isResgate) {
            insertData.origem = "resgate_investimento";
            insertData.tipo = "receita";
            insertData.status = "recebido";
            insertData.data_pagamento = new Date().toISOString().split("T")[0];
          }
          // Se rentabilidade, marcar origem
          if (isRentabilidade) {
            insertData.origem = "rentabilidade_investimento";
            insertData.tipo = "receita";
            insertData.status = "recebido";
            insertData.data_pagamento = new Date().toISOString().split("T")[0];
          }
          
          // Para recorrente, gerar grupo_id e usar data_inicio retroativa se definida
          if (dataToSave.recorrente) {
            const grupoId = crypto.randomUUID();
            insertData.recorrencia_grupo_id = grupoId;
            
            // Se tem data de início retroativa, usar como data_vencimento do primeiro
            const recorrenciaInicio = (dataToSave as any).recorrencia_inicio;
            if (recorrenciaInicio) {
              insertData.data_vencimento = recorrenciaInicio;
            }
          }
          
          // Remove campo auxiliar antes de salvar
          delete insertData.recorrencia_inicio;

          const { data, error } = await supabase
            .from("lancamentos")
            .insert([insertData])
            .select();

          if (error) throw error;

          // Atualizar saldo da conta se pago/recebido
            const effectiveStatus = (isResgate || isRentabilidade) ? "recebido" : formData.status;
          if (data && data[0] && formData.conta_bancaria_id && ["pago", "recebido"].includes(effectiveStatus)) {
            const delta = (isResgate || isRentabilidade || formData.tipo === "receita") ? formData.valor : -formData.valor;
            const { data: contaAtual } = await supabase
              .from("contas_bancarias")
              .select("saldo_atual")
              .eq("id", formData.conta_bancaria_id)
              .single();
            if (contaAtual) {
              const saldoAnterior = Number(contaAtual.saldo_atual);
              const saldoPosterior = saldoAnterior + delta;
              await (supabase.from("contas_bancarias").update({ saldo_atual: saldoPosterior } as any) as any)
                .eq("id", formData.conta_bancaria_id);
              await logMovimentacao({
                conta_bancaria_id: formData.conta_bancaria_id,
                empresa_id: empresaId || null,
                tipo: formData.tipo === "receita" ? "receita" : "despesa",
                descricao: formData.descricao,
                valor: delta,
                saldo_anterior: saldoAnterior,
                saldo_posterior: saldoPosterior,
                lancamento_id: data[0].id,
              });
            }
          }

          // Se recorrente, chamar generate-recurring para criar ocorrências
          if (dataToSave.recorrente) {
            try {
              const { data: session } = await supabase.auth.getSession();
              await supabase.functions.invoke("generate-recurring", {
                headers: { Authorization: `Bearer ${session?.session?.access_token}` },
              });
            } catch (err) {
              console.warn("Erro ao gerar recorrências:", err);
            }
          }

          setLancamentos([...lancamentos, ...(data as unknown as Lancamento[])]);
          toast.success(dataToSave.recorrente ? "Lançamento recorrente criado com sucesso." : "O lançamento foi criado com sucesso.");
        }
      }

      setOpenModal(false);
      setFormData({
        descricao: "",
        valor: 0,
        data_vencimento: new Date().toISOString().split("T")[0],
        tipo: "despesa",
        status: "pendente",
        categoria_id: null,
        fornecedor_id: null,
        cliente_id: null,
        conta_bancaria_id: null,
        forma_pagamento_id: null,
        projeto_id: null,
        cartao_credito_id: null,
        recorrente: false,
        parcela_atual: null,
        total_parcelas: null,
        data_pagamento: null,
      });
      setSelectedId(null);
      fetchLancamentos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar lançamento");
    }
  };

  const handleStatus = async (id: string, status: "pendente" | "pago" | "recebido" | "cancelado") => {
    try {
      // Buscar o lançamento atual para saber o valor e tipo
      const lancamento = lancamentos.find(l => l.id === id);
      const oldStatus = lancamento?.status;

      const { error } = await supabase
        .from("lancamentos")
        .update({ status })
        .eq("id", id);

      if (error) {
        throw error;
      }

      // Sync venda status if linked
      const vendaStatusMap: Record<string, string> = {
        recebido: "aprovada",
        pendente: "pendente",
        cancelado: "cancelada",
        pago: "aprovada",
      };
      if (vendaStatusMap[status]) {
        await (supabase as any)
          .from('vendas_digitais')
          .update({ status: vendaStatusMap[status] })
          .eq('lancamento_id', id);
      }

      // Atualizar saldo da conta quando muda para pago/recebido ou sai de pago/recebido
      if (lancamento?.conta_bancaria_id) {
        const wasPaid = ["pago", "recebido"].includes(oldStatus || "");
        const isPaid = ["pago", "recebido"].includes(status);

        if (!wasPaid && isPaid) {
          // Entrando em pago/recebido: aplicar delta
          const delta = lancamento.tipo === "receita" ? lancamento.valor : -lancamento.valor;
          const { data: contaAtual } = await supabase
            .from("contas_bancarias")
            .select("saldo_atual")
            .eq("id", lancamento.conta_bancaria_id)
            .single();
          if (contaAtual) {
            const saldoAnterior = Number(contaAtual.saldo_atual);
            const saldoPosterior = saldoAnterior + delta;
            await (supabase.from("contas_bancarias").update({ saldo_atual: saldoPosterior } as any) as any)
              .eq("id", lancamento.conta_bancaria_id);
            await logMovimentacao({
              conta_bancaria_id: lancamento.conta_bancaria_id,
              empresa_id: empresaId || null,
              tipo: lancamento.tipo === "receita" ? "receita" : "despesa",
              descricao: `Baixa: ${lancamento.descricao}`,
              valor: delta,
              saldo_anterior: saldoAnterior,
              saldo_posterior: saldoPosterior,
              lancamento_id: lancamento.id,
            });
          }
        } else if (wasPaid && !isPaid) {
          // Saindo de pago/recebido: reverter delta
          const delta = lancamento.tipo === "receita" ? -lancamento.valor : lancamento.valor;
          const { data: contaAtual } = await supabase
            .from("contas_bancarias")
            .select("saldo_atual")
            .eq("id", lancamento.conta_bancaria_id)
            .single();
          if (contaAtual) {
            const saldoAnterior = Number(contaAtual.saldo_atual);
            const saldoPosterior = saldoAnterior + delta;
            await (supabase.from("contas_bancarias").update({ saldo_atual: saldoPosterior } as any) as any)
              .eq("id", lancamento.conta_bancaria_id);
            await logMovimentacao({
              conta_bancaria_id: lancamento.conta_bancaria_id,
              empresa_id: empresaId || null,
              tipo: "ajuste",
              descricao: `Estorno: ${lancamento.descricao}`,
              valor: delta,
              saldo_anterior: saldoAnterior,
              saldo_posterior: saldoPosterior,
              lancamento_id: lancamento.id,
            });
          }
        }
      }

      // When cancelling a recurring transaction, cancel all future pending ones in the same chain
      if (lancamento && lancamento.recorrente && !lancamento.total_parcelas && status === "cancelado") {
        try {
          const today = new Date().toISOString().split("T")[0];
          await supabase
            .from("lancamentos")
            .update({ status: "cancelado" })
            .eq("descricao", lancamento.descricao)
            .eq("valor", lancamento.valor)
            .eq("recorrente", true)
            .eq("status", "pendente")
            .gt("data_vencimento", today);
        } catch (err) {
          console.warn("Erro ao cancelar recorrências futuras:", err);
        }
      }

      // Auto-generate next occurrence for recurring transactions when paying
      if (lancamento && lancamento.recorrente && !lancamento.total_parcelas && ["pago", "recebido"].includes(status)) {
        // Trigger the edge function to fill future months and wait for completion
        await supabase.functions.invoke("generate-recurring");
      }

      toast.success("O status do lançamento foi atualizado com sucesso.");
      await fetchLancamentos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status");
    }
  };

  const handleUpdateStatus = (id: string, status: "pendente" | "pago" | "recebido" | "cancelado") => {
    handleStatus(id, status);
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'pago': case 'recebido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string, tipo: string): string => {
    if (status === 'recebido' && tipo === 'receita') return 'Recebido';
    else if (status === 'pago' && (tipo === 'despesa' || tipo === 'investimento')) return 'Pago';
    else return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getTipoBadgeClass = (tipo: string, origem?: string): string => {
    if (origem === 'resgate_investimento') return 'bg-purple-100 text-purple-800';
    if (origem === 'rentabilidade_investimento') return 'bg-emerald-100 text-emerald-800';
    if (tipo === 'receita') return 'bg-green-100 text-green-800';
    if (tipo === 'investimento') return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    fetchLancamentos();
  };

  const getEmpresaExportInfo = async () => {
    if (!empresaId) return undefined;
    const { data } = await supabase
      .from("empresas")
      .select("nome, cnpj, email, telefone, endereco")
      .eq("id", empresaId)
      .single();
    return data || undefined;
  };

  const enrichLancamentos = () =>
    lancamentos.map((l) => ({
      ...l,
      conta_bancaria_nome: contasBancarias.find((c) => c.id === l.conta_bancaria_id)?.nome || "",
      forma_pagamento_nome: formasPagamento.find((f) => f.id === l.forma_pagamento_id)?.descricao || "",
    }));

  const exportToCSV = async () => {
    const enriched = enrichLancamentos();
    const empresa = await getEmpresaExportInfo();
    const { exportLancamentosCSV } = await import("@/utils/lancamentosExport");
    exportLancamentosCSV(enriched, empresa);
  };

  const exportToPDF = async () => {
    const enriched = enrichLancamentos();
    const empresa = await getEmpresaExportInfo();
    const periodo = `${monthStart} a ${monthEnd}`;
    const { exportLancamentosPDF } = await import("@/utils/lancamentosExport");
    exportLancamentosPDF(enriched, periodo, empresa);
  };

  const aplicarFiltros = () => {
    fetchLancamentos();
    setOpenFilterModal(false);
  };

  const resetFilters = () => {
    setFiltros({
      tipo: null,
      status: null,
      data_inicio: null,
      data_fim: null,
      categoria_id: null,
      valor_min: null,
      valor_max: null,
      fornecedor_id: null,
      cliente_id: null,
      projeto_id: null,
    });
    fetchLancamentos();
  };

  return (
    <LancamentosContext.Provider
      value={{
        lancamentos,
        filtros,
        formData,
        openModal,
        selectedId,
        setOpenModal,
        handleInputChange,
        handleSelectChange,
        handleFilterInputChange,
        handleFilterSelectChange,
        handleDelete,
        handleEdit,
        handleSave,
        handleStatus,
        aplicarFiltros,
        resetFilters,
        openFilterModal,
        setOpenFilterModal,
        loading,
        categorias,
        fornecedores,
        clientes,
        formasPagamento,
        contasBancarias,
        projetos,
        cartoesCredito,
        handleDateChange,
        openDeleteModal,
        setOpenDeleteModal,
        handleOpenModal,
        handleOpenDeleteModal,
        handleUpdateStatus,
        getStatusBadgeClass,
        getStatusLabel,
        getTipoBadgeClass,
        exportToCSV,
        exportToPDF,
        handleSort,
        refreshCategorias: fetchCategorias,
        refreshFornecedores: fetchFornecedores,
        refreshClientes: fetchClientes,
        refreshFormasPagamento: fetchFormasPagamento,
        refreshContasBancarias: fetchContasBancarias,
        refreshProjetos: fetchProjetos,
        refreshCartoesCredito: fetchCartoesCredito,
        refreshLancamentos: fetchLancamentos,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </LancamentosContext.Provider>
  );
};

export { LancamentosContext };
