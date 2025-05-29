export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_history: {
        Row: {
          id: number
          new_values: Json | null
          old_values: Json | null
          operation: string | null
          performed_at: string | null
          performed_by: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          id?: never
          new_values?: Json | null
          old_values?: Json | null
          operation?: string | null
          performed_at?: string | null
          performed_by?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          id?: never
          new_values?: Json | null
          old_values?: Json | null
          operation?: string | null
          performed_at?: string | null
          performed_by?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string | null
          credit_report_id: string
          id: string
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
          id?: string
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
          id?: string
          mailing_address?: string
          modified_at?: string | null
          modified_by?: string | null
          retention_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          id: string
          phone_number: string | null
          social_security: string | null
          state: string | null
          street_address1: string | null
          street_address2: string | null
          subscribed: boolean
          zip_code: number | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          id: string
          phone_number?: string | null
          social_security?: string | null
          state?: string | null
          street_address1?: string | null
          street_address2?: string | null
          subscribed?: boolean
          zip_code?: number | null
        }
        Update: {
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          social_security?: string | null
          state?: string | null
          street_address1?: string | null
          street_address2?: string | null
          subscribed?: boolean
          zip_code?: number | null
        }
        Relationships: []
      }
      tradelines: {
        Row: {
          account_condition: string
          account_number: string
          balance: number
          created_at: string | null
          credit_line: number
          creditor: string
          date_opened: string
          dispute_count: number | null
          id: string
          monthly_payment: number
          status: string
          type: string
          user_id: string
        }
        Insert: {
          account_condition: string
          account_number: string
          balance: number
          created_at?: string | null
          credit_line: number
          creditor: string
          date_opened: string
          dispute_count?: number | null
          id?: string
          monthly_payment: number
          status: string
          type: string
          user_id: string
        }
        Update: {
          account_condition?: string
          account_number?: string
          balance?: number
          created_at?: string | null
          credit_line?: number
          creditor?: string
          date_opened?: string
          dispute_count?: number | null
          id?: string
          monthly_payment?: number
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          tags: string[] | null
          title: string | null
          transcript_file: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id: string
          tags?: string[] | null
          title?: string | null
          transcript_file?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title?: string | null
          transcript_file?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
