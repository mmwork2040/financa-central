

## Plano: Reformulação do Design System + Landing Page

### Análise do Design System de Referência

O HTML anexo define um estilo **glassmorphism moderno** com estas características:
- **Fundo da página**: `#cfddea` (azul-acinzentado suave)
- **Superfícies de vidro**: `bg-white/50 backdrop-blur-md` com sombras profundas complexas
- **Cards**: `rounded-2xl`, fundo `#f1f2f3` ou gradientes sutis (blue-50, orange-50, etc.)
- **Botões primários**: preto (`bg-black`), formato pill (`rounded-full`), sombra layered profunda, hover com `scale-105`
- **Botões secundários**: branco com borda, pill, hover com shadow
- **Tipografia**: Inter + Manrope para headings, `font-medium` no heading principal
- **Animações**: `fadeIn 0.8s`, `slideUp 0.8s` com delays escalonados (200ms, 400ms, 600ms, 800ms)
- **Cores de apoio**: azul, verde, roxo, laranja, amarelo para ícones e badges

### O que será feito

#### 1. Atualizar CSS global (`src/index.css`)
- Adicionar classes utilitárias de glassmorphism: `.glass-surface`, `.glass-shadow`
- Adicionar animações `slide-up` e `fade-in` com delays escalonados
- Ajustar background da landing page para gradiente `#cfddea`

#### 2. Atualizar Tailwind config (`tailwind.config.ts`)
- Adicionar animações `slide-up`, `fade-in` com variantes de delay
- Manter as cores orange como accent/brand (Contabiliza AI usa laranja)

#### 3. Reescrever Landing Page (`src/pages/LandingPage.tsx`)
Seguindo a estrutura exata do hero do design system, adaptada para "Contabiliza AI":

- **Navbar**: glass surface (`bg-white/90 backdrop-blur-md`), logo + nome "Contabiliza AI", botões pill
- **Hero**: container glass com grid 2 colunas, badge social proof, heading grande com Manrope, subtítulo, 2 botões pill (preto primário + branco secundário), indicadores de confiança (estrelas, certificação)
- **Stats**: números em destaque dentro de cards glass
- **Features**: grid 3 colunas com cards `rounded-2xl bg-gray-50 hover:bg-gray-100` e ícones coloridos em círculos
- **Highlights**: seção com gradiente cards (from-orange-50 to-white) para os diferenciais
- **CTA**: seção final com glass surface e botão grande
- **Footer**: minimalista, "Contabiliza AI"

#### 4. Atualizar AuthContainer (`src/components/auth/AuthContainer.tsx`)
- Aplicar fundo `#cfddea` e glass surface no card de login/registro para coerência visual

### Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/index.css` | Editar - adicionar utilitários glass e animações |
| `tailwind.config.ts` | Editar - adicionar keyframes slide-up/fade-in |
| `src/pages/LandingPage.tsx` | Reescrever completamente |
| `src/components/auth/AuthContainer.tsx` | Editar - aplicar glass style |

