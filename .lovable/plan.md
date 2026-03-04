

## Diagnóstico

Dois problemas principais foram identificados:

### 1. Valores errados (Hotmart)
O parser do Hotmart no `webhook-receiver` divide os valores por 100 (`/ 100`), assumindo que a Hotmart envia valores em centavos. Porém, a Hotmart envia os valores **ja em reais**. Exemplo: "Comunidade - O Segredo do viajante" deveria ser R$1.293,57 mas foi registrada como R$12,94 (1293.57 / 100).

Linha problemática:
```
valor_bruto: Number(purchase?.price?.value || ...) / 100
```

### 2. Lançamentos entrando como "pago" em vez de "pendente"
Apesar de `dias_recebimento = 30` estar configurado na integração, os lançamentos existentes estão todos com `status: pago` e `data_pagamento` preenchida. Isso indica que no momento do registro, a lógica de crédito de 30 dias não estava ativa ou havia um bug. Além disso, o usuário quer que as vendas **nunca** sejam convertidas automaticamente para "recebido" -- somente quando ele manualmente marcar.

---

## Plano de Implementação

### Etapa 1 -- Corrigir parser Hotmart (webhook-receiver)
- Remover a divisão por 100 no `parseHotmart` para `valor_bruto`, `taxa` e `valor_liquido`
- A Hotmart ja envia valores em reais no campo `price.value`

### Etapa 2 -- Garantir que vendas aprovadas entrem como "pendente"
- No `webhook-receiver`, confirmar que vendas aprovadas com `diasRecebimento > 0` criam lançamentos com `status: "pendente"`, `data_pagamento: null`, e `data_vencimento` = data_venda + diasRecebimento
- Remover a lógica de conversão automática da Edge Function `process-digital-receipts`, ja que o usuário quer controle manual

### Etapa 3 -- Corrigir dados existentes no banco
- Atualizar os valores das vendas digitais e lançamentos existentes que vieram do Hotmart (multiplicar por 100 para restaurar o valor correto)
- Alterar status dos lançamentos de integração de "pago" para "pendente" e limpar `data_pagamento`, ja que devem ser receitas futuras

### Etapa 4 -- Remover auto-conversão (process-digital-receipts)
- Alterar a Edge Function `process-digital-receipts` para que **não** converta automaticamente lançamentos pendentes para recebido. O usuário controlará isso manualmente pela tela de lançamentos

### Arquivos afetados
- `supabase/functions/webhook-receiver/index.ts` (fix Hotmart parser + garantir pendente)
- `supabase/functions/process-digital-receipts/index.ts` (remover auto-conversão)
- Dados no banco (correção via queries de atualização)

