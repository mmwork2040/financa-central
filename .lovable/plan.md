

## Plano: Redesign Visual Completo — Green Emphasis Design System

Migrar todo o sistema do design system atual (Orange Emphasis) para o novo **Green Emphasis Light Premium**, aplicando glassmorphism, novas cores, bordas arredondadas pill, e melhor contraste de texto em todas as páginas.

### Escopo das Mudanças

**1. CSS Variables e Fundo Global (`src/index.css`)**
- Trocar `--primary` de laranja para verde (`142 71% 45%` / `#22C55E`)
- Trocar `--ring` para verde
- Alterar `--sidebar-background` para glass branco (`0 0% 100% / 0.72`) com texto escuro
- Adicionar fundo global com gradientes radiais verde/azul/âmbar conforme design system
- Aumentar `--radius` para `0.75rem` (mais arredondado)
- Adicionar classes utilitárias: `.glass-card`, `.glass-surface` com backdrop-blur e bordas sutis
- Atualizar `.sidebar-link` para texto escuro com hover suave
- Atualizar dark mode mantendo verde como primary
- Adicionar `box-shadow` premium (inset + glow verde)

**2. Sidebar (`src/components/Sidebar.tsx`)**
- Mudar de fundo sólido laranja para glass branco (`bg-white/72 backdrop-blur-[14px]`)
- Texto de `sidebar-foreground` (branco) para texto escuro (`text-slate-700`)
- Links ativos: fundo `bg-slate-900/4` com borda sutil em vez de cor sólida
- Logo/header em estilo clean
- Botão toggle com fundo semi-transparente

**3. Dashboard (`src/pages/Dashboard.tsx`)**
- Cards de resumo com estilo glass (fundo semi-transparente, inset shadow, hover com elevação)
- Ícones dos cards com fundo verde suave em vez de cores variadas
- Banner de saúde financeira com glass effect
- Atalhos rápidos com estilo pill/glassmorphism

**4. DashboardShortcuts (`src/components/dashboard/DashboardShortcuts.tsx`)**
- Botões com fundo glass, borda sutil, hover com elevação `-2px`
- Ícone com fundo gradiente verde suave

**5. DashboardChart (`src/components/dashboard/DashboardChart.tsx`)**
- Card com estilo glass
- Tooltip com backdrop-blur e borda sutil

**6. DashboardDonutChart (`src/components/dashboard/DashboardDonutChart.tsx`)**
- Mesmo estilo glass no card

**7. SummaryCard (`src/components/dashboard/SummaryCard.tsx`)**
- Aplicar glass effect e hover elevação

**8. Lançamentos (`LancamentosHeader.tsx`, `LancamentosTable.tsx`, `LancamentosSummary.tsx`)**
- Botões primários com gradiente verde
- Cards e tabelas com estilo glass
- Ícone do header com fundo verde

**9. MobileBottomNav (`src/components/common/MobileBottomNav.tsx`)**
- Active state usa verde em vez de laranja

**10. PageHeader (`src/components/common/PageHeader.tsx`)**
- Ícone com fundo verde suave

**11. Card Component (`src/components/ui/card.tsx`)**
- Adicionar backdrop-blur sutil e inset shadow como padrão

**12. Button Component (`src/components/ui/button.tsx`)**
- Variante `default` com gradiente verde e shadow glow
- Pill border-radius nos botões

**13. Input Component (`src/components/ui/input.tsx`)**
- Pill border-radius, fundo `bg-slate-900/4`, inset shadow

**14. useCompanyTheme (`src/hooks/useCompanyTheme.ts`)**
- Mudar `SYSTEM_PRIMARY_COLOR` de `#f97316` para `#22C55E`
- Atualizar `applyHex` para também setar sidebar como glass (não mudar sidebar bg para cor primária)

**15. Auth pages (LoginForm, RegisterForm, AuthContainer)**
- Botão primário verde
- Estilo glass nos cards de formulário

### Arquivos a Editar

| Arquivo | Tipo |
|---------|------|
| `src/index.css` | Editar (tokens, classes globais) |
| `src/components/ui/card.tsx` | Editar (glass effect) |
| `src/components/ui/button.tsx` | Editar (pill radius, green gradient) |
| `src/components/ui/input.tsx` | Editar (pill radius) |
| `src/components/Sidebar.tsx` | Editar (glass sidebar, texto escuro) |
| `src/pages/Dashboard.tsx` | Editar (glass cards) |
| `src/components/dashboard/DashboardShortcuts.tsx` | Editar (glass buttons) |
| `src/components/dashboard/DashboardChart.tsx` | Editar (glass tooltip) |
| `src/components/dashboard/DashboardDonutChart.tsx` | Editar (glass card) |
| `src/components/dashboard/SummaryCard.tsx` | Editar (glass effect) |
| `src/components/lancamentos/LancamentosHeader.tsx` | Editar (green icon) |
| `src/components/common/PageHeader.tsx` | Editar (green icon bg) |
| `src/components/common/MobileBottomNav.tsx` | Ajuste menor (cor ativa) |
| `src/hooks/useCompanyTheme.ts` | Editar (default green, glass sidebar) |
| `tailwind.config.ts` | Editar (extended colors, radius) |

### Princípios de Contraste
- Texto sobre glass branco: `text-slate-900` para títulos, `text-slate-600` para corpo
- Texto sobre fundo verde: `text-slate-900/92` (escuro sobre verde claro, alto contraste)
- Muted text: `text-slate-500`
- Sidebar: texto escuro sobre glass branco (invertendo o padrão atual)

