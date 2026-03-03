

## Plano: Redesign do Dashboard com Atalhos e Dados Visuais

Baseado na imagem de referência (dashboard estilo moderno com cards de resumo, gráfico de fluxo de caixa, atalhos rápidos e lista de transações recentes), vou reestruturar o dashboard atual.

### Estrutura do Novo Dashboard

```text
┌─────────────────────────────────────────────────────┐
│  Header: Saudação + Saúde Financeira + Eye toggle   │
├──────────┬──────────┬──────────┬─────────────────────┤
│ Receitas │ Despesas │  Saldo   │  Contas Próximas    │
│  (card)  │  (card)  │  (card)  │     (card)          │
├──────────┴──────────┴──────────┴─────────────────────┤
│  Atalhos Rápidos (grid de botões com ícones)         │
│  [+ Lançamento] [Clientes] [Fornecedores]            │
│  [Relatórios] [Contas Bancárias] [Vendas Digitais]   │
├─────────────────────────┬───────────────────────────-┤
│  Gráfico Fluxo de Caixa │  Resumo Totais + Donut    │
│  (BarChart 6 meses)     │  por Tipo (receita/desp)  │
├─────────────────────────┴───────────────────────────-┤
│  Próximos 7 dias          │  Últimas Movimentações   │
│  (contas a vencer)        │  (transações recentes)   │
└───────────────────────────┴──────────────────────────┘
```

### O que será implementado

1. **Seção de Atalhos Rápidos** (novo componente `DashboardShortcuts.tsx`)
   - Grid de 6 botões-atalho com ícones e labels
   - Navegação para: Novo Lançamento, Clientes, Fornecedores, Relatórios, Contas Bancárias, Vendas Digitais
   - Estilo pill/glassmorphism seguindo o design system do projeto
   - O atalho "Novo Lançamento" abre o modal de criação diretamente

2. **Gráfico Donut de Distribuição** (novo componente `DashboardDonutChart.tsx`)
   - PieChart (Recharts) mostrando proporção receitas vs despesas vs investimentos
   - Integrado ao lado do card de totais, substituindo o card simples atual

3. **Layout side-by-side para Próximos 7 dias e Últimas Movimentações**
   - Reorganizar as duas seções em grid 2 colunas no desktop

4. **Ajustes no Dashboard.tsx**
   - Integrar os novos componentes
   - Reorganizar layout em grid responsivo
   - Manter todos os dados e funcionalidades existentes

5. **Hook `useDashboardData`** -- sem alterações necessárias, já fornece todos os dados

### Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/components/dashboard/DashboardShortcuts.tsx` | Criar |
| `src/components/dashboard/DashboardDonutChart.tsx` | Criar |
| `src/pages/Dashboard.tsx` | Editar layout |

