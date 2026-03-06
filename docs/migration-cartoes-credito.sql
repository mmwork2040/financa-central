-- Migration: Cartões de Crédito para Conta Pessoal

-- 1. Criar tabela cartoes_credito
CREATE TABLE public.cartoes_credito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  bandeira text,
  ultimos_digitos text,
  limite numeric DEFAULT 0,
  dia_fechamento integer NOT NULL,
  dia_vencimento integer NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.cartoes_credito ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "cartoes_credito_select" ON public.cartoes_credito
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "cartoes_credito_insert" ON public.cartoes_credito
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "cartoes_credito_update" ON public.cartoes_credito
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "cartoes_credito_delete" ON public.cartoes_credito
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));

-- 4. Trigger updated_at
CREATE TRIGGER update_cartoes_credito_updated_at
  BEFORE UPDATE ON public.cartoes_credito
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Adicionar coluna cartao_credito_id na tabela lancamentos
ALTER TABLE public.lancamentos
  ADD COLUMN cartao_credito_id uuid REFERENCES public.cartoes_credito(id) ON DELETE SET NULL;
