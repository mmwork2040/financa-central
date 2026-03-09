import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Check, Search, Plus, Trash2, Code2, ChevronDown, ChevronRight, FolderOpen, FolderClosed } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
- user_id (obrigatório — UUID do usuário para controle de permissões)
- periodo: semana, mes, trimestre, semestre ou ano
- data_inicio: YYYY-MM-DD
- data_fim: YYYY-MM-DD

REGRAS DE PERÍODO (OBRIGATÓRIAS):
1) Se o usuário informar data_inicio ou data_fim: preencha data_inicio e/ou data_fim. Envie periodo como "" (vazio).
2) Se o usuário informar um período (semana, mes, etc.): preencha periodo. Envie data_inicio e data_fim como "" (vazio).
3) Se não informar período nem datas: envie periodo como "mes". Envie data_inicio e data_fim como "" (vazio).

IMPORTANTE: Nunca omita campos do body. Campos não utilizados devem ser enviados como "" (string vazia).
CONTROLE DE ACESSO: Sempre envie o user_id para que o sistema valide as permissões do usuário.

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Resumos",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "user_id", type: "string", required: true, description: "UUID do usuário (controle de permissões)" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
    ],
    body: { action: "resumo-financeiro", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", user_id: "{{ $fromAI('user_id', 'UUID do usuário para controle de permissões') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Padrão: mes') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}" },
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

CONTROLE DE ACESSO: Sempre envie o user_id do usuário solicitante. O sistema verificará se o usuário tem permissão de visualização para vendas digitais.

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Vendas",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "user_id", type: "string", required: true, description: "UUID do usuário solicitante (para controle de acesso)" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
      { name: "plataforma", type: "string", required: false, description: "Nome da plataforma (ex: Hotmart, Kiwify)" },
      { name: "status", type: "string", required: false, description: "Status da venda (ex: aprovada, pendente)" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "vendas-digitais", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", user_id: "{{ $fromAI('user_id', 'UUID do usuário solicitante') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Padrão: mes') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}", plataforma: "{{ $fromAI('plataforma', 'Nome da plataforma ex: Hotmart, Kiwify. Deixe vazio para todas') }}", status: "{{ $fromAI('status', 'Status da venda ex: aprovada, pendente. Deixe vazio para todos') }}", limit: "{{ $fromAI('limit', 'Limite de resultados. Deixe vazio para padrão') }}" },
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
- Buscar conta bancária

Parâmetros:
- empresa_id
- search (busca por nome)

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "search", type: "string", required: false, description: "Busca por nome" },
    ],
    body: { action: "contas-bancarias", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", search: "{{ $fromAI('search', 'Busca por nome. Deixe vazio para listar todos') }}" },
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
- Buscar projeto

Parâmetros:
- empresa_id
- search (busca por nome)
- status
- limit

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "search", type: "string", required: false, description: "Busca por nome" },
      { name: "status", type: "string", required: false, description: "Status: ativo, concluido ou cancelado" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "projetos", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", search: "{{ $fromAI('search', 'Busca por nome. Deixe vazio para listar todos') }}", status: "{{ $fromAI('status', 'Status: ativo, concluido ou cancelado. Deixe vazio para todos') }}", limit: "{{ $fromAI('limit', 'Limite de resultados. Deixe vazio para padrão') }}" },
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
- Buscar categoria

Parâmetros:
- empresa_id
- search (busca por nome)

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "search", type: "string", required: false, description: "Busca por nome" },
    ],
    body: { action: "categorias", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", search: "{{ $fromAI('search', 'Busca por nome. Deixe vazio para listar todos') }}" },
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
- Buscar forma de pagamento

Parâmetros:
- empresa_id
- search (busca por descrição)

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "search", type: "string", required: false, description: "Busca por descrição" },
    ],
    body: { action: "formas-pagamento", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", search: "{{ $fromAI('search', 'Busca por descrição. Deixe vazio para listar todos') }}" },
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
    description: "Cria um lançamento financeiro completo — resolve dependências automaticamente por nome. Suporta recorrência e parcelamento.",
    toolDescription: `Cria um novo lançamento financeiro no sistema. Esta ferramenta resolve TUDO automaticamente.

REGRA CRÍTICA — CAMPOS PERMITIDOS:
- Envie APENAS os campos listados abaixo. NÃO invente campos extras.

RESOLUÇÃO AUTOMÁTICA DE DEPENDÊNCIAS:
- Para cada campo obrigatório (categoria, cliente, fornecedor, conta bancária, forma de pagamento), você pode enviar:
  a) O UUID direto (_id), OU
  b) O NOME (_nome) — o sistema buscará pelo nome. Se não existir, CADASTRARÁ automaticamente.
- Exemplo: em vez de categoria_id, envie categoria_nome: "Alimentação". O sistema busca ou cria.
- conta_bancaria_nome busca pelo campo "nome" E pelo campo "banco" (ex: "Santander" encontra a conta cujo banco é Santander).
- NUNCA inclua agência ou número da conta no campo conta_bancaria_nome. Use SOMENTE o nome do banco.
- Se o usuário informar agência e/ou número da conta, envie nos campos separados: conta_bancaria_agencia e conta_bancaria_conta.
- Se o usuário informar o nome do banco separado do nome da conta, envie conta_bancaria_banco para o nome do banco.

CAMPOS OBRIGATÓRIOS:
- empresa_id, descricao, valor, data_vencimento, tipo (receita ou despesa)
- categoria: envie categoria_id OU categoria_nome
- forma_pagamento: envie forma_pagamento_id OU forma_pagamento_nome
- conta_bancaria: envie conta_bancaria_id OU conta_bancaria_nome
- Se tipo = "receita": envie cliente_id OU cliente_nome
- Se tipo = "despesa": envie fornecedor_id OU fornecedor_nome

VALOR:
- Envie SEMPRE como número puro (ex: 500, 3000.50). NÃO use formato brasileiro "3.000,00".

STATUS AUTOMÁTICO:
- Se data_pagamento for informada e status não for enviado, o sistema define automaticamente:
  - receita → "recebido"
  - despesa → "pago"
- Se data_pagamento NÃO for informada, status padrão = "pendente"

RECORRÊNCIA E PARCELAMENTO:
- Para lançamentos recorrentes, envie:
  - recorrente: true
  - recorrencia_tipo: semanal, quinzenal, mensal (padrão), trimestral ou anual
  - recorrencia_inicio: YYYY-MM-DD (data de início, aceita retroativas. Se vazio, usa data_vencimento)
  - recorrencia_fim: YYYY-MM-DD (data fim, vazio = indefinido)
- Para parcelamento, envie:
  - total_parcelas: número de parcelas (ex: 12). O valor será dividido automaticamente.
- Recorrente e parcelado são MUTUAMENTE EXCLUSIVOS. Não envie ambos.

CAMPOS OPCIONAIS:
- status (pendente, pago, recebido — se não informado, é calculado automaticamente)
- projeto_id, data_pagamento
- recorrente, recorrencia_tipo, recorrencia_inicio, recorrencia_fim
- total_parcelas
- conta_bancaria_agencia, conta_bancaria_conta, conta_bancaria_banco
- cliente_cpf_cnpj, fornecedor_cpf_cnpj

FLUXO SIMPLIFICADO:
1. Pergunte ao usuário: descrição, valor, tipo (receita/despesa), data, categoria, forma de pagamento, conta bancária, e cliente/fornecedor.
2. Se o usuário mencionar "todo mês", "mensal", "recorrente", pergunte frequência e data fim.
3. Se o usuário mencionar "parcelado" ou "em X vezes", envie total_parcelas.
4. Chame criar_lancamento com os NOMES informados pelo usuário nos campos _nome.
5. O sistema resolve tudo e retorna o lançamento criado + registros_criados (se houver).

Sempre usar a empresa_id ativa. Nunca misturar empresas.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "descricao", type: "string", required: true, description: "Descrição do lançamento" },
      { name: "valor", type: "number", required: true, description: "Valor numérico puro (ex: 500, 1500.99). NÃO use formato brasileiro" },
      { name: "data_vencimento", type: "string", required: true, description: "Data de vencimento (YYYY-MM-DD)" },
      { name: "tipo", type: "string", required: true, description: "OBRIGATÓRIO: receita ou despesa" },
      { name: "status", type: "string", required: false, description: "pendente, pago ou recebido. Se omitido: auto-definido pela data_pagamento" },
      { name: "recorrente", type: "boolean", required: false, description: "true para lançamento recorrente. Padrão: false" },
      { name: "recorrencia_tipo", type: "string", required: false, description: "semanal, quinzenal, mensal (padrão), trimestral ou anual" },
      { name: "recorrencia_inicio", type: "string", required: false, description: "Data de início da recorrência YYYY-MM-DD (aceita retroativas). Se vazio, usa data_vencimento" },
      { name: "recorrencia_fim", type: "string", required: false, description: "Data fim da recorrência YYYY-MM-DD. Vazio = indefinido" },
      { name: "total_parcelas", type: "number", required: false, description: "Número de parcelas. Valor dividido automaticamente. Mutuamente exclusivo com recorrente" },
      { name: "categoria_id", type: "string", required: false, description: "UUID da categoria (use se já souber o ID)" },
      { name: "categoria_nome", type: "string", required: false, description: "Nome da categoria (busca ou cria automaticamente)" },
      { name: "cliente_id", type: "string", required: false, description: "UUID do cliente (obrigatório se receita)" },
      { name: "cliente_nome", type: "string", required: false, description: "Nome do cliente (busca ou cria, obrigatório se receita)" },
      { name: "cliente_cpf_cnpj", type: "string", required: false, description: "CPF ou CNPJ do cliente (usado ao criar novo cliente)" },
      { name: "fornecedor_id", type: "string", required: false, description: "UUID do fornecedor (obrigatório se despesa)" },
      { name: "fornecedor_nome", type: "string", required: false, description: "Nome do fornecedor (busca ou cria, obrigatório se despesa)" },
      { name: "fornecedor_cpf_cnpj", type: "string", required: false, description: "CPF ou CNPJ do fornecedor (usado ao criar novo fornecedor)" },
      { name: "forma_pagamento_id", type: "string", required: false, description: "UUID da forma de pagamento" },
      { name: "forma_pagamento_nome", type: "string", required: false, description: "Nome da forma de pagamento (busca ou cria)" },
      { name: "conta_bancaria_id", type: "string", required: false, description: "UUID da conta bancária" },
      { name: "conta_bancaria_nome", type: "string", required: false, description: "SOMENTE o nome do banco (ex: Santander, Itaú, Nubank). NÃO inclua agência ou número da conta" },
      { name: "conta_bancaria_banco", type: "string", required: false, description: "Nome do banco (ex: Itaú). Usado ao criar nova conta se diferente do nome" },
      { name: "conta_bancaria_agencia", type: "string", required: false, description: "Número da agência bancária (usado ao criar nova conta)" },
      { name: "conta_bancaria_conta", type: "string", required: false, description: "Número da conta bancária (usado ao criar nova conta)" },
      { name: "projeto_id", type: "string", required: false, description: "UUID do projeto (opcional)" },
      { name: "data_pagamento", type: "string", required: false, description: "Data de pagamento (YYYY-MM-DD). Se informada, status será auto-definido como pago/recebido" },
    ],
    body: { action: "criar-lancamento", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", descricao: "{{ $fromAI('descricao', 'Descrição do lançamento') }}", valor: "{{ $fromAI('valor', 'Valor numérico puro. Ex: 500, 1500.99. NUNCA use formato brasileiro') }}", data_vencimento: "{{ $fromAI('data_vencimento', 'Data de vencimento YYYY-MM-DD') }}", tipo: "{{ $fromAI('tipo', 'OBRIGATÓRIO: receita ou despesa') }}", status: "{{ $fromAI('status', 'pendente, pago ou recebido. Deixe vazio para auto-definir pela data_pagamento') }}", recorrente: "{{ $fromAI('recorrente', 'true para recorrente, false ou vazio para único') }}", recorrencia_tipo: "{{ $fromAI('recorrencia_tipo', 'semanal, quinzenal, mensal, trimestral ou anual. Padrão: mensal. Deixe vazio se não recorrente') }}", recorrencia_inicio: "{{ $fromAI('recorrencia_inicio', 'Data início recorrência YYYY-MM-DD. Aceita retroativas. Vazio = usa data_vencimento') }}", recorrencia_fim: "{{ $fromAI('recorrencia_fim', 'Data fim recorrência YYYY-MM-DD. Vazio = indefinido') }}", total_parcelas: "{{ $fromAI('total_parcelas', 'Número de parcelas. Valor dividido automaticamente. Vazio se não parcelado') }}", categoria_id: "{{ $fromAI('categoria_id', 'UUID da categoria. Vazio se usar categoria_nome') }}", categoria_nome: "{{ $fromAI('categoria_nome', 'Nome da categoria. O sistema busca ou cria automaticamente') }}", cliente_id: "{{ $fromAI('cliente_id', 'UUID do cliente. Vazio se usar cliente_nome ou se for despesa') }}", cliente_nome: "{{ $fromAI('cliente_nome', 'Nome do cliente. Obrigatório se receita e sem cliente_id') }}", cliente_cpf_cnpj: "{{ $fromAI('cliente_cpf_cnpj', 'CPF ou CNPJ do cliente. Usado ao criar novo cliente. Deixe vazio se não informado') }}", fornecedor_id: "{{ $fromAI('fornecedor_id', 'UUID do fornecedor. Vazio se usar fornecedor_nome ou se for receita') }}", fornecedor_nome: "{{ $fromAI('fornecedor_nome', 'Nome do fornecedor. Obrigatório se despesa e sem fornecedor_id') }}", fornecedor_cpf_cnpj: "{{ $fromAI('fornecedor_cpf_cnpj', 'CPF ou CNPJ do fornecedor. Usado ao criar novo fornecedor. Deixe vazio se não informado') }}", forma_pagamento_id: "{{ $fromAI('forma_pagamento_id', 'UUID da forma de pagamento. Vazio se usar forma_pagamento_nome') }}", forma_pagamento_nome: "{{ $fromAI('forma_pagamento_nome', 'Nome da forma de pagamento. Busca ou cria automaticamente') }}", conta_bancaria_id: "{{ $fromAI('conta_bancaria_id', 'UUID da conta bancária. Vazio se usar conta_bancaria_nome') }}", conta_bancaria_nome: "{{ $fromAI('conta_bancaria_nome', 'SOMENTE nome do banco. Ex: Santander, Itaú. NÃO inclua agência ou número') }}", conta_bancaria_banco: "{{ $fromAI('conta_bancaria_banco', 'Nome do banco. Usado ao criar nova conta se diferente do nome. Deixe vazio se não informado') }}", conta_bancaria_agencia: "{{ $fromAI('conta_bancaria_agencia', 'Número da agência. Usado ao criar nova conta. Deixe vazio se não informado') }}", conta_bancaria_conta: "{{ $fromAI('conta_bancaria_conta', 'Número da conta. Usado ao criar nova conta. Deixe vazio se não informado') }}", projeto_id: "{{ $fromAI('projeto_id', 'UUID do projeto. Deixe vazio se não informado') }}", data_pagamento: "{{ $fromAI('data_pagamento', 'Data de pagamento YYYY-MM-DD. Se informada, status auto-definido como pago/recebido') }}" },
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

CONTROLE DE ACESSO: Sempre envie o user_id do usuário solicitante. O sistema verificará se o usuário tem permissão de visualização para anúncios digitais.

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Vendas",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "user_id", type: "string", required: true, description: "UUID do usuário solicitante (para controle de acesso)" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início personalizada (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim personalizada (YYYY-MM-DD)" },
      { name: "plataforma", type: "string", required: false, description: "Plataforma (ex: meta_ads, google_ads)" },
    ],
    body: { action: "listar-anuncios", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", user_id: "{{ $fromAI('user_id', 'UUID do usuário solicitante') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Padrão: mes') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}", plataforma: "{{ $fromAI('plataforma', 'Plataforma ex: meta_ads, google_ads. Deixe vazio para todas') }}" },
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
    action: "criar-cliente",
    toolName: "criar_cliente",
    label: "Criar Cliente",
    description: "Cadastra um novo cliente no sistema",
    toolDescription: `Cadastra um novo cliente no sistema. O cliente será criado com origem "manual" e poderá ser editado ou excluído normalmente.

Use quando o usuário solicitar:
- Cadastrar cliente
- Adicionar cliente
- Registrar cliente
- Novo cliente

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
      { name: "nome", type: "string", required: true, description: "Nome do cliente" },
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
    body: { action: "criar-cliente", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", nome: "{{ $fromAI('nome', 'Nome do cliente') }}", cpf_cnpj: "{{ $fromAI('cpf_cnpj', 'CPF ou CNPJ') }}", telefone: "{{ $fromAI('telefone', 'Telefone') }}", email: "{{ $fromAI('email', 'Email') }}", cep: "{{ $fromAI('cep', 'CEP') }}", rua: "{{ $fromAI('rua', 'Rua') }}", numero: "{{ $fromAI('numero', 'Número') }}", complemento: "{{ $fromAI('complemento', 'Complemento') }}", bairro: "{{ $fromAI('bairro', 'Bairro') }}", cidade: "{{ $fromAI('cidade', 'Cidade') }}", estado: "{{ $fromAI('estado', 'Estado UF') }}" },
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
  // ─── EXTRATO E TRANSFERÊNCIA ───
  {
    action: "extrato-conta",
    toolName: "extrato_conta",
    label: "Extrato de Conta",
    description: "Extrato detalhado de uma conta bancária com movimentações e resumo",
    toolDescription: `Consulta o extrato de uma conta bancária específica.\n\nUse quando o usuário solicitar:\n- Extrato bancário\n- Movimentações da conta\n- Histórico da conta\n- Entradas e saídas da conta\n\nParâmetros:\n- empresa_id (obrigatório)\n- conta_bancaria_id ou conta_bancaria_nome (um dos dois)\n- periodo: semana, mes, trimestre, semestre ou ano\n- data_inicio / data_fim\n\nSe nenhuma conta for especificada, usa a conta principal ou a única cadastrada.\n\nSempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "conta_bancaria_id", type: "string", required: false, description: "UUID da conta bancária" },
      { name: "conta_bancaria_nome", type: "string", required: false, description: "Nome ou banco da conta" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "data_inicio", type: "string", required: false, description: "Data início (YYYY-MM-DD)" },
      { name: "data_fim", type: "string", required: false, description: "Data fim (YYYY-MM-DD)" },
    ],
    body: { action: "extrato-conta", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", conta_bancaria_id: "{{ $fromAI('conta_bancaria_id', 'UUID da conta. Vazio se usar nome') }}", conta_bancaria_nome: "{{ $fromAI('conta_bancaria_nome', 'Nome ou banco da conta. Vazio se usar ID') }}", periodo: "{{ $fromAI('periodo', 'Periodo: semana, mes, trimestre, semestre ou ano. Padrão: mes') }}", data_inicio: "{{ $fromAI('data_inicio', 'Data início YYYY-MM-DD. Deixe vazio se não informado') }}", data_fim: "{{ $fromAI('data_fim', 'Data fim YYYY-MM-DD. Deixe vazio se não informado') }}" },
  },
  {
    action: "transferir-entre-contas",
    toolName: "transferir_entre_contas",
    label: "Transferir entre Contas",
    description: "Transfere valores entre contas bancárias, atualizando saldos e criando lançamentos",
    toolDescription: `Realiza transferência de valores entre duas contas bancárias.\n\nUse quando o usuário solicitar:\n- Transferir entre contas\n- Mover dinheiro de uma conta para outra\n- Transferência interna\n\nO sistema:\n1. Debita o valor da conta origem\n2. Credita o valor na conta destino\n3. Cria 2 lançamentos automáticos (saída e entrada)\n\nParâmetros:\n- empresa_id (obrigatório)\n- valor (obrigatório, número puro)\n- conta_origem: envie conta_origem_id OU conta_origem_nome\n- conta_destino: envie conta_destino_id OU conta_destino_nome\n- descricao (opcional)\n\nSempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "valor", type: "number", required: true, description: "Valor da transferência (número puro)" },
      { name: "conta_origem_id", type: "string", required: false, description: "UUID da conta origem" },
      { name: "conta_origem_nome", type: "string", required: false, description: "Nome ou banco da conta origem" },
      { name: "conta_destino_id", type: "string", required: false, description: "UUID da conta destino" },
      { name: "conta_destino_nome", type: "string", required: false, description: "Nome ou banco da conta destino" },
      { name: "descricao", type: "string", required: false, description: "Descrição da transferência" },
    ],
    body: { action: "transferir-entre-contas", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", valor: "{{ $fromAI('valor', 'Valor numérico puro da transferência') }}", conta_origem_id: "{{ $fromAI('conta_origem_id', 'UUID da conta origem. Vazio se usar nome') }}", conta_origem_nome: "{{ $fromAI('conta_origem_nome', 'Nome da conta origem. Vazio se usar ID') }}", conta_destino_id: "{{ $fromAI('conta_destino_id', 'UUID da conta destino. Vazio se usar nome') }}", conta_destino_nome: "{{ $fromAI('conta_destino_nome', 'Nome da conta destino. Vazio se usar ID') }}", descricao: "{{ $fromAI('descricao', 'Descrição da transferência. Deixe vazio para padrão') }}" },
  },
  // ─── EDITAR ───
  {
    action: "editar-cliente",
    toolName: "editar_cliente",
    label: "Editar Cliente",
    description: "Altera dados de um cliente existente (bloqueado se vinculado a lançamentos pagos/recebidos)",
    toolDescription: `Altera dados de um cliente existente.

⚠️ REGRAS DE SEGURANÇA:
1. Clientes adicionados automaticamente (via integração/webhook) NÃO podem ser editados. Somente clientes com origem "manual".
2. Se o cliente possuir lançamentos com status "pago" ou "recebido", a edição será BLOQUEADA automaticamente pelo sistema.

Use quando o usuário solicitar:
- Alterar cliente
- Atualizar dados do cliente
- Editar cliente

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório — UUID do cliente a editar)
- nome, email, telefone, cpf_cnpj, cep, rua, numero, complemento, bairro, cidade, estado, ativo (opcionais — envie apenas os campos que mudarão)

⚠️ NÃO é possível editar/excluir USUÁRIOS por este template. Alterações de usuários devem ser feitas pelo sistema.

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID do cliente a editar" },
      { name: "nome", type: "string", required: false, description: "Novo nome" },
      { name: "email", type: "string", required: false, description: "Novo e-mail" },
      { name: "telefone", type: "string", required: false, description: "Novo telefone" },
      { name: "cpf_cnpj", type: "string", required: false, description: "Novo CPF/CNPJ" },
      { name: "ativo", type: "boolean", required: false, description: "true ou false" },
    ],
    body: { action: "editar-cliente", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID do cliente a editar') }}", nome: "{{ $fromAI('nome', 'Novo nome. Deixe vazio se não mudar') }}", email: "{{ $fromAI('email', 'Novo email. Deixe vazio se não mudar') }}", telefone: "{{ $fromAI('telefone', 'Novo telefone. Deixe vazio se não mudar') }}", cpf_cnpj: "{{ $fromAI('cpf_cnpj', 'Novo CPF/CNPJ. Deixe vazio se não mudar') }}", ativo: "{{ $fromAI('ativo', 'true ou false. Deixe vazio se não mudar') }}" },
  },
  {
    action: "editar-fornecedor",
    toolName: "editar_fornecedor",
    label: "Editar Fornecedor",
    description: "Altera dados de um fornecedor existente (bloqueado se vinculado a lançamentos pagos/recebidos)",
    toolDescription: `Altera dados de um fornecedor existente.

⚠️ REGRA DE SEGURANÇA: Se o fornecedor possuir lançamentos com status "pago" ou "recebido", a edição será BLOQUEADA.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório — UUID do fornecedor)
- nome, email, telefone, cpf_cnpj, cep, rua, numero, complemento, bairro, cidade, estado, ativo (opcionais)

Sempre usar a empresa_id ativa. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID do fornecedor a editar" },
      { name: "nome", type: "string", required: false, description: "Novo nome" },
      { name: "email", type: "string", required: false, description: "Novo e-mail" },
      { name: "telefone", type: "string", required: false, description: "Novo telefone" },
      { name: "ativo", type: "boolean", required: false, description: "true ou false" },
    ],
    body: { action: "editar-fornecedor", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID do fornecedor') }}", nome: "{{ $fromAI('nome', 'Novo nome. Deixe vazio se não mudar') }}", email: "{{ $fromAI('email', 'Novo email. Deixe vazio se não mudar') }}", telefone: "{{ $fromAI('telefone', 'Novo telefone. Deixe vazio se não mudar') }}", ativo: "{{ $fromAI('ativo', 'true ou false. Deixe vazio se não mudar') }}" },
  },
  {
    action: "editar-categoria",
    toolName: "editar_categoria",
    label: "Editar Categoria",
    description: "Altera dados de uma categoria (bloqueado se vinculada a lançamentos pagos/recebidos)",
    toolDescription: `Altera nome ou tipo de uma categoria existente.

⚠️ REGRA DE SEGURANÇA: Se a categoria possuir lançamentos com status "pago" ou "recebido", a edição será BLOQUEADA.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório)
- nome (opcional)
- tipo: receita, despesa ou investimento (opcional)

Sempre usar a empresa_id ativa. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID da categoria" },
      { name: "nome", type: "string", required: false, description: "Novo nome" },
      { name: "tipo", type: "string", required: false, description: "receita, despesa ou investimento" },
    ],
    body: { action: "editar-categoria", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID da categoria') }}", nome: "{{ $fromAI('nome', 'Novo nome. Deixe vazio se não mudar') }}", tipo: "{{ $fromAI('tipo', 'receita, despesa ou investimento. Deixe vazio se não mudar') }}" },
  },
  {
    action: "editar-conta-bancaria",
    toolName: "editar_conta_bancaria",
    label: "Editar Conta Bancária",
    description: "Altera dados de uma conta bancária (bloqueado se vinculada a lançamentos pagos/recebidos)",
    toolDescription: `Altera dados de uma conta bancária existente.

⚠️ REGRA DE SEGURANÇA: Se a conta possuir lançamentos com status "pago" ou "recebido", a edição será BLOQUEADA.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório)
- nome, banco, agencia, conta (opcionais)
- saldo_atual (numérico, opcional)
- principal (boolean, opcional)

Sempre usar a empresa_id ativa. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID da conta bancária" },
      { name: "nome", type: "string", required: false, description: "Novo nome" },
      { name: "banco", type: "string", required: false, description: "Novo banco" },
      { name: "saldo_atual", type: "number", required: false, description: "Novo saldo atual" },
      { name: "principal", type: "boolean", required: false, description: "true ou false" },
    ],
    body: { action: "editar-conta-bancaria", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID da conta bancária') }}", nome: "{{ $fromAI('nome', 'Novo nome. Deixe vazio se não mudar') }}", banco: "{{ $fromAI('banco', 'Novo banco. Deixe vazio se não mudar') }}", saldo_atual: "{{ $fromAI('saldo_atual', 'Novo saldo. Deixe vazio se não mudar') }}", principal: "{{ $fromAI('principal', 'true ou false. Deixe vazio se não mudar') }}" },
  },
  {
    action: "editar-forma-pagamento",
    toolName: "editar_forma_pagamento",
    label: "Editar Forma de Pagamento",
    description: "Altera descrição de uma forma de pagamento (bloqueado se vinculada a lançamentos pagos/recebidos)",
    toolDescription: `Altera a descrição de uma forma de pagamento.

⚠️ REGRA DE SEGURANÇA: Se a forma de pagamento possuir lançamentos com status "pago" ou "recebido", a edição será BLOQUEADA.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório)
- descricao (obrigatório — nova descrição)

Sempre usar a empresa_id ativa. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID da forma de pagamento" },
      { name: "descricao", type: "string", required: true, description: "Nova descrição" },
    ],
    body: { action: "editar-forma-pagamento", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID da forma de pagamento') }}", descricao: "{{ $fromAI('descricao', 'Nova descrição') }}" },
  },
  {
    action: "editar-projeto",
    toolName: "editar_projeto",
    label: "Editar Projeto",
    description: "Altera dados de um projeto (sem restrições de lançamentos vinculados)",
    toolDescription: `Altera dados de um projeto existente.

Projetos são um controle à parte do usuário — podem ser editados livremente independente de lançamentos vinculados. O saldo de receitas e despesas é apenas informativo.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório)
- nome, descricao, status, orcamento (opcionais)

Sempre usar a empresa_id ativa. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID do projeto" },
      { name: "nome", type: "string", required: false, description: "Novo nome" },
      { name: "descricao", type: "string", required: false, description: "Nova descrição" },
      { name: "status", type: "string", required: false, description: "ativo, concluido ou cancelado" },
      { name: "orcamento", type: "number", required: false, description: "Novo orçamento" },
    ],
    body: { action: "editar-projeto", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID do projeto') }}", nome: "{{ $fromAI('nome', 'Novo nome. Deixe vazio se não mudar') }}", descricao: "{{ $fromAI('descricao', 'Nova descrição. Deixe vazio se não mudar') }}", status: "{{ $fromAI('status', 'ativo, concluido ou cancelado. Deixe vazio se não mudar') }}", orcamento: "{{ $fromAI('orcamento', 'Novo orçamento. Deixe vazio se não mudar') }}" },
  },
  {
    action: "editar-lancamento",
    toolName: "editar_lancamento",
    label: "Editar Lançamento",
    description: "Altera dados de um lançamento pendente (bloqueado se já pago/recebido). Suporta edição de recorrência.",
    toolDescription: `Altera dados de um lançamento financeiro existente.

⚠️ REGRA DE SEGURANÇA: Lançamentos com status "pago" ou "recebido" NÃO podem ser alterados.

⚠️ IMPORTANTE: Use as ferramentas de listagem (categorias, clientes, fornecedores, etc.) para obter IDs válidos antes de atualizar campos de relacionamento.

PROTEÇÃO DE CADEIA RECORRENTE:
- Se o lançamento pertence a uma cadeia recorrente (possui recorrencia_grupo_id), apenas os seguintes campos podem ser alterados: valor, status, data_vencimento, data_pagamento, categoria_id, cliente_id, fornecedor_id, conta_bancaria_id, forma_pagamento_id, projeto_id.
- Campos bloqueados em lançamentos recorrentes: descricao, tipo, recorrencia_tipo, recorrencia_fim. Alterar esses campos quebraria a cadeia.
- Para alterar a frequência ou encerrar uma recorrência, use os campos recorrencia_tipo e recorrencia_fim APENAS em lançamentos NÃO recorrentes que estejam sendo convertidos.

RECORRÊNCIA E PARCELAMENTO:
- Para tornar um lançamento único em recorrente, envie:
  - recorrente: true
  - recorrencia_tipo: semanal, quinzenal, mensal (padrão), trimestral ou anual
  - recorrencia_inicio: YYYY-MM-DD (data de início, aceita retroativas. Se vazio, usa data_vencimento)
  - recorrencia_fim: YYYY-MM-DD (data fim, vazio = indefinido)
- Para alterar o fim da recorrência de um lançamento já recorrente:
  - recorrencia_fim: YYYY-MM-DD (nova data fim)
- Recorrente e parcelado são MUTUAMENTE EXCLUSIVOS.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório — UUID do lançamento)
- descricao, valor, tipo, status, data_vencimento, data_pagamento (opcionais)
- categoria_id, cliente_id, fornecedor_id, conta_bancaria_id, forma_pagamento_id, projeto_id (opcionais)
- recorrente, recorrencia_tipo, recorrencia_inicio, recorrencia_fim (opcionais — para controle de recorrência)

Sempre usar a empresa_id ativa. Nunca inventar dados.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID do lançamento" },
      { name: "descricao", type: "string", required: false, description: "Nova descrição (bloqueado em recorrentes)" },
      { name: "valor", type: "number", required: false, description: "Novo valor" },
      { name: "tipo", type: "string", required: false, description: "receita ou despesa (bloqueado em recorrentes)" },
      { name: "status", type: "string", required: false, description: "pendente, pago ou recebido" },
      { name: "data_vencimento", type: "string", required: false, description: "Nova data de vencimento YYYY-MM-DD" },
      { name: "data_pagamento", type: "string", required: false, description: "Data de pagamento YYYY-MM-DD" },
      { name: "recorrente", type: "boolean", required: false, description: "true para tornar recorrente. Não altere se já for recorrente" },
      { name: "recorrencia_tipo", type: "string", required: false, description: "semanal, quinzenal, mensal, trimestral ou anual" },
      { name: "recorrencia_inicio", type: "string", required: false, description: "Data início recorrência YYYY-MM-DD (aceita retroativas)" },
      { name: "recorrencia_fim", type: "string", required: false, description: "Data fim recorrência YYYY-MM-DD. Vazio = indefinido" },
      { name: "categoria_id", type: "string", required: false, description: "UUID da categoria" },
      { name: "cliente_id", type: "string", required: false, description: "UUID do cliente" },
      { name: "fornecedor_id", type: "string", required: false, description: "UUID do fornecedor" },
      { name: "conta_bancaria_id", type: "string", required: false, description: "UUID da conta bancária" },
      { name: "forma_pagamento_id", type: "string", required: false, description: "UUID da forma de pagamento" },
      { name: "projeto_id", type: "string", required: false, description: "UUID do projeto" },
    ],
    body: { action: "editar-lancamento", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID do lançamento') }}", descricao: "{{ $fromAI('descricao', 'Nova descrição. Deixe vazio se não mudar. BLOQUEADO em recorrentes') }}", valor: "{{ $fromAI('valor', 'Novo valor. Deixe vazio se não mudar') }}", tipo: "{{ $fromAI('tipo', 'receita ou despesa. Deixe vazio se não mudar. BLOQUEADO em recorrentes') }}", status: "{{ $fromAI('status', 'pendente, pago ou recebido. Deixe vazio se não mudar') }}", data_vencimento: "{{ $fromAI('data_vencimento', 'YYYY-MM-DD. Deixe vazio se não mudar') }}", data_pagamento: "{{ $fromAI('data_pagamento', 'YYYY-MM-DD. Deixe vazio se não mudar') }}", recorrente: "{{ $fromAI('recorrente', 'true para tornar recorrente. Deixe vazio se não mudar') }}", recorrencia_tipo: "{{ $fromAI('recorrencia_tipo', 'semanal, quinzenal, mensal, trimestral ou anual. Deixe vazio se não mudar') }}", recorrencia_inicio: "{{ $fromAI('recorrencia_inicio', 'Data início recorrência YYYY-MM-DD. Aceita retroativas. Deixe vazio se não mudar') }}", recorrencia_fim: "{{ $fromAI('recorrencia_fim', 'Data fim recorrência YYYY-MM-DD. Vazio = indefinido. Deixe vazio se não mudar') }}", categoria_id: "{{ $fromAI('categoria_id', 'UUID da categoria. Deixe vazio se não mudar') }}", cliente_id: "{{ $fromAI('cliente_id', 'UUID do cliente. Deixe vazio se não mudar') }}", fornecedor_id: "{{ $fromAI('fornecedor_id', 'UUID do fornecedor. Deixe vazio se não mudar') }}", conta_bancaria_id: "{{ $fromAI('conta_bancaria_id', 'UUID da conta bancária. Deixe vazio se não mudar') }}", forma_pagamento_id: "{{ $fromAI('forma_pagamento_id', 'UUID da forma de pagamento. Deixe vazio se não mudar') }}", projeto_id: "{{ $fromAI('projeto_id', 'UUID do projeto. Deixe vazio se não mudar') }}" },
  },
  // ─── EXCLUIR ───
  {
    action: "excluir-cliente",
    toolName: "excluir_cliente",
    label: "Excluir Cliente",
    description: "Remove um cliente (bloqueado se vinculado a lançamentos pagos/recebidos)",
    toolDescription: `Exclui um cliente do sistema.

⚠️ REGRAS DE SEGURANÇA:
1. Clientes adicionados automaticamente (via integração/webhook) NÃO podem ser excluídos. Somente clientes com origem "manual".
2. Se o cliente possuir lançamentos com status "pago" ou "recebido", a exclusão será BLOQUEADA automaticamente.
⚠️ NÃO é possível excluir USUÁRIOS por este template.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório — UUID do cliente)

Sempre usar a empresa_id ativa. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID do cliente a excluir" },
    ],
    body: { action: "excluir-cliente", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID do cliente a excluir') }}" },
  },
  {
    action: "excluir-fornecedor",
    toolName: "excluir_fornecedor",
    label: "Excluir Fornecedor",
    description: "Remove um fornecedor (bloqueado se vinculado a lançamentos pagos/recebidos)",
    toolDescription: `Exclui um fornecedor do sistema.

⚠️ REGRA DE SEGURANÇA: Se o fornecedor possuir lançamentos com status "pago" ou "recebido", a exclusão será BLOQUEADA.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório)

Sempre usar a empresa_id ativa.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID do fornecedor" },
    ],
    body: { action: "excluir-fornecedor", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID do fornecedor') }}" },
  },
  {
    action: "excluir-categoria",
    toolName: "excluir_categoria",
    label: "Excluir Categoria",
    description: "Remove uma categoria (bloqueado se vinculada a lançamentos pagos/recebidos)",
    toolDescription: `Exclui uma categoria do sistema.

⚠️ REGRA DE SEGURANÇA: Bloqueada se possuir lançamentos pagos/recebidos.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório)

Sempre usar a empresa_id ativa.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID da categoria" },
    ],
    body: { action: "excluir-categoria", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID da categoria') }}" },
  },
  {
    action: "excluir-conta-bancaria",
    toolName: "excluir_conta_bancaria",
    label: "Excluir Conta Bancária",
    description: "Remove uma conta bancária (bloqueado se vinculada a lançamentos pagos/recebidos)",
    toolDescription: `Exclui uma conta bancária do sistema.

⚠️ REGRA DE SEGURANÇA: Bloqueada se possuir lançamentos pagos/recebidos.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório)

Sempre usar a empresa_id ativa.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID da conta bancária" },
    ],
    body: { action: "excluir-conta-bancaria", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID da conta bancária') }}" },
  },
  {
    action: "excluir-forma-pagamento",
    toolName: "excluir_forma_pagamento",
    label: "Excluir Forma de Pagamento",
    description: "Remove uma forma de pagamento (bloqueado se vinculada a lançamentos pagos/recebidos)",
    toolDescription: `Exclui uma forma de pagamento do sistema.

⚠️ REGRA DE SEGURANÇA: Bloqueada se possuir lançamentos pagos/recebidos.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório)

Sempre usar a empresa_id ativa.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID da forma de pagamento" },
    ],
    body: { action: "excluir-forma-pagamento", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID da forma de pagamento') }}" },
  },
  {
    action: "excluir-projeto",
    toolName: "excluir_projeto",
    label: "Excluir Projeto",
    description: "Remove um projeto (sem restrições de lançamentos vinculados)",
    toolDescription: `Exclui um projeto do sistema.

Projetos são um controle à parte do usuário — podem ser excluídos livremente. Lançamentos vinculados NÃO são afetados, apenas perdem a referência ao projeto.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório)

Sempre usar a empresa_id ativa.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID do projeto" },
    ],
    body: { action: "excluir-projeto", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID do projeto') }}" },
  },
  {
    action: "excluir-lancamento",
    toolName: "excluir_lancamento",
    label: "Excluir Lançamento",
    description: "Remove um lançamento pendente (bloqueado se já pago/recebido). Suporta exclusão de cadeia recorrente.",
    toolDescription: `Exclui um lançamento financeiro do sistema.

⚠️ REGRA DE SEGURANÇA: Lançamentos com status "pago" ou "recebido" NÃO podem ser excluídos.

LANÇAMENTOS RECORRENTES:
- Por padrão, exclui APENAS a ocorrência informada (pelo id).
- Para excluir TODA a cadeia recorrente (todas as ocorrências futuras pendentes do mesmo grupo), envie: excluir_cadeia: true.
- Ocorrências já pagas/recebidas dentro da cadeia NÃO serão excluídas mesmo com excluir_cadeia = true.

Parâmetros:
- empresa_id (obrigatório)
- id (obrigatório — UUID do lançamento)
- excluir_cadeia (opcional — true para excluir todas as ocorrências pendentes da cadeia recorrente)

Sempre usar a empresa_id ativa. Nunca inventar dados.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "id", type: "string", required: true, description: "UUID do lançamento" },
      { name: "excluir_cadeia", type: "boolean", required: false, description: "true para excluir toda a cadeia recorrente pendente" },
    ],
    body: { action: "excluir-lancamento", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", id: "{{ $fromAI('id', 'UUID do lançamento') }}", excluir_cadeia: "{{ $fromAI('excluir_cadeia', 'true para excluir toda a cadeia recorrente. Deixe vazio para excluir apenas esta ocorrência') }}" },
  },
  // ─── VENDAS DIGITAIS CRUD ───
  {
    action: "criar-venda",
    toolName: "criar_venda",
    label: "Criar Venda Digital",
    description: "Cadastra uma nova venda digital manual no sistema, com opção de emissão de NF",
    toolDescription: `Cadastra uma nova venda digital manual.

Use quando o usuário solicitar:
- Registrar venda
- Adicionar venda manual
- Nova venda digital

⚠️ CAMPOS OBRIGATÓRIOS: plataforma, valor_bruto

EMISSÃO DE NOTA FISCAL:
- Pergunte ao usuário se deseja emitir a nota fiscal junto com a venda.
- Se emitir_nota_fiscal = true, os seguintes campos tornam-se OBRIGATÓRIOS:
  • cliente (nome do cliente)
  • cliente_documento (CPF ou CNPJ válido, mínimo 11 dígitos numéricos)
  • produto (nome do produto)
  • valor_bruto (maior que zero)
  • data_venda (YYYY-MM-DD)
- Se algum desses campos estiver ausente, NÃO envie emitir_nota_fiscal como true. Informe ao usuário quais campos faltam.

Parâmetros:
- empresa_id (obrigatório)
- user_id (obrigatório — UUID do usuário para controle de permissões)
- plataforma (obrigatório — ex: hotmart, kiwify, eduzz, monetizze, manual)
- valor_bruto (obrigatório — número puro, ex: 197.00)
- taxa (opcional — comissão da plataforma, número puro)
- valor_liquido (opcional — calculado automaticamente se não informado: valor_bruto - taxa)
- produto (opcional — nome do produto)
- cliente (opcional — nome do cliente)
- cliente_email (opcional)
- cliente_telefone (opcional)
- cliente_documento (opcional — CPF ou CNPJ)
- cliente_endereco (opcional)
- status (opcional — aprovada, pendente, reembolsada, cancelada. Padrão: aprovada)
- data_venda (opcional — YYYY-MM-DD. Padrão: hoje)
- observacoes (opcional)
- emitir_nota_fiscal (opcional — true/false. Se true, valida campos obrigatórios para emissão)

CONTROLE DE ACESSO: Requer permissão 'pode_incluir' na tela 'vendas_digitais'.
Para emitir NF, também requer permissão 'pode_incluir' na tela 'emissao_nf'.

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Vendas",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "user_id", type: "string", required: true, description: "UUID do usuário (controle de permissões)" },
      { name: "plataforma", type: "string", required: true, description: "Plataforma (ex: hotmart, kiwify, manual)" },
      { name: "valor_bruto", type: "number", required: true, description: "Valor bruto da venda (número puro)" },
      { name: "taxa", type: "number", required: false, description: "Taxa/comissão da plataforma" },
      { name: "valor_liquido", type: "number", required: false, description: "Valor líquido (calculado se vazio)" },
      { name: "produto", type: "string", required: false, description: "Nome do produto" },
      { name: "cliente", type: "string", required: false, description: "Nome do cliente" },
      { name: "cliente_email", type: "string", required: false, description: "E-mail do cliente" },
      { name: "cliente_telefone", type: "string", required: false, description: "Telefone do cliente" },
      { name: "cliente_documento", type: "string", required: false, description: "CPF ou CNPJ do cliente" },
      { name: "cliente_endereco", type: "string", required: false, description: "Endereço do cliente" },
      { name: "status", type: "string", required: false, description: "aprovada, pendente, reembolsada ou cancelada" },
      { name: "data_venda", type: "string", required: false, description: "Data da venda (YYYY-MM-DD)" },
      { name: "observacoes", type: "string", required: false, description: "Observações" },
      { name: "emitir_nota_fiscal", type: "boolean", required: false, description: "Se true, emite NF automaticamente (requer campos obrigatórios preenchidos)" },
    ],
    body: { action: "criar-venda", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", user_id: "{{ $fromAI('user_id', 'UUID do usuário') }}", plataforma: "{{ $fromAI('plataforma', 'Plataforma: hotmart, kiwify, eduzz, monetizze, manual') }}", valor_bruto: "{{ $fromAI('valor_bruto', 'Valor bruto numérico') }}", taxa: "{{ $fromAI('taxa', 'Taxa/comissão. Deixe vazio se não houver') }}", valor_liquido: "{{ $fromAI('valor_liquido', 'Valor líquido. Deixe vazio para calcular automaticamente') }}", produto: "{{ $fromAI('produto', 'Nome do produto. Deixe vazio se não informado') }}", cliente: "{{ $fromAI('cliente', 'Nome do cliente. Deixe vazio se não informado') }}", cliente_email: "{{ $fromAI('cliente_email', 'Email do cliente') }}", cliente_telefone: "{{ $fromAI('cliente_telefone', 'Telefone do cliente') }}", cliente_documento: "{{ $fromAI('cliente_documento', 'CPF ou CNPJ do cliente') }}", cliente_endereco: "{{ $fromAI('cliente_endereco', 'Endereço do cliente') }}", status: "{{ $fromAI('status', 'aprovada, pendente, reembolsada ou cancelada') }}", data_venda: "{{ $fromAI('data_venda', 'Data YYYY-MM-DD. Deixe vazio para hoje') }}", observacoes: "{{ $fromAI('observacoes', 'Observações. Deixe vazio se não houver') }}", emitir_nota_fiscal: "{{ $fromAI('emitir_nota_fiscal', 'true para emitir NF junto com a venda. Requer cliente, cliente_documento, produto, valor_bruto e data_venda preenchidos') }}" },
  },
  {
    action: "editar-venda",
    toolName: "editar_venda",
    label: "Editar Venda Digital",
    description: "Altera dados de uma venda digital existente, com opção de emissão de NF",
    toolDescription: `Altera dados de uma venda digital existente.

⚠️ REGRAS DE SEGURANÇA:
1. Vendas com origem automática (webhook/integração) NÃO podem ser editadas. Somente vendas com origem "manual".
2. Envie apenas os campos que deseja alterar. Campos não enviados ou vazios serão mantidos.

EMISSÃO DE NOTA FISCAL:
- Se o usuário deseja emitir NF na edição, envie emitir_nota_fiscal = true.
- Antes de emitir, verifique se a venda possui todos os campos obrigatórios:
  • cliente (nome do cliente)
  • cliente_documento (CPF ou CNPJ válido)
  • produto (nome do produto)
  • valor_bruto (maior que zero)
  • data_venda
- Se algum campo estiver faltando, inclua-o na edição OU informe ao usuário.

Use quando o usuário solicitar:
- Editar venda
- Alterar dados da venda
- Atualizar venda

Parâmetros:
- empresa_id (obrigatório)
- user_id (obrigatório — UUID do usuário para controle de permissões)
- id (obrigatório — UUID da venda a editar)
- plataforma, valor_bruto, taxa, valor_liquido, produto, cliente, cliente_email, cliente_telefone, cliente_documento, cliente_endereco, status, data_venda, observacoes (opcionais)
- emitir_nota_fiscal (opcional — true/false)

CONTROLE DE ACESSO: Requer permissão 'pode_alterar' na tela 'vendas_digitais'.
Para emitir NF, também requer permissão 'pode_incluir' na tela 'emissao_nf'.

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Vendas",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "user_id", type: "string", required: true, description: "UUID do usuário (controle de permissões)" },
      { name: "id", type: "string", required: true, description: "UUID da venda a editar" },
      { name: "valor_bruto", type: "number", required: false, description: "Novo valor bruto" },
      { name: "taxa", type: "number", required: false, description: "Nova taxa/comissão" },
      { name: "valor_liquido", type: "number", required: false, description: "Novo valor líquido" },
      { name: "produto", type: "string", required: false, description: "Novo nome do produto" },
      { name: "cliente", type: "string", required: false, description: "Novo nome do cliente" },
      { name: "cliente_documento", type: "string", required: false, description: "Novo CPF/CNPJ do cliente" },
      { name: "status", type: "string", required: false, description: "Novo status" },
      { name: "observacoes", type: "string", required: false, description: "Novas observações" },
      { name: "emitir_nota_fiscal", type: "boolean", required: false, description: "Se true, emite NF após edição (requer campos obrigatórios)" },
    ],
    body: { action: "editar-venda", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", user_id: "{{ $fromAI('user_id', 'UUID do usuário') }}", id: "{{ $fromAI('id', 'UUID da venda a editar') }}", valor_bruto: "{{ $fromAI('valor_bruto', 'Novo valor bruto. Deixe vazio se não mudar') }}", taxa: "{{ $fromAI('taxa', 'Nova taxa. Deixe vazio se não mudar') }}", valor_liquido: "{{ $fromAI('valor_liquido', 'Novo valor líquido. Deixe vazio se não mudar') }}", produto: "{{ $fromAI('produto', 'Novo produto. Deixe vazio se não mudar') }}", cliente: "{{ $fromAI('cliente', 'Novo cliente. Deixe vazio se não mudar') }}", cliente_documento: "{{ $fromAI('cliente_documento', 'Novo CPF/CNPJ. Deixe vazio se não mudar') }}", status: "{{ $fromAI('status', 'Novo status. Deixe vazio se não mudar') }}", observacoes: "{{ $fromAI('observacoes', 'Novas observações. Deixe vazio se não mudar') }}", emitir_nota_fiscal: "{{ $fromAI('emitir_nota_fiscal', 'true para emitir NF. Requer campos obrigatórios preenchidos na venda') }}" },
  },
  {
    action: "excluir-venda",
    toolName: "excluir_venda",
    label: "Excluir Venda Digital",
    description: "Remove uma venda digital do sistema (bloqueado se origem automática)",
    toolDescription: `Remove uma venda digital do sistema.

⚠️ REGRAS DE SEGURANÇA:
1. Vendas com origem automática (webhook/integração) NÃO podem ser excluídas.
2. Se a venda possuir um lançamento vinculado, ele será excluído junto.
3. Se a venda possuir nota fiscal emitida (invoice_status = ISSUED ou AUTHORIZED), a exclusão será BLOQUEADA. A nota fiscal deve ser cancelada antes.

Use quando o usuário solicitar:
- Excluir venda
- Apagar venda
- Remover venda

Parâmetros:
- empresa_id (obrigatório)
- user_id (obrigatório — UUID do usuário para controle de permissões)
- id (obrigatório — UUID da venda a excluir)

CONTROLE DE ACESSO: Requer permissão 'pode_excluir' na tela 'vendas_digitais'.

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Vendas",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "user_id", type: "string", required: true, description: "UUID do usuário (controle de permissões)" },
      { name: "id", type: "string", required: true, description: "UUID da venda a excluir" },
    ],
    body: { action: "excluir-venda", empresa_id: "{{ $fromAI('empresa_id', 'UUID da empresa') }}", user_id: "{{ $fromAI('user_id', 'UUID do usuário') }}", id: "{{ $fromAI('id', 'UUID da venda a excluir') }}" },
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
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => new Set(["Resumos", "Financeiro", "Vendas", "Cadastros", "Personalizado"]));
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [collapsedSubGroups, setCollapsedSubGroups] = useState<Set<string>>(() => new Set(["Cadastros-Listar", "Cadastros-Criar", "Cadastros-Editar", "Cadastros-Excluir"]));
  const [customTemplates, setCustomTemplates] = useState<ActionTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("n8n-custom-templates-v3");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ action: "", label: "", description: "", json: "{}" });

  // Auto-inject user_id into all templates for permission control
  const injectUserId = (templates: ActionTemplate[]): ActionTemplate[] => {
    return templates.map(t => {
      const alreadyHasUserIdInBody = !!t.body.user_id;
      
      // Add user_id to params if not present
      const hasUserIdParam = t.params.some(p => p.name === "user_id");
      const params = hasUserIdParam ? t.params : [
        t.params[0], // empresa_id always first
        { name: "user_id", type: "string", required: true, description: "UUID do usuário (controle de permissões)" },
        ...t.params.slice(1),
      ];

      // Add user_id to body if not present
      let newBody = t.body;
      if (!alreadyHasUserIdInBody) {
        const entries = Object.entries(t.body);
        const empresaIdx = entries.findIndex(([k]) => k === "empresa_id");
        entries.splice(empresaIdx + 1, 0, ["user_id", "{{ $fromAI('user_id', 'UUID do usuário para controle de permissões') }}"]);
        newBody = Object.fromEntries(entries);
      }

      // Always ensure user_id is in the Parâmetros section of the description
      let toolDescription = t.toolDescription;
      
      if (toolDescription.includes("Parâmetros:")) {
        const paramSectionMatch = toolDescription.match(/Parâmetros:[\s\S]*?(?=\n\n|$)/);
        const paramSection = paramSectionMatch ? paramSectionMatch[0] : "";
        if (!paramSection.includes("user_id")) {
          toolDescription = toolDescription.replace(
            /- empresa_id(\s*\(obrigatório\))?/,
            `- empresa_id$1\n- user_id (obrigatório — UUID do usuário para controle de permissões)`
          );
        }
      }
      
      // Append permission notice
      const permNotice = `\n\nCONTROLE DE ACESSO: Sempre envie o user_id para que o sistema valide as permissões do usuário antes de executar a ação.`;
      if (!toolDescription.includes("CONTROLE DE ACESSO")) {
        toolDescription = toolDescription + permNotice;
      }

      // Append JSON schema to description
      if (!toolDescription.includes("Schema (JSON):")) {
        const schemaObj: Record<string, string> = {};
        for (const [key, val] of Object.entries(newBody)) {
          if (key === "action") {
            schemaObj[key] = String(val);
          } else {
            const param = params.find(p => p.name === key);
            if (param) {
              schemaObj[key] = param.required ? `<${param.description}>` : `<opcional>`;
            } else {
              schemaObj[key] = "<opcional>";
            }
          }
        }
        const schemaJson = JSON.stringify(schemaObj, null, 2);
        toolDescription = toolDescription + `\n\nSchema (JSON):\n${schemaJson}`;
      }

      return { ...t, params, body: newBody, toolDescription };
    });
  };

  const allTemplates = injectUserId([...DEFAULT_TEMPLATES, ...customTemplates]);
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

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleSubGroup = (key: string) => {
    setCollapsedSubGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const getCadastroSubGroup = (action: string): string => {
    if (action.startsWith("criar-")) return "Criar";
    if (action.startsWith("editar-")) return "Editar";
    if (action.startsWith("excluir-")) return "Excluir";
    return "Listar";
  };

  const SUBGROUP_COLORS: Record<string, string> = {
    "Listar": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    "Criar": "bg-green-500/10 text-green-700 dark:text-green-400",
    "Editar": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    "Excluir": "bg-red-500/10 text-red-700 dark:text-red-400",
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
      <Collapsible>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-amber-500/10 transition-colors">
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="h-4 w-4 text-amber-600" />
                Como configurar cada HTTP Request Tool
                <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto transition-transform [[data-state=open]_&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3 text-xs text-muted-foreground pt-0">
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
        const isCategoryOpen = !collapsedCategories.has(category);

        const renderTemplateCard = (template: ActionTemplate) => {
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
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                      {Object.keys(template.body).length} campos
                    </Badge>
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
        };

        return (
          <div key={category} className="space-y-2">
            <div
              className="flex items-center gap-2 cursor-pointer select-none py-1"
              onClick={() => toggleCategory(category)}
            >
              {isCategoryOpen ? (
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FolderClosed className="h-4 w-4 text-muted-foreground" />
              )}
              <Badge variant="secondary" className={CATEGORY_COLORS[category] || ""}>
                {category}
              </Badge>
              <span className="text-xs text-muted-foreground">{categoryTemplates.length} tool(s)</span>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isCategoryOpen ? "" : "-rotate-90"}`} />
            </div>

            {isCategoryOpen && (
              <div className="pl-2">
                {category === "Cadastros" ? (
                  // Sub-group Cadastros by Listar/Criar/Editar/Excluir
                  (() => {
                    const subGroups = ["Listar", "Criar", "Editar", "Excluir"];
                    return (
                      <div className="space-y-3">
                        {subGroups.map(sg => {
                          const sgTemplates = categoryTemplates.filter(t => getCadastroSubGroup(t.action) === sg);
                          if (sgTemplates.length === 0) return null;
                          const sgKey = `${category}-${sg}`;
                          const isSgOpen = !collapsedSubGroups.has(sgKey);
                          return (
                            <div key={sg} className="space-y-1.5">
                              <div
                                className="flex items-center gap-2 cursor-pointer select-none py-0.5 pl-1"
                                onClick={() => toggleSubGroup(sgKey)}
                              >
                                <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isSgOpen ? "" : "-rotate-90"}`} />
                                <Badge variant="outline" className={`text-[11px] px-2 py-0 h-5 ${SUBGROUP_COLORS[sg] || ""}`}>
                                  {sg}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">{sgTemplates.length}</span>
                              </div>
                              {isSgOpen && (
                                <div className="grid gap-2 pl-3">
                                  {sgTemplates.map(renderTemplateCard)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : (
                  <div className="grid gap-2">
                    {categoryTemplates.map(renderTemplateCard)}
                  </div>
                )}
              </div>
            )}
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
