import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SolicitacaoSaida {
  id: string;
  user_id: string;
  empresa_id: string;
  motivo: string | null;
  status: string;
  respondido_por: string | null;
  respondido_em: string | null;
  auto_aprovado: boolean;
  expira_em: string;
  created_at: string;
  updated_at: string;
  user_nome?: string;
  user_email?: string;
  empresa_nome?: string;
}

const queryTable = () => (supabase as any).from("solicitacoes_saida");

export const useSolicitacoesSaida = () => {
  const { user, empresaId, isSuperAdmin, userRole } = useAuth();
  const [myRequests, setMyRequests] = useState<SolicitacaoSaida[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SolicitacaoSaida[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = userRole === "admin" || isSuperAdmin;

  const fetchMyRequests = useCallback(async () => {
    if (!user) return;
    const { data } = await queryTable()
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const empresaIds = [...new Set((data as any[]).map((d: any) => d.empresa_id))];
      const { data: empresas } = await supabase
        .from("empresas")
        .select("id, nome")
        .in("id", empresaIds as string[]);

      setMyRequests((data as any[]).map((d: any) => ({
        ...d,
        empresa_nome: empresas?.find((e) => e.id === d.empresa_id)?.nome || "Empresa",
      })));
    }
  }, [user]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user || !isAdmin) return;

    const { data } = await queryTable()
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: true });

    if (data) {
      const items = data as any[];
      const userIds = [...new Set(items.map((d: any) => d.user_id))];
      const { data: perfis } = await supabase
        .from("perfis")
        .select("id, nome, email")
        .in("id", userIds as string[]);

      const empresaIds = [...new Set(items.map((d: any) => d.empresa_id))];
      const { data: empresas } = await supabase
        .from("empresas")
        .select("id, nome")
        .in("id", empresaIds as string[]);

      setPendingRequests(items.map((d: any) => ({
        ...d,
        user_nome: perfis?.find((p) => p.id === d.user_id)?.nome || "Usuário",
        user_email: perfis?.find((p) => p.id === d.user_id)?.email || "",
        empresa_nome: empresas?.find((e) => e.id === d.empresa_id)?.nome || "Empresa",
      })));
    }
  }, [user, isAdmin]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await supabase.functions.invoke("process-exit-request", {
      body: { action: "check-expired" },
    });
    await Promise.all([fetchMyRequests(), fetchPendingRequests()]);
    setLoading(false);
  }, [fetchMyRequests, fetchPendingRequests]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, empresaId]);

  useEffect(() => {
    const handler = () => { if (user) fetchAll(); };
    window.addEventListener("exit-requests-changed", handler);
    return () => window.removeEventListener("exit-requests-changed", handler);
  }, [user, fetchAll]);

  const createRequest = async (targetEmpresaId: string, motivo?: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-exit-request", {
        body: { action: "create", empresaId: targetEmpresaId, motivo },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Solicitação de saída enviada. Aguarde a resposta do administrador.");
      window.dispatchEvent(new Event("exit-requests-changed"));
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-exit-request", {
        body: { action: "cancel", requestId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Solicitação cancelada.");
      window.dispatchEvent(new Event("exit-requests-changed"));
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const approveRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-exit-request", {
        body: { action: "approve", requestId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Solicitação aprovada — usuário removido da empresa.");
      await fetchAll();
      window.dispatchEvent(new Event("exit-requests-changed"));
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const rejectRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-exit-request", {
        body: { action: "reject", requestId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Solicitação rejeitada — usuário permanece na empresa.");
      await fetchAll();
      window.dispatchEvent(new Event("exit-requests-changed"));
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const hasPendingRequest = (targetEmpresaId: string) => {
    return myRequests.some(r => r.empresa_id === targetEmpresaId && r.status === "pendente");
  };

  return {
    myRequests,
    pendingRequests,
    pendingCount: pendingRequests.length,
    loading,
    actionLoading,
    isAdmin,
    createRequest,
    cancelRequest,
    approveRequest,
    rejectRequest,
    hasPendingRequest,
    refresh: fetchAll,
  };
};
