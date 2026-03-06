

## Plano: Resumo de Faturas por Cartão no Dashboard Pessoal

### O que será feito

Adicionar uma seção no Dashboard Pessoal que mostra, para cada cartão de crédito cadastrado, o total da fatura do mês selecionado (agrupando lançamentos por `cartao_credito_id` com `data_vencimento` dentro do mês).

### Alterações

**1. Novo componente `src/components/dashboard/ResumoFaturasCartoes.tsx`**

- Recebe o `monthStart` e `monthEnd` do `MonthFilterContext`
- Busca cartões de crédito ativos (`cartoes_credito` onde `ativo = true`)
- Busca lançamentos do mês que possuem `cartao_credito_id` não nulo
- Agrupa os lançamentos por cartão, calculando:
  - Total da fatura (soma dos valores)
  - Quantidade de lançamentos
  - Status (pago vs pendente)
- Exibe cada cartão como um mini-card com nome, bandeira, últimos dígitos, total da fatura e barra de progresso vs limite
- Respeita `maskValue` para ocultar valores
- Se não houver cartões cadastrados, não renderiza nada

**2. Editar `src/components/dashboard/DashboardPessoal.tsx`**

- Importar e inserir `<ResumoFaturasCartoes />` entre o bloco de Saldo/Investido e o gráfico de Receitas vs Despesas

### Sem alterações no banco
Os dados já existem nas tabelas `cartoes_credito` e `lancamentos` (coluna `cartao_credito_id`).

