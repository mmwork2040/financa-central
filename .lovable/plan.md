

## Plano: Aplicar Design System Glass Verde na Landing Page, Lançamentos e Páginas de Controle Interno

### 1. Landing Page (`src/pages/LandingPage.tsx`)
- Navbar: glass effect (`glass-card`), logo com fundo verde arredondado, nome "Contabiliza AI"
- Hero: gradiente verde sutil no fundo, badge pill com ícone verde
- Stats: glass-card nos containers de stats, valores em `text-primary` (verde)
- Features: cards com `glass-card` class, ícones com fundo `bg-primary/10`
- Highlights: cards laterais com glass effect
- CTA: botão com gradiente verde (já herdado do button.tsx)
- Footer: nome "Contabiliza AI", fundo glass sutil

### 2. Auth Pages (`src/components/auth/AuthContainer.tsx`, `RegisterForm.tsx`)
- AuthContainer: trocar `bg-gray-50` por fundo com gradiente verde (igual body), card principal com `glass-card` em vez de `bg-white shadow-md`
- RegisterForm: trocar `text-gray-700` por `text-foreground`, `text-gray-400` por `text-muted-foreground` (usar tokens do design system)
- LoginForm: mesmas correções de cores hardcoded

### 3. Lançamentos - Header (`src/components/lancamentos/LancamentosHeader.tsx`)
- Ícone com `rounded-xl` e `bg-primary/10` (já está ok, apenas confirmar)
- Nenhuma mudança significativa necessária

### 4. Lançamentos - Table (`src/components/lancamentos/LancamentosTable.tsx`)
- Container da tabela: adicionar `glass-card` class no wrapper `rounded-md border`
- Badges de tipo/status: já usam `rounded-full`, manter
- Mobile cards: adicionar `glass-card` class

### 5. Lançamentos - Filter Dialog (`src/components/lancamentos/LancamentosFilterDialog.tsx`)
- DialogContent já herda estilos globais, sem mudanças necessárias

### 6. Lançamentos - Summary (`src/components/lancamentos/LancamentosSummary.tsx`)
- SummaryCard já usa Card que tem glass effect, ok

### 7. SummaryCard (`src/components/dashboard/SummaryCard.tsx`)
- Adicionar `glass-card` class ao Card para efeito glass explícito
- Hover com elevação sutil (`hover:-translate-y-0.5 transition-transform`)

### 8. PageHeader (`src/components/common/PageHeader.tsx`)
- Ícone container: trocar `rounded-lg` por `rounded-xl` para consistência

### 9. MobileBottomNav (`src/components/common/MobileBottomNav.tsx`)
- Adicionar `glass-card` styling no nav container (glass bottom bar)

### Arquivos a editar

| Arquivo | Mudanças |
|---------|----------|
| `src/pages/LandingPage.tsx` | Glass navbar/cards, nome "Contabiliza AI", gradientes verdes |
| `src/components/auth/AuthContainer.tsx` | Glass card, gradiente verde no fundo |
| `src/components/auth/RegisterForm.tsx` | Trocar cores hardcoded por tokens |
| `src/components/auth/LoginForm.tsx` | Trocar cores hardcoded por tokens |
| `src/components/lancamentos/LancamentosTable.tsx` | Glass wrapper na tabela e mobile cards |
| `src/components/dashboard/SummaryCard.tsx` | Glass card + hover elevation |
| `src/components/common/PageHeader.tsx` | Ícone `rounded-xl` |
| `src/components/common/MobileBottomNav.tsx` | Glass bottom nav |

