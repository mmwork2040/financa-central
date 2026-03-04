

## Plano: Integrar vendas digitais nos relatórios e refletir dados em tempo real

### Problema atual

O hook `useRelatoriosData` consulta **apenas** a tabela `lancamentos`. As vendas digitais (`vendas_digitais`) que representam receitas de plataformas (Hotmart, Kiwify, etc.) nao sao consideradas nos relatórios. Alem disso, os relatórios nao distinguem entre receitas confirmadas e receitas previstas.

### Solucao

**1. `src/hooks/useRelatoriosData.tsx`** -- Incluir vendas digitais como receitas:

- Apos buscar `lancamentos`, tambem buscar `vendas_digitais` no mesmo periodo (filtro por `data_venda`)
- Vendas com status `recebido` contam como receita executada
- Vendas com status `aprovada` ou `pendente` contam como receita prevista
- Agrupar vendas por plataforma como categoria (ex: "Hotmart", "Kiwify")
- Mesclar nos dados de `dataReceitas`, `dataFluxo` e `topReceitas`
- Adicionar estados `receitasExecutadas` e `receitasPrevistas` ao retorno do hook para uso no ResumoFinanceiro

**2. `src/components/relatorios/ResumoFinanceiro.tsx`** -- Expandir para mostrar receitas executadas vs previstas:

- Receber props adicionais: `receitasExecutadas`, `receitasPrevistas`, `despesasExecutadas`, `despesasPrevistas`
- Exibir as 4 linhas detalhadas (executadas + previstas) alem dos totais
- Badge visual para "Previsto" em amarelo

**3. `src/pages/Relatorios.tsx`** -- Passar os novos dados para o ResumoFinanceiro

**4. `src/components/relatorios/FluxoCaixaChart.tsx`** -- Adicionar barras para receitas previstas vs executadas (opcional, se complexidade permitir, senao manter receitas totais)

### Regras de negocio

- Vendas digitais com `status = 'recebido'` -> receita confirmada do mes
- Vendas digitais com `status != 'recebido'` (aprovada, pendente) -> receita prevista
- Lancamentos com `status = 'pago'` ou `'recebido'` -> executado
- Lancamentos com `status = 'pendente'` -> previsto
- Evitar duplicidade: vendas digitais que ja possuem `lancamento_id` nao devem ser contadas duas vezes (o lancamento vinculado ja esta na tabela lancamentos)

### Arquivos afetados
- `src/hooks/useRelatoriosData.tsx`
- `src/components/relatorios/ResumoFinanceiro.tsx`
- `src/pages/Relatorios.tsx`

