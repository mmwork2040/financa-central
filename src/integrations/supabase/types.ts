export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          empresa_id: string | null
          endereco: string | null
          id: string
          nome: string
          origem: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          id?: string
          nome: string
          origem?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          origem?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          banco: string | null
          conta: string | null
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          saldo_atual: number
          saldo_inicial: number
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          saldo_atual?: number
          saldo_inicial?: number
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          saldo_atual?: number
          saldo_inicial?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas_chat: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversas_chat_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnpj: string | null
          cor_primaria: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          pessoal: boolean
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          cor_primaria?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          pessoal?: boolean
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          cor_primaria?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          pessoal?: boolean
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      formas_pagamento: {
        Row: {
          created_at: string
          descricao: string
          empresa_id: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          empresa_id?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          empresa_id?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formas_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          empresa_id: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      integracoes: {
        Row: {
          ambiente: string
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          plataforma: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          ambiente?: string
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          plataforma: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          ambiente?: string
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          plataforma?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integracoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_code_permissoes: {
        Row: {
          id: string
          invite_code_id: string
          pode_alterar: boolean
          pode_excluir: boolean
          pode_incluir: boolean
          tela: string
        }
        Insert: {
          id?: string
          invite_code_id: string
          pode_alterar?: boolean
          pode_excluir?: boolean
          pode_incluir?: boolean
          tela: string
        }
        Update: {
          id?: string
          invite_code_id?: string
          pode_alterar?: boolean
          pode_excluir?: boolean
          pode_incluir?: boolean
          tela?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_code_permissoes_invite_code_id_fkey"
            columns: ["invite_code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          created_by: string
          empresa_id: string
          expires_at: string | null
          id: string
          max_uses: number | null
          redeemed_at: string | null
          redeemed_by: string | null
          redeemed_by_email: string | null
          redeemed_by_name: string | null
          role: Database["public"]["Enums"]["app_role"]
          uses: number | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          created_by: string
          empresa_id: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redeemed_by_email?: string | null
          redeemed_by_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          uses?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          created_by?: string
          empresa_id?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redeemed_by_email?: string | null
          redeemed_by_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          categoria_id: string | null
          cliente_id: string | null
          conta_bancaria_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string | null
          forma_pagamento_id: string | null
          fornecedor_id: string | null
          id: string
          origem: string
          parcela_atual: number | null
          projeto_id: string | null
          recorrencia_fim: string | null
          recorrencia_tipo: string | null
          recorrente: boolean
          status: string
          tipo: string
          total_parcelas: number | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          cliente_id?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          empresa_id?: string | null
          forma_pagamento_id?: string | null
          fornecedor_id?: string | null
          id?: string
          origem?: string
          parcela_atual?: number | null
          projeto_id?: string | null
          recorrencia_fim?: string | null
          recorrencia_tipo?: string | null
          recorrente?: boolean
          status?: string
          tipo?: string
          total_parcelas?: number | null
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria_id?: string | null
          cliente_id?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string | null
          forma_pagamento_id?: string | null
          fornecedor_id?: string | null
          id?: string
          origem?: string
          parcela_atual?: number | null
          projeto_id?: string | null
          recorrencia_fim?: string | null
          recorrencia_tipo?: string | null
          recorrente?: boolean
          status?: string
          tipo?: string
          total_parcelas?: number | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_integracoes: {
        Row: {
          created_at: string
          empresa_id: string
          evento: string
          id: string
          payload: Json | null
          plataforma: string
          status: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          evento: string
          id?: string
          payload?: Json | null
          plataforma: string
          status?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          evento?: string
          id?: string
          payload?: Json | null
          plataforma?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_integracoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_chat: {
        Row: {
          conteudo: string
          conversa_id: string
          created_at: string
          id: string
          remetente: string
        }
        Insert: {
          conteudo: string
          conversa_id: string
          created_at?: string
          id?: string
          remetente?: string
        }
        Update: {
          conteudo?: string
          conversa_id?: string
          created_at?: string
          id?: string
          remetente?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas_chat"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          lida: boolean
          mensagem: string
          referencia_id: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          lida?: boolean
          mensagem: string
          referencia_id?: string | null
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          lida?: boolean
          mensagem?: string
          referencia_id?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          email: string
          empresa_id: string | null
          evolution_webhook_url: string | null
          foto_url: string | null
          id: string
          nome: string
          permissao: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa_id?: string | null
          evolution_webhook_url?: string | null
          foto_url?: string | null
          id: string
          nome: string
          permissao?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa_id?: string | null
          evolution_webhook_url?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          permissao?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      permissoes: {
        Row: {
          id: string
          perfis_id: string
          pode_alterar: boolean
          pode_excluir: boolean
          pode_incluir: boolean
          tela: string
        }
        Insert: {
          id?: string
          perfis_id: string
          pode_alterar?: boolean
          pode_excluir?: boolean
          pode_incluir?: boolean
          tela: string
        }
        Update: {
          id?: string
          perfis_id?: string
          pode_alterar?: boolean
          pode_excluir?: boolean
          pode_incluir?: boolean
          tela?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_perfis_id_fkey"
            columns: ["perfis_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          orcamento: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          orcamento?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          orcamento?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projetos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimentos_digitais: {
        Row: {
          created_at: string
          data_prevista: string | null
          data_recebida: string | null
          id: string
          status: string
          valor: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          data_prevista?: string | null
          data_recebida?: string | null
          id?: string
          status?: string
          valor?: number
          venda_id: string
        }
        Update: {
          created_at?: string
          data_prevista?: string | null
          data_recebida?: string | null
          id?: string
          status?: string
          valor?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_digitais_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas_digitais"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_saida: {
        Row: {
          auto_aprovado: boolean
          created_at: string
          empresa_id: string
          expira_em: string
          id: string
          motivo: string | null
          respondido_em: string | null
          respondido_por: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_aprovado?: boolean
          created_at?: string
          empresa_id: string
          expira_em?: string
          id?: string
          motivo?: string | null
          respondido_em?: string | null
          respondido_por?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_aprovado?: boolean
          created_at?: string
          empresa_id?: string
          expira_em?: string
          id?: string
          motivo?: string | null
          respondido_em?: string | null
          respondido_por?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_saida_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_suporte: {
        Row: {
          acao: string
          created_at: string
          empresa_id: string
          id: string
          motivo: string | null
          registro_descricao: string
          registro_id: string
          resposta: string | null
          status: string
          tabela: string
          updated_at: string
          user_email: string
          user_id: string
          user_nome: string
          user_telefone: string | null
        }
        Insert: {
          acao?: string
          created_at?: string
          empresa_id: string
          id?: string
          motivo?: string | null
          registro_descricao: string
          registro_id: string
          resposta?: string | null
          status?: string
          tabela: string
          updated_at?: string
          user_email: string
          user_id: string
          user_nome: string
          user_telefone?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          empresa_id?: string
          id?: string
          motivo?: string | null
          registro_descricao?: string
          registro_id?: string
          resposta?: string | null
          status?: string
          tabela?: string
          updated_at?: string
          user_email?: string
          user_id?: string
          user_nome?: string
          user_telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_suporte_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_digitais: {
        Row: {
          cliente: string | null
          created_at: string
          data_prevista_recebimento: string | null
          data_venda: string
          empresa_id: string
          id: string
          plataforma: string
          produto: string | null
          status: string
          taxa: number
          valor_bruto: number
          valor_liquido: number
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          data_prevista_recebimento?: string | null
          data_venda?: string
          empresa_id: string
          id?: string
          plataforma: string
          produto?: string | null
          status?: string
          taxa?: number
          valor_bruto?: number
          valor_liquido?: number
        }
        Update: {
          cliente?: string | null
          created_at?: string
          data_prevista_recebimento?: string | null
          data_venda?: string
          empresa_id?: string
          id?: string
          plataforma?: string
          produto?: string | null
          status?: string
          taxa?: number
          valor_bruto?: number
          valor_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_digitais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks_empresa: {
        Row: {
          ativo: boolean
          campo_resposta: string | null
          comportamento: string | null
          created_at: string
          empresa_id: string
          evento: string
          id: string
          nome: string | null
          payload_json: string | null
          tabela: string | null
          url: string
        }
        Insert: {
          ativo?: boolean
          campo_resposta?: string | null
          comportamento?: string | null
          created_at?: string
          empresa_id: string
          evento: string
          id?: string
          nome?: string | null
          payload_json?: string | null
          tabela?: string | null
          url: string
        }
        Update: {
          ativo?: boolean
          campo_resposta?: string | null
          comportamento?: string | null
          created_at?: string
          empresa_id?: string
          evento?: string
          id?: string
          nome?: string | null
          payload_json?: string | null
          tabela?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_empresa_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      user_belongs_to_empresa: {
        Args: { _empresa_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "usuario" | "leitura" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "usuario", "leitura", "super_admin"],
    },
  },
} as const
