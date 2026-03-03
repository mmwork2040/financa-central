

## Plano: Caixa Previsto do Mês Atual no Dashboard

### Problema
O "Caixa Previsto" no Dashboard busca dados do **mês seguinte**. Deveria considerar apenas receitas e despesas **pendentes do mês atual** (o mês selecionado).

### Alterações

**`src/hooks/useDashboardData.tsx`** (linhas 180-197):
- Trocar o filtro de `nextMonthStart/nextMonthEnd` para usar o mês atual (`selectedMonth`)
- Caixa Previsto = `caixaAtual + receitasPendentes(mêsAtual) - despesasPendentes(mêsAtual)`
- Já temos os dados do mês atual carregados (`allLancamentos`), então podemos reutilizá-los em vez de fazer nova query

**`src/pages/Dashboard.tsx`** (linha 146):
- Alterar o texto descritivo de "Projeção para o mês seguinte" para "Previsão para o mês atual"

### Relatórios — sem alteração
O `CaixaView.tsx` já projeta múltiplos meses futuros com a simulação `simularFluxoCaixa`, que é o comportamento correto para relatórios.

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useDashboardData.tsx` | Usar mês atual para caixa previsto |
| `src/pages/Dashboard.tsx` | Atualizar label descritivo |

