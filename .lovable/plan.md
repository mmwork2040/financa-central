
# Plano: Cadastro dual + Limites + Onboarding

## 1. Cadastro sempre como Pessoal
- Fluxo de signup permanece igual, mas cria automaticamente uma "empresa pessoal" (tipo PF) para o usuário.
- Após o primeiro login, o onboarding modal apresenta o app e, no final, oferece o card **"Adicionar Contabilidade do meu Negócio"** que abre o fluxo atual de criação de empresa PJ.
- O mesmo botão fica disponível no seletor de empresas (topo do sidebar) como "+ Adicionar Empresa".

## 2. Limites por usuário (campos no perfil)
Adicionar em `perfis`:
- `max_empresas_pj` int default `1`
- `permite_conta_pessoal` bool default `true`

Regras:
- Ao tentar criar empresa PJ, validar `count(empresas PJ do user) < max_empresas_pj`. Se excedido, mostrar mensagem "Solicite ao administrador aumento do limite" com link para suporte.
- Se `permite_conta_pessoal = false`, ocultar o modo pessoa física do seletor.
- Super admin gerencia esses campos numa nova aba **"Limites"** dentro da tela existente de Gestão de Usuários (`/gestao-usuarios` ou equivalente), com inputs inline.

## 3. Onboarding multi-step (modal)
Novo componente `OnboardingModal.tsx`, disparado quando `perfis.onboarding_concluido = false`:

Slides (6):
1. **Bem-vindo** — apresentação rápida do app.
2. **Página Inicial** — dashboards e métricas.
3. **Lançamentos** — receitas/despesas, parcelas, recorrências.
4. **WhatsApp** — botão flutuante para lançar via chat.
5. **Notas Fiscais & Integrações** — emissão e Hotmart/Asaas.
6. **Adicionar Empresa PJ** (condicional se `max_empresas_pj > 0`) — card CTA que leva ao formulário de nova empresa OU botão "Concluir" para ficar só na PF.

Controles: "Pular", "Voltar", "Próximo", "Concluir". Ao concluir marca `onboarding_concluido = true`.

## Detalhes técnicos

**Migration:**
```sql
ALTER TABLE public.perfis
  ADD COLUMN max_empresas_pj int NOT NULL DEFAULT 1,
  ADD COLUMN permite_conta_pessoal boolean NOT NULL DEFAULT true,
  ADD COLUMN onboarding_concluido boolean NOT NULL DEFAULT false;
```

**Arquivos alterados:**
- `handle_new_user()` / `assign_super_admin()` — garantir criação de empresa pessoal padrão.
- `src/components/onboarding/OnboardingModal.tsx` (novo).
- `src/pages/Layout.tsx` (ou App) — montar o modal quando `!onboarding_concluido`.
- `src/components/empresa/CriarEmpresaDialog.tsx` — validar limite antes de submeter.
- `src/pages/GestaoUsuarios.tsx` — nova aba/coluna "Limites" (max_empresas_pj, permite_conta_pessoal) editável por super admin.
- `src/components/layout/Sidebar.tsx` — botão "+ Adicionar Empresa" no seletor respeitando limite.

**Sem alterações destrutivas:** usuários existentes recebem `onboarding_concluido = true` no backfill para não verem o modal.

## Fora do escopo
- Onboarding não usará biblioteca de tour guiado (fica como modal simples).
- Cobrança por empresa adicional não faz parte deste plano.
