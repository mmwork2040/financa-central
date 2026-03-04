

## Plano: Tornar CurrencyInput editável livremente (copiar/colar/editar)

### Problema
O `CurrencyInput` atual usa uma abordagem baseada em centavos que intercepta cada tecla individualmente. Isso impede copiar/colar, selecionar texto, e edição livre do cursor. O usuário fica "preso" num modo rígido de digitação.

### Solução
Reescrever o `CurrencyInput` para usar uma abordagem de texto livre com formatação on-blur:
- **Digitação livre**: o usuário digita normalmente, pode colar valores, mover o cursor
- **On blur**: ao sair do campo, o valor é parseado e formatado como `R$ 1.234,56`
- **On focus**: mostra o valor numérico limpo para facilitar edição (ex: `1234.56` ou `1234,56`)
- **Copiar/colar**: funciona naturalmente pois o input não intercepta teclas

### Mudança

**`src/components/ui/currency-input.tsx`** — Reescrever o componente:
- Estado interno como string de texto livre
- `onFocus`: mostra valor numérico sem formatação (apenas número com vírgula decimal)
- `onChange`: aceita qualquer input, sem restrição
- `onBlur`: parseia o texto (aceita `.` ou `,` como decimal, remove caracteres não numéricos), formata como BRL, e emite `onValueChange` com o valor em centavos (mantendo compatibilidade com consumidores)
- Sync com prop `value` via `useEffect`
- Manter a mesma interface `CurrencyInputProps` para não quebrar nenhum consumidor

### Arquivos afetados
- `src/components/ui/currency-input.tsx` — reescrita do componente (sem alterar a interface)

Nenhum outro arquivo precisa mudar pois a interface `onValueChange(cents: string)` será mantida.

