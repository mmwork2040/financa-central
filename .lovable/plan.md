

## Plano: Contabilizar apenas a comissão recebida nas vendas de integrações

### Problema Atual

O `webhook-receiver` trata o **valor bruto** (`price.value`) como a receita principal e subtrai a taxa da plataforma. Isso está incorreto para afiliados/co-produtores — o sistema deveria contabilizar apenas o **valor que o usuário efetivamente recebe** (sua comissão), não o valor total da venda.

Exemplo Hotmart:
- Venda de R$ 297,00 → Comissão do afiliado: R$ 89,10
- Atualmente registra R$ 297,00 como receita
- Deveria registrar R$ 89,10 como receita contábil

### Mudanças Necessárias

#### 1. Banco de Dados — Nova coluna na `vendas_digitais`

Adicionar campo `valor_comissao` (numeric, default 0) para armazenar o valor que o usuário efetivamente recebe (comissão). O campo `valor_bruto` continua armazenando o valor total da venda para referência.

#### 2. Edge Function `webhook-receiver` — Ajustar parsers

Atualizar cada parser de plataforma para extrair corretamente o valor de comissão do usuário:

- **Hotmart**: Usar `purchase.commission.value` como o valor recebido pelo usuário (comissão). Se `commission_as === "PRODUCER"`, valor recebido = `price - fee`. Se `AFFILIATE`, valor recebido = `commission.value`.
- **Kiwify**: Usar `commission.commission_amount` como comissão do usuário quando disponível.
- **Eduzz**: Usar `trans_value` ou `sale_amount_win` como valor recebido (já é o líquido do usuário).
- **Monetizze**: Usar `comissao` como valor recebido pelo afiliado.
- **Hubla**: Lógica similar baseada nos campos de comissão.

Adicionar campo `valor_comissao` ao `SaleData` interface.

O **lançamento financeiro** criado automaticamente passará a usar `valor_comissao` (ou `valor_liquido` se comissão = 0) em vez do `valor_liquido` antigo.

#### 3. Frontend — Exibir comissão na tela de Vendas

Mostrar o campo `valor_comissao` na tabela de vendas digitais e no formulário, diferenciando "Valor da Venda" (bruto) de "Minha Comissão" (o que de fato entra no caixa).

#### 4. Lógica contábil

- O lançamento criado pelo webhook usará `valor_comissao` como valor
- A reconciliação e relatórios usarão o valor da comissão
- O `

_to` da venda no banco continua com o `valor_liquido` original para histórico

### Arquivos Impactados

| Arquivo | Alteração |
|---|---|
| Migration SQL | Adicionar coluna `valor_comissao` em `vendas_digitais` |
| `supabase/functions/webhook-receiver/index.ts` | Atualizar parsers e usar comissão no lançamento |
| `src/pages/VendasDigitais.tsx` | Exibir coluna "Minha Comissão" |
| `src/components/vendas/VendaFormDialog.tsx` | Campo de comissão no formulário manual |
| `src/integrations/supabase/types.ts` | Auto-atualizado |

