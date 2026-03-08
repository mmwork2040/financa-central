

## Visão Geral

Substituir o gráfico de donut atual (que mostra apenas Receitas vs Despesas) por um painel de gráficos mais completo com:

1. **Gráfico de Pizza por Categorias** — com filtros (receita/despesa/todos) e toggle entre % e valores
2. **Gráfico de Linhas com projeção futura** — trimestral, semestral ou anual

## Mudanças

### 1. `src/components/dashboard/DashboardCategoryPieChart.tsx` (novo)

Componente que:
- Recebe os lançamentos do mês (`lancamentosMes`) já disponíveis no hook
- Agrupa por `categoria.nome`, somando valores
- Filtro por tipo: "Receitas" | "Despesas" | "Todos" (Select ou tabs)
- Toggle: exibir **%** ou **R$** nos labels do gráfico
- Paleta de ~10 cores pré-definidas
- Respeita `useValuesVisibility` (mascara valores quando oculto)
- Legenda interativa abaixo do gráfico com nome da categoria + valor/percentual

### 2. `src/components/dashboard/DashboardTrendLineChart.tsx` (novo)

Componente que:
- Recebe os lançamentos (busca dados futuros conforme período selecionado)
- Select de período: **Trimestral** (3 meses) | **Semestral** (6 meses) | **Anual** (12 meses)
- Mostra meses passados (dados reais pagos) + meses futuros (pendentes como projeção, linha tracejada)
- Linhas: Receitas (verde), Despesas (vermelho), Saldo (azul)
- Usa dados do hook + query adicional para meses fora do mês selecionado
- Respeita `useValuesVisibility`

### 3. `src/hooks/useDashboardData.tsx` (editar)

- Alterar a query de `lancamentos` (linhas 99-105) para incluir `categoria:categoria_id(nome)` nos `todosLancamentos` (query das linhas 125-129) — atualmente só traz na query de recentes
- Retornar `todosLancamentos` (renomear para `lancamentosMes` que já existe mas sem categoria) com categoria inclusa
- Adicionar função/query para buscar lançamentos de meses futuros para o gráfico de linhas (query parametrizada por período)

### 4. `src/pages/Dashboard.tsx` (editar)

- Substituir o grid de charts (linhas 207-214) para incluir os dois novos componentes
- Layout: 
  - Linha 1: `DashboardChart` (barras, lg:col-span-2) + `DashboardCategoryPieChart` (lg:col-span-1) — mesmo layout atual mas com o novo pie
  - Linha 2: `DashboardTrendLineChart` (full width)

### Detalhes Técnicos

**Query para gráfico de linhas (períodos futuros):**
```sql
-- Buscar lançamentos agrupados por mês nos próximos N meses
SELECT tipo, valor, data_vencimento, status 
FROM lancamentos
WHERE data_vencimento BETWEEN <monthStart> AND <futureEnd>
```

Agrupamento client-side por `YYYY-MM`, separando dados reais (pago/recebido) de projetados (pendente).

**Cores do pie chart:**
```typescript
const CATEGORY_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"
];
```

Nenhuma alteração de banco de dados necessária.

