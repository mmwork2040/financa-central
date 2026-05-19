
## Objetivo

Melhorar a importação inteligente de documentos para que:
1. **Super Admin** configure uma única chave de IA (global) e libere por tenant — todos os usuários da empresa liberada usam.
2. A **leitura real** dos arquivos (PDF, imagem, Excel, CSV) funcione corretamente — hoje envia lixo binário para o LLM.
3. A IA **sugira categorias** e o sistema **crie automaticamente** as que não existirem na empresa.

---

## 1. Configuração global da IA (Super Admin)

**Nova tabela** `ai_global_config` (singleton):
- `provider` (`openai` | `google_gemini` | `anthropic` | `deepseek` | `lovable_ai`)
- `model`
- `api_key_encrypted` (armazenado como secret server-side via `LLM_GLOBAL_API_KEY`, não na tabela)
- `ativo` boolean
- `updated_by`, `updated_at`

**Nova tabela** `ai_global_access`:
- `empresa_id` (FK), `liberado` boolean, `liberado_em`, `liberado_por`
- RLS: leitura pela própria empresa; escrita apenas super_admin.

**UI nova** em `src/pages/ConfigGlobalIA.tsx` (rota protegida `/admin/ia-global`, só super_admin):
- Card 1: configurar provider + modelo + chave (a chave vai para Supabase secret via edge function `set-global-ai-key`, não trafega no banco).
- Card 2: lista de empresas com toggle "Liberar acesso à IA global".

**Item no Sidebar** (super admin only): "IA Global".

---

## 2. Leitura real dos documentos

Substituir o `readFileContent` do `ImportarDocumentos.tsx` por extração real, e enviar **anexo nativo** para o LLM em vez de string base64 truncada:

| Tipo | Como extrair |
|---|---|
| PDF | `pdfjs-dist` no client extrai texto por página. Se < 50 chars, faz fallback renderizando página → PNG → envia como imagem para o modelo (visão). |
| Imagem | Enviar como `image_url` (base64 inteiro, não truncado) ao endpoint vision do provider. |
| XLSX/XLS | `xlsx` (SheetJS) no client converte para CSV/JSON. |
| CSV/TXT | `file.text()` direto. |

Edge function `process-document-import` passa a aceitar:
```ts
{
  fileName,
  textContent?: string,      // texto extraído
  imageBase64?: string,      // se for imagem ou página renderizada
  mimeType: string,
  preferredLLM?: string      // opcional, default = config global
}
```

Refatorar as funções `callOpenAI/callGemini/callAnthropic/callDeepSeek` para suportar **mensagens multimodais** (parts com `image_url` quando houver `imageBase64`).

---

## 3. Resolução de credenciais na edge function

Nova ordem de resolução em `process-document-import`:

1. Verifica `ai_global_access` para a `empresa_id` do usuário.
   - Se liberado e existe `ai_global_config` ativo → usa secret `LLM_GLOBAL_API_KEY` + provider/model global.
2. Caso contrário → fallback ao comportamento atual (tabela `integracoes` da empresa).
3. Se nada disponível → erro claro: "Solicite ao administrador a liberação da IA global ou configure uma integração de IA".

---

## 4. Auto-criação de categorias

Após o usuário clicar "Importar selecionados" em `handleSaveSelected`:
- Para cada item com `categoria_sugerida` preenchida:
  - Busca em `categorias` da empresa por nome (case-insensitive).
  - Se não existir, faz `insert` em `categorias` com `tipo` derivado de `tipo_sugerido` (receita/despesa).
  - Usa o `id` resultante no `lancamentos.categoria_id`.
- Respeita unique constraint existente (`empresa_id` + lower(nome)).
- Mesmo tratamento para `fornecedor_cliente` → cria em `fornecedores` ou `clientes` conforme o tipo.

Os campos `categoria_id`, `fornecedor_id`/`cliente_id` passam a ser salvos no `lancamentos`.

---

## 5. Prompt aprimorado

Atualizar `SYSTEM_PROMPT` para:
- Reforçar extração de **uma linha por item** em notas/cupons.
- Pedir categoria genérica padronizada (lista sugerida: Alimentação, Transporte, Software, Marketing, Salários, etc).
- Detectar CNPJ/CPF do fornecedor e colocar em `observacoes`.

---

## Arquivos afetados

**Novos:**
- `supabase/migrations/*_global_ai.sql` — tabelas + RLS
- `supabase/functions/set-global-ai-key/index.ts` — super admin grava secret
- `src/pages/ConfigGlobalIA.tsx`
- `src/hooks/useGlobalAI.ts`

**Editados:**
- `supabase/functions/process-document-import/index.ts` — multimodal + resolução global
- `src/pages/ImportarDocumentos.tsx` — extração real (pdfjs, xlsx) e envio multimodal
- `src/components/Sidebar.tsx` — link "IA Global" (super admin)
- `src/App.tsx` — rota nova

**Dependências:**
- `pdfjs-dist`, `xlsx`

---

## Detalhes técnicos

- A `api_key` global **nunca** vai para o banco — só vive como secret `LLM_GLOBAL_API_KEY` (gerenciada via tool `add_secret` quando o super admin salva).
- `ai_global_config` armazena apenas metadata (provider/model/ativo).
- Edge function lê a key com `Deno.env.get("LLM_GLOBAL_API_KEY")`.
- Mantém compatibilidade: empresas sem acesso global continuam com `integracoes` próprias.
- RLS estrita em `ai_global_config` e `ai_global_access`: só super_admin escreve.
