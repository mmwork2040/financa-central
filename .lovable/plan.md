

## Plano: Separar Recorrente e Parcelado como conceitos distintos

### Problema Atual

O formulário mistura os conceitos: "Parcelas" só aparece quando "Recorrente" está ativo. Na prática:
- **Recorrente** = valor integral repetido a cada mês (ex: aluguel R$1.000 todo mês)
- **Parcelado** = valor total dividido em N parcelas nos próximos meses (ex: compra de R$1.200 em 12x = R$100/mês)

Atualmente o `handleSave` já divide o valor quando há `total_parcelas`, mas a UX não deixa claro que são conceitos diferentes e mutuamente exclusivos.

### Solução

**1. Formulário (`LancamentosFormDialog.tsx`)** — Substituir o toggle de recorrência + campo de parcelas por um seletor de modo:

- Opção "Único" (padrão): lançamento avulso, sem repetição
- Opção "Recorrente": mostra frequência (semanal/mensal/etc) e data fim opcional. Valor integral duplicado
- Opção "Parcelado": mostra campo de número de parcelas. Valor total é dividido automaticamente

O campo de parcelas NÃO aparece mais dentro de recorrente. São mutuamente exclusivos.

**2. Componente `RecorrenciaToggle.tsx`** — Refatorar para `LancamentoModoSelect`:

- Radio group com 3 opções: Único / Recorrente / Parcelado
- Quando "Recorrente": exibe frequência + data fim (como hoje)
- Quando "Parcelado": exibe campo de total de parcelas + preview do valor por parcela
- Seta `recorrente=true` para ambos os modos, mas `total_parcelas` só é preenchido no modo Parcelado

**3. `handleSave` em `LancamentosContext.tsx`** — Ajustar lógica de criação:

- **Modo Recorrente** (`recorrente=true`, `total_parcelas=null`): insere o primeiro lançamento com valor integral. A edge function `generate-recurring` cria os próximos meses automaticamente (já funciona assim)
- **Modo Parcelado** (`recorrente=false`, `total_parcelas > 1`): divide o valor total pelo número de parcelas, insere todas as parcelas de uma vez com `parcela_atual` e `descricao` com sufixo `(1/N)`. Cada parcela é um registro independente com `recorrente=false`

**4. Confirmação no Dialog** — Mostrar preview claro:

- Para recorrente: "R$1.000,00/mês — repete mensalmente"
- Para parcelado: "R$1.200,00 total → 12x de R$100,00"

### Arquivos afetados
- `src/components/lancamentos/form/RecorrenciaToggle.tsx` → refatorar para seletor de modo com 3 opções
- `src/components/lancamentos/LancamentosFormDialog.tsx` → adaptar para novo componente de modo
- `src/contexts/LancamentosContext.tsx` → ajustar `handleSave` para separar lógica recorrente vs parcelado
- `src/components/lancamentos/form/ParcelasInput.tsx` → mover para dentro do novo componente de modo

