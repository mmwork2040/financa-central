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

// Define the types for the data
export type Lancamento = {
  id?: string;
  created_at?: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  tipo: "receita" | "despesa" | "investimento";
  status: "pendente" | "pago" | "recebido" | "cancelado";
  categoria_id: string | null;
  fornecedor_id: string | null;
  cliente_id: string | null;
  conta_bancaria_id: string | null;
  forma_pagamento_id: string | null;
  recorrente: boolean;
  parcela_atual: number | null;
  total_parcelas: number | null;
  data_pagamento: string | null;
  // Add these for join data
  fornecedor?: { id: string; nome: string };
  cliente?: { id: string; nome: string };
  categoria?: { id: string; nome: string; tipo: string };
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

export type ContaBancaria = {
  id: string;
  created_at?: string;
  nome: string;
};

type FiltrosType = {
  tipo?: "receita" | "despesa" | "investimento" | null;
  status?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  categoria_id?: string | null;
  valor_min?: number | null;
  valor_max?: number | null;
  fornecedor_id?: string | null;
  cliente_id?: string | null;
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
  handleDateChange: (field: string, date: Date | null) => void;
  openDeleteModal: boolean;
  setOpenDeleteModal: (open: boolean) => void;
  handleOpenModal: (lancamento?: Lancamento) => void;
  handleOpenDeleteModal: (id: string) => void;
  handleUpdateStatus: (id: string, status: "pendente" | "pago" | "recebido" | "cancelado") => void;
  getStatusBadgeClass: (status: string) => string;
  getStatusLabel: (status: string, tipo: string) => string;
  getTipoBadgeClass: (tipo: string) => string;
  exportToCSV: () => void;
  exportToPDF: () => void;
  handleSort: (field: string) => void;
  refreshCategorias: () => void;
  refreshFornecedores: () => void;
  refreshClientes: () => void;
  refreshFormasPagamento: () => void;
  refreshContasBancarias: () => void;
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
  const { empresaId, user, userProfile } = useAuth();

  // Add sort state
  const [sortField, setSortField] = useState<string>('data_vencimento');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
    recorrente: false,
    parcela_atual: null,
    total_parcelas: null,
    data_pagamento: null,
  });

  const fetchLancamentos = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase as any).from("lancamentos").select(`
        *,
        categoria:categorias(*),
        fornecedor:fornecedores(*),
        cliente:clientes(*)
      `).order(sortField, { ascending: sortDirection === 'asc' });

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

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Cast results to ensure type safety
      setLancamentos(data as unknown as Lancamento[]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar lançamentos");
    } finally {
      setLoading(false);
    }
  }, [filtros, sortField, sortDirection]);

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

  useEffect(() => {
    fetchLancamentos();
    fetchCategorias();
    fetchFornecedores();
    fetchClientes();
    fetchFormasPagamento();
    fetchContasBancarias();
  }, [
    fetchLancamentos,
    fetchCategorias,
    fetchFornecedores,
    fetchClientes,
    fetchFormasPagamento,
    fetchContasBancarias,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value === "no-category" || value === "no-client" || value === "no-supplier" || value === "no-payment-method" || value === "no-bank-account" ? null : value });
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
      // Find the lancamento to get its description for webhook
      const lancamento = lancamentos.find(l => l.id === selectedId);

      // Fire webhook for direct delete with table name
      try {
        await supabase.functions.invoke("fire-webhook", {
          body: {
            empresa_id: empresaId,
            evento: "Excluir Registro",
            tabela: "lancamentos",
            descricao: lancamento?.descricao || "",
            registro: selectedId,
            usuario: {
              id: user?.id,
              nome: userProfile?.nome,
              email: userProfile?.email,
              telefone: userProfile?.telefone || null,
            },
            acao: "exclusao_direta",
          },
        });
      } catch (err) {
        console.warn("Webhook de exclusão direta não disparado:", err);
      }

      const { error } = await supabase.from("lancamentos").delete().eq("id", selectedId);

      if (error) {
        throw error;
      }

      setLancamentos(lancamentos.filter((lancamento) => lancamento.id !== selectedId));
      toast.success("O lançamento foi excluído com sucesso.");
      setOpenDeleteModal(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir lançamento");
    }
  };

  const handleOpenModal = (lancamento?: Lancamento) => {
    if (lancamento) {
      handleEdit(lancamento);
    } else {
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
        conta_bancaria_id: null,
        forma_pagamento_id: null,
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
    setFormData({
      descricao: lancamento.descricao,
      valor: lancamento.valor,
      data_vencimento: lancamento.data_vencimento,
      tipo: lancamento.tipo,
      status: lancamento.status,
      categoria_id: lancamento.categoria_id,
      fornecedor_id: lancamento.fornecedor_id,
      cliente_id: lancamento.cliente_id,
      conta_bancaria_id: lancamento.conta_bancaria_id,
      forma_pagamento_id: lancamento.forma_pagamento_id,
      recorrente: lancamento.recorrente,
      parcela_atual: lancamento.parcela_atual,
      total_parcelas: lancamento.total_parcelas,
      data_pagamento: lancamento.data_pagamento,
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      // Ensure proper typing
      const dataToSave: LancamentoFormData = {
        ...formData,
        tipo: formData.tipo as "receita" | "despesa" | "investimento",
        status: formData.status as "pendente" | "pago" | "recebido" | "cancelado"
      };

      if (selectedId) {
        // Update existing lancamento
        const { error } = await supabase
          .from("lancamentos")
          .update(dataToSave)
          .eq("id", selectedId);

        if (error) {
          throw error;
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
                telefone: (userProfile as any)?.telefone || null,
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
        const { data, error } = await supabase
          .from("lancamentos")
          .insert([{ ...dataToSave, empresa_id: empresaId }])
          .select();

        if (error) {
          throw error;
        }

        // Cast data to ensure type safety
        setLancamentos([...lancamentos, ...(data as unknown as Lancamento[])]);
        toast.success("O lançamento foi criado com sucesso.");
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
      const { error } = await supabase
        .from("lancamentos")
        .update({ status })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setLancamentos(
        lancamentos.map((lancamento) =>
          lancamento.id === id ? { ...lancamento, status } : lancamento
        )
      );
      toast.success("O status do lançamento foi atualizado com sucesso.");
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

  const getTipoBadgeClass = (tipo: string): string => {
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

  const exportToCSV = () => {
    toast.success("Função em desenvolvimento.");
  };

  const exportToPDF = () => {
    toast.success("Função em desenvolvimento.");
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
      }}
    >
      {children}
    </LancamentosContext.Provider>
  );
};

export { LancamentosContext };
