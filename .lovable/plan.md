

## Plano: Gestão de múltiplas empresas independentes com cobrança individual

### Situação atual

O sistema **já suporta** múltiplas empresas por usuário:
- `user_roles` permite vincular um usuário a N empresas
- O sidebar já tem um switcher de empresa funcional
- O convite por código já funciona (onboarding e sidebar)
- `switchEmpresa` troca o contexto ativo

### O que falta

1. **Criar nova empresa após o onboarding** — Hoje, só é possível criar empresa durante o primeiro acesso. Depois, o usuário só pode "entrar com código de convite". Falta a opção "Criar nova empresa" no dropdown do switcher.

2. **Cobrança por empresa (Stripe)** — Cada empresa deve ter uma assinatura independente. Isso requer integração com Stripe para gerenciar planos por empresa.

### Mudanças propostas

#### Fase 1: Criar nova empresa a partir do switcher (sem Stripe)

**`src/components/Sidebar.tsx`**
- Adicionar opção **"Criar nova empresa"** no dropdown do switcher (ao lado de "Entrar com código de convite").
- Ao clicar, abrir um Dialog com o formulário de criação de empresa (nome, CNPJ, email, telefone — reutilizando a lógica do `OnboardingScreen`).
- Chamar a edge function `create-empresa` existente e, após sucesso, recarregar para entrar na nova empresa.

**`supabase/functions/create-empresa/index.ts`**
- Verificar se já funciona para usuários que já têm empresa (provavelmente sim, mas validar).

#### Fase 2: Cobrança por empresa (Stripe) — etapa futura

Essa fase exige habilitar a integração Stripe no projeto. A estrutura seria:
- Tabela `assinaturas` vinculada a `empresa_id` com status do plano.
- Cada empresa criada inicia em período de teste (trial).
- Tela de planos/assinatura acessível nas configurações da empresa.
- Bloqueio de acesso quando a assinatura expira.

### Recomendação

Sugiro implementar a **Fase 1** agora (criar empresa pelo switcher) e discutir a Fase 2 (Stripe/cobrança) separadamente, pois envolve decisões de negócio (planos, preços, trial, etc.).

### Arquivos afetados (Fase 1)
- `src/components/Sidebar.tsx` — novo item "Criar nova empresa" + Dialog com formulário

