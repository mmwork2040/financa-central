

## Plano: Refazer a Landing Page com apresentação visual premium

### Visão Geral
Reescrever completamente a `LandingPage.tsx` seguindo as 6 seções do briefing, com visual moderno, glassmorphism, e mockups visuais construídos em CSS/HTML puro simulando telas do sistema e conversas no Telegram.

### Estrutura das Seções

**1. Hero Section** — "Seu departamento financeiro a uma mensagem de distância"
- Headline impactante com destaque em laranja
- Subtítulo sobre IA
- Mockup de celular construído em CSS com conversa simulada de chat (bolhas de mensagem estilo Telegram)
- CTA: "Testar por 30 dias grátis"

**2. Conexão com a Dor** — "Chega de planilhas..."
- Layout texto centralizado com ícones de planilhas/calculadora riscados
- Parágrafo persuasivo sobre perda de tempo
- Fundo com gradiente sutil para separação visual

**3. Como Funciona** — 4 passos horizontais/verticais
- Timeline visual com 4 passos numerados (ícones + texto)
- Cada passo com ícone animado (chat, cadastro, mensagem/áudio, relatório)

**4. Funcionalidades** — 5 features com mockups visuais
- Cada funcionalidade em layout alternado (texto esquerda/imagem direita e vice-versa)
- Mockups CSS simulando:
  - Conversa de chat com confirmação de lançamento
  - Dashboard com gráfico de barras (componente estilizado)
  - Lista de contas com badges de status (pago/pendente/vencido)
  - Chat com resumo financeiro
  - Grid de logos de plataformas (Meta Ads, Google Ads, Hotmart, etc.)

**5. Para quem é** — Cards com perfis de público-alvo
- 4 cards glassmorphism: Infoprodutores, Donos de agências, Prestadores de serviço, Profissionais liberais
- Ícones representativos para cada perfil

**6. Planos e Preços** — 3 cards de preço
- Mensal R$197, Trimestral R$147, Anual R$79 (destacado como "Melhor Escolha")
- Badge "30 dias grátis" em cada plano
- Card anual com borda laranja e badge especial

**Footer** — Mantém estilo atual com branding Contabiliza AI

### Detalhes Técnicos

- **Arquivo modificado**: `src/pages/LandingPage.tsx` (reescrita completa)
- **Componentes auxiliares**: Criar `src/components/landing/` com subcomponentes para organização:
  - `PhoneMockup.tsx` — Frame de celular reutilizável com conteúdo interno
  - `ChatBubble.tsx` — Bolhas de chat simulando conversa com IA
  - `DashboardMockup.tsx` — Mini dashboard estilizado
  - `PricingCard.tsx` — Card de plano de preço
- **Sem dependências novas** — Tudo construído com Tailwind + Lucide icons
- **Responsivo** — Mobile-first, adaptação em todas as seções
- **Navegação**: Navbar sticky com scroll suave para seções, CTAs apontam para `/register`

### Mockups Visuais (construídos em CSS)
Como não é possível usar screenshots reais do sistema em runtime, serão construídas representações visuais fiéis usando:
- Divs estilizadas simulando a interface do dashboard (barras de gráfico coloridas, cards de saldo)
- Bolhas de chat com avatares simulando interação com a IA
- Listas com badges de status (verde/amarelo/vermelho) para contas
- Frame de celular com bordas arredondadas e notch

