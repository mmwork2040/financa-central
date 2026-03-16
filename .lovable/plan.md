

## Plano: Simplificar lógica Hotmart — valor recebido = valor bruto - taxa

### Contexto

O usuário quer que, independentemente do papel (produtor, afiliado, co-produtor), o sistema sempre trate o `valor_bruto` (price.value) como o valor da venda e subtraia a `taxa` (fee.value) da Hotmart. O resultado (`valor_bruto - taxa`) é o que o CNPJ cadastrado efetivamente recebe e deve ser contabilizado como receita.

### Mudança

**Arquivo**: `supabase/functions/webhook-receiver/index.ts` — função `parseHotmart`

Remover a lógica condicional de `commissionAs` (linhas 66-76) e simplificar para:

```typescript
const valorComissao = valorBruto - fee;
```

Isso elimina a verificação de `AFFILIATE` / `CO_PRODUCER` / `PRODUCER`. O campo `valor_comissao` sempre será `valor_bruto - taxa`, representando a receita líquida do CNPJ.

### Resumo

| Campo | Valor |
|---|---|
| `valor_bruto` | price.value (valor total da venda) |
| `taxa` | fee.value (taxa Hotmart) |
| `valor_liquido` | valor_bruto - taxa |
| `valor_comissao` | valor_bruto - taxa (= receita contábil) |

Apenas 1 arquivo alterado, 1 deploy da edge function.

