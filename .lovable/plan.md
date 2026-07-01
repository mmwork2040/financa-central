## Diagnóstico

Investiguei o banco e o código:

- **Parceladas**: só existem 2 lançamentos com `total_parcelas>1` em 438 registros, ambos sem `parcela_atual` e sem `recorrencia_grupo_id`. A criação em bulk no client (`LancamentosContext.handleSave`) não valida se todas as N parcelas foram realmente inseridas, e não há redundância server-side.
- **Recorrentes**: havia duplicatas (mesmo grupo, mesma data). Já limpei os 3 duplicados que existiam. Não existe índice único impedindo novas duplicatas.
- **Relatórios**: `useRelatoriosData` já calcula `receitasPrevistas`/`despesasPrevistas` a partir de status `pendente`/`vencido`. Não aparecem porque as ocorrências futuras não existem no banco.
- **Virada do mês**: como `status='pendente'` e a listagem já os trata como "a pagar/receber", basta garantir que os registros existam.

## Plano de correção

### 1. Banco (arquivo SQL para aplicar via console)

Como não tenho a ferramenta de migração ativa, vou gerar `db_migrations/fix_recorrencias_parcelas.sql`:

- Índice **único parcial**: `UNIQUE (empresa_id, recorrencia_grupo_id, data_vencimento) WHERE recorrencia_grupo_id IS NOT NULL` — bloqueia duplicatas em qualquer cadeia.
- Função `public.backfill_series(_empresa_id uuid)` (SECURITY DEFINER) que:
  - Para cada grupo recorrente aberto, preenche meses faltantes até 12 meses adiante (respeitando `recorrencia_fim`).
  - Para cada grupo parcelado incompleto, preenche as parcelas restantes até `total_parcelas`, dividindo o valor original se necessário.
- Trigger `after_insert_lancamento_series` que dispara `backfill_series` sempre que um lançamento novo tem `recorrente=true` ou `total_parcelas>1` — redundância caso o client falhe.
- pg_cron diário 06:00 BRT executando `backfill_series` para todas as empresas.

### 2. Edge function `generate-recurring` (reescrita)

- Passa a tratar **parceladas incompletas** também (hoje só cuida de recorrentes).
- Aceita `{ empresa_id }` no body para uso pelo cron/backfill.
- Grava com upsert idempotente (aproveitando o novo índice único quando aplicado).
- Corrige loop para incrementar `currentDate` antes do `continue` (evita ficar preso em datas já existentes).

### 3. Frontend `src/contexts/LancamentosContext.tsx`

- No fluxo **parcelado**: após `.insert(parcelas)`, valida se `data.length === totalParcelas`. Se falhar parcialmente, dispara `generate-recurring` como fallback e mostra erro detalhado com `console.error` do payload que falhou.
- No fluxo **recorrente**: mantém invocação de `generate-recurring` (já existe) e verifica retorno.
- Substitui `toast.success` genérico por mensagens que reflitam quantos registros foram criados (ex.: "8 parcelas de R$ 125,00 criadas").

### 4. Limpeza retroativa (via data-tool)

- Já removi duplicatas de grupos existentes (concluído).
- Backfill dos 2 parcelados órfãos (`Automações` 8x e `Black Friday Infinita` 5x): atribui `recorrencia_grupo_id`, define `parcela_atual=1`, divide o valor e cria as parcelas 2..N.
- Backfill dos grupos recorrentes de todas as empresas — invocar `generate-recurring` por empresa após o deploy.

### 5. Verificação

- Após aplicar: consultar `lancamentos` do grupo `Automações` deve mostrar 8 registros com datas mensais consecutivas.
- Abrir Relatórios com filtro "Próximos 3 meses" e confirmar que "Despesas previstas" reflete os pendentes futuros.
- Simular virada do mês: registros `pendente` do mês atual já aparecem em "Contas a pagar".

### Detalhes técnicos

```text
Estrutura da série
  recorrente=true,  total_parcelas=null  → aberta (janela rolante de 12 meses)
  recorrente=false, total_parcelas=N     → fechada (exatamente N registros)
  Ambas agrupadas por recorrencia_grupo_id
```

Índice único (SQL):
```sql
CREATE UNIQUE INDEX idx_lanc_grupo_data
  ON lancamentos(empresa_id, recorrencia_grupo_id, data_vencimento)
  WHERE recorrencia_grupo_id IS NOT NULL;
```

### Arquivos a modificar

- `supabase/functions/generate-recurring/index.ts` — reescrita completa.
- `src/contexts/LancamentosContext.tsx` — validação do bulk insert e fallback.
- `db_migrations/fix_recorrencias_parcelas.sql` — novo, para aplicação manual (índice, função, trigger, cron).

### Após aprovação

Executo tudo em uma única passagem, deploy da edge function, backfill via chamada por empresa e reporto o resultado.
