

## Plano: Adicionar botão de visibilidade de valores na página de Projeto

### Problema
A página `ProjetoDetalhe` usa `useValuesVisibility()` no componente `ProjetoResumo` para mascarar valores, mas não exibe o botão de toggle (olho) para o usuário alternar a visibilidade.

### Solução
Adicionar o botão Eye/EyeOff no header da página de detalhe do projeto, ao lado do nome e status.

### Alteração

**`src/pages/ProjetoDetalhe.tsx`**
- Importar `useValuesVisibility`, `Eye`, `EyeOff`
- Adicionar um `Button` ghost com ícone de olho no header (junto ao botão "Voltar" e título), chamando `toggle()` ao clicar

