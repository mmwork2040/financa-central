

## Plano: Controle Financeiro Completo por Projeto

### Resumo

Transformar a página de Projetos de uma lista simples para uma visão detalhada com painel de controle financeiro por projeto, incluindo valores previstos (editáveis manualmente), valores realizados (vindos dos lançamentos), cálculos automáticos de lucro e impostos, e uma aba com todos os lançamentos vinculados.

---

### 1. Migração de Banco de Dados

Adicionar novas colunas na tabela `projetos`:

```sql
ALTER TABLE projetos
  ADD COLUMN investimento_previsto numeric NOT NULL DEFAULT 0,
  ADD COLUMN despesa_prevista numeric NOT NULL DEFAULT 0,
  ADD COLUMN data_inicio date,
  ADD COLUMN data_fim date,
  ADD COLUMN imposto_percentual numeric NOT NULL DEFAULT 0,
  ADD COLUMN imposto_base text NOT NULL DEFAULT 'lucro'; -- 'lucro' ou 'receita'
```

Isso permite que o usuário preencha valores de planejamento (investimento previsto, despesa prevista, datas de início/fim, % de imposto e base de cálculo) sem relação com os lançamentos reais.

---

### 2. Atualizar Formulário de Projeto (`ProjetoForm.tsx`)

Expandir o formulário para incluir os novos campos:
- **Investimento Previsto** (CurrencyInput)
- **Despesa Prevista** (CurrencyInput)
- **Data Início** e **Data Fim** (date inputs)
- **% Imposto** (input numérico)
- **Base do Imposto** (select: "Sobre o Lucro" / "Sobre a Receita Total")

O dialog será expandido para `sm:max-w-[600px]` para acomodar os novos campos.

---

### 3. Atualizar Hook `useProjetos.ts`

- Atualizar a interface `Projeto` e `initialProjeto` com os novos campos.
- Incluir os novos campos no payload de insert/update.

---

### 4. Nova Página de Detalhe do Projeto

Criar `src/pages/ProjetoDetalhe.tsx` com rota `/projetos/:id`:

**Aba "Resumo"** — Painel com cards de indicadores:
- Investimento Previsto (do campo manual)
- Despesa Prevista (do campo manual)
- Receitas Realizadas (soma dos lançamentos tipo receita vinculados)
- Despesas Realizadas (soma dos lançamentos tipo despesa vinculados)
- Lucro Projetado (Receitas Realizadas - Despesas Realizadas)
- Imposto Previsto (% aplicado sobre lucro ou receita, conforme configuração)
- Lucro Líquido Projetado (Lucro - Imposto)
- Valores Pendentes (lançamentos pendentes/aberto vinculados)
- Período do projeto (data início → data fim)

**Aba "Lançamentos"** — Tabela com todos os lançamentos que possuem `projeto_id` igual ao projeto atual, com colunas: Data, Descrição, Tipo, Valor, Status. Permite filtrar por status e tipo.

---

### 5. Navegação

- Na `ProjetosTable`, ao clicar no nome do projeto, navegar para `/projetos/:id`.
- Adicionar rota no `App.tsx`: `<Route path="/projetos/:id" element={...}>`
- Botão de voltar na página de detalhe.

---

### 6. Componentes Novos

| Componente | Função |
|---|---|
| `src/pages/ProjetoDetalhe.tsx` | Página de detalhe com abas |
| `src/components/projetos/ProjetoResumo.tsx` | Grid de cards com indicadores financeiros |
| `src/components/projetos/ProjetoLancamentos.tsx` | Tabela de lançamentos vinculados ao projeto |

---

### 7. Cálculos Automáticos (no frontend)

Todos derivados dos lançamentos com `projeto_id`:
- **Receitas Realizadas** = soma de `valor` onde `tipo = 'receita'` e `status IN ('pago', 'recebido')`
- **Despesas Realizadas** = soma de `valor` onde `tipo = 'despesa'` e `status IN ('pago', 'recebido')`
- **Receitas Pendentes** = soma onde `tipo = 'receita'` e `status IN ('pendente', 'aberto')`
- **Despesas Pendentes** = soma onde `tipo = 'despesa'` e `status IN ('pendente', 'aberto')`
- **Lucro Projetado** = Receitas Realizadas - Despesas Realizadas
- **Imposto Previsto** = `imposto_percentual / 100 * (lucro OU receita total)` conforme `imposto_base`
- **Lucro Líquido** = Lucro - Imposto

---

### Arquivos afetados

- **Migração SQL** — novas colunas em `projetos`
- `src/hooks/useProjetos.ts` — interface e payload atualizados
- `src/components/projetos/ProjetoForm.tsx` — novos campos
- `src/components/projetos/ProjetosTable.tsx` — link no nome do projeto
- `src/pages/ProjetoDetalhe.tsx` — **novo**
- `src/components/projetos/ProjetoResumo.tsx` — **novo**
- `src/components/projetos/ProjetoLancamentos.tsx` — **novo**
- `src/App.tsx` — nova rota

