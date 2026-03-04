

## Plano: Padronizar espaçamento lateral da Landing Page

### Diagnóstico

A seção 2 ("Conexão com a dor") usa `container` + conteúdo interno com `max-w-4xl mx-auto`, o que cria margens laterais generosas. Outras seções usam o `container` cheio (max-width ~1280px) sem restrição interna, ficando mais "esticadas". As seções que precisam de ajuste:

- **Seção 1 (Hero)**: grid ocupa toda a largura do container
- **Seção 4 (Funcionalidades)**: grids de features vão até a borda do container
- **Seção 5 (Para quem é)**: usa `max-w-5xl` (já razoável)
- **Footer**: conteúdo ocupa toda a largura

### Mudanças em `src/pages/LandingPage.tsx`

1. **Hero (seção 1)**: Envolver o grid em `max-w-6xl mx-auto` para centralizar e dar respiro lateral.

2. **Funcionalidades (seção 4)**: Envolver todo o conteúdo interno em `max-w-6xl mx-auto` — isso alinha os grids de features com o mesmo respiro das demais seções.

3. **Para quem é (seção 5)**: Ajustar de `max-w-5xl` para `max-w-6xl` nos cards para manter consistência.

4. **Footer**: Adicionar `max-w-6xl mx-auto` ao conteúdo interno.

O valor `max-w-6xl` (1152px) foi escolhido por ser intermediário entre o `max-w-4xl` da seção 2 e o container cheio, criando margens confortáveis sem comprimir demais o conteúdo de grids com 2 colunas.

### Arquivo afetado
- `src/pages/LandingPage.tsx`

