
import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FAQ_ITEMS = [
  {
    pergunta: "Como cadastrar um novo lançamento?",
    resposta: "Acesse o menu Lançamentos, clique em 'Novo Lançamento', preencha os campos obrigatórios (descrição, valor, data de vencimento e tipo) e clique em Salvar. Você também pode criar lançamentos via chat no Telegram.",
  },
  {
    pergunta: "Como emitir uma nota fiscal?",
    resposta: "Na página de Vendas Digitais, localize a venda desejada e clique no botão 'Emitir NF'. Para utilizar essa funcionalidade, é necessário ter a integração fiscal configurada nas Configurações da Empresa.",
  },
  {
    pergunta: "Como adicionar uma nova conta bancária?",
    resposta: "Vá em Cadastros > Contas Bancárias e clique em 'Nova Conta Bancária'. Preencha o nome, selecione o banco (ou digite manualmente), informe agência, conta e saldo inicial.",
  },
  {
    pergunta: "Como configurar integrações?",
    resposta: "Acesse Configurações > Integrações. Lá você encontrará as plataformas disponíveis (Hotmart, Kiwify, Shopify, etc). Insira a API Key da plataforma desejada e ative a integração.",
  },
  {
    pergunta: "Como convidar outros usuários para a empresa?",
    resposta: "Em Cadastros > Usuários, clique em 'Gerar Código de Convite'. Defina o perfil de acesso e compartilhe o código gerado com o novo usuário, que poderá usá-lo ao fazer login.",
  },
  {
    pergunta: "Como funciona o controle de permissões?",
    resposta: "Administradores podem acessar a página Permissões pelo menu lateral. Lá é possível definir, para cada usuário, quais telas ele pode acessar e quais ações (incluir, alterar, excluir) são permitidas.",
  },
  {
    pergunta: "Como ver meus relatórios financeiros?",
    resposta: "Acesse o menu Relatórios para visualizar resumos financeiros, gráficos de fluxo de caixa, análise por categoria, tendências e análise preditiva. Use os filtros de período para refinar os dados.",
  },
  {
    pergunta: "Como funciona a recorrência de lançamentos?",
    resposta: "Ao criar um lançamento, ative a opção 'Recorrente' e defina o tipo (mensal, semanal, etc.) e a data de término. O sistema gerará automaticamente os lançamentos futuros.",
  },
  {
    pergunta: "Como transferir valores entre contas bancárias?",
    resposta: "Na página Contas Bancárias, clique no botão 'Transferir' (disponível quando há 2+ contas). Selecione a conta de origem, a conta de destino e o valor da transferência.",
  },
  {
    pergunta: "Como alterar meu plano de assinatura?",
    resposta: "Clique em 'Ver Planos' no banner superior ou acesse o menu de configurações. Escolha o plano desejado e siga as instruções de pagamento.",
  },
];

const SupportFAQ = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" />
        Perguntas Frequentes
      </h2>
      <div className="space-y-2">
        {FAQ_ITEMS.map((item, index) => (
          <Card key={index} className="overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
            >
              <span className="font-medium text-sm pr-4">{item.pergunta}</span>
              {openFaq === index ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
            {openFaq === index && (
              <CardContent className="pt-0 pb-4 px-4 border-t">
                <p className="text-sm text-muted-foreground leading-relaxed">{item.resposta}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SupportFAQ;
