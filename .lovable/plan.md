

## Plano: Integrar vendas manuais com lançamentos financeiros

### Contexto
Atualmente, ao registrar uma venda manual na página "Vendas", apenas um registro em `vendas_digitais` é criado. Não é gerado um lançamento financeiro correspondente em `lancamentos`. O webhook já faz isso para vendas de plataformas. A página de Vendas serve como ambiente de visualização e exportação contábil com dados detalhados do cliente.

### O que será feito

**1. Criar lançamento automaticamente ao registrar venda manual**
No `VendaFormDialog.tsx`, após inserir o registro em `vendas_digitais`, inserir também um registro em `lancamentos` com:
- `tipo`: "receita"
- `descricao`: "Venda - {produto}"
- `valor`: valor_liquido
- `data_vencimento`: data da venda
- `status`: mapeado do status da venda (aprovada → "recebido", pendente → "pendente")
- `empresa_id`, `cliente_id`: herdados da venda
- `origem`: "venda"

**2. Ao editar venda manual, atualizar o lançamento vinculado**
Adicionar campo `lancamento_id` na tabela `vendas_digitais` (nullable) para vincular venda ao lançamento correspondente. Na edição, atualizar o lançamento associado.

**3. Schema: adicionar coluna `lancamento_id`**
Migration: `ALTER TABLE vendas_digitais ADD COLUMN lancamento_id uuid REFERENCES lancamentos(id) ON DELETE SET NULL;`

### Arquivos afetados
- **Migration SQL**: adicionar `lancamento_id` em `vendas_digitais`
- `src/components/vendas/VendaFormDialog.tsx`: após salvar venda, criar/atualizar lançamento vinculado
- `supabase/functions/webhook-receiver/index.ts`: salvar `lancamento_id` no registro de venda (já cria lançamento, só precisa vincular)

### Detalhes técnicos
- O mapeamento de status: `aprovada` → `recebido`, `pendente` → `pendente`, `reembolsada/cancelada` → `cancelado`
- A categoria será opcional (o usuário pode classificar depois nos lançamentos)
- Conta bancária e forma de pagamento ficam opcionais para vendas manuais, diferente do fluxo obrigatório via n8n

