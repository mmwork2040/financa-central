

## Plan: Sincronizar cores de receitas (verde) e despesas (vermelho) na aba de Lançamentos

### Locais a alterar

**1. `src/components/lancamentos/LancamentosTable.tsx`**
- **Linha 187 (mobile)** e **linha 356 (desktop)**: O valor de receitas usa `text-primary` (laranja). Trocar para `text-green-600`.
- Investimentos podem manter `text-blue-600`.

**2. `src/components/lancamentos/LancamentosSummary.tsx`**
- **Linha 41**: "Receitas Executadas" usa `iconColor="text-primary"`. Trocar para `"text-green-600"`.
- Receitas Previstas (linha 57) usa `text-amber-500` — manter ou trocar para `text-green-500` para consistência visual com receitas.

**3. `src/contexts/LancamentosContext.tsx`**
- A função `getTipoBadgeClass` já retorna `bg-green-100 text-green-800` para receitas — OK.
- Verificar `getStatusBadgeClass` para garantir consistência (status "recebido" deve usar verde).

**4. `src/components/lancamentos/LancamentosTable.tsx` linha 365**
- O badge "✓ Executado" usa `bg-primary/10 text-primary`. Trocar para `bg-green-100 text-green-700` para receitas ou manter genérico.

### Resumo das mudanças

| Arquivo | O que muda |
|---|---|
| `LancamentosTable.tsx` | Valor de receita: `text-primary` → `text-green-600` (2 locais) |
| `LancamentosSummary.tsx` | iconColor de "Receitas Executadas": `text-primary` → `text-green-600` |

Alterações pontuais em 2 arquivos, sem mudança de lógica.

