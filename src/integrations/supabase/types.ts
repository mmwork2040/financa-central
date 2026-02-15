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
          parcela_atual: number | null
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
          parcela_atual?: number | null
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
          parcela_atual?: number | null
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
        ]
      }
      perfis: {
        Row: {
          created_at: string
          email: string
          empresa_id: string | null
          id: string
          nome: string
          permissao: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa_id?: string | null
          id: string
          nome: string
          permissao?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa_id?: string | null
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
