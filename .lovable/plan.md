

## Plano: Telegram como atalho no menu e na barra mobile

### Mudanças

#### 1. `src/components/Sidebar.tsx`
- Importar o ícone `Send` do lucide-react.
- Adicionar um item de menu **"Lançamentos via Chat"** no nível principal (após "Anúncios", antes de "Cadastros"), que abre `https://t.me/meu_agente_financeir` em nova aba via `window.open`.
- Usar o ícone `Send` (mesmo do botão flutuante atual).

#### 2. `src/components/common/MobileBottomNav.tsx`
- Substituir um dos itens ou adicionar o item **"Chat"** com ícone `Send` na barra inferior.
- Ao clicar, abre o link do Telegram em nova aba (em vez de navegar internamente).
- Substituir "Anúncios" por "Chat" na barra mobile (5 itens é o limite visual confortável), ou manter os 5 atuais e trocar "Config" por "Chat" (Config já está acessível pela sidebar).

#### 3. `src/components/common/FloatingTelegramButton.tsx`
- Remover o botão flutuante, já que o atalho estará no menu e na barra mobile.

#### 4. `src/layouts/AppLayout.tsx`
- Remover a importação e renderização do `FloatingTelegramButton`.

### Arquivos afetados
- `src/components/Sidebar.tsx` — novo item de menu
- `src/components/common/MobileBottomNav.tsx` — novo item na barra
- `src/components/common/FloatingTelegramButton.tsx` — remover
- `src/layouts/AppLayout.tsx` — remover referência ao floating button

