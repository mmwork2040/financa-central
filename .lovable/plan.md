

## Plano: Modo Pessoa Física com Dashboard Simplificado

### Situação Atual
- O sistema já possui o conceito de `isPessoal` (campo `pessoal` na tabela `empresas`) e a criação de conta pessoal via onboarding ("Usar individualmente").
- Porém, o array `PESSOAL_BLOCKED_ROUTES` está vazio e a sidebar/dashboard não diferencia o modo pessoal do empresarial.

### O que será implementado

**1. Filtrar menu da Sidebar para contas pessoais**

No `Sidebar.tsx`, quando `isPessoal === true`, ocultar os itens:
- Vendas, Anúncios, Projetos (do `mainItems`)
- Clientes, Fornecedores, Usuários (do `cadastrosItems`)
- Integrações, Webhooks, NF/Fiscal (do `configItems`)

Manter visíveis: Dashboard, Lançamentos, Categorias, Contas Bancárias, Formas de Pagamento, Relatórios, Configurações Pessoais.

**2. Bloquear rotas no ProtectedRoute**

Preencher `PESSOAL_BLOCKED_ROUTES` com:
`/vendas-digitais`, `/anuncios`, `/clientes`, `/fornecedores`, `/projetos`, `/users`, `/permissions`, `/settings/integracoes`, `/settings/webhooks`

**3. Dashboard Pessoal simplificado**

Criar um componente `DashboardPessoal` dentro de `Dashboard.tsx` que será renderizado quando `isPessoal === true`. Conterá:
- Saudação simples
- Toggle de visibilidade de valores
- 3 cards: Receitas do mês, Despesas do mês, Saldo
- 1 card: Saldo Investido (destaque para controle de investimentos)
- Gráfico de barras mensal (receitas vs despesas)
- Lista de últimas movimentações
- Sem: saúde financeira complexa, caixa previsto, meses de caixa, contas a pagar/receber separadas

**4. Atalhos do Dashboard para modo pessoal**

No `DashboardShortcuts.tsx`, filtrar atalhos removendo Clientes, Fornecedores e Vendas quando `isPessoal`. Substituir por: Novo Lançamento, Contas Bancárias, Categorias, Relatórios.

**5. Lançamentos em modo pessoal**

No formulário de lançamentos (`LancamentosFormDialog`), quando `isPessoal`:
- Ocultar campos de Cliente e Fornecedor (não são obrigatórios)
- Manter: descrição, valor, tipo, categoria, conta bancária, forma de pagamento, status, data

**6. Configurações Pessoais**

Na `ConfiguracoesEmpresa.tsx`, já existe diferenciação parcial (`isPessoal`). Garantir que a seção de Configuração Fiscal e Códigos de Convite fiquem ocultas para contas pessoais.

### Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/Sidebar.tsx` | Filtrar itens de menu por `isPessoal` |
| `src/components/auth/ProtectedRoute.tsx` | Popular `PESSOAL_BLOCKED_ROUTES` |
| `src/pages/Dashboard.tsx` | Criar `DashboardPessoal` e renderizar condicionalmente |
| `src/components/dashboard/DashboardShortcuts.tsx` | Filtrar atalhos por `isPessoal` |
| `src/components/lancamentos/LancamentosFormDialog.tsx` | Ocultar cliente/fornecedor quando pessoal |
| `src/pages/ConfiguracoesEmpresa.tsx` | Ocultar seção fiscal para pessoal |

### Sem alterações no banco de dados
A coluna `pessoal` na tabela `empresas` já existe e é utilizada. Nenhuma migration necessária.

