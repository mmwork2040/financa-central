import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface Projeto {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  orcamento: number;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export const initialProjeto: Omit<Projeto, "id" | "empresa_id" | "created_at" | "updated_at"> = {
  nome: "",
  descricao: "",
  status: "ativo",
  orcamento: 0,
};

export function useProjetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProjeto, setCurrentProjeto] = useState<any>({ ...initialProjeto });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { empresaId } = useAuth();

  const fetchProjetos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("projetos")
        .select("*")
        .order("nome");

      if (error) throw error;
      setProjetos(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjetos();
  }, [fetchProjetos]);

  const openModal = (projeto?: Projeto) => {
    if (projeto) {
      setCurrentProjeto({ ...projeto });
    } else {
      setCurrentProjeto({ ...initialProjeto });
    }
    setIsModalOpen(true);
  };

  const confirmDelete = (projeto: Projeto) => {
    setCurrentProjeto(projeto);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentProjeto((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setCurrentProjeto((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!currentProjeto.nome) throw new Error("Nome do projeto é obrigatório");

      const payload = {
        nome: currentProjeto.nome,
        descricao: currentProjeto.descricao || null,
        status: currentProjeto.status,
        orcamento: Number(currentProjeto.orcamento) || 0,
      };

      if (currentProjeto.id) {
        const { error } = await (supabase as any)
          .from("projetos")
          .update(payload)
          .eq("id", currentProjeto.id);
        if (error) throw error;
        toast.success("Projeto atualizado com sucesso!");
      } else {
        const { error } = await (supabase as any)
          .from("projetos")
          .insert({ ...payload, empresa_id: empresaId });
        if (error) {
          if (error.code === '23505') throw new Error("Já existe um projeto com este nome.");
          throw error;
        }
        toast.success("Projeto cadastrado com sucesso!");
      }

      setIsModalOpen(false);
      fetchProjetos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar projeto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await (supabase as any)
        .from("projetos")
        .delete()
        .eq("id", currentProjeto.id);
      if (error) throw error;
      toast.success("Projeto excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      fetchProjetos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir projeto");
    }
  };

  return {
    projetos, loading, currentProjeto, isModalOpen, isDeleteDialogOpen, isSaving,
    fetchProjetos, openModal, confirmDelete, handleInputChange, handleSelectChange,
    handleSubmit, handleDelete, setIsModalOpen, setIsDeleteDialogOpen,
  };
}
