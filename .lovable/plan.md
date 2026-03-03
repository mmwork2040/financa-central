

## Plano: Caixa da Empresa no Dashboard/Relatórios + Receitas/Despesas Previstas vs Executadas em Lançamentos

### Conceito de "Caixa"

O **Caixa** é o saldo consolidado de todas as contas bancárias da empresa (`sum(saldo_atual)` da tabela `contas_bancarias`). Diferente do "saldo do mês" (receitas - despesas do mês), o caixa representa o dinheiro real disponível.

### 1. Dashboard — Novos Cards de Caixa

Adicionar 2 novos cards no grid de resumo do Dashboard:

- **Caixa Atual**: soma de `saldo_atual` de todas as `contas_bancarias`. Ícone `Landmark`, cor azul.
- **Caixa Previsto (Mês Seguinte)**: Caixa Atual + receitas pendentes do mês seguinte - despesas pendentes do mês seguinte. Ícone `TrendingUp`, cor verde/vermelho conforme positivo/negativo.
- **Meses de Caixa**: Caixa Atual / média mensal de despesas (últimos 3 meses pagos). Exibe "X meses" como indicador de runway. Ícone `Calendar`.

Esses dados serão calculados no `useDashboardData.tsx`, buscando `contas_bancarias` e lançamentos do mês seguinte.

### 2. Relatórios — Seção de Caixa

No `Relatorios.tsx`, adicionar uma nova aba **"Caixa"** com:
- Card de Caixa Atual (soma saldos bancários)
- Projeção de caixa mês a mês (gráfico de linha: caixa atual + receitas previstas - despesas previstas para os próximos 3 meses)
- Indicador de "Meses de Caixa" (runway)

### 3. Lançamentos — Previsto vs Executado

No `LancamentosSummary.tsx`, separar os totais em **Executado** (status pago/recebido) e **Previsto** (status pendente/aberto):

```text
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Receitas     │  │ Despesas     │  │ Receitas     │  │ Despesas     │
│ Executadas   │  │ Executadas   │  │ Previstas    │  │ Previstas    │
│ R$ X.XXX     │  │ R$ X.XXX     │  │ R$ X.XXX     │  │ R$ X.XXX     │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

Na `LancamentosTable`, adicionar um badge visual indicando se o lançamento já foi **Executado** (✓ verde) ou é **Previsto** (🕐 amarelo), baseado no status.

### Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useDashboardData.tsx` | Buscar `contas_bancarias`, calcular caixa atual, caixa previsto mês seguinte, meses de caixa |
| `src/pages/Dashboard.tsx` | Adicionar 3 cards de caixa no grid (Caixa Atual, Previsto, Meses de Caixa) |
| `src/components/lancamentos/LancamentosSummary.tsx` | Separar totais em Executado vs Previsto (6 cards) |
| `src/components/lancamentos/LancamentosTable.tsx` | Adicionar badge Executado/Previsto na coluna de status |
| `src/pages/Relatorios.tsx` | Adicionar aba "Caixa" com card + projeção |
| `src/components/relatorios/CaixaView.tsx` | **Criar** — componente da aba Caixa nos relatórios |

### Dados necessários (sem migração)

Todos os dados já existem:
- `contas_bancarias.saldo_atual` — caixa real
- `lancamentos` com filtro por mês seguinte e status pendente — previsões
- `lancamentos` dos últimos 3 meses com status pago — média de despesas para calcular runway

