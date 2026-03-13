## Perfis de Acesso (Templates de Permissão)

O sistema já possui convites com permissões granulares por tela, mas hoje o admin precisa configurar cada permissão manualmente a cada convite. A proposta é criar **perfis de acesso** (templates pré-configurados) que agrupam permissões por tipo de colaborador, agilizando o convite e padronizando o acesso.

### O que muda para o usuário

1. Na tela de convites, em vez de marcar permissão por permissão, o admin seleciona um **perfil de acesso** (ex: "Colaborador", "Contador", "Sócio") e as permissões são preenchidas automaticamente
2. O admin pode **criar perfis personalizados** com qualquer combinação de telas/ações
3. Os perfis pré-configurados vêm prontos ao criar a empresa, mas podem ser editados
4. Ao resgatar o convite, as permissões do perfil são aplicadas automaticamente ao novo usuário

### Perfis pré-configurados


| Perfil          | Acesso                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sócio**       | Acesso total                                                                                                                                                 |
| **Colaborador** | Lançamentos (incluir/alterar), Clientes, Fornecedores, Categorias. Sem excluir, sem relatórios financeiros                                                   |
| **Contador**    | Relatórios, Lançamentos (visualizar), Categorias (visualizar), Contas Bancárias (visualizar). Somente leitura. Permitido geração e emissão de notas fiscais. |


### Mudanças técnicas

**1. Nova tabela `perfis_acesso**` (templates de permissão por empresa)

- `id`, `empresa_id`, `nome` (ex: "Contador"), `descricao`, `is_default` (pré-configurado), `created_at`
- RLS: filtrado por `empresa_id` do usuário

**2. Nova tabela `perfis_acesso_permissoes**` (permissões de cada perfil)

- `id`, `perfil_acesso_id`, `tela`, `pode_incluir`, `pode_alterar`, `pode_excluir`
- RLS: via join com `perfis_acesso.empresa_id`

**3. Coluna `perfil_acesso_id` na tabela `invite_codes**`

- Opcional — quando preenchido, ao resgatar o convite as permissões vêm do perfil

**4. Nova página/seção "Perfis de Acesso"** na configuração da empresa

- CRUD de perfis com tabela de permissões por tela (mesma UI da tela de Permissões)
- Cards para cada perfil pré-configurado e custom

**5. Atualização do formulário de convites** (`InviteCodesCard`)

- Dropdown para selecionar perfil de acesso (substitui o switch admin/config manual)
- Opção "Personalizado" para manter o comportamento atual de marcar permissões manualmente
- Ao selecionar um perfil, as permissões são preenchidas automaticamente (read-only preview)

**6. Atualização da Edge Function `generate-invite-code**`

- Receber `perfil_acesso_id` opcional
- Se informado, copiar permissões do perfil para `invite_code_permissoes`

**7. Atualização da Edge Function `redeem-invite-code**`

- Sem mudança — já copia de `invite_code_permissoes` para `permissoes` do usuário

**8. Seed dos perfis padrão**

- Migration que insere os 3 perfis default para cada empresa existente
- Trigger ou lógica no `create-empresa` para criar os perfis default em novas empresas

### Arquivos impactados

- **Novas migrations**: criar tabelas + seed + RLS
- `**supabase/functions/generate-invite-code/index.ts**`: suporte a `perfil_acesso_id`
- `**supabase/functions/create-empresa/index.ts**`: seed dos perfis default
- `**src/components/convites/InviteCodesCard.tsx**`: dropdown de perfil + preview
- **Nova página/componente**: CRUD de perfis de acesso
- `**src/components/Sidebar.tsx**`: link para nova seção (se separada)