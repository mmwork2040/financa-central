

# Reformulacao Completa do Design - Soft Dashboard Design System (Orange Emphasis)

## Objetivo
Aplicar integralmente o Design System "Soft Dashboard Light Premium (Orange Emphasis)" em todo o sistema, abrangendo tokens de cores, tipografia, efeitos glass/blur, border-radius, sombras, botoes pilula, inputs, cards, sidebar, e layout geral.

---

## Resumo das mudancas do Design System

### Tokens principais extraidos do arquivo:

**Backgrounds:**
- Fundo do app com gradientes radiais (laranja + azul sutil)
- Superficies com efeito glass (`rgba(255,255,255,0.72)` + `backdrop-filter: blur`)
- Inputs/chips com `rgba(15,23,42,0.04)`

**Tipografia (Inter):**
- Hero: 48px / fw 400
- H1/metricas: 28px / fw 700
- H2/titulos cards: 20px / fw 600
- Body: 14px / fw 400
- Small: 12px

**Cores:**
- Texto: `#0F172A`, `#334155`, `#475569`, `#64748B`, `#94A3B8`
- Enfase laranja: `#EA580C` (forte), `#FED7AA` (claro)
- Azul info: `#5D7AFF`
- Amber: `#F59E0B`
- Orange secundario: `#FB923C`

**Bordas e sombras:**
- Bordas muito sutis: `rgba(15,23,42,0.08)` e `rgba(15,23,42,0.12)`
- Sombras premium: `0 18px 50px rgba(15,23,42,0.08)`
- Shadow glow laranja: `0 0 36px rgba(234,88,12,0.22)`
- Inset branco: `inset 0 1px 0 rgba(255,255,255,0.80)`

**Border-radius:**
- xs: 12px, sm: 16px, md: 20px, lg: 24px, xl: 30px, pill: 999px

**Botoes:**
- Formato pilula (border-radius: 999px)
- Primary: gradiente laranja (`linear-gradient(135deg, rgba(253,186,116,0.98), rgba(234,88,12,0.98))`)
- Default: glass branco com borda sutil
- Ghost: transparente
- Hover com `translateY(-1px)` e sombra

**Cards:**
- Glass com `::before` radial-gradient branco para efeito de brilho
- Hoverable com `translateY(-2px)` e sombra crescente
- Border-radius: 24px-30px

**Inputs:**
- Background `rgba(15,23,42,0.04)`, border-radius pill, shadow inset

**Tabs/Pills:**
- Pillbar container glass com pills
- Ativa: gradiente laranja com sombra glow

**Sidebar:**
- Background glass branco (nao mais laranja solido)
- Links com hover sutil, ativo com fundo `rgba(15,23,42,0.04)` e borda

---

## Plano de implementacao

### 1. CSS Global (`src/index.css`)
- Substituir variaveis CSS `:root` para refletir os tokens do design system
- Adicionar novas variaveis: `--shadow-1`, `--shadow-2`, `--shadow-glow`, `--shadow-inset`
- Atualizar radii para valores maiores (12px-30px)
- Mudar background do body para gradiente radial premium
- Mudar sidebar para glass branco em vez de laranja solido
- Atualizar classes utilitarias (`.sidebar-link`, `.card-dashboard`, etc.)
- Importar fonte Inter via `@import` do Google Fonts no `index.html`

### 2. Tailwind Config (`tailwind.config.ts`)
- Atualizar `--radius` para 12px (xs base)
- Adicionar cores do design system (text-900, text-700, etc.)
- Atualizar animacoes para incluir hover com translateY

### 3. Componentes UI base (shadcn)

**`button.tsx`:**
- Variante default: glass branco, border sutil, border-radius pill
- Variante primary: gradiente laranja, texto escuro, sombra glow
- Variante ghost: transparente sem borda
- Adicionar efeito hover com translateY(-1px)

**`card.tsx`:**
- Background glass (`rgba(255,255,255,0.92)`)
- Border-radius 24px
- Shadow inset
- Pseudo-elemento `::before` para brilho radial (via classe CSS)
- Classe hoverable com translateY(-2px)

**`input.tsx`:**
- Background `rgba(15,23,42,0.04)`
- Border-radius pill
- Shadow inset

**`badge.tsx`:**
- Border-radius pill
- Background glass
- Shadow inset

**`tabs.tsx` / componentes de abas:**
- Estilo pillbar para TabsList
- Estilo pill ativa com gradiente laranja para TabsTrigger

### 4. Sidebar (`src/components/Sidebar.tsx`)
- Trocar background de laranja solido para glass branco (`rgba(255,255,255,0.72)`) com `backdrop-filter: blur(14px)`
- Links com texto escuro em vez de branco
- Link ativo: fundo sutil `rgba(15,23,42,0.04)`, texto escuro, borda e shadow inset
- Border-radius 24px (desktop)
- Atualizar cores de texto do header, empresa switcher, etc.

### 5. AppLayout (`src/layouts/AppLayout.tsx`)
- Background principal com gradiente radial premium
- Remover `bg-background` e usar classe customizada

### 6. Dashboard (`src/pages/Dashboard.tsx`)
- Cards com efeito glass e hoverable
- Metricas com tipografia do design system (28px bold, tracking tight)
- Cores dos icones seguindo o esquema de accents

### 7. Auth Pages (`AuthContainer.tsx`, `LoginForm.tsx`)
- Aplicar visual glass nos formularios
- Botoes pilula
- Inputs com estilo do design system

### 8. PageHeader e DashboardHeader
- Tipografia alinhada ao design system

### 9. Tabelas e listas
- Linhas com estilo `itemrow` (border-radius 16px, background sutil)
- Icones com fundo tinted e shadow

### 10. `index.html`
- Adicionar link para fonte Inter do Google Fonts

---

## Detalhes tecnicos

### Arquivos que serao modificados:
1. `index.html` - adicionar fonte Inter
2. `src/index.css` - tokens CSS, classes globais, variaveis de sidebar
3. `tailwind.config.ts` - radius, cores adicionais
4. `src/components/ui/button.tsx` - estilos pilula e gradiente
5. `src/components/ui/card.tsx` - glass + hoverable
6. `src/components/ui/input.tsx` - estilo glass input
7. `src/components/ui/badge.tsx` - estilo pill glass
8. `src/components/ui/tabs.tsx` - pillbar style
9. `src/components/Sidebar.tsx` - glass branco + texto escuro
10. `src/layouts/AppLayout.tsx` - background gradiente
11. `src/components/auth/AuthContainer.tsx` - visual glass
12. `src/components/common/PageHeader.tsx` - tipografia
13. `src/components/dashboard/SummaryCard.tsx` - glass hoverable
14. `src/pages/Dashboard.tsx` - cards glass

### Abordagem:
- As mudancas principais estarao centralizadas no CSS global e nos componentes UI base, para que todas as paginas herdem automaticamente o novo visual
- Componentes especificos (Sidebar, Dashboard) recebem ajustes adicionais
- A sidebar muda drasticamente: de laranja solida para glass branca, impactando cores de texto e links

