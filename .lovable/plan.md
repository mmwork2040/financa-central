## Problemas identificados

1. **Excesso de ícones soltos** no nível raiz (Dashboard, Lançamentos, Importar, Vendas, Notas, Anúncios, Projetos, Cadastros, Relatórios, Configurações, Permissões, Perfis, Suporte, Administração) → poluição visual.
2. **Itens não-universais visíveis para todas as empresas** (ex: Anúncios aparece para qualquer empresa business mesmo sem integração de Ads → já existe filtro `requiresAds`, mas Vendas/Notas/Projetos seguem o mesmo problema).
3. **Itens de Super Admin misturados** dentro de "Configurações" mental do usuário (Logs, n8n Templates, Webhooks, Planos/Assinaturas) — hoje já estão em "Administração", mas o ícone "IA Global" está duplicado conceitualmente com a aba de IA dentro de Integrações.
4. **Duas entradas de "IA"**: `IA Global` (admin) + `Inteligência Artificial` (categoria em /settings/integracoes). Confunde.
5. **Configurações** mistura "Empresa/Pessoal", "Integrações", "Termos" — ok, mas pode receber também "Perfis de Acesso" e "Permissões" que hoje vivem soltos no menu raiz.

## Solução proposta

### A. Reagrupamento do menu (raiz mais enxuto)

```
[Topo fixo]
  Dashboard
  Lançamentos
  Vendas              (só se empresa tem integração de vendas ativa)
  Notas Fiscais       (só se módulo fiscal habilitado / business)
  Anúncios            (só se integração Ads ativa — já existe)
  Projetos            (só se ativado nos controles do plano)
  Importar
  Relatórios

[Grupo: Cadastros]   (colapsável — já existe)
  Clientes, Fornecedores, Categorias, Contas, Formas, Cartões, Usuários

[Grupo: Configurações]   (colapsável)
  Empresa / Pessoal
  Integrações          (inclui IA da empresa)
  Perfis de Acesso     ← movido pra cá
  Permissões           ← movido pra cá
  Termos e Políticas

[Grupo: Super Admin]   (colapsável, só isSuperAdmin, ícone Shield)
  IA Global
  Planos de Assinatura
  n8n Templates
  Webhooks
  Logs

[Rodapé]
  Suporte
  Sair
```

### B. Regras de visibilidade por empresa

Cada item "businessOnly" passa a checar uma flag derivada:
- `Vendas` → existe integração ativa em `plataformas_vendas` OU `planControles.vendas !== false`
- `Notas Fiscais` → `planControles.notas_fiscais` ligado E (config fiscal feita OU super admin)
- `Anúncios` → integração google_ads/meta_ads ativa (já existe)
- `Projetos` → `planControles.projetos !== false`

Itens não aplicáveis simplesmente **não aparecem** (em vez de virem desabilitados). Super Admin sempre vê tudo com badge "admin".

### C. Resolver duplicação de IA

- Renomear `IA Global` (admin) → **"IA — Provedor Global"** (deixa claro que é configuração de chave global / fallback).
- Dentro de Integrações, a categoria "IA" permanece como **"IA da Empresa"** (chaves próprias do tenant).
- Tooltip explicando a diferença em ambos.

### D. Densidade visual

- Ícones do menu raiz reduzidos de 18 → 16px no estado colapsado.
- Separadores sutis entre os 4 grupos (Operação / Cadastros / Config / Admin).
- No estado colapsado (w-14): grupos viram apenas o ícone "chefe" (FolderOpen / Settings / Shield) clicável que expande tooltip-flyout com os filhos — não derrama todos os itens individuais como hoje (linhas 507, 558 fazem isso).

## Arquivos afetados

- `src/components/Sidebar.tsx` — reorganização das arrays `mainItems`, `configItems`, `adminGlobalItems`; mover `adminItems` (Permissões/Perfis) para dentro de `configItems`; adicionar checagens de visibilidade para Vendas/Notas/Projetos; ajustar render colapsado para usar flyout.
- `src/pages/ConfigGlobalIA.tsx` — atualizar título para "IA — Provedor Global" + texto explicativo.
- `src/pages/Integracoes.tsx` — ajustar label da categoria `ia` para "IA da Empresa".

## Fora do escopo

- Não muda rotas nem permissões reais (apenas visibilidade no menu).
- Não toca em RLS, edge functions ou dados.
- Não redesigna estilos — apenas hierarquia e agrupamento.

## Pergunta antes de implementar

Confirma os 4 grupos (Operação / Cadastros / Configurações / Super Admin) e a movimentação de **Permissões + Perfis de Acesso** para dentro de Configurações? Se preferir mantê-los soltos no raiz, ajusto.