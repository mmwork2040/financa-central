

## Plano: Filtros de Período Avançados + Dashboard de Fechamento de Ciclo

### Visão Geral
Transformar a página de Relatórios para suportar:
1. **Filtros de visualização futura**: próximo mês, próximos 3, 6 e 12 meses
2. **Período personalizado**: date picker com data início e data fim definidos pelo usuário
3. **Nova aba "Fechamento"**: dashboard detalhado para fechamento de ciclos (mês, trimestre, semestre, ano) com ranking de categorias de maior gasto/receita, percentuais, comparativos

### Alterações

---

**1. `src/hooks/useRelatoriosData.tsx`** — Refatorar para suportar todos os modos de período

- Aceitar `periodo` com novos valores: `'mes'`, `'trimestre'`, `'semestre'`, `'ano'`, `'proximo_mes'`, `'proximos_3'`, `'proximos_6'`, `'proximos_12'`, `'personalizado'`
- Aceitar parâmetros opcionais `dataInicio?: Date` e `dataFim?: Date` para período personalizado
- Para períodos futuros (`proximo_*`), calcular `dataInicio = hoje` e `dataFim` conforme meses à frente
- Aplicar o filtro de data na query do Supabase (que hoje está sem filtro!) usando `gte('data_vencimento', dataInicioStr).lte('data_vencimento', dataFimStr)`
- Alterar `processarFluxoCaixa` para agrupar por mês real (usando `data_vencimento`) em vez de retornar apenas "Total" — cada barra do gráfico será um mês
- Retornar também dados adicionais: `topDespesas` e `topReceitas` (top 5 categorias ordenadas por valor)

---

**2. `src/pages/Relatorios.tsx`** — Novos filtros + nova aba Fechamento

- Substituir o `<Select>` atual por um com 3 grupos de opções:
  - **Passado**: Último mês, Último trimestre, Último semestre, Último ano
  - **Futuro**: Próximo mês, Próximos 3 meses, Próximos 6 meses, Próximos 12 meses
  - **Personalizado**: abre dois `Popover` com `Calendar` (data início / data fim)
- Quando `periodo === 'personalizado'`, mostrar date pickers inline ao lado do select
- Adicionar nova aba **"Fechamento"** na `TabsList`
- Passar `dataInicio`/`dataFim` para o hook quando personalizado

---

**3. Novo componente `src/components/relatorios/FechamentoCiclo.tsx`** — Dashboard de Fechamento

Recebe `dataReceitas`, `dataDespesas`, `dataFluxo`, `periodo` e exibe:

- **Resumo do ciclo**: cards com Total Receitas, Total Despesas, Saldo, Margem (%)
- **Top 5 Categorias de Despesa**: tabela ranqueada com nome, valor, % do total, barra visual de progresso
- **Top 5 Categorias de Receita**: mesma estrutura
- **Comparativo Receita vs Despesa**: gráfico de barras horizontal lado a lado
- **Indicadores**: margem líquida, ticket médio por lançamento, categoria que mais cresceu/reduziu
- Seletor de ciclo próprio (Mês atual, Trimestre atual, Semestre atual, Ano atual) que define o intervalo de datas automaticamente

---

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useRelatoriosData.tsx` | Suportar períodos futuros, personalizado e filtro real por data; agrupar fluxo por mês; retornar top categorias |
| `src/pages/Relatorios.tsx` | Novos valores no Select com grupos; date pickers para personalizado; nova aba Fechamento |
| `src/components/relatorios/FechamentoCiclo.tsx` | **Novo** — Dashboard completo de fechamento de ciclo |

