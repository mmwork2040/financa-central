

## Problema

No `ConfiguracaoFiscal.tsx`, a função `handleCertUpload` (linhas 105-108) exige que a senha do certificado esteja preenchida **antes** de permitir o upload do arquivo `.pfx`. Isso bloqueia o fluxo natural do usuário, que espera primeiro selecionar o arquivo e depois informar a senha.

## Correção

**Arquivo: `src/components/configuracoes/ConfiguracaoFiscal.tsx`**

1. Remover a validação de senha obrigatória dentro de `handleCertUpload` (linhas 105-108)
2. Manter a validação de senha apenas no `validateFields` / `handleSave`, onde ela já existe (linha 136)
3. Reorganizar o layout do card de certificado para que o botão de upload venha **antes** do campo de senha, tornando o fluxo mais intuitivo: upload primeiro, senha depois

Resultado: o usuário poderá enviar o certificado livremente e só precisará da senha ao salvar a configuração fiscal.

