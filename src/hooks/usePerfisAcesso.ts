import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PerfilAcessoPermissao {
  id?: string;
  perfil_acesso_id?: string;
  tela: string;
  pode_incluir: boolean;
  pode_alterar: boolean;
  pode_excluir: boolean;
}

export interface PerfilAcesso {
  id: string;
  empresa_id: string;
  nome: string;
  descricao: string | null;
  is_default: boolean;
  created_at: string;
  permissoes?: PerfilAcessoPermissao[];
}

export function usePerfisAcesso() {
  const { empresaId } = useAuth();
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPerfis = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("perfis_acesso")
        .select("*, perfis_acesso_permissoes(*)")
        .eq("empresa_id", empresaId)
        .order("is_default", { ascending: false })
        .order("nome");

      if (error) throw error;

      const mapped = (data || []).map((p: any) => ({
        ...p,
        permissoes: p.perfis_acesso_permissoes || [],
      }));
      setPerfis(mapped);
    } catch (err: any) {
      console.error("Error fetching perfis_acesso:", err);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    fetchPerfis();
  }, [fetchPerfis]);

  const createPerfil = async (nome: string, descricao: string, permissoes: PerfilAcessoPermissao[]) => {
    if (!empresaId) return;
    const { data, error } = await (supabase as any)
      .from("perfis_acesso")
      .insert({ empresa_id: empresaId, nome, descricao: descricao || null, is_default: false })
      .select("id")
      .single();

    if (error) throw error;

    if (permissoes.length > 0) {
      const rows = permissoes.map(p => ({
        perfil_acesso_id: data.id,
        tela: p.tela,
        pode_incluir: p.pode_incluir,
        pode_alterar: p.pode_alterar,
        pode_excluir: p.pode_excluir,
      }));
      await (supabase as any).from("perfis_acesso_permissoes").insert(rows);
    }

    toast.success("Perfil de acesso criado");
    fetchPerfis();
  };

  const updatePerfil = async (id: string, nome: string, descricao: string, permissoes: PerfilAcessoPermissao[]) => {
    await (supabase as any).from("perfis_acesso").update({ nome, descricao: descricao || null }).eq("id", id);
    
    // Delete old perms and re-insert
    await (supabase as any).from("perfis_acesso_permissoes").delete().eq("perfil_acesso_id", id);
    
    if (permissoes.length > 0) {
      const rows = permissoes.map(p => ({
        perfil_acesso_id: id,
        tela: p.tela,
        pode_incluir: p.pode_incluir,
        pode_alterar: p.pode_alterar,
        pode_excluir: p.pode_excluir,
      }));
      await (supabase as any).from("perfis_acesso_permissoes").insert(rows);
    }

    toast.success("Perfil de acesso atualizado");
    fetchPerfis();
  };

  const deletePerfil = async (id: string) => {
    const { error } = await (supabase as any).from("perfis_acesso").delete().eq("id", id);
    if (error) throw error;
    toast.success("Perfil de acesso removido");
    fetchPerfis();
  };

  return { perfis, loading, fetchPerfis, createPerfil, updatePerfil, deletePerfil };
}
