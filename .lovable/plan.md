

## Plano: Landing Page Premium com Design System Visual

### Objetivo
Elevar o visual da landing page aplicando os padrões do design system anexo e inspiracao das imagens NITUX: floating cards no hero, gradientes radiais, sombras premium, elementos decorativos flutuantes, e mais profundidade visual.

### Mudancas Principais

**1. Hero Section - Estilo NITUX**
- Fundo com container arredondado e gradiente radial (como o hero card da NITUX)
- Floating stat cards ao redor do phone mockup: "R$ 24.500 receitas este mes", "95% precisao da IA", "R$ 10.300 saldo"
- Circulos decorativos flutuantes (dots brancos com sombra, como na imagem)
- Badge pill acima do titulo: "N1 EM GESTAO FINANCEIRA COM IA"
- Dois botoes: CTA primario + "Ver Demo" outline

**2. Secao Dor - Metricas visuais**
- Adicionar barra de stats como na NITUX: "+85% Economia de tempo", "98% Precisao", "2min por lancamento"
- Cards glassmorphism com tint radial para os icones de planilha/calculadora

**3. Como Funciona - Cards premium**
- Cards com `::before` radial gradient overlay (do design system)
- Hover com translateY(-2px) e shadow-2
- Linha conectora visual entre os passos

**4. Funcionalidades - Mockups aprimorados**
- DashboardMockup: adicionar tooltip flutuante sobre o grafico (como no design system .tooltip)
- ContasListMockup: aplicar itemrow styling do design system
- IntegrationsMockup: logos maiores com glow effect

**5. Pricing - Estilo premium**
- Card destacado com borda gradiente e glow shadow
- Background com tint radial no card anual

**6. Nova secao: Social Proof / Numeros**
- Secao entre features e pricing com metricas: "+500 empresas", "R$ 50M gerenciados", "4.9 avaliacao"

### Arquivos Modificados
- `src/pages/LandingPage.tsx` — Hero redesenhado com floating cards, dots decorativos, badge pill, secao de stats
- `src/components/landing/PhoneMockup.tsx` — Sombra premium e glow
- `src/components/landing/DashboardMockup.tsx` — Tooltip flutuante, gradiente radial de fundo
- `src/components/landing/ContasListMockup.tsx` — Itemrow com design system styling
- `src/components/landing/IntegrationsMockup.tsx` — Glow nos logos
- `src/components/landing/PricingCard.tsx` — Gradiente de borda no destacado, sombra glow
- `src/components/landing/ChatBubble.tsx` — Sem mudancas

### Detalhes Tecnicos
- Tudo em Tailwind + inline styles para gradientes radiais especificos
- Floating cards com `absolute` positioning no hero
- Dots decorativos com divs circulares `bg-white/60` e shadow
- Stats section com grid de 3-4 colunas
- Sem dependencias novas

