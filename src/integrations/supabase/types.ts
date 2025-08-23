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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Relationships: []
      }
      audit_history: {
        Row: {
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          operation: string | null
          performed_by: string | null
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation?: string | null
          performed_by?: string | null
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation?: string | null
          performed_by?: string | null
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      credit_reports: {
        Row: {
          created_at: string
          encrypted_content: string | null
          encryption_key_id: string | null
          id: string
          report_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_content?: string | null
          encryption_key_id?: string | null
          id?: string
          report_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_content?: string | null
          encryption_key_id?: string | null
          id?: string
          report_date?: string
          user_id?: string
        }
        Relationships: []
      }
      dispute_letter: {
        Row: {
          address: string | null
          city: string | null
          created_on: string
          delivery_status: string | null
          email: string | null
          fist_name: string | null
          id: string
          last_name: string | null
          lob_id: string | null
          state: string | null
          tradelines: Json | null
          user_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_on?: string
          delivery_status?: string | null
          email?: string | null
          fist_name?: string | null
          id?: string
          last_name?: string | null
          lob_id?: string | null
          state?: string | null
          tradelines?: Json | null
          user_id: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_on?: string
          delivery_status?: string | null
          email?: string | null
          fist_name?: string | null
          id?: string
          last_name?: string | null
          lob_id?: string | null
          state?: string | null
          tradelines?: Json | null
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      dispute_packets: {
        Row: {
          bureau_count: number | null
          created_at: string
          dispute_letter_url: string | null
          document_urls: string | null
          file_name: string
          file_path: string
          id: string
          metadata: Json | null
          packet_status: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          bureau_count?: number | null
          created_at?: string
          dispute_letter_url?: string | null
          document_urls?: string | null
          file_name: string
          file_path: string
          id?: string
          metadata?: Json | null
          packet_status?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          bureau_count?: number | null
          created_at?: string
          dispute_letter_url?: string | null
          document_urls?: string | null
          file_name?: string
          file_path?: string
          id?: string
          metadata?: Json | null
          packet_status?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string | null
          credit_report_id: string
          email: string | null
          id: string
          lob_id: string | null
          mailing_address: string
          modified_at: string | null
          modified_by: string | null
          retention_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credit_report_id: string
          email?: string | null
          id?: string
          lob_id?: string | null
          mailing_address: string
          modified_at?: string | null
          modified_by?: string | null
          retention_date?: string | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credit_report_id?: string
          email?: string | null
          id?: string
          lob_id?: string | null
          mailing_address?: string
          modified_at?: string | null
          modified_by?: string | null
          retention_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      encrypted_report_content: {
        Row: {
          content_id: string | null
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      experian_test: {
        Row: {
          account_balance: string | null
          account_number: string | null
          account_number_prefix: string | null
          account_status: string | null
          account_type: string | null
          created_at: string | null
          credit_bureau: string
          credit_limit: string | null
          creditor_name: string | null
          date_opened: string | null
          dispute_count: number | null
          id: string
          is_negative: boolean | null
          monthly_payment: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_balance?: string | null
          account_number?: string | null
          account_number_prefix?: string | null
          account_status?: string | null
          account_type?: string | null
          created_at?: string | null
          credit_bureau?: string
          credit_limit?: string | null
          creditor_name?: string | null
          date_opened?: string | null
          dispute_count?: number | null
          id?: string
          is_negative?: boolean | null
          monthly_payment?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_balance?: string | null
          account_number?: string | null
          account_number_prefix?: string | null
          account_status?: string | null
          account_type?: string | null
          created_at?: string | null
          credit_bureau?: string
          credit_limit?: string | null
          creditor_name?: string | null
          date_opened?: string | null
          dispute_count?: number | null
          id?: string
          is_negative?: boolean | null
          monthly_payment?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      letters: {
        Row: {
          cost_cents: number
          created_at: string | null
          file_path: string
          id: string
          lob_id: string | null
          sent_at: string | null
          status: string
          to_address: string
          to_name: string
          user_id: string
        }
        Insert: {
          cost_cents?: number
          created_at?: string | null
          file_path: string
          id?: string
          lob_id?: string | null
          sent_at?: string | null
          status?: string
          to_address: string
          to_name: string
          user_id: string
        }
        Update: {
          cost_cents?: number
          created_at?: string | null
          file_path?: string
          id?: string
          lob_id?: string | null
          sent_at?: string | null
          status?: string
          to_address?: string
          to_name?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string | null
          id: string
          status: string
          stripe_payment_id: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          id?: string
          status: string
          stripe_payment_id: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          id?: string
          status?: string
          stripe_payment_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address1: string | null
          address2: string | null
          avatar_url: string | null
          city: string | null
          dob: string | null
          first_name: string | null
          id: string
          last_four_of_ssn: string | null
          last_name: string | null
          phone_number: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          avatar_url?: string | null
          city?: string | null
          dob?: string | null
          first_name?: string | null
          id?: string
          last_four_of_ssn?: string | null
          last_name?: string | null
          phone_number?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address1?: string | null
          address2?: string | null
          avatar_url?: string | null
          city?: string | null
          dob?: string | null
          first_name?: string | null
          id?: string
          last_four_of_ssn?: string | null
          last_name?: string | null
          phone_number?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      tradeline_test: {
        Row: {
          account_balance: string | null
          account_number: string | null
          account_status: string | null
          account_type: string | null
          created_at: string | null
          credit_bureau: string | null
          credit_limit: string | null
          creditor_name: string | null
          date_opened: string | null
          id: string | null
          monthly_payment: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_balance?: string | null
          account_number?: string | null
          account_status?: string | null
          account_type?: string | null
          created_at?: string | null
          credit_bureau?: string | null
          credit_limit?: string | null
          creditor_name?: string | null
          date_opened?: string | null
          id?: string | null
          monthly_payment?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_balance?: string | null
          account_number?: string | null
          account_status?: string | null
          account_type?: string | null
          created_at?: string | null
          credit_bureau?: string | null
          credit_limit?: string | null
          creditor_name?: string | null
          date_opened?: string | null
          id?: string | null
          monthly_payment?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tradelines: {
        Row: {
          account_balance: string | null
          account_number: string | null
          account_number_prefix: string | null
          account_status: string | null
          account_type: string | null
          created_at: string | null
          credit_bureau: string
          credit_limit: string | null
          creditor_name: string | null
          date_opened: string | null
          dispute_count: number | null
          id: string
          is_negative: boolean | null
          monthly_payment: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_balance?: string | null
          account_number?: string | null
          account_number_prefix?: string | null
          account_status?: string | null
          account_type?: string | null
          created_at?: string | null
          credit_bureau?: string
          credit_limit?: string | null
          creditor_name?: string | null
          date_opened?: string | null
          dispute_count?: number | null
          id?: string
          is_negative?: boolean | null
          monthly_payment?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_balance?: string | null
          account_number?: string | null
          account_number_prefix?: string | null
          account_status?: string | null
          account_type?: string | null
          created_at?: string | null
          credit_bureau?: string
          credit_limit?: string | null
          creditor_name?: string | null
          date_opened?: string | null
          dispute_count?: number | null
          id?: string
          is_negative?: boolean | null
          monthly_payment?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          document_type: string | null
          file_url: string | null
          id: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          document_type?: string | null
          file_url?: string | null
          id?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Update: {
          document_type?: string | null
          file_url?: string | null
          id?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      can_upload_dispute_packet: {
        Args: { userid: string }
        Returns: boolean
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      fetch_tradelines: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      has_role: {
        Args:
          | { _role: Database["public"]["Enums"]["app_role"]; _user_id: string }
          | { check_role: string }
        Returns: boolean
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      parse_flexible_date: {
        Args: { p_date_string: string }
        Returns: string
      }
      update_user_profile_timestamp: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      upsert_tradeline: {
        Args: {
          p_account_balance: string
          p_account_number: string
          p_account_status: string
          p_account_type: string
          p_credit_bureau: string
          p_credit_limit: string
          p_creditor_name: string
          p_date_opened: string
          p_is_negative: boolean
          p_monthly_payment: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_permission: "channels.delete" | "messages.delete"
      app_role: "admin" | "moderator" | "user"
      bureau: "equifax" | "transunion" | "experian" | "'" | "null"
      tradeline_status:
        | "open"
        | "closed"
        | "in_collection"
        | "charged_off"
        | "disputed"
        | "late"
        | "collections"
        | "paid-closed"
        | "current-account"
        | "never-late"
        | "null"
      tradeline_type:
        | "credit_card"
        | "loan"
        | "mortgage"
        | "auto_loan"
        | "student_loan"
        | "collection"
        | "null"
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
      app_permission: ["channels.delete", "messages.delete"],
      app_role: ["admin", "moderator", "user"],
      bureau: ["equifax", "transunion", "experian", "'", "null"],
      tradeline_status: [
        "open",
        "closed",
        "in_collection",
        "charged_off",
        "disputed",
        "late",
        "collections",
        "paid-closed",
        "current-account",
        "never-late",
        "null",
      ],
      tradeline_type: [
        "credit_card",
        "loan",
        "mortgage",
        "auto_loan",
        "student_loan",
        "collection",
        "null",
      ],
    },
  },
} as const
