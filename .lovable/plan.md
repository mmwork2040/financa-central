

## Plano: Redesign Completo do Design System nas Páginas Internas

O objetivo e aplicar os padroes visuais dos HTMLs de referencia (glassmorphism, `rounded-2xl`, cards `bg-[#f1f2f3]`, sombras layered, tipografia Inter/Manrope) de forma consistente em **todo o sistema**, nao apenas na landing page.

### Tokens de Design Extraidos dos HTMLs

| Token | Valor |
|-------|-------|
| Fundo pagina | `#cfddea` (landing) / `bg-background` (app) |
| Glass surface | `bg-white/50 backdrop-blur-md` + sombra layered complexa |
| Glass surface forte | `bg-white/72 backdrop-blur-[14px]` |
| Card background | `#f1f2f3` ou `bg-gray-50` |
| Botao primario | `bg-black text-white rounded-full` + sombra 6-layer |
| Botao secundario | `bg-white text-black border-gray-200 rounded-full` |
| Border radius | `rounded-2xl` (cards), `rounded-3xl` (containers), `rounded-full` (buttons/badges) |
| Gradientes | `from-blue-50 to-white`, `from-orange-50 to-white`, etc. |
| Icones em circulos | `w-10 h-10 rounded-full bg-{color}-100` + `text-{color}-600` |
| Animacoes | `fadeIn 0.8s`, `slideUp 0.8s` com delays 200/400/600/800ms |

### Arquivos a Editar

#### 1. `src/index.css` -- Refinar utilidades globais
- Adicionar `.glass-card` (equivalente ao card padrao do design system: `bg-[#f1f2f3] rounded-2xl`)
- Adicionar `.glass-container` (sombra layered complexa exata do HTML: `rgba(255,255,255,0.1) 0px 1px 1px inset, rgba(50,50,93,0.25) 0px 50px 100px -20px, rgba(0,0,0,0.3) 0px 30px 60px -30px`)
- Adicionar `.btn-pill-sm` para botoes menores pill
- Refinar `.sidebar-link` para usar hover suave (`hover:bg-white/10`)

#### 2. `src/components/ui/card.tsx` -- Atualizar estilo base
- Mudar border-radius de `rounded-lg` para `rounded-2xl`
- Opcional: adicionar variante glass

#### 3. `src/components/ui/button.tsx` -- Adicionar variante pill
- Nova variante `pill` com `bg-black text-white rounded-full` + sombra layered
- Nova variante `pill-outline` com `bg-white border rounded-full`

#### 4. `src/components/Sidebar.tsx` -- Aplicar glassmorphism
- Trocar `bg-sidebar` solido por `bg-white/72 backdrop-blur-[14px]` com texto escuro
- Links com `text-gray-700 hover:text-black hover:bg-gray-100`
- Border `border-gray-200` ao inves de `border-sidebar-border`
- Manter toda logica funcional existente

#### 5. `src/layouts/AppLayout.tsx` -- Fundo global suave
- Adicionar gradiente radial sutil no fundo (tons de laranja/azul muito claros) ou manter `bg-background` com ajuste no CSS

#### 6. `src/pages/Dashboard.tsx` -- Cards com novo estilo
- Summary cards com `rounded-2xl` e icone em circulo `rounded-full bg-{color}-100`
- Shortcut buttons com glass style
- Cards de "Proximos 7 dias" e "Ultimas movimentacoes" com `rounded-2xl`

#### 7. `src/components/dashboard/DashboardShortcuts.tsx` -- Estilo glass
- Botoes com `bg-gray-50 hover:bg-gray-100 rounded-2xl` ao inves do atual

#### 8. `src/components/dashboard/SummaryCard.tsx` -- Atualizar visual
- Usar icones em circulos coloridos como no design system

#### 9. `src/components/common/PageHeader.tsx` -- Refinar tipografia
- Usar `font-heading` (Manrope) nos titulos

#### 10. `src/components/auth/AuthContainer.tsx` -- Ja alinhado, pequenos ajustes
- Garantir sombra layered complexa igual ao HTML

#### 11. `src/pages/LandingPage.tsx` -- Refinar com sombra exata do HTML
- Usar a sombra layered exata: `shadow-[rgba(255,255,255,0.1)_0px_1px_1px_0px_inset,rgba(50,50,93,0.25)_0px_50px_100px_-20px,rgba(0,0,0,0.3)_0px_30px_60px_-30px]`
- Hero buttons com a sombra exata do botao primario do design system

### Escopo e Impacto

A mudanca e **sistematica**: ao atualizar `card.tsx`, `button.tsx` e `index.css`, todas as 20+ paginas internas (Lancamentos, Clientes, Fornecedores, Relatorios, etc.) herdam automaticamente o novo visual sem editar cada uma individualmente. A sidebar e o dashboard precisam de ajustes manuais por terem estilos customizados.

### Resumo dos Arquivos

| Arquivo | Acao |
|---------|------|
| `src/index.css` | Editar -- novas utilidades glass |
| `src/components/ui/card.tsx` | Editar -- rounded-2xl |
| `src/components/ui/button.tsx` | Editar -- variante pill |
| `src/components/Sidebar.tsx` | Editar -- glassmorphism + texto escuro |
| `src/layouts/AppLayout.tsx` | Editar -- fundo gradiente sutil |
| `src/pages/Dashboard.tsx` | Editar -- cards redesign |
| `src/components/dashboard/DashboardShortcuts.tsx` | Editar -- estilo glass |
| `src/components/dashboard/SummaryCard.tsx` | Editar -- icones circulares |
| `src/components/common/PageHeader.tsx` | Editar -- font-heading |
| `src/pages/LandingPage.tsx` | Editar -- sombras exatas |
| `src/components/auth/AuthContainer.tsx` | Editar -- sombra exata |

