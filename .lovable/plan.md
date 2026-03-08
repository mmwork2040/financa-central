

## Problem

The **Projetos** page (`src/pages/Projetos.tsx`) and **ProjetoDetalhe** page (`src/pages/ProjetoDetalhe.tsx`) use `useValuesVisibility()` but are **not wrapped** in a `ValuesVisibilityProvider`. This means the `toggle` function is the default no-op `() => {}`, so clicking the eye button does nothing.

Every other page that uses this feature (Dashboard, Lançamentos, Contas Bancárias, Relatórios) wraps its content in `ValuesVisibilityProvider`.

## Fix

**1. `src/pages/Projetos.tsx`** — Wrap the page content in `ValuesVisibilityProvider`, following the same pattern used in `ContasBancarias.tsx`:
- Extract current component body into a `ProjetosContent` inner component
- Wrap it with `<ValuesVisibilityProvider>` in the default export

**2. `src/pages/ProjetoDetalhe.tsx`** — Same fix:
- Extract into `ProjetoDetalheContent`
- Wrap with `<ValuesVisibilityProvider>`

No database or other file changes needed. Two files, minimal edits.

