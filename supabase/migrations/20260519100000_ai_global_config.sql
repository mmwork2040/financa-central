-- Configuração global de IA controlada pelo Super Admin
CREATE TABLE IF NOT EXISTS public.ai_global_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('openai','google_gemini','anthropic','deepseek','lovable_ai')),
  model text NOT NULL,
  api_key text,
  ativo boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_global_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_global_config_super_admin_all" ON public.ai_global_config;
CREATE POLICY "ai_global_config_super_admin_all"
  ON public.ai_global_config FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_ai_global_config_updated ON public.ai_global_config;
CREATE TRIGGER trg_ai_global_config_updated
  BEFORE UPDATE ON public.ai_global_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ai_global_access (
  empresa_id uuid PRIMARY KEY REFERENCES public.empresas(id) ON DELETE CASCADE,
  liberado boolean NOT NULL DEFAULT false,
  liberado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  liberado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_global_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_global_access_super_admin_all" ON public.ai_global_access;
CREATE POLICY "ai_global_access_super_admin_all"
  ON public.ai_global_access FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "ai_global_access_select_own" ON public.ai_global_access;
CREATE POLICY "ai_global_access_select_own"
  ON public.ai_global_access FOR SELECT
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

DROP TRIGGER IF EXISTS trg_ai_global_access_updated ON public.ai_global_access;
CREATE TRIGGER trg_ai_global_access_updated
  BEFORE UPDATE ON public.ai_global_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
