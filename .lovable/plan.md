

## Plano: Corrigir bug de data off-by-one no DatePicker

### Causa Raiz

O bug ocorre por conversão de fuso horário. Duas origens:

1. **Ao salvar**: `date.toISOString().split('T')[0]` converte para UTC. No Brasil (UTC-3), selecionar dia 03 às 00:00 local vira dia 02 em UTC.
2. **Ao exibir**: `new Date("2025-03-03")` interpreta como UTC meia-noite, que no Brasil vira dia 02 às 21h — o calendário destaca o dia errado.

### Correção

**`src/components/lancamentos/LancamentosFormDialog.tsx`** — linha 83:
- Trocar `date.toISOString().split('T')[0]` por formatação local:
  ```ts
  const isoDate = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  ```

**`src/components/lancamentos/form/DatePickerField.tsx`** — linhas 31 e 37:
- Trocar `new Date(value)` por parse local que evita offset UTC:
  ```ts
  // "2025-03-03" → new Date(2025, 2, 3) em horário local
  const parseLocalDate = (v: string) => {
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  ```

**`src/components/ui/calendar.tsx`** — adicionar `pointer-events-auto` na className do DayPicker (recomendação Shadcn para funcionar dentro de dialogs/popovers).

### Arquivos afetados
- `src/components/lancamentos/LancamentosFormDialog.tsx`
- `src/components/lancamentos/form/DatePickerField.tsx`
- `src/components/ui/calendar.tsx`

