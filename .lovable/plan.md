

# Plano: Aplicar Design System Aurora (Cyan Edition) em todo o sistema

## Resumo

Migrar o sistema inteiro do tema "Orange Emphasis Light Premium" (#f97316) para o Design System Aurora com paleta Cyan/Indigo, fundo escuro, glassmorphism atualizado, e tipografia Plus Jakarta Sans.

## Escopo da mudança

A mudança é primariamente de **tokens de design** (CSS variables) e **estilos globais**, com ajustes pontuais em componentes que usam cores hardcoded.

## Etapas

### 1. Atualizar CSS variables (`src/index.css`)

Substituir toda a paleta de cores HSL nas variáveis `:root` e `.dark`:

- **Primary**: de `25 95% 53%` (orange) para `187 92% 41%` (cyan #06B6D4)
- **Background**: fundo escuro `210 65% 4%` (#050D14)
- **Card/Popover**: superfícies escuras semi-transparentes
- **Secondary**: `217 91% 60%` (#38BDF8)
- **Accent**: `263 70% 76%` (#A78BFA)
- **Muted**: tons escuros com contraste adequado
- **Border**: `rgba(255,255,255,0.07)` equivalente em HSL
- **Ring**: cyan
- **Sidebar**: fundo escuro `210 50% 6%`, bordas sutis, primary cyan
- **Foreground/text**: tons claros (#F0FDFF)

Adicionar variáveis extras para gradientes Aurora:
```css
--aurora-gradient-primary: linear-gradient(135deg, #06B6D4 0%, #6366F1 100%);
--aurora-gradient-text: linear-gradient(90deg, #06B6D4 0%, #818CF8 55%, #A78BFA 100%);
```

Atualizar `.glass-card` e `.glass-surface` para o visual escuro com `rgba(255,255,255,0.04)` e `backdrop-filter: blur(20px)`.

Atualizar background do body com gradientes radiais em cyan/indigo/violet.

Remover a distinção light/dark (o sistema Aurora é inherentemente dark-mode).

### 2. Adicionar fonte Plus Jakarta Sans (`index.html`)

Adicionar Google Fonts link para `Plus Jakarta Sans:wght@300;400;500;600;700;800` e `Spline Sans Mono` no `<head>`.

### 3. Atualizar Tailwind config (`tailwind.config.ts`)

- Trocar cores `orange` por `cyan` equivalentes
- Atualizar `fontFamily` para incluir `Plus Jakarta Sans` como `sans`
- Manter estrutura de `success`, `warning`, `danger`

### 4. Atualizar componentes com cores hardcoded

Buscar e corrigir referências diretas a cores orange/laranja:

- **Sidebar (`src/components/Sidebar.tsx`)**: `bg-white` → fundo escuro Aurora
- **MobileBottomNav**: `bg-white/72` → `bg-[#080F1A]/80`
- **LandingPage**: gradientes e cores inline que referenciam `hsla(25, 95%, 53%...)`
- **Dashboard cards**: quaisquer referências hardcoded a orange
- **Glass utilities**: já atualizadas no passo 1

### 5. Atualizar landing page

- Gradientes de fundo nas seções → tons cyan/indigo
- Badge, botões, e textos decorativos → nova paleta
- Mockups internos → adaptar ao tema escuro

### 6. Remover restrição de tema orange na config da empresa

O hook `useCompanyTheme` pode precisar de ajuste se forçar cores orange.

## Arquivos impactados

| Arquivo | Tipo de mudança |
|---|---|
| `index.html` | Adicionar fonte Google |
| `src/index.css` | Reescrever variáveis CSS e glass utilities |
| `tailwind.config.ts` | Atualizar cores e font family |
| `src/components/Sidebar.tsx` | Fundo escuro, cores |
| `src/components/common/MobileBottomNav.tsx` | Fundo escuro |
| `src/pages/LandingPage.tsx` | Gradientes e cores inline |
| `src/layouts/AppLayout.tsx` | Background body adjustments |
| `src/hooks/useCompanyTheme.ts` | Remover forçamento de orange |
| ~10-15 componentes com cores hardcoded | Ajustes pontuais |

## Observações

- O design system Aurora é essencialmente um tema **dark-only**. O modo light não fará sentido com essa paleta. O toggle light/dark pode ser removido ou adaptado.
- A marca "Contabiliza AI" será mantida, apenas a identidade visual muda.
- Componentes UI (shadcn/ui) se adaptam automaticamente pelas CSS variables, então a maioria funciona sem alteração.

