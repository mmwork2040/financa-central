## Problema identificado

A Hotmart envia webhooks separados quando um reembolso ocorre (eventos `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_PROTEST`). Ao analisar o `webhook-receiver` e os dados da empresa **OSV LTDA** (`67abcbf5-...`), encontrei três falhas que fazem reembolsos serem ignorados:

### Falha 1 — Dedupe engole o reembolso
O bloco de dedupe compara (`plataforma`, `valor_liquido`, `data_venda`, `produto`, `cliente`). Quando o webhook de reembolso chega, ele bate com a venda aprovada original (mesmo cliente/produto/valor) e retorna `duplicate: true` **sem aplicar o estorno**. Resultado: nenhum lançamento de despesa de reembolso é criado e o saldo não é revertido.

### Falha 2 — Status lido do campo errado
`parseHotmart` lê apenas `purchase.status`. Em webhooks de reembolso a Hotmart marca o evento via `data.event` / `body.event` (ex.: `PURCHASE_REFUNDED`), e `purchase.status` pode permanecer ausente ou inconsistente, caindo no fallback `"approved"` → `"aprovada"`. Ou seja, mesmo sem dedupe, um reembolso poderia ser registrado como nova venda aprovada.

### Falha 3 — Sem rastreio por transação
Não armazenamos `transaction_id` da Hotmart. Sem essa chave não há como casar o evento de reembolso com a venda original; toda a reconciliação depende de heurística frágil.

### Evidência
- 2 vendas iguais de Roberto Lopes (R$ 1.097 e R$ 1.197) e 2 de Rosana Chaves continuam com `status='aprovada'` em `vendas_digitais` para a OSV LTDA.
- `logs_integracoes` para Hotmart/OSV: 0 registros — não há log dos webhooks de reembolso (provavelmente `logs_enabled=false` ou os webhooks de reembolso nunca chegaram a ser processados como esperado).

---

## Plano de correção

### 1. Adicionar coluna `transaction_id` em `vendas_digitais`
Migration: nova coluna `transaction_id text` + índice único `(empresa_id, plataforma, transaction_id)` quando não nulo. Permite reconciliar reembolsos com a venda original.

### 2. Reescrever `parseHotmart` (e demais parsers) para priorizar o evento
Mapeamento explícito por `event`:
- `PURCHASE_APPROVED` / `PURCHASE_COMPLETE` → `aprovada`
- `PURCHASE_REFUNDED` → `reembolsada`
- `PURCHASE_CHARGEBACK` → `chargeback`
- `PURCHASE_PROTEST` → `disputa`
- `PURCHASE_CANCELED` → `cancelada`
- `PURCHASE_EXPIRED` → `expirada`
- `PURCHASE_DELAYED` / `PURCHASE_BILLET_PRINTED` → `pendente`

Capturar `transaction_id` de `purchase.transaction` (e equivalente nas demais plataformas: Eduzz `trans_cod`, Kiwify `order_id`, Hubla `id`, Monetizze `venda.codigo`).

### 3. Reformular fluxo no `webhook-receiver`
Pseudo-código:

```text
parse → saleData (com transaction_id e status normalizado)

se transaction_id existir:
  buscar venda por (empresa_id, plataforma, transaction_id)
senão:
  fallback heurístico atual (data+valor+produto+cliente)

se venda encontrada:
  se status novo == status atual → log "duplicate" e sai
  se status novo é estorno (reembolsada/chargeback/cancelada-após-aprovada):
    - atualizar vendas_digitais.status
    - criar lançamento de DESPESA "REEMBOLSO"/"CHARGEBACK" com data_pagamento=hoje
    - reverter saldo da conta bancária (se a venda original já foi recebida)
    - se houver lançamento original ainda pendente, cancelá-lo
senão (venda nova):
  inserir vendas_digitais
  se aprovada → criar lançamento de receita (lógica atual mantida)
  se já vier reembolsada/chargeback (raro) → registrar como estorno direto
```

### 4. Garantir logging
Forçar `logs_integracoes.insert` para **todo** evento de reembolso/chargeback independentemente de `logs_enabled` — eventos críticos sempre logados (com flag `evento_critico=true`). Isso evita perder rastro de estornos.

### 5. Janela de 30 dias e job de reconciliação
Criar edge function `reconcile-hotmart-refunds` (executada via `pg_cron` 1x/dia) que:
- Para cada venda Hotmart aprovada nos últimos 35 dias, consulta a API Hotmart (`/payments/api/v1/sales/history`) usando o token configurado em `integracoes`
- Se a venda aparecer como `REFUNDED`/`CHARGEBACK` na API mas continuar `aprovada` no banco → aplica o estorno automaticamente
- Cobre o caso de webhook perdido / falha de rede dentro da janela de 30 dias da Hotmart

### 6. UI (Vendas Digitais)
- Mostrar badge laranja "Reembolsada" / vermelho "Chargeback" no status
- Ação manual "Marcar como reembolsada" para casos extremos (com confirmação)
- Botão "Reconciliar agora" (admin) chamando a função do passo 5

### 7. Backfill das 4 vendas afetadas da OSV LTDA
Após deploy, rodar a função de reconciliação manualmente para o período de abril/2026 da OSV LTDA, ou disponibilizar o botão "Marcar como reembolsada" para o admin corrigir manualmente os 4 registros (Roberto x2, Rosana x2), gerando os lançamentos de estorno e revertendo saldo.

---

## Arquivos afetados
- `supabase/functions/webhook-receiver/index.ts` (parsers + fluxo de matching/estorno)
- `supabase/functions/reconcile-hotmart-refunds/index.ts` (novo)
- Migration: coluna `transaction_id` + índice único parcial
- `src/pages/VendasDigitais.tsx` + `src/components/vendas/...` (badges + ação manual + botão reconciliar)
- `supabase/config.toml` (cron schedule)
