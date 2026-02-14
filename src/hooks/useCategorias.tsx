import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Categoria {
  id: string;
  nome: string;
  tipo: "receita" | "despesa";
}

export const initialCategoria: Categoria = {
  id: "",
  nome: "",
  tipo: "despesa",
};

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategoria, setCurrentCategoria] = useState<Categoria>({ ...initialCategoria });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { empresaId } = useAuth();

  useEffect(() => {
    fetchCategorias();
  }, []);

  async function fetchCategorias() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) throw error;

      const validatedCategorias = data?.map(item => {
        const tipo = item.tipo === "receita" ? "receita" : "despesa";
        return { ...item, tipo } as Categoria;
      }) || [];

      setCategorias(validatedCategorias);
    } catch (error: any) {
      toast({ title: "Erro ao carregar categorias", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const openModal = (categoria?: Categoria) => {
    if (categoria) {
      setCurrentCategoria({ ...categoria });
    } else {
      setCurrentCategoria({ ...initialCategoria });
    }
    setIsModalOpen(true);
  };

  const confirmDelete = (categoria: Categoria) => {
    setCurrentCategoria(categoria);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentCategoria(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: "receita" | "despesa") => {
    setCurrentCategoria(prev => ({ ...prev, tipo: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (!currentCategoria.nome) throw new Error("Nome da categoria é obrigatório");

      if (currentCategoria.id) {
        const { error } = await supabase
          .from('categorias')
          .update({ nome: currentCategoria.nome, tipo: currentCategoria.tipo })
          .eq('id', currentCategoria.id);
        if (error) throw error;
        toast({ title: "Categoria atualizada com sucesso!" });
      } else {
        const { error } = await supabase
          .from('categorias')
          .insert({ nome: currentCategoria.nome, tipo: currentCategoria.tipo, empresa_id: empresaId });
        if (error) throw error;
        toast({ title: "Categoria cadastrada com sucesso!" });
      }
      
      setIsModalOpen(false);
      fetchCategorias();
    } catch (error: any) {
      toast({ title: "Erro ao salvar categoria", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('categorias').delete().eq('id', currentCategoria.id);
      if (error) throw error;
      toast({ title: "Categoria excluída com sucesso!" });
      setIsDeleteDialogOpen(false);
      fetchCategorias();
    } catch (error: any) {
      toast({ title: "Erro ao excluir categoria", description: error.message, variant: "destructive" });
    }
  };

  return {
    categorias, loading, currentCategoria, isModalOpen, isDeleteDialogOpen, isSaving,
    fetchCategorias, openModal, confirmDelete, handleInputChange, handleSelectChange,
    handleSubmit, handleDelete, setIsModalOpen, setIsDeleteDialogOpen
  };
}
