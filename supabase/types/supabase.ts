export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      disputes: {
        Row: {
          created_at: string;
          credit_bureau: string;
          id: string;
          letter_content: string;
          mailing_address: string;
          shipping_label_url: string | null;
          status: string;
          tracking_number: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          credit_bureau: string;
          id?: string;
          letter_content: string;
          mailing_address: string;
          shipping_label_url?: string | null;
          status?: string;
          tracking_number?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          credit_bureau?: string;
          id?: string;
          letter_content?: string;
          mailing_address?: string;
          shipping_label_url?: string | null;
          status?: string;
          tracking_number?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      credit_reports: {
        Row: {
          id: string;
          user_id: string;
          file_path: string;
          file_name: string;
          upload_date: string;
          status: string;
          analysis_summary: Json | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_path: string;
          file_name: string;
          upload_date: string;
          status: string;
          analysis_summary?: Json | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_path?: string;
          file_name?: string;
          upload_date?: string;
          status?: string;
          analysis_summary?: Json | null;
          error_message?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "credit_reports_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          first_name: string | null;
          last_name: string | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          id: string;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      tradelines: {
        Row: {
          id: string;
          user_id: string;
          creditor: string;
          account_number: string;
          status: string;
          type: string;
          balance: number;
          date_opened: string;
          credit_line: number;
          monthly_payment: number;
          account_condition: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          creditor: string;
          account_number: string;
          status: string;
          type: string;
          balance: number;
          date_opened: string;
          credit_line: number;
          monthly_payment: number;
          account_condition: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          creditor?: string;
          account_number?: string;
          status?: string;
          type?: string;
          balance?: number;
          date_opened?: string;
          credit_line?: number;
          monthly_payment?: number;
          account_condition?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tradelines_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
