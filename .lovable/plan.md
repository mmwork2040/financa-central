

## Redesign Completo — Aurora Design System (Cyan Edition)

O design system enviado é o **Aurora — Cyan Edition**, com estética dark-first baseada em glassmorphism, gradientes cyan→indigo→violet, fonte Plus Jakarta Sans, e superfícies com blur/transparência. Vou adaptar para light + dark mode mantendo toda a identidade visual.

---

### Paleta de cores (Aurora adaptada)

**Dark mode** (fiel ao design system):
- Primary: `#06B6D4` (cyan)
- Background: `#050D14` / Cards: `rgba(255,255,255,0.04)`
- Borders: `rgba(255,255,255,0.07)`
- Text: `#F0FDFF` / Secondary: `rgba(224,242,254,0.65)`
- Sidebar: glass escuro com backdrop-blur

**Light mode** (derivado):
- Primary: `#0891B2` (cyan-700 para contraste)
- Background: `#F8FAFC` / Cards: `#FFFFFF`
- Borders: `#E2E8F0`
- Text: `#0F172A` / Secondary: `#64748B`
- Sidebar: glass branco com backdrop-blur

---

### Arquivos a alterar

1. **`src/index.css`** — Reescrever todas as CSS variables (`:root` e `.dark`) com a paleta Aurora. Adicionar background com blobs animados (gradientes cyan/indigo/violet). Atualizar classes utilitárias (cards, sidebar-link, etc.).

2. **`tailwind.config.ts`** — Atualizar cores extended (cyan como primary), adicionar font-family Plus Jakarta Sans, novos keyframes (blobFloat, glowPulse, fadeSlideUp/Down), border-radius tokens maiores.

3. **`index.html`** — Adicionar link do Google Fonts para Plus Jakarta Sans.

4. **`src/components/Sidebar.tsx`** — Converter sidebar para glass panel (backdrop-blur-xl, bg semi-transparente), texto adaptado ao tema, gradiente no logo, hover states com glow sutil.

5. **`src/layouts/AppLayout.tsx`** — Adicionar background animado (aurora blobs) atrás do conteúdo principal.

6. **`src/pages/Dashboard.tsx`** — Cards com glass effect, gradient borders on hover, ícones com glow, valores com gradient-text para destaques.

7. **`src/components/dashboard/SummaryCard.tsx`** — Aplicar glass card style, hover com translateY(-4px) e shadow glow.

8. **`src/components/common/PageHeader.tsx`** — Título com gradient-text (cyan→indigo), ícone com glow background.

9. **`src/components/ui/button.tsx`** — Variante primary com gradient (cyan→indigo), shadow glow, hover translateY(-2px). Secondary com border glass. Pill shape (rounded-full).

10. **`src/components/ui/card.tsx`** — Glass surface default, border sutil, hover com lift + glow. `::before` pseudo-element com gradient line no topo.

11. **`src/components/ui/input.tsx`** — Focus com border cyan + box-shadow glow rgba(6,182,212,0.18).

12. **`src/components/ui/badge.tsx`** — Pill shape, semantic colors com alpha backgrounds (como no design system: success, warning, error com transparência).

13. **`src/components/common/MobileBottomNav.tsx`** — Glass bar com backdrop-blur.

14. **`src/pages/LandingPage.tsx`** — Hero com animated blobs, gradient text, botões Aurora.

15. **`src/components/auth/LoginForm.tsx` / `RegisterForm.tsx`** — Glass card centralizado sobre fundo Aurora.

---

### Detalhes técnicos

- **Fonte**: Plus Jakarta Sans (weights 400-800) via Google Fonts
- **Glass effect**: `bg-white/[0.04] dark:bg-white/[0.04] bg-white/80 backdrop-blur-xl border border-white/[0.07]`
- **Gradient primary**: `bg-gradient-to-br from-cyan-500 to-indigo-500`
- **Glow shadows**: `shadow-[0_0_40px_rgba(6,182,212,0.35)]`
- **Animated blobs**: 3 divs posicionados fixed com radial-gradient, blur(80px), opacity 0.25, animation float
- **Dark mode toggle**: mantido via `next-themes`, apenas troca variáveis CSS
- **Pill buttons**: `rounded-full` em todos os botões e badges
- **Cards hover**: `hover:-translate-y-1 hover:shadow-lg transition-all`

Estimativa: ~15 arquivos editados, mudança puramente visual sem impacto funcional.

