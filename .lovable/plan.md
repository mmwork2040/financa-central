

## Plano: Ajuste de Harmonia e Responsividade Desktop na Landing Page

### Problemas Identificados

1. **Hero**: O grid `md:grid-cols-2` funciona, mas os FloatingStatCards com posicionamento absoluto (`-left-12`, `-right-8`) podem transbordar ou sobrepor conteúdo em telas médias. Falta breathing room entre texto e mockup.
2. **Seção "Conexão com a dor"**: Os ícones (Planilhas, Cálculos, Seta, IA) estão em `flex` sem `flex-wrap`, o que pode comprimir em telas médias. Espaçamento `gap-6` insuficiente para desktop grande.
3. **Seção "Como Funciona" (Timeline)**: Os cards de mockup têm `max-w-[260px]` fixo, ficando pequenos em desktop. Os textos descritivos poderiam ter mais espaço.
4. **Seção Funcionalidades**: 5 features com `grid md:grid-cols-2 gap-12` — o gap é uniforme mas o `mb-24` entre seções é excessivo, quebrando o ritmo visual.
5. **Seção "Para quem é"**: Grid `lg:grid-cols-4` OK, mas os cards poderiam ter altura uniforme e padding mais generoso.
6. **Pricing**: Grid `md:grid-cols-3` com `max-w-4xl` — espaçamento harmônico mas os cards precisam de altura uniforme. O card destacado com `scale-[1.03]` pode causar overflow sutil.
7. **Footer**: Muito simples e com pouco padding, destoa do resto da página premium.
8. **Geral**: Container `px-4` é apertado em desktop. Seções com `py-20` uniformes perdem hierarquia visual.

### Solução por Seção

**`src/pages/LandingPage.tsx`** — Todas as mudanças concentradas neste arquivo:

1. **Hero**:
   - Aumentar `gap-12` para `gap-16 lg:gap-20` no grid
   - Ajustar FloatingStatCards para `lg:-left-16` em desktop, com `hidden md:block` para mobile
   - Padding vertical `py-16 md:py-24 lg:py-32`

2. **Seção Dor**:
   - Adicionar `flex-wrap justify-center` na row de ícones
   - Aumentar gap para `gap-8` em desktop
   - Container interno com `max-w-4xl` para mais breathing room

3. **Timeline (Como Funciona)**:
   - Aumentar `max-w-[260px]` para `max-w-xs` (320px) nos cards de mockup
   - Refinar gap entre steps de `mb-16` para `mb-20`

4. **Funcionalidades**:
   - Reduzir `mb-24` para `mb-16 lg:mb-20` para ritmo mais consistente
   - Adicionar `lg:gap-16` no grid para mais espaço em telas grandes

5. **"Para quem é"**:
   - Adicionar `max-w-5xl mx-auto` para centralizar melhor
   - Cards com `min-h` implícito via `flex flex-col justify-between`

6. **Pricing**:
   - Remover `scale-[1.03]` no `PricingCard.tsx` e usar `ring-2 ring-primary` para destaque sem overflow
   - Ou manter scale mas adicionar padding ao container

7. **Footer**:
   - Aumentar padding para `py-12`
   - Adicionar links úteis ou ao menos mais presença visual

8. **Geral**:
   - Container com `px-4 md:px-6 lg:px-8` para mais respiro em desktop
   - Variar `py` entre seções: hero maior, intermediárias `py-20`, footer menor

### Arquivos afetados
- `src/pages/LandingPage.tsx` — Ajustes de classes Tailwind em todas as seções
- `src/components/landing/PricingCard.tsx` — Ajuste do scale no card destacado

