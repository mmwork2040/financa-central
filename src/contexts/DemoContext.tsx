import React, { createContext, useContext } from "react";

export interface DemoData {
  userName: string;
  summary: {
    totalReceitas: number;
    receitasPrevistas: number;
    totalDespesas: number;
    despesasPrevistas: number;
    saldoAtual: number;
    emAtraso: number;
  };
  caixa: {
    caixaAtual: number;
    saldoInvestido: number;
    caixaPrevisto: number;
    mesesDeCaixa: number;
    receitasPendentesAcumuladas: number;
    despesasPendentesAcumuladas: number;
    itensPendentes: any[];
  };
  healthStatus: "saudavel" | "atencao" | "risco";
  lancamentosRecentes: Array<{
    id: string;
    descricao: string;
    tipo: string;
    valor: number;
    status: string;
    data_vencimento: string;
    categoria: { nome: string } | null;
  }>;
  contasProximas: Array<{
    id: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
  }>;
  receitasPendentes: Array<{
    id: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
  }>;
  monthlyChartData: Array<{ name: string; receitas: number; despesas: number; investimentos: number }>;
  contasBancarias: Array<{
    id: string;
    nome: string;
    banco: string;
    saldo_atual: number;
  }>;
  lancamentos: Array<{
    id: string;
    descricao: string;
    tipo: string;
    valor: number;
    status: string;
    data_vencimento: string;
    data_pagamento: string | null;
    categoria: string;
    forma_pagamento: string;
  }>;
  projetos: Array<{
    id: string;
    nome: string;
    status: string;
    orcamento: number;
    descricao: string;
  }>;
  clientes: Array<{
    id: string;
    nome: string;
    email: string;
    telefone: string;
    cpf_cnpj: string;
  }>;
  fornecedores: Array<{
    id: string;
    nome: string;
    email: string;
    telefone: string;
    cpf_cnpj: string;
  }>;
}

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

const demoData: DemoData = {
  userName: "Visitante",
  summary: {
    totalReceitas: 48750,
    receitasPrevistas: 12500,
    totalDespesas: 31200,
    despesasPrevistas: 8900,
    saldoAtual: 74303.88,
    emAtraso: 2,
  },
  caixa: {
    caixaAtual: 74303.88,
    saldoInvestido: 15000,
    caixaPrevisto: 77903.88,
    mesesDeCaixa: 8,
    receitasPendentesAcumuladas: 12500,
    despesasPendentesAcumuladas: 8900,
    itensPendentes: [],
  },
  healthStatus: "saudavel",
  monthlyChartData: [
    { name: "Set", receitas: 32000, despesas: 28000, investimentos: 0 },
    { name: "Out", receitas: 38000, despesas: 30000, investimentos: 5000 },
    { name: "Nov", receitas: 42000, despesas: 33000, investimentos: 0 },
    { name: "Dez", receitas: 55000, despesas: 40000, investimentos: 10000 },
    { name: "Jan", receitas: 45000, despesas: 35000, investimentos: 0 },
    { name: "Fev", receitas: 48750, despesas: 31200, investimentos: 0 },
  ],
  contasBancarias: [
    { id: "1", nome: "Conta Principal", banco: "Nubank", saldo_atual: 42303.88 },
    { id: "2", nome: "Conta Reserva", banco: "Inter", saldo_atual: 17000 },
    { id: "3", nome: "Investimentos", banco: "XP", saldo_atual: 15000 },
  ],
  lancamentosRecentes: [
    { id: "1", descricao: "Venda consultoria digital", tipo: "receita", valor: 8500, status: "recebido", data_vencimento: fmt(addDays(today, -2)), categoria: { nome: "Serviços" } },
    { id: "2", descricao: "Aluguel escritório", tipo: "despesa", valor: 3200, status: "pago", data_vencimento: fmt(addDays(today, -5)), categoria: { nome: "Infraestrutura" } },
    { id: "3", descricao: "Pagamento freelancer design", tipo: "despesa", valor: 2800, status: "pago", data_vencimento: fmt(addDays(today, -3)), categoria: { nome: "Terceiros" } },
    { id: "4", descricao: "Assinatura premium cliente", tipo: "receita", valor: 4200, status: "recebido", data_vencimento: fmt(addDays(today, -1)), categoria: { nome: "Recorrência" } },
    { id: "5", descricao: "Google Ads", tipo: "despesa", valor: 1500, status: "pago", data_vencimento: fmt(addDays(today, -4)), categoria: { nome: "Marketing" } },
  ],
  contasProximas: [
    { id: "c1", descricao: "Internet fibra óptica", valor: 299, data_vencimento: fmt(addDays(today, 3)) },
    { id: "c2", descricao: "Salário equipe", valor: 12000, data_vencimento: fmt(addDays(today, 5)) },
    { id: "c3", descricao: "Plataforma de email marketing", valor: 450, data_vencimento: fmt(addDays(today, 7)) },
    { id: "c4", descricao: "Contador mensal", valor: 800, data_vencimento: fmt(addDays(today, 10)) },
  ],
  receitasPendentes: [
    { id: "r1", descricao: "Projeto website empresa ABC", valor: 6500, data_vencimento: fmt(addDays(today, 4)) },
    { id: "r2", descricao: "Manutenção mensal — cliente X", valor: 3200, data_vencimento: fmt(addDays(today, 8)) },
    { id: "r3", descricao: "Consultoria estratégica", valor: 2800, data_vencimento: fmt(addDays(today, 12)) },
  ],
  lancamentos: [
    { id: "l1", descricao: "Venda consultoria digital", tipo: "receita", valor: 8500, status: "recebido", data_vencimento: fmt(addDays(today, -2)), data_pagamento: fmt(addDays(today, -2)), categoria: "Serviços", forma_pagamento: "PIX" },
    { id: "l2", descricao: "Aluguel escritório", tipo: "despesa", valor: 3200, status: "pago", data_vencimento: fmt(addDays(today, -5)), data_pagamento: fmt(addDays(today, -5)), categoria: "Infraestrutura", forma_pagamento: "Boleto" },
    { id: "l3", descricao: "Pagamento freelancer design", tipo: "despesa", valor: 2800, status: "pago", data_vencimento: fmt(addDays(today, -3)), data_pagamento: fmt(addDays(today, -3)), categoria: "Terceiros", forma_pagamento: "Transferência" },
    { id: "l4", descricao: "Assinatura premium cliente", tipo: "receita", valor: 4200, status: "recebido", data_vencimento: fmt(addDays(today, -1)), data_pagamento: fmt(addDays(today, -1)), categoria: "Recorrência", forma_pagamento: "Cartão" },
    { id: "l5", descricao: "Google Ads", tipo: "despesa", valor: 1500, status: "pago", data_vencimento: fmt(addDays(today, -4)), data_pagamento: fmt(addDays(today, -4)), categoria: "Marketing", forma_pagamento: "Cartão" },
    { id: "l6", descricao: "Projeto website empresa ABC", tipo: "receita", valor: 6500, status: "pendente", data_vencimento: fmt(addDays(today, 4)), data_pagamento: null, categoria: "Serviços", forma_pagamento: "PIX" },
    { id: "l7", descricao: "Salário equipe", tipo: "despesa", valor: 12000, status: "pendente", data_vencimento: fmt(addDays(today, 5)), data_pagamento: null, categoria: "Folha", forma_pagamento: "Transferência" },
    { id: "l8", descricao: "Manutenção mensal — cliente X", tipo: "receita", valor: 3200, status: "pendente", data_vencimento: fmt(addDays(today, 8)), data_pagamento: null, categoria: "Recorrência", forma_pagamento: "Boleto" },
  ],
  projetos: [
    { id: "p1", nome: "Redesign E-commerce ABC", status: "ativo", orcamento: 25000, descricao: "Redesign completo do e-commerce com foco em conversão" },
    { id: "p2", nome: "App Mobile FinTech", status: "ativo", orcamento: 45000, descricao: "Desenvolvimento de app mobile para gestão financeira" },
    { id: "p3", nome: "Campanha Black Friday", status: "concluido", orcamento: 8000, descricao: "Campanha de marketing digital para Black Friday 2024" },
  ],
  clientes: [
    { id: "cl1", nome: "Empresa ABC Ltda", email: "contato@abc.com.br", telefone: "(11) 99999-1234", cpf_cnpj: "12.345.678/0001-90" },
    { id: "cl2", nome: "João Silva MEI", email: "joao@email.com", telefone: "(21) 98888-5678", cpf_cnpj: "123.456.789-00" },
    { id: "cl3", nome: "TechStart Solutions", email: "admin@techstart.io", telefone: "(31) 97777-9012", cpf_cnpj: "98.765.432/0001-10" },
    { id: "cl4", nome: "Maria Consultoria", email: "maria@consultoria.com", telefone: "(41) 96666-3456", cpf_cnpj: "987.654.321-00" },
  ],
  fornecedores: [
    { id: "f1", nome: "AWS Cloud Services", email: "billing@aws.com", telefone: "", cpf_cnpj: "XX.XXX.XXX/0001-XX" },
    { id: "f2", nome: "Agência Criativa Digital", email: "contato@agencia.com", telefone: "(11) 3333-4444", cpf_cnpj: "11.222.333/0001-44" },
    { id: "f3", nome: "Coworking Hub", email: "admin@cowork.com.br", telefone: "(11) 2222-3333", cpf_cnpj: "55.666.777/0001-88" },
  ],
};

interface DemoContextType {
  isDemo: boolean;
  data: DemoData;
}

const DemoContext = createContext<DemoContextType>({ isDemo: false, data: demoData });

export const DemoProvider = ({ children }: { children: React.ReactNode }) => (
  <DemoContext.Provider value={{ isDemo: true, data: demoData }}>
    {children}
  </DemoContext.Provider>
);

export const useDemo = () => useContext(DemoContext);
