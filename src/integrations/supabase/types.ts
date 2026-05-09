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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          model: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      api_configurations: {
        Row: {
          api_key_encrypted: string | null
          api_name: string
          category: string
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          api_name: string
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          api_name?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nome: string
          saldo: number
          status: string
          tipo: string
          ultima_sinc: string | null
          user_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nome: string
          saldo?: number
          status?: string
          tipo?: string
          ultima_sinc?: string | null
          user_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
          saldo?: number
          status?: string
          tipo?: string
          ultima_sinc?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          banco: string | null
          classificado: boolean
          conta_contabil: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          banco?: string | null
          classificado?: boolean
          conta_contabil?: string | null
          created_at?: string
          data?: string
          descricao: string
          id?: string
          tipo?: string
          user_id: string
          valor?: number
        }
        Update: {
          banco?: string | null
          classificado?: boolean
          conta_contabil?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      certificados_digitais: {
        Row: {
          cnpj: string | null
          created_at: string
          emissor: string | null
          file_path: string | null
          id: string
          nome_arquivo: string
          razao_social: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string
          validade: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          emissor?: string | null
          file_path?: string | null
          id?: string
          nome_arquivo: string
          razao_social?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id: string
          validade?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          emissor?: string | null
          file_path?: string | null
          id?: string
          nome_arquivo?: string
          razao_social?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          validade?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          cnpj: string | null
          company_name: string
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          monthly_fee: number | null
          notes: string | null
          phone: string | null
          status: string
          tax_regime: string | null
          trade_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string | null
          company_name: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          monthly_fee?: number | null
          notes?: string | null
          phone?: string | null
          status?: string
          tax_regime?: string | null
          trade_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string | null
          company_name?: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          monthly_fee?: number | null
          notes?: string | null
          phone?: string | null
          status?: string
          tax_regime?: string | null
          trade_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          client_id: string | null
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          category?: string | null
          client_id?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_configurations: {
        Row: {
          certificate_filename: string | null
          certificate_password_encrypted: string | null
          certificate_password_hash: string | null
          certificate_path: string | null
          consecutive_validation_failures: number | null
          created_at: string
          environment: Database["public"]["Enums"]["sefaz_environment"]
          id: string
          is_suspended: boolean | null
          max_retries: number | null
          retry_delay_minutes: number | null
          uf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_filename?: string | null
          certificate_password_encrypted?: string | null
          certificate_password_hash?: string | null
          certificate_path?: string | null
          consecutive_validation_failures?: number | null
          created_at?: string
          environment?: Database["public"]["Enums"]["sefaz_environment"]
          id?: string
          is_suspended?: boolean | null
          max_retries?: number | null
          retry_delay_minutes?: number | null
          uf: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_filename?: string | null
          certificate_password_encrypted?: string | null
          certificate_password_hash?: string | null
          certificate_path?: string | null
          consecutive_validation_failures?: number | null
          created_at?: string
          environment?: Database["public"]["Enums"]["sefaz_environment"]
          id?: string
          is_suspended?: boolean | null
          max_retries?: number | null
          retry_delay_minutes?: number | null
          uf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nf_eventos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nfe_id: string | null
          nfse_id: string | null
          protocolo: string | null
          sequencia: number | null
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nfe_id?: string | null
          nfse_id?: string | null
          protocolo?: string | null
          sequencia?: number | null
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nfe_id?: string | null
          nfse_id?: string | null
          protocolo?: string | null
          sequencia?: number | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nf_eventos_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe_emitidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nf_eventos_nfse_id_fkey"
            columns: ["nfse_id"]
            isOneToOne: false
            referencedRelation: "nfse_emitidas"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_emitidas: {
        Row: {
          cancelada_em: string | null
          cce_data: string | null
          cce_sequencia: number | null
          cce_texto: string | null
          chave_acesso: string | null
          client_id: string | null
          cnpj_destinatario: string | null
          cnpj_emitente: string | null
          created_at: string
          data_emissao: string
          id: string
          info_complementares: string | null
          integrador: string | null
          motivo_cancelamento: string | null
          natureza_operacao: string | null
          numero: string
          razao_destinatario: string | null
          serie: string
          status: string
          uf_destino: string | null
          user_id: string
          valor_icms: number
          valor_ipi: number
          valor_produtos: number
          valor_total: number
        }
        Insert: {
          cancelada_em?: string | null
          cce_data?: string | null
          cce_sequencia?: number | null
          cce_texto?: string | null
          chave_acesso?: string | null
          client_id?: string | null
          cnpj_destinatario?: string | null
          cnpj_emitente?: string | null
          created_at?: string
          data_emissao?: string
          id?: string
          info_complementares?: string | null
          integrador?: string | null
          motivo_cancelamento?: string | null
          natureza_operacao?: string | null
          numero: string
          razao_destinatario?: string | null
          serie?: string
          status?: string
          uf_destino?: string | null
          user_id: string
          valor_icms?: number
          valor_ipi?: number
          valor_produtos?: number
          valor_total?: number
        }
        Update: {
          cancelada_em?: string | null
          cce_data?: string | null
          cce_sequencia?: number | null
          cce_texto?: string | null
          chave_acesso?: string | null
          client_id?: string | null
          cnpj_destinatario?: string | null
          cnpj_emitente?: string | null
          created_at?: string
          data_emissao?: string
          id?: string
          info_complementares?: string | null
          integrador?: string | null
          motivo_cancelamento?: string | null
          natureza_operacao?: string | null
          numero?: string
          razao_destinatario?: string | null
          serie?: string
          status?: string
          uf_destino?: string | null
          user_id?: string
          valor_icms?: number
          valor_ipi?: number
          valor_produtos?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "nfe_emitidas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_itens: {
        Row: {
          cfop: string | null
          cofins_aliquota: number
          descricao: string
          icms_aliquota: number
          id: string
          ipi_aliquota: number
          ncm: string | null
          nfe_id: string
          numero_item: number
          pis_aliquota: number
          quantidade: number
          unidade: string
          valor_unitario: number
        }
        Insert: {
          cfop?: string | null
          cofins_aliquota?: number
          descricao: string
          icms_aliquota?: number
          id?: string
          ipi_aliquota?: number
          ncm?: string | null
          nfe_id: string
          numero_item?: number
          pis_aliquota?: number
          quantidade?: number
          unidade?: string
          valor_unitario?: number
        }
        Update: {
          cfop?: string | null
          cofins_aliquota?: number
          descricao?: string
          icms_aliquota?: number
          id?: string
          ipi_aliquota?: number
          ncm?: string | null
          nfe_id?: string
          numero_item?: number
          pis_aliquota?: number
          quantidade?: number
          unidade?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "nfe_itens_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe_emitidas"
            referencedColumns: ["id"]
          },
        ]
      }
      nfse_emitidas: {
        Row: {
          base_calculo: number
          cancelada_em: string | null
          client_id: string | null
          cnpj_prestador: string | null
          cnpj_tomador: string | null
          codigo_servico: string | null
          codigo_verificacao: string | null
          cofins_valor: number
          created_at: string
          csll_valor: number
          data_emissao: string
          discriminacao: string
          id: string
          inss_valor: number
          ir_valor: number
          iss_aliquota: number
          iss_valor: number
          motivo_cancelamento: string | null
          municipio_prestacao: string | null
          numero: string
          pis_valor: number
          razao_prestador: string | null
          razao_tomador: string | null
          serie: string
          status: string
          updated_at: string
          user_id: string
          valor_deducoes: number
          valor_liquido: number
          valor_servicos: number
        }
        Insert: {
          base_calculo?: number
          cancelada_em?: string | null
          client_id?: string | null
          cnpj_prestador?: string | null
          cnpj_tomador?: string | null
          codigo_servico?: string | null
          codigo_verificacao?: string | null
          cofins_valor?: number
          created_at?: string
          csll_valor?: number
          data_emissao?: string
          discriminacao: string
          id?: string
          inss_valor?: number
          ir_valor?: number
          iss_aliquota?: number
          iss_valor?: number
          motivo_cancelamento?: string | null
          municipio_prestacao?: string | null
          numero: string
          pis_valor?: number
          razao_prestador?: string | null
          razao_tomador?: string | null
          serie?: string
          status?: string
          updated_at?: string
          user_id: string
          valor_deducoes?: number
          valor_liquido?: number
          valor_servicos?: number
        }
        Update: {
          base_calculo?: number
          cancelada_em?: string | null
          client_id?: string | null
          cnpj_prestador?: string | null
          cnpj_tomador?: string | null
          codigo_servico?: string | null
          codigo_verificacao?: string | null
          cofins_valor?: number
          created_at?: string
          csll_valor?: number
          data_emissao?: string
          discriminacao?: string
          id?: string
          inss_valor?: number
          ir_valor?: number
          iss_aliquota?: number
          iss_valor?: number
          motivo_cancelamento?: string | null
          municipio_prestacao?: string | null
          numero?: string
          pis_valor?: number
          razao_prestador?: string | null
          razao_tomador?: string | null
          serie?: string
          status?: string
          updated_at?: string
          user_id?: string
          valor_deducoes?: number
          valor_liquido?: number
          valor_servicos?: number
        }
        Relationships: [
          {
            foreignKeyName: "nfse_emitidas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          audit: boolean | null
          dead_letter_alerts_email: boolean | null
          dead_letter_alerts_push: boolean | null
          email: boolean | null
          id: string
          nfe: boolean | null
          nfse: boolean | null
          push: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audit?: boolean | null
          dead_letter_alerts_email?: boolean | null
          dead_letter_alerts_push?: boolean | null
          email?: boolean | null
          id?: string
          nfe?: boolean | null
          nfse?: boolean | null
          push?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audit?: boolean | null
          dead_letter_alerts_email?: boolean | null
          dead_letter_alerts_push?: boolean | null
          email?: boolean | null
          id?: string
          nfe?: boolean | null
          nfse?: boolean | null
          push?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      obligations: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          created_at: string
          due_date: string
          id: string
          notes: string | null
          reference_period: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          reference_period?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          reference_period?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obligations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_documents: {
        Row: {
          created_at: string
          document_type: string
          id: string
          is_processing: boolean | null
          last_error: string | null
          next_retry_at: string | null
          period_date: string
          processing_log: Json | null
          protocol_number: string | null
          receipt_number: string | null
          retry_count: number | null
          sefaz_response_code: string | null
          sefaz_response_message: string | null
          signed_xml_content: string | null
          status: string
          updated_at: string
          user_id: string
          xml_content: string
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: string
          is_processing?: boolean | null
          last_error?: string | null
          next_retry_at?: string | null
          period_date?: string
          processing_log?: Json | null
          protocol_number?: string | null
          receipt_number?: string | null
          retry_count?: number | null
          sefaz_response_code?: string | null
          sefaz_response_message?: string | null
          signed_xml_content?: string | null
          status?: string
          updated_at?: string
          user_id: string
          xml_content: string
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: string
          is_processing?: boolean | null
          last_error?: string | null
          next_retry_at?: string | null
          period_date?: string
          processing_log?: Json | null
          protocol_number?: string | null
          receipt_number?: string | null
          retry_count?: number | null
          sefaz_response_code?: string | null
          sefaz_response_message?: string | null
          signed_xml_content?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          xml_content?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          crc: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          crc?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          crc?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      token_usage: {
        Row: {
          action_type: string
          cost_estimate: number
          created_at: string
          description: string | null
          id: string
          model: string | null
          tokens_input: number
          tokens_output: number
          total_tokens: number
          user_id: string
        }
        Insert: {
          action_type: string
          cost_estimate?: number
          created_at?: string
          description?: string | null
          id?: string
          model?: string | null
          tokens_input?: number
          tokens_output?: number
          total_tokens?: number
          user_id: string
        }
        Update: {
          action_type?: string
          cost_estimate?: number
          created_at?: string
          description?: string | null
          id?: string
          model?: string | null
          tokens_input?: number
          tokens_output?: number
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_nfe_access_key: {
        Args: {
          p_cnpj: string
          p_numero: string
          p_serie: string
          p_uf: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "contador" | "auxiliar"
      sefaz_environment: "homologacao" | "producao"
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
      app_role: ["admin", "contador", "auxiliar"],
      sefaz_environment: ["homologacao", "producao"],
    },
  },
} as const
