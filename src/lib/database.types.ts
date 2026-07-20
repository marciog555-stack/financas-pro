export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      benefit_cards: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          name: string
          owner: string | null
          profile_id: string | null
          type: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          name: string
          owner?: string | null
          profile_id?: string | null
          type: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          name?: string
          owner?: string | null
          profile_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_cards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          due_date: string | null
          id: string
          is_paid: boolean | null
          name: string
          owner: string | null
          profile_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_paid?: boolean | null
          name: string
          owner?: string | null
          profile_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_paid?: boolean | null
          name?: string
          owner?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          color: string | null
          created_at: string | null
          current_amount: number
          id: string
          name: string
          profile_id: string | null
          target_amount: number
          target_date: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          current_amount?: number
          id?: string
          name: string
          profile_id?: string | null
          target_amount: number
          target_date?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          current_amount?: number
          id?: string
          name?: string
          profile_id?: string | null
          target_amount?: number
          target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          is_recurring: boolean | null
          owner: string | null
          profile_id: string | null
          source: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          is_recurring?: boolean | null
          owner?: string | null
          profile_id?: string | null
          source: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          is_recurring?: boolean | null
          owner?: string | null
          profile_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          created_at: string | null
          id: string
          interest_rate: number
          monthly_payment: number
          name: string
          owner: string | null
          profile_id: string | null
          remaining_installments: number
          total_amount: number
          total_installments: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_rate: number
          monthly_payment: number
          name: string
          owner?: string | null
          profile_id?: string | null
          remaining_installments: number
          total_amount: number
          total_installments: number
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_rate?: number
          monthly_payment?: number
          name?: string
          owner?: string | null
          profile_id?: string | null
          remaining_installments?: number
          total_amount?: number
          total_installments?: number
        }
        Relationships: [
          {
            foreignKeyName: "loans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          mode: string | null
          name: string
          partner_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mode?: string | null
          name: string
          partner_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mode?: string | null
          name?: string
          partner_name?: string | null
          updated_at?: string | null
          user_id?: string | null
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
