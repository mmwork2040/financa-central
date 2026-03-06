

## Plano: Reformular seção de Planos e Preços na Landing Page

### O que será feito

Substituir os 3 cards atuais (Mensal/Anual/Trimestral com features genéricas) por 4 planos novos (Start, Growth, Pro, Enterprise) com toggle Mensal/Anual, textos e preços específicos, e um card especial Enterprise.

### Alterações

**1. Reescrever `src/components/landing/PricingCard.tsx`**

- Props expandidas: `features: string[]`, `buttonLabel`, `buttonAction`, `monthlyPrice`, `annualPrice`, `isEnterprise`, `emoji`
- Receber prop `billingPeriod: "mensal" | "anual"` para alternar preço exibido
- Mostrar preço do período selecionado em destaque + texto secundário "ou R$ X no plano [outro]"
- Badge "30 dias grátis" nos planos Start/Growth/Pro
- Card Enterprise com layout diferente: só descrição + botão WhatsApp (sem preço numérico)

**2. Editar `src/pages/LandingPage.tsx` (seção 6)**

- Adicionar state `billingPeriod` com toggle Mensal/Anual (usando ToggleGroup ou botões estilizados)
- Novo heading e subtítulo conforme especificado pelo usuário
- Grid de 4 cards com os dados exatos:
  - **Start** (R$49 anual / R$79 mensal) — features: 100 lançamentos, 50 NFs, Gestão Dupla, Integração nativa
  - **Growth** (R$97 anual / R$147 mensal) — features: 500 lançamentos, 250 NFs, Gestão Dupla, Integração nativa — highlighted + badge "Mais Popular"
  - **Pro** (R$297 anual / R$349 mensal) — features: Ilimitados, 1500 NFs, Gestão Dupla, Integração nativa
  - **Enterprise** — card especial com texto descritivo e botão WhatsApp
- Grid: `md:grid-cols-2 lg:grid-cols-4` para acomodar 4 cards

### Dados dos planos (hardcoded na landing)

| Plano | Anual | Mensal | Lançamentos | NFs | CTA |
|-------|-------|--------|-------------|-----|-----|
| Start | R$ 49 | R$ 79 | 100 | 50 | Começar meu teste grátis |
| Growth | R$ 97 | R$ 147 | 500 | 250 | Escalar com o Growth |
| Pro | R$ 297 | R$ 349 | Ilimitados | 1.500 | Dominar com o Pro |
| Enterprise | — | — | — | — | Falar com um Especialista (WhatsApp) |

