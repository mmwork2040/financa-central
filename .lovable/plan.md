

## Plano: Filtro de Mês em Carrossel + Parcelas Divididas + Despesas Recorrentes Previstas

### Visão Geral

Criar um componente de navegação por mês (carrossel horizontal) que será exibido em todas as páginas internas, filtrando os dados pelo mês selecionado. Ao salvar lançamentos parcelados, o sistema criará automaticamente um registro para cada parcela nos meses seguintes com o valor dividido. Despesas recorrentes também gerarão lançamentos futuros como "previstos".

### 1. Componente MonthCarousel (`src/components/common/MonthCarousel.tsx`)

- Carrossel horizontal com setas esquerda/direita
- Exibe o mês atual centralizado, com meses anteriores e futuros navegáveis (6 meses para trás, 12 para frente)
- Formato: "Janeiro 2026", "Fevereiro 2026", etc.
- Mês ativo destacado com `bg-primary text-white rounded-full`
- Estado armazenado em contexto global para ser acessado em todas as páginas
- Estilo glass consistente com o design system

### 2. Contexto Global de Mês (`src/contexts/MonthFilterContext.tsx`)

- `selectedMonth: Date` (primeiro dia do mês selecionado)
- `setSelectedMonth(date: Date)`
- `monthStart: string` e `monthEnd: string` (formatados para queries)
- Provider envolvendo o AppLayout para estar disponível em todas as páginas

### 3. Integração nas Páginas

**Dashboard** — Filtrar resumo, gráficos e movimentações pelo mês selecionado. Os cards de resumo mostrarão totais do mês. O gráfico de fluxo de caixa destacará o mês ativo.

**Lançamentos** — O `fetchLancamentos` usará `monthStart`/`monthEnd` como filtro padrão de `data_vencimento`. Os lançamentos virtuais (parcelas futuras e recorrências) aparecerão junto com os reais, marcados com badge "Previsto".

**Clientes, Fornecedores, Categorias, Contas Bancárias, Formas de Pagamento** — Estas páginas são cadastros, não transacionais. O carrossel aparecerá mas não filtrará dados (apenas para consistência visual e navegação rápida).

### 4. Criação Automática de Parcelas no Banco (handleSave)

Quando o usuário salvar um lançamento com `recorrente: true` e `total_parcelas > 1`:
- O valor total será dividido por `total_parcelas`
- Serão inseridos N registros no banco, cada um com:
  - `valor = valor_total / total_parcelas`
  - `data_vencimento` incrementada mês a mês
  - `parcela_atual` = 1, 2, 3...
  - `total_parcelas` = N
  - `status = "pendente"`
  - `descricao` com sufixo "(Parcela X/N)"

Isso acontecerá no `handleSave` do `LancamentosContext.tsx`, substituindo a inserção única por um `insert` em lote.

### 5. Projeção de Recorrências (client-side)

Para lançamentos marcados como `recorrente: true` sem `total_parcelas` (recorrência indefinida):
- No `LancamentosContainer`, ao filtrar pelo mês, verificar se existem recorrências ativas cujo `data_vencimento` é anterior ao mês selecionado e que não possuem `recorrencia_fim` ou cuja `recorrencia_fim` é posterior
- Gerar lançamentos virtuais (sem `id` real) com badge "Previsto" para exibição
- Esses lançamentos virtuais não são salvos no banco — são calculados em runtime

### 6. Integração no AppLayout

O `MonthCarousel` será renderizado dentro do `AppLayout`, acima do `{children}`, para aparecer em todas as páginas internas.

### Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/components/common/MonthCarousel.tsx` | **Criar** — componente de carrossel de meses |
| `src/contexts/MonthFilterContext.tsx` | **Criar** — contexto global do mês selecionado |
| `src/layouts/AppLayout.tsx` | **Editar** — adicionar MonthFilterProvider e MonthCarousel |
| `src/contexts/LancamentosContext.tsx` | **Editar** — usar monthStart/monthEnd no fetch; gerar parcelas no save |
| `src/components/lancamentos/LancamentosContainer.tsx` | **Editar** — gerar lançamentos virtuais de recorrências |
| `src/components/lancamentos/LancamentosTable.tsx` | **Editar** — exibir badge "Previsto" em lançamentos virtuais |
| `src/hooks/useDashboardData.tsx` | **Editar** — filtrar dados pelo mês selecionado |
| `src/pages/Dashboard.tsx` | **Editar** — usar mês do contexto |
| `src/components/lancamentos/LancamentosSummary.tsx` | Sem mudanças (já calcula sobre os lancamentos filtrados) |

### Detalhes Técnicos

**MonthCarousel**: Usa `embla-carousel-react` (já instalado) ou scroll nativo com `overflow-x-auto` e `scroll-snap`. Renderiza botões para cada mês, com `ChevronLeft`/`ChevronRight` nas extremidades.

**Parcelas no banco**: O insert em lote usa array de objetos no Supabase:
```typescript
const parcelas = Array.from({ length: totalParcelas }, (_, i) => ({
  ...dataToSave,
  valor: valorTotal / totalParcelas,
  parcela_atual: i + 1,
  data_vencimento: addMonths(dataVencimento, i),
  descricao: `${descricao} (${i+1}/${totalParcelas})`
}));
await supabase.from("lancamentos").insert(parcelas);
```

**Lançamentos virtuais**: Adicionam flag `_virtual: true` para que a tabela saiba que não são editáveis e exiba o badge "Previsto".

