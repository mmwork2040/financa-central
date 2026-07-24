-- =====================================================================
-- Cadastro dual (Pessoal + Negócio), limites por usuário e tour de onboarding
-- Aplicar via console/DB tool. Idempotente.
-- =====================================================================

ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS max_empresas_pj integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS permite_conta_pessoal boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_concluido boolean NOT NULL DEFAULT false;

-- Marca usuários já existentes como onboardados para não verem o tour retroativo
UPDATE public.perfis
SET onboarding_concluido = true
WHERE created_at < now() - interval '5 minutes'
  AND onboarding_concluido = false;
