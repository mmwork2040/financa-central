

## Plano: Remover personalização de cores e manter apenas Light/Dark mode

### Objetivo
Eliminar a possibilidade do usuário alterar a cor primária do sistema. A cor será sempre a do design system (#22C55E verde). Apenas alternância Light/Dark mode será permitida.

### Alterações

**1. `src/hooks/useCompanyTheme.ts`** — Simplificar drasticamente
- Remover toda a lógica de buscar `cor_primaria` do banco e aplicar dinamicamente
- O hook retorna `themeReady: true` imediatamente (sem fetch)
- As cores CSS padrão definidas em `index.css` serão usadas sem override

**2. `src/pages/ConfiguracoesEmpresa.tsx`** — Remover seção de cor
- Remover o bloco inteiro de "Cor Primária" (linhas 286-303): color picker, input hex, preview, botões Desfazer/Confirmar
- Remover states relacionados: `originalColor`, `colorChanged`
- Remover funções: `handleColorChange`, `handleUndoColor`, `handleConfirmColor`
- Remover `cor_primaria` do `handleSave` (não enviar mais para o banco)
- Remover import `Undo2`, `Check` se não usados em outro lugar

**3. `src/index.css`** — Já está correto
- As variáveis CSS de light e dark mode já definem `--primary: 142 71% 45%` (verde #22C55E). Nenhuma alteração necessária.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useCompanyTheme.ts` | Simplificar: retornar `true` sem fetch/apply |
| `src/pages/ConfiguracoesEmpresa.tsx` | Remover seção de cor primária e lógica associada |

