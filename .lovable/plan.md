

## Plano: Reorganizar cards do Dashboard

### Mudanças

**1. Unificar "Saldo do mês" + "Saldo Investido" em um único card**
- O card principal mostra "Saldo do mês" com valor em tamanho normal
- Abaixo, em texto menor, exibe "Saldo Investido" como informação complementar
- Remove o card separado de "Saldo Investido" da seção de Caixa

**2. Colocar "Contas a Pagar" e "Receitas Pendentes" lado a lado**
- Substituir a seção colapsável atual (Contas a Pagar + Últimas Movimentações) por: Contas a Pagar + Receitas Pendentes lado a lado
- A seção "Receitas Pendentes" listará receitas com status `pendente`/`aberto` do mês, similar à lista de Contas a Pagar
- "Últimas Movimentações" permanece abaixo, em largura total

**3. Hook `useDashboardData`**
- Adicionar um novo estado `receitasPendentes` (lista de `ContaProxima[]`) com receitas pendentes do mês, análogo a `contasProximas`

### Arquivos afetados
- `src/hooks/useDashboardData.tsx` — adicionar lista `receitasPendentes`
- `src/pages/Dashboard.tsx` — reorganizar layout dos cards e seções colapsáveis

