import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CartaoCredito = {
  id: string;
  empresa_id: string;
  nome: string;
  bandeira: string | null;
  ultimos_digitos: string | null;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type CartaoCreditoForm = {
  nome: string;
  bandeira: string;
  ultimos_digitos: string;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  ativo: boolean;
};

const defaultForm: CartaoCreditoForm = {
  nome: "",
  bandeira: "",
  ultimos_digitos: "",
  limite: 0,
  dia_fechamento: 1,
  dia_vencimento: 10,
  ativo: true,
};

export const useCartoesCredito = () => {
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CartaoCreditoForm>({ ...defaultForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCartoes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("cartoes_credito")
        .select("*")
        .order("nome");
      if (error) throw error;
      setCartoes(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar cartões");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCartoes();
  }, [fetchCartoes]);

  const openNew = () => {
    setEditingId(null);
    setFormData({ ...defaultForm });
    setOpenModal(true);
  };

  const openEdit = (cartao: CartaoCredito) => {
    setEditingId(cartao.id);
    setFormData({
      nome: cartao.nome,
      bandeira: cartao.bandeira || "",
      ultimos_digitos: cartao.ultimos_digitos || "",
      limite: cartao.limite,
      dia_fechamento: cartao.dia_fechamento,
      dia_vencimento: cartao.dia_vencimento,
      ativo: cartao.ativo,
    });
    setOpenModal(true);
  };

  const save = async (empresaId: string) => {
    try {
      if (formData.dia_fechamento < 1 || formData.dia_fechamento > 31 ||
          formData.dia_vencimento < 1 || formData.dia_vencimento > 31) {
        toast.error("Dia de fechamento e vencimento devem estar entre 1 e 31.");
        return;
      }

      const payload = {
        nome: formData.nome,
        bandeira: formData.bandeira || null,
        ultimos_digitos: formData.ultimos_digitos || null,
        limite: formData.limite,
        dia_fechamento: formData.dia_fechamento,
        dia_vencimento: formData.dia_vencimento,
        ativo: formData.ativo,
      };

      if (editingId) {
        const { error } = await (supabase as any)
          .from("cartoes_credito")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Cartão atualizado com sucesso.");
      } else {
        const { error } = await (supabase as any)
          .from("cartoes_credito")
          .insert([{ ...payload, empresa_id: empresaId }]);
        if (error) throw error;
        toast.success("Cartão cadastrado com sucesso.");
      }

      setOpenModal(false);
      fetchCartoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cartão");
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await (supabase as any)
        .from("cartoes_credito")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
      toast.success("Cartão excluído com sucesso.");
      setOpenDeleteModal(false);
      fetchCartoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir cartão");
    }
  };

  return {
    cartoes,
    loading,
    formData,
    setFormData,
    editingId,
    openModal,
    setOpenModal,
    openDeleteModal,
    setOpenDeleteModal,
    openNew,
    openEdit,
    save,
    confirmDelete,
    handleDelete,
    fetchCartoes,
  };
};
