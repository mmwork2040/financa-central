

## Plano: Cartões de Crédito para Conta Pessoal

### Conceito

Criar uma tabela `cartoes_credito` vinculada à empresa pessoal. Cada cartão tem **dia de fechamento** e **dia de vencimento da fatura**. Ao criar um lançamento de despesa e associá-lo a um cartão, o sistema calcula automaticamente em qual fatura a despesa cai: se a data da despesa for **após o dia de fechamento**, ela pertence à fatura do **mês seguinte** (ajustando `data_vencimento` para o dia de vencimento do próximo mês).

### Alterações no Banco de Dados

**Nova tabela `cartoes_credito`:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| empresa_id | uuid | Vinculado à empresa pessoal |
| nome | text | Ex: "Nubank", "Itaú Platinum" |
| bandeira | text | Visa, Mastercard, etc. (opcional) |
| ultimos_digitos | text | Últimos 4 dígitos (opcional) |
| limite | numeric | Limite do cartão (opcional) |
| dia_fechamento | integer | Dia do mês (1-31) em que fecha a fatura |
| dia_vencimento | integer | Dia do mês (1-31) em que vence a fatura |
| ativo | boolean | Default true |
| created_at / updated_at | timestamptz | |

**RLS:** Mesma lógica das demais tabelas — `empresa_id = get_user_empresa_id(auth.uid())` com `has_screen_permission` para CUD.

**Coluna nova na tabela `lancamentos`:**
- `cartao_credito_id uuid nullable` — referência ao cartão usado na despesa.

### Lógica de Fatura (frontend)

Quando o usuário selecionar um cartão de crédito no formulário de lançamento:
1. Pegar a `data_vencimento` do lançamento (data da compra)
2. Comparar o **dia** dessa data com o `dia_fechamento` do cartão
3. Se `dia da compra > dia_fechamento`: a fatura é do mês seguinte → setar `data_vencimento` do lançamento para `dia_vencimento` do próximo mês
4. Se `dia da compra <= dia_fechamento`: fatura do mês atual → setar `data_vencimento` para `dia_vencimento` do mesmo mês

### Arquivos a Criar / Modificar

| Arquivo | Ação |
|---------|------|
| **Migration SQL** | Criar tabela `cartoes_credito` + adicionar coluna `cartao_credito_id` em `lancamentos` |
| `src/hooks/useCartoesCredito.ts` | **Novo** — CRUD de cartões de crédito |
| `src/pages/CartoesCredito.tsx` | **Novo** — Página de gestão de cartões |
| `src/components/cartoes-credito/CartaoCreditoForm.tsx` | **Novo** — Modal de cadastro/edição |
| `src/components/cartoes-credito/CartoesCreditoTable.tsx` | **Novo** — Tabela de listagem |
| `src/components/Sidebar.tsx` | Adicionar item "Cartões de Crédito" visível apenas em `isPessoal` |
| `src/App.tsx` | Adicionar rota `/cartoes-credito` |
| `src/components/lancamentos/LancamentosFormDialog.tsx` | Adicionar select de cartão de crédito (quando `isPessoal`), com lógica automática de ajuste de vencimento |
| `src/contexts/LancamentosContext.tsx` | Carregar cartões de crédito, incluir `cartao_credito_id` no formData e no save |

### Fluxo do Usuário

1. Usuário cadastra cartão com nome, dia de fechamento (ex: 10) e dia de vencimento (ex: 20)
2. Ao criar um lançamento de despesa, seleciona o cartão
3. Se a compra foi dia 15 (após fechamento dia 10) → vencimento automaticamente ajustado para dia 20 do mês seguinte
4. Se a compra foi dia 5 (antes do fechamento dia 10) → vencimento fica dia 20 do mesmo mês

