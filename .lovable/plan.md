## Plano: Tornar textos de vendas neutros (qualquer tipo de negócio)

### Escopo
Apenas alterações de **texto**. Nenhuma mudança de design, layout, estrutura, rotas, nomes de componentes, tabelas (`vendas_digitais`) ou caminhos (`/vendas-digitais`).

### Mapeamento completo das ocorrências
Após varredura, há somente **2 strings visíveis ao usuário** que precisam ser ajustadas:

1. **`src/pages/LandingPage.tsx`** (linha 99)
   - De: `O controle financeiro do seu negócio digital a uma`
   - Para: `O controle financeiro do seu negócio a uma`

2. **`src/components/vendas/VendasExport.ts`** (linha 53)
   - De: `title: "Relatório de Vendas Digitais"`
   - Para: `title: "Relatório de Vendas"`

### O que NÃO será alterado
- Página `VendasDigitais.tsx`: título já é apenas **"Vendas"** (linha 401), descrição já neutra ("Registre vendas manuais e receba vendas das plataformas conectadas"), empty state neutro ("Nenhuma venda registrada").
- Sidebar: já mostra apenas **"Vendas"** (linha 185).
- Menções a **"certificado digital"** (A1 .pfx) — termo técnico fiscal obrigatório, mantido.
- Nome do arquivo/rota/tabela `vendas_digitais` — alteração estrutural, fora do escopo solicitado.
- Outras páginas (`AnunciosDigitais`, etc.) não tocadas, pois o pedido é específico da página de vendas.

### Resultado
Toda comunicação visível ao usuário relacionada à página de Vendas passa a ser neutra, servindo qualquer tipo de negócio (físico, serviços, digital, etc.) — sem qualquer alteração visual ou estrutural.