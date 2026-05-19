## Ajuste

Nos extratos/planilhas enviados pelos usuários, as receitas aparecem rotuladas como **"Entrada"/"Entradas"** e as despesas como **"Saída"/"Saídas"**. O prompt atual da IA (`supabase/functions/process-document-import/index.ts`) não cita esses termos, então classifica errado o `tipo_sugerido` nesses arquivos.

## Mudança

Arquivo único: `supabase/functions/process-document-import/index.ts` — acrescentar regra explícita ao `SYSTEM_PROMPT` na detecção de `tipo_sugerido`:

- "Entrada", "Entradas", "ENTRADA", coluna "Entrada", "Crédito", "Recebimento" → **receita**
- "Saída", "Saídas", "SAÍDA", coluna "Saída", "Débito", "Pagamento" → **despesa**
- Em planilhas com colunas separadas "Entrada" e "Saída", o tipo é definido pela coluna onde o valor está preenchido (ignorar sinal +/-)
- Esses rótulos têm prioridade sobre heurísticas de descrição quando presentes

Sem mudanças em schema, frontend ou outras funções. Edge function é redeployada automaticamente.

## Verificação

Importar uma planilha/extrato com colunas "Entrada" e "Saída" e confirmar que itens da coluna Entrada vêm como `tipo_sugerido: "receita"` e os da Saída como `"despesa"`.
