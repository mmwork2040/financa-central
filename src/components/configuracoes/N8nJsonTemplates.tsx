import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Check, Search, Plus, Trash2, Code2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface ToolParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ActionTemplate {
  action: string;
  toolName: string;
  label: string;
  description: string;
  toolDescription: string;
  category: string;
  params: ToolParam[];
  body: Record<string, any>;
}

const DEFAULT_TEMPLATES: ActionTemplate[] = [
  {
    action: "resumo-financeiro",
    toolName: "resumo_financeiro",
    label: "Resumo Financeiro",
    description: "Visão geral: receitas, despesas, saldo, vendas digitais e contas bancárias",
    toolDescription: `Consulta o resumo financeiro geral da empresa.

Use quando o usuário solicitar:
- Resumo financeiro
- Quanto gastei / recebi
- Saldo atual
- Visão geral das finanças

Parâmetros:
- empresa_id (obrigatório)
- periodo: semana, mes, trimestre, semestre ou ano
- data_inicio: YYYY-MM-DD
- data_fim: YYYY-MM-DD

REGRAS DE PERÍODO (OBRIGATÓRIAS):
1) Se o usuário informar data_inicio ou data_fim: preencha data_inicio e/ou data_fim. Envie periodo como "" (vazio).
2) Se o usuário informar um período (semana, mes, etc.): preencha periodo. Envie data_inicio e data_fim como "" (vazio).
3) Se não informar período nem datas: envie periodo como "mes". Envie data_inicio e data_fim como "" (vazio).

IMPORTANTE: Nunca omita campos do body. Campos não utilizados devem ser enviados como "" (string vazia).

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Resumos",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
    ],
    body: { action: "resumo-financeiro", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Padrão: mes') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}" },
  },
  {
    action: "lancamentos",
    toolName: "lancamentos",
    label: "Lançamentos",
    description: "Lista de lançamentos com filtros por tipo, status e categoria",
    toolDescription: `Consulta lançamentos financeiros (receitas e despesas).

Use quando o usuário solicitar:
- Lançamentos do mês
- Receitas ou despesas
- Contas a pagar / receber
- Movimentações financeiras

Parâmetros:
- empresa_id (obrigatório)
- periodo: semana, mes, trimestre, semestre ou ano
- data_inicio: YYYY-MM-DD
- data_fim: YYYY-MM-DD
- tipo: receita ou despesa (envie "" se não informado)
- status: pendente ou pago (envie "" se não informado)
- categoria_id: UUID da categoria (envie "" se não informado)
- limit: número (envie "" se não informado)

REGRAS DE PERÍODO (OBRIGATÓRIAS):
1) Se o usuário informar data_inicio ou data_fim: preencha data_inicio e/ou data_fim. Envie periodo como "" (vazio).
2) Se o usuário informar um período (semana, mes, etc.): preencha periodo. Envie data_inicio e data_fim como "" (vazio).
3) Se não informar período nem datas: envie periodo como "mes". Envie data_inicio e data_fim como "" (vazio).

IMPORTANTE: Nunca omita campos do body. Campos não utilizados devem ser enviados como "" (string vazia).

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
      { name: "tipo", type: "string", required: false, description: "Filtro: receita ou despesa" },
      { name: "status", type: "string", required: false, description: "Filtro: pendente ou pago" },
      { name: "categoria_id", type: "string", required: false, description: "UUID da categoria" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "lancamentos", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Padrão: mes') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}", tipo: "{{ $fromAI('tipo', 'Filtro: receita ou despesa. Deixe vazio para todos') }}", status: "{{ $fromAI('status', 'Filtro: pendente ou pago. Deixe vazio para todos') }}", categoria_id: "{{ $fromAI('categoria_id', 'UUID da categoria. Deixe vazio se não informado') }}", limit: "{{ $fromAI('limit', 'Limite de resultados. Deixe vazio para padrão') }}" },
  },
  {
    action: "despesas-pendentes",
    toolName: "despesas_pendentes",
    label: "Despesas Pendentes",
    description: "Lista de despesas com status pendente ordenadas por vencimento",
    toolDescription: `Consulta despesas pendentes de pagamento.

Use quando o usuário solicitar:
- Despesas pendentes
- Contas a pagar
- O que preciso pagar

Parâmetros:
- empresa_id (obrigatório)
- periodo: semana, mes, trimestre, semestre ou ano
- data_inicio: YYYY-MM-DD
- data_fim: YYYY-MM-DD
- limit: número (envie "" se não informado)

REGRAS DE PERÍODO (OBRIGATÓRIAS):
1) Se o usuário informar data_inicio ou data_fim: preencha data_inicio e/ou data_fim. Envie periodo como "" (vazio).
2) Se o usuário informar um período (semana, mes, etc.): preencha periodo. Envie data_inicio e data_fim como "" (vazio).
3) Se não informar período nem datas: envie periodo como "" (vazio) para listar todas as pendentes.

IMPORTANTE: Nunca omita campos do body. Campos não utilizados devem ser enviados como "" (string vazia).

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "despesas-pendentes", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Deixe vazio para listar todas') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}", limit: "{{ $fromAI('limit', 'Limite de resultados. Deixe vazio para padrão') }}" },
  },
  {
    action: "receitas-pendentes",
    toolName: "receitas_pendentes",
    label: "Receitas Pendentes",
    description: "Lista de receitas com status pendente ordenadas por vencimento",
    toolDescription: `Consulta receitas pendentes de recebimento.

Use quando o usuário solicitar:
- Receitas pendentes
- Contas a receber
- O que tenho para receber

Parâmetros:
- empresa_id (obrigatório)
- periodo: semana, mes, trimestre, semestre ou ano
- data_inicio: YYYY-MM-DD
- data_fim: YYYY-MM-DD
- limit: número (envie "" se não informado)

REGRAS DE PERÍODO (OBRIGATÓRIAS):
1) Se o usuário informar data_inicio ou data_fim: preencha data_inicio e/ou data_fim. Envie periodo como "" (vazio).
2) Se o usuário informar um período (semana, mes, etc.): preencha periodo. Envie data_inicio e data_fim como "" (vazio).
3) Se não informar período nem datas: envie periodo como "" (vazio) para listar todas as pendentes.

IMPORTANTE: Nunca omita campos do body. Campos não utilizados devem ser enviados como "" (string vazia).

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "receitas-pendentes", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Deixe vazio para listar todas') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}", limit: "{{ $fromAI('limit', 'Limite de resultados. Deixe vazio para padrão') }}" },
  },
  {
    action: "resumo-categorias",
    toolName: "resumo_categorias",
    label: "Resumo por Categorias",
    description: "Totais de receitas e despesas agrupados por categoria",
    toolDescription: `Consulta totais agrupados por categoria.

Use quando o usuário solicitar:
- Gastos por categoria
- Onde estou gastando mais
- Resumo por categoria

Parâmetros:
- empresa_id (obrigatório)
- periodo: semana, mes, trimestre, semestre ou ano
- data_inicio: YYYY-MM-DD
- data_fim: YYYY-MM-DD

REGRAS DE PERÍODO (OBRIGATÓRIAS):
1) Se o usuário informar data_inicio ou data_fim: preencha data_inicio e/ou data_fim. Envie periodo como "" (vazio).
2) Se o usuário informar um período (semana, mes, etc.): preencha periodo. Envie data_inicio e data_fim como "" (vazio).
3) Se não informar período nem datas: envie periodo como "mes". Envie data_inicio e data_fim como "" (vazio).

IMPORTANTE: Nunca omita campos do body. Campos não utilizados devem ser enviados como "" (string vazia).

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Resumos",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
    ],
    body: { action: "resumo-categorias", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Padrão: mes') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}" },
  },
  {
    action: "vendas-digitais",
    toolName: "vendas_digitais",
    label: "Vendas Digitais",
    description: "Vendas de plataformas externas com filtros por plataforma e status",
    toolDescription: `Consulta vendas realizadas em plataformas digitais.

Use quando o usuário solicitar:
- Vendas online
- Vendas Hotmart, Monetizze, Eduzz ou similiar
- Vendas digitais aprovadas
- Relatório de vendas digitais

Parâmetros:
- empresa_id (obrigatório)
- periodo: semana, mes, trimestre, semestre ou ano
- data_inicio: YYYY-MM-DD
- data_fim: YYYY-MM-DD
- plataforma: nome da plataforma (envie "" se não informado)
- status: status da venda (envie "" se não informado)
- limit: número (envie "" se não informado)

REGRAS DE PERÍODO (OBRIGATÓRIAS):
1) Se o usuário informar data_inicio ou data_fim: preencha data_inicio e/ou data_fim. Envie periodo como "" (vazio).
2) Se o usuário informar um período (semana, mes, etc.): preencha periodo. Envie data_inicio e data_fim como "" (vazio).
3) Se não informar período nem datas: envie periodo como "mes". Envie data_inicio e data_fim como "" (vazio).

IMPORTANTE: Nunca omita campos do body. Campos não utilizados devem ser enviados como "" (string vazia).

Não usar para recebimentos pendentes.

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Vendas",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
      { name: "plataforma", type: "string", required: false, description: "Nome da plataforma (ex: Hotmart, Kiwify)" },
      { name: "status", type: "string", required: false, description: "Status da venda (ex: aprovada, pendente)" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "vendas-digitais", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Padrão: mes') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}", plataforma: "{{ $fromAI('plataforma', 'Nome da plataforma ex: Hotmart, Kiwify. Deixe vazio para todas') }}", status: "{{ $fromAI('status', 'Status da venda ex: aprovada, pendente. Deixe vazio para todos') }}", limit: "{{ $fromAI('limit', 'Limite de resultados. Deixe vazio para padrão') }}" },
  },
  {
    action: "recebimentos-digitais",
    toolName: "recebimentos_digitais",
    label: "Recebimentos Digitais",
    description: "Recebimentos vinculados a vendas digitais",
    toolDescription: `Consulta recebimentos de vendas digitais.

Use quando o usuário solicitar:
- Recebimentos pendentes
- Quando vou receber
- Parcelas de vendas digitais

Parâmetros:
- empresa_id (obrigatório)
- periodo: semana, mes, trimestre, semestre ou ano
- data_inicio: YYYY-MM-DD
- data_fim: YYYY-MM-DD
- status: pendente ou recebido (envie "" se não informado)
- limit: número (envie "" se não informado)

REGRAS DE PERÍODO (OBRIGATÓRIAS):
1) Se o usuário informar data_inicio ou data_fim: preencha data_inicio e/ou data_fim. Envie periodo como "" (vazio).
2) Se o usuário informar um período (semana, mes, etc.): preencha periodo. Envie data_inicio e data_fim como "" (vazio).
3) Se não informar período nem datas: envie periodo como "" (vazio) para listar todos.

IMPORTANTE: Nunca omita campos do body. Campos não utilizados devem ser enviados como "" (string vazia).

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Vendas",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
      { name: "status", type: "string", required: false, description: "Status: pendente ou recebido" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "recebimentos-digitais", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Deixe vazio para listar todos') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}", status: "{{ $fromAI('status', 'Status: pendente ou recebido. Deixe vazio para todos') }}", limit: "{{ $fromAI('limit', 'Limite de resultados. Deixe vazio para padrão') }}" },
  },
  {
    action: "contas-bancarias",
    toolName: "contas_bancarias",
    label: "Contas Bancárias",
    description: "Lista de todas as contas bancárias e seus saldos",
    toolDescription: `Consulta contas bancárias e saldos.

Use quando o usuário solicitar:
- Saldo das contas
- Contas bancárias
- Quanto tenho no banco

Parâmetros:
- empresa_id

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
    ],
    body: { action: "contas-bancarias", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}" },
  },
  {
    action: "clientes",
    toolName: "clientes",
    label: "Clientes",
    description: "Lista de clientes com filtros de busca e status",
    toolDescription: `Consulta lista de clientes cadastrados.

Use quando o usuário solicitar:
- Lista de clientes
- Buscar cliente
- Clientes ativos

Parâmetros:
- empresa_id
- ativo
- search
- limit

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "ativo", type: "boolean", required: false, description: "Filtrar por status ativo" },
      { name: "search", type: "string", required: false, description: "Busca por nome" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "clientes", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", ativo: "{{ $fromAI('ativo', 'Filtrar por status ativo true ou false. Deixe vazio para todos') }}", search: "{{ $fromAI('search', 'Busca por nome. Deixe vazio para listar todos') }}", limit: "{{ $fromAI('limit', 'Limite de resultados. Deixe vazio para padrão') }}" },
  },
  {
    action: "fornecedores",
    toolName: "fornecedores",
    label: "Fornecedores",
    description: "Lista de fornecedores com filtros de busca e status",
    toolDescription: `Consulta lista de fornecedores cadastrados.

Use quando o usuário solicitar:
- Lista de fornecedores
- Buscar fornecedor
- Fornecedores ativos

Parâmetros:
- empresa_id
- ativo
- search
- limit

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "ativo", type: "boolean", required: false, description: "Filtrar por status ativo" },
      { name: "search", type: "string", required: false, description: "Busca por nome" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "fornecedores", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", ativo: "{{ $fromAI('ativo', 'Filtrar por status ativo true ou false. Deixe vazio para todos') }}", search: "{{ $fromAI('search', 'Busca por nome. Deixe vazio para listar todos') }}", limit: "{{ $fromAI('limit', 'Limite de resultados. Deixe vazio para padrão') }}" },
  },
  {
    action: "projetos",
    toolName: "projetos",
    label: "Projetos",
    description: "Lista de projetos com filtro por status",
    toolDescription: `Consulta projetos cadastrados.

Use quando o usuário solicitar:
- Lista de projetos
- Projetos ativos
- Status dos projetos

Parâmetros:
- empresa_id
- status
- limit

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "status", type: "string", required: false, description: "Status: ativo, concluido ou cancelado" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "projetos", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", status: "{{ $fromAI('status', 'Status: ativo, concluido ou cancelado. Deixe vazio para todos') }}", limit: "{{ $fromAI('limit', 'Limite de resultados. Deixe vazio para padrão') }}" },
  },
  {
    action: "categorias",
    toolName: "categorias",
    label: "Categorias",
    description: "Lista de todas as categorias cadastradas",
    toolDescription: `Consulta categorias cadastradas.

Use quando o usuário solicitar:
- Lista de categorias
- Categorias disponíveis

Parâmetros:
- empresa_id

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
    ],
    body: { action: "categorias", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}" },
  },
  {
    action: "formas-pagamento",
    toolName: "formas_pagamento",
    label: "Formas de Pagamento",
    description: "Lista de formas de pagamento cadastradas",
    toolDescription: `Consulta formas de pagamento cadastradas.

Use quando o usuário solicitar:
- Formas de pagamento
- Meios de pagamento disponíveis

Parâmetros:
- empresa_id

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
    ],
    body: { action: "formas-pagamento", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}" },
  },
  {
    action: "listar-opcoes-lancamento",
    toolName: "listar_opcoes_lancamento",
    label: "Opções para Lançamento",
    description: "Lista categorias, fornecedores, clientes, contas bancárias, formas de pagamento e projetos ativos",
    toolDescription: `Retorna todas as opções disponíveis para preencher um novo lançamento financeiro.

Use ANTES de criar um lançamento para obter os IDs válidos de:
- Categorias (receita/despesa)
- Fornecedores ativos
- Clientes ativos
- Contas bancárias
- Formas de pagamento
- Projetos ativos

Use quando o usuário solicitar:
- Registrar um lançamento (chame esta ferramenta primeiro para obter as opções)
- Quais categorias/fornecedores/contas disponíveis

Parâmetros:
- empresa_id

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
    ],
    body: { action: "listar-opcoes-lancamento", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}" },
  },
  {
    action: "fluxo-caixa",
    toolName: "fluxo_caixa",
    label: "Fluxo de Caixa",
    description: "Comparativo mensal de receitas vs despesas",
    toolDescription: `Consulta o fluxo de caixa comparativo mensal.

Use quando o usuário solicitar:
- Fluxo de caixa
- Comparativo mensal
- Evolução financeira

Parâmetros:
- empresa_id (obrigatório)
- periodo: semana, mes, trimestre, semestre ou ano
- data_inicio: YYYY-MM-DD
- data_fim: YYYY-MM-DD

REGRAS DE PERÍODO (OBRIGATÓRIAS):
1) Se o usuário informar data_inicio ou data_fim: preencha data_inicio e/ou data_fim. Envie periodo como "" (vazio).
2) Se o usuário informar um período (semana, mes, etc.): preencha periodo. Envie data_inicio e data_fim como "" (vazio).
3) Se não informar período nem datas: envie periodo como "semestre". Envie data_inicio e data_fim como "" (vazio).

IMPORTANTE: Nunca omita campos do body. Campos não utilizados devem ser enviados como "" (string vazia).

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Resumos",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
    ],
    body: { action: "fluxo-caixa", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Padrão: semestre') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}" },
  },
  {
    action: "criar-lancamento",
    toolName: "criar_lancamento",
    label: "Criar Lançamento",
    description: "Cria um novo lançamento financeiro (receita ou despesa)",
    toolDescription: `Cria um novo lançamento financeiro no sistema.

⚠️ IMPORTANTE: ANTES de usar esta ferramenta, você DEVE chamar a ferramenta "listar_opcoes_lancamento" para obter os IDs válidos de categorias, fornecedores, clientes, contas bancárias, formas de pagamento e projetos. NUNCA invente UUIDs — use apenas os retornados por listar_opcoes_lancamento.

Fluxo obrigatório:
1. Chame listar_opcoes_lancamento com a empresa_id
2. Apresente as opções ao usuário se necessário
3. Use os IDs retornados para preencher este lançamento

Use quando o usuário solicitar:
- Registrar uma despesa
- Registrar uma receita
- Lançar uma conta
- Adicionar um gasto

Parâmetros:
- empresa_id (obrigatório)
- descricao (obrigatório)
- valor (obrigatório)
- data_vencimento (obrigatório, formato YYYY-MM-DD)
- tipo (receita ou despesa, padrão: despesa)
- status (pendente ou pago, padrão: pendente)
- categoria_id, cliente_id, fornecedor_id, conta_bancaria_id, forma_pagamento_id, projeto_id (opcionais — use IDs de listar_opcoes_lancamento)
- data_pagamento (opcional, formato YYYY-MM-DD)

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "descricao", type: "string", required: true, description: "Descrição do lançamento" },
      { name: "valor", type: "number", required: true, description: "Valor do lançamento" },
      { name: "data_vencimento", type: "string", required: true, description: "Data de vencimento (YYYY-MM-DD)" },
      { name: "tipo", type: "string", required: false, description: "receita ou despesa (padrão: despesa)" },
      { name: "status", type: "string", required: false, description: "pendente ou pago (padrão: pendente)" },
      { name: "categoria_id", type: "string", required: false, description: "UUID da categoria" },
      { name: "cliente_id", type: "string", required: false, description: "UUID do cliente" },
      { name: "fornecedor_id", type: "string", required: false, description: "UUID do fornecedor" },
      { name: "conta_bancaria_id", type: "string", required: false, description: "UUID da conta bancária" },
      { name: "forma_pagamento_id", type: "string", required: false, description: "UUID da forma de pagamento" },
      { name: "projeto_id", type: "string", required: false, description: "UUID do projeto" },
      { name: "data_pagamento", type: "string", required: false, description: "Data de pagamento (YYYY-MM-DD)" },
    ],
    body: { action: "criar-lancamento", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", descricao: "{{ $fromAI('descricao', 'Descrição do lançamento') }}", valor: "{{ $fromAI('valor', 'Valor numérico do lançamento') }}", data_vencimento: "{{ $fromAI('data_vencimento', 'Data de vencimento YYYY-MM-DD') }}", tipo: "{{ $fromAI('tipo', 'receita ou despesa') }}", status: "{{ $fromAI('status', 'pendente ou pago') }}" },
  },
  {
    action: "atualizar-telegram-id",
    toolName: "atualizar_telegram_id",
    label: "Atualizar Telegram do Usuário",
    description: "Atualiza o telegram_id de um usuário no sistema",
    toolDescription: `Atualiza o ID do Telegram de um usuário.

Use quando o usuário solicitar:
- Vincular Telegram
- Salvar ID do Telegram
- Atualizar identificador Telegram

Parâmetros:
- empresa_id (obrigatório)
- telegram_id (obrigatório)
- user_id ou email (um dos dois é obrigatório para identificar o usuário)

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "telegram_id", type: "string", required: true, description: "ID do Telegram do usuário" },
      { name: "user_id", type: "string", required: false, description: "UUID do usuário" },
      { name: "email", type: "string", required: false, description: "Email do usuário" },
    ],
    body: { action: "atualizar-telegram-id", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", telegram_id: "{{ $fromAI('telegram_id', 'ID do Telegram do usuário') }}", user_id: "{{ $fromAI('user_id', 'UUID do usuário') }}", email: "{{ $fromAI('email', 'Email do usuário') }}" },
  },
  {
    action: "atualizar-telegram-cliente",
    toolName: "atualizar_telegram_cliente",
    label: "Atualizar Telegram do Cliente",
    description: "Atualiza o telegram_id de um cliente no sistema",
    toolDescription: `Atualiza o ID do Telegram de um cliente.

Use quando o usuário solicitar:
- Vincular Telegram do cliente
- Salvar ID do Telegram do cliente

Parâmetros:
- empresa_id (obrigatório)
- telegram_id (obrigatório)
- cliente_id, email ou telefone (um deles é obrigatório para identificar o cliente)

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "telegram_id", type: "string", required: true, description: "ID do Telegram do cliente" },
      { name: "cliente_id", type: "string", required: false, description: "UUID do cliente" },
      { name: "email", type: "string", required: false, description: "Email do cliente" },
      { name: "telefone", type: "string", required: false, description: "Telefone do cliente" },
    ],
    body: { action: "atualizar-telegram-cliente", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", telegram_id: "{{ $fromAI('telegram_id', 'ID do Telegram do cliente') }}", cliente_id: "{{ $fromAI('cliente_id', 'UUID do cliente') }}", email: "{{ $fromAI('email', 'Email do cliente') }}", telefone: "{{ $fromAI('telefone', 'Telefone do cliente') }}" },
  },
  {
    action: "listar-anuncios",
    toolName: "listar_anuncios",
    label: "Listar Anúncios",
    description: "Consulta integrações de anúncios e performance de vendas por plataforma",
    toolDescription: `Consulta dados de anúncios e integrações de ads da empresa.

Use quando o usuário solicitar:
- Anúncios ativos
- Performance de anúncios
- Meta Ads / Google Ads
- ROAS das campanhas
- Investimento em anúncios

Parâmetros:
- empresa_id (obrigatório)
- periodo: semana, mes, trimestre, semestre ou ano
- data_inicio: YYYY-MM-DD
- data_fim: YYYY-MM-DD
- plataforma: meta_ads, google_ads (envie "" se não informado)

REGRAS DE PERÍODO (OBRIGATÓRIAS):
1) Se o usuário informar data_inicio ou data_fim: preencha data_inicio e/ou data_fim. Envie periodo como "" (vazio).
2) Se o usuário informar um período (semana, mes, etc.): preencha periodo. Envie data_inicio e data_fim como "" (vazio).
3) Se não informar período nem datas: envie periodo como "mes". Envie data_inicio e data_fim como "" (vazio).

IMPORTANTE: Nunca omita campos do body. Campos não utilizados devem ser enviados como "" (string vazia).

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Vendas",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
      { name: "plataforma", type: "string", required: false, description: "Plataforma (ex: meta_ads, google_ads)" },
    ],
    body: { action: "listar-anuncios", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Padrão: mes') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}", plataforma: "{{ $fromAI('plataforma', 'Plataforma ex: meta_ads, google_ads. Deixe vazio para todas') }}" },
  },
  {
    action: "listar-usuarios",
    toolName: "listar_usuarios",
    label: "Listar Usuários",
    description: "Lista usuários da empresa com filtros por nome e permissão",
    toolDescription: `Consulta usuários cadastrados na empresa.

Use quando o usuário solicitar:
- Lista de usuários
- Quem tem acesso
- Usuários da empresa
- Buscar usuário

Parâmetros:
- empresa_id
- search (busca por nome)
- permissao (admin, editor ou leitura)
- limit

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "search", type: "string", required: false, description: "Busca por nome" },
      { name: "permissao", type: "string", required: false, description: "Filtro: admin, editor ou leitura" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "listar-usuarios", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", search: "{{ $fromAI('search', 'Busca por nome. Deixe vazio para listar todos') }}", permissao: "{{ $fromAI('permissao', 'Filtro: admin, editor ou leitura. Deixe vazio para todos') }}", limit: "{{ $fromAI('limit', 'Limite de resultados. Deixe vazio para padrão') }}" },
  },
  {
    action: "criar-fornecedor",
    toolName: "criar_fornecedor",
    label: "Criar Fornecedor",
    description: "Cadastra um novo fornecedor no sistema",
    toolDescription: `Cadastra um novo fornecedor.

Use quando o usuário solicitar:
- Cadastrar fornecedor
- Adicionar fornecedor
- Registrar fornecedor

⚠️ IMPORTANTE: O campo "nome" é obrigatório. Os demais campos são opcionais.

Parâmetros:
- empresa_id (obrigatório)
- nome (obrigatório)
- cpf_cnpj, telefone, email, cep, rua, numero, complemento, bairro, cidade, estado (opcionais)
- ativo (padrão: true)

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "nome", type: "string", required: true, description: "Nome do fornecedor" },
      { name: "cpf_cnpj", type: "string", required: false, description: "CPF ou CNPJ" },
      { name: "telefone", type: "string", required: false, description: "Telefone" },
      { name: "email", type: "string", required: false, description: "E-mail" },
      { name: "cep", type: "string", required: false, description: "CEP" },
      { name: "rua", type: "string", required: false, description: "Rua" },
      { name: "numero", type: "string", required: false, description: "Número" },
      { name: "complemento", type: "string", required: false, description: "Complemento" },
      { name: "bairro", type: "string", required: false, description: "Bairro" },
      { name: "cidade", type: "string", required: false, description: "Cidade" },
      { name: "estado", type: "string", required: false, description: "Estado (UF)" },
      { name: "ativo", type: "boolean", required: false, description: "Ativo (padrão: true)" },
    ],
    body: { action: "criar-fornecedor", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", nome: "{{ $fromAI('nome', 'Nome do fornecedor') }}", cpf_cnpj: "{{ $fromAI('cpf_cnpj', 'CPF ou CNPJ') }}", telefone: "{{ $fromAI('telefone', 'Telefone') }}", email: "{{ $fromAI('email', 'Email') }}", cep: "{{ $fromAI('cep', 'CEP') }}", rua: "{{ $fromAI('rua', 'Rua') }}", numero: "{{ $fromAI('numero', 'Número') }}", complemento: "{{ $fromAI('complemento', 'Complemento') }}", bairro: "{{ $fromAI('bairro', 'Bairro') }}", cidade: "{{ $fromAI('cidade', 'Cidade') }}", estado: "{{ $fromAI('estado', 'Estado UF') }}" },
  },
  {
    action: "criar-categoria",
    toolName: "criar_categoria",
    label: "Criar Categoria",
    description: "Cadastra uma nova categoria financeira no sistema",
    toolDescription: `Cadastra uma nova categoria financeira.

Use quando o usuário solicitar:
- Cadastrar categoria
- Adicionar categoria
- Criar categoria de despesa/receita

Parâmetros:
- empresa_id (obrigatório)
- nome (obrigatório)
- tipo (receita, despesa ou investimento — padrão: despesa)

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "nome", type: "string", required: true, description: "Nome da categoria" },
      { name: "tipo", type: "string", required: false, description: "receita, despesa ou investimento (padrão: despesa)" },
    ],
    body: { action: "criar-categoria", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", nome: "{{ $fromAI('nome', 'Nome da categoria') }}", tipo: "{{ $fromAI('tipo', 'receita, despesa ou investimento') }}" },
  },
  {
    action: "criar-conta-bancaria",
    toolName: "criar_conta_bancaria",
    label: "Criar Conta Bancária",
    description: "Cadastra uma nova conta bancária no sistema",
    toolDescription: `Cadastra uma nova conta bancária.

Use quando o usuário solicitar:
- Cadastrar conta bancária
- Adicionar conta no banco
- Registrar conta bancária

Parâmetros:
- empresa_id (obrigatório)
- nome (obrigatório)
- banco, agencia, conta (opcionais)
- saldo_inicial (numérico, padrão: 0)
- principal (boolean, padrão: false — se true, desmarca a principal anterior)

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "nome", type: "string", required: true, description: "Nome da conta" },
      { name: "banco", type: "string", required: false, description: "Nome do banco" },
      { name: "agencia", type: "string", required: false, description: "Número da agência" },
      { name: "conta", type: "string", required: false, description: "Número da conta" },
      { name: "saldo_inicial", type: "number", required: false, description: "Saldo inicial (padrão: 0)" },
      { name: "principal", type: "boolean", required: false, description: "Conta principal (padrão: false)" },
    ],
    body: { action: "criar-conta-bancaria", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", nome: "{{ $fromAI('nome', 'Nome da conta') }}", banco: "{{ $fromAI('banco', 'Nome do banco') }}", agencia: "{{ $fromAI('agencia', 'Número da agência') }}", conta: "{{ $fromAI('conta', 'Número da conta') }}", saldo_inicial: "{{ $fromAI('saldo_inicial', 'Saldo inicial numérico') }}", principal: "{{ $fromAI('principal', 'true ou false') }}" },
  },
  {
    action: "criar-forma-pagamento",
    toolName: "criar_forma_pagamento",
    label: "Criar Forma de Pagamento",
    description: "Cadastra uma nova forma de pagamento no sistema",
    toolDescription: `Cadastra uma nova forma de pagamento.

Use quando o usuário solicitar:
- Cadastrar forma de pagamento
- Adicionar meio de pagamento
- Registrar forma de pagamento (ex: PIX, Boleto, Cartão)

Parâmetros:
- empresa_id (obrigatório)
- descricao (obrigatório — ex: PIX, Boleto, Cartão de Crédito)

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "descricao", type: "string", required: true, description: "Descrição da forma de pagamento (ex: PIX, Boleto)" },
    ],
    body: { action: "criar-forma-pagamento", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", descricao: "{{ $fromAI('descricao', 'Descrição da forma de pagamento') }}" },
  },
  {
    action: "criar-projeto",
    toolName: "criar_projeto",
    label: "Criar Projeto",
    description: "Cadastra um novo projeto no sistema",
    toolDescription: `Cadastra um novo projeto.

Use quando o usuário solicitar:
- Cadastrar projeto
- Adicionar projeto
- Criar novo projeto

Parâmetros:
- empresa_id (obrigatório)
- nome (obrigatório)
- descricao (opcional)
- status (ativo, concluido ou cancelado — padrão: ativo)
- orcamento (numérico, padrão: 0)

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "nome", type: "string", required: true, description: "Nome do projeto" },
      { name: "descricao", type: "string", required: false, description: "Descrição do projeto" },
      { name: "status", type: "string", required: false, description: "ativo, concluido ou cancelado (padrão: ativo)" },
      { name: "orcamento", type: "number", required: false, description: "Orçamento do projeto (padrão: 0)" },
    ],
    body: { action: "criar-projeto", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", nome: "{{ $fromAI('nome', 'Nome do projeto') }}", descricao: "{{ $fromAI('descricao', 'Descrição do projeto') }}", status: "{{ $fromAI('status', 'ativo, concluido ou cancelado') }}", orcamento: "{{ $fromAI('orcamento', 'Orçamento numérico do projeto') }}" },
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Resumos": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "Financeiro": "bg-green-500/10 text-green-700 dark:text-green-400",
  "Vendas": "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  "Cadastros": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  "Personalizado": "bg-pink-500/10 text-pink-700 dark:text-pink-400",
};

const N8nJsonTemplates = () => {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [customTemplates, setCustomTemplates] = useState<ActionTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("n8n-custom-templates-v3");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ action: "", label: "", description: "", json: "{}" });

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];
  const categories = [...new Set(allTemplates.map(t => t.category))];

  const filtered = allTemplates.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.action.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (action: string) => {
    setExpandedActions(prev => {
      const next = new Set(prev);
      next.has(action) ? next.delete(action) : next.add(action);
      return next;
    });
  };

  const handleAddCustom = () => {
    if (!newTemplate.action || !newTemplate.label) {
      toast.error("Preencha pelo menos a action e o label.");
      return;
    }
    let parsedJson: Record<string, any>;
    try {
      parsedJson = JSON.parse(newTemplate.json);
    } catch {
      toast.error("JSON inválido.");
      return;
    }
    const custom: ActionTemplate = {
      action: newTemplate.action,
      toolName: newTemplate.action.replace(/-/g, "_"),
      label: newTemplate.label,
      description: newTemplate.description || "Template personalizado",
      toolDescription: newTemplate.description || "Template personalizado",
      category: "Personalizado",
      params: [{ name: "empresa_id", type: "string", required: true, description: "UUID da empresa" }],
      body: parsedJson,
    };
    const updated = [...customTemplates, custom];
    setCustomTemplates(updated);
    localStorage.setItem("n8n-custom-templates-v3", JSON.stringify(updated));
    setNewTemplate({ action: "", label: "", description: "", json: "{}" });
    setShowAddForm(false);
    toast.success("Template personalizado adicionado!");
  };

  const handleRemoveCustom = (action: string) => {
    const updated = customTemplates.filter(t => t.action !== action);
    setCustomTemplates(updated);
    localStorage.setItem("n8n-custom-templates-v3", JSON.stringify(updated));
    toast.success("Template removido.");
  };

  const realEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-query`;

  return (
    <div className="space-y-6">
      {/* Header info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <Code2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Endpoint n8n-query</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background/80 px-2 py-1 rounded border font-mono break-all">
                  POST {realEndpoint}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleCopy(realEndpoint, "endpoint")}
                >
                  {copiedId === "endpoint" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Períodos: <code className="text-[11px]">semana</code> · <code className="text-[11px]">mes</code> · <code className="text-[11px]">trimestre</code> · <code className="text-[11px]">semestre</code> · <code className="text-[11px]">ano</code> · ou datas personalizadas via <code className="text-[11px]">data_inicio</code> / <code className="text-[11px]">data_fim</code> (YYYY-MM-DD)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruções do HTTP Request Tool */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="h-4 w-4 text-amber-600" />
            Como configurar cada HTTP Request Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">No nó HTTP Request Tool (Parameters):</p>
            <ol className="list-decimal list-inside ml-2 space-y-0.5">
              <li><strong>Description:</strong> Copie da aba <em>"Descrição"</em> abaixo</li>
              <li><strong>Method:</strong> POST</li>
              <li><strong>URL:</strong> Cole o endpoint acima</li>
              <li><strong>Send Query Parameters:</strong> OFF (não necessário)</li>
              <li><strong>Send Headers:</strong> ON → Name: <code className="text-[11px] bg-background px-1 rounded">apikey</code> · Value: sua anon key</li>
              <li><strong>Send Body:</strong> ON</li>
              <li><strong>Body Content Type:</strong> JSON</li>
              <li><strong>Specify Body:</strong> <strong>"Using JSON"</strong></li>
              <li><strong>JSON:</strong> Cole da aba <em>"Body JSON"</em> abaixo (os <code className="text-[11px] bg-background px-1 rounded">{"{{ $fromAI() }}"}</code> serão preenchidos pelo agente)</li>
            </ol>
          </div>
          <div className="mt-2 p-2 rounded border border-red-500/20 bg-red-500/5">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              ⚠️ NÃO use "Defined automatically by the model" no Specify Body — o campo <code className="text-[11px]">action</code> ficará ausente e causará erro.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-1.5 whitespace-nowrap">
          <Plus className="h-4 w-4" /> Novo Template
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Novo Template Personalizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="action (ex: meus-dados)" value={newTemplate.action} onChange={e => setNewTemplate(p => ({ ...p, action: e.target.value }))} />
              <Input placeholder="Label (ex: Meus Dados)" value={newTemplate.label} onChange={e => setNewTemplate(p => ({ ...p, label: e.target.value }))} />
            </div>
            <Input placeholder="Descrição" value={newTemplate.description} onChange={e => setNewTemplate(p => ({ ...p, description: e.target.value }))} />
            <textarea
              className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder='{"action":"minha-action","empresa_id":"{{ $json.empresa_id }}"}'
              value={newTemplate.json}
              onChange={e => setNewTemplate(p => ({ ...p, json: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAddCustom}>Adicionar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates by category */}
      {categories.map(category => {
        const categoryTemplates = filtered.filter(t => t.category === category);
        if (categoryTemplates.length === 0) return null;
        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={CATEGORY_COLORS[category] || ""}>
                {category}
              </Badge>
              <span className="text-xs text-muted-foreground">{categoryTemplates.length} tool(s)</span>
            </div>
            <div className="grid gap-2">
              {categoryTemplates.map(template => {
                const isExpanded = expandedActions.has(template.action);
                const isCustom = customTemplates.some(c => c.action === template.action);
                const bodyStr = JSON.stringify(template.body, null, 2);
                return (
                  <Card key={template.action} className="overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpand(template.action)}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{template.label}</span>
                          <code className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{template.toolName}</code>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        {isCustom && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveCustom(template.action)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t bg-muted/30 px-4 py-3">
                        <Tabs defaultValue="description" className="w-full">
                          <TabsList className="h-8 mb-3">
                            <TabsTrigger value="description" className="text-xs px-3 h-7">Descrição</TabsTrigger>
                            <TabsTrigger value="body" className="text-xs px-3 h-7">Body JSON</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="description" className="mt-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-muted-foreground">Cole no campo <strong>Description</strong> do HTTP Request Tool</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => handleCopy(template.toolDescription, `desc-${template.action}`)}
                              >
                                {copiedId === `desc-${template.action}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                Copiar
                              </Button>
                            </div>
                            <pre className="text-xs font-mono bg-background/80 rounded border p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto">
                              {template.toolDescription}
                            </pre>
                          </TabsContent>

                          <TabsContent value="body" className="mt-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-muted-foreground">
                                Specify Body → <strong>"Using JSON"</strong> → cole este JSON. Os <code className="text-[10px] bg-background px-1 rounded">{"{{ $fromAI() }}"}</code> são preenchidos automaticamente pelo agente de IA:
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => handleCopy(bodyStr, `body-${template.action}`)}
                              >
                                {copiedId === `body-${template.action}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                Copiar
                              </Button>
                            </div>
                            <pre className="text-xs font-mono bg-background/80 rounded border p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-[250px] overflow-y-auto">
                              {bodyStr}
                            </pre>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nenhum template encontrado para "{search}"
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default N8nJsonTemplates;
