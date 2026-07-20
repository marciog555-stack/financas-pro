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
          household_id: string
          id: string
          name: string
          owner_profile_id: string | null
          type: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          household_id: string
          id?: string
          name: string
          owner_profile_id?: string | null
          type: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          household_id?: string
          id?: string
          name?: string
          owner_profile_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_cards_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_cards_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
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
          household_id: string
          id: string
          is_paid: boolean | null
          name: string
          owner_profile_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          due_date?: string | null
          household_id: string
          id?: string
          is_paid?: boolean | null
          name: string
          owner_profile_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          due_date?: string | null
          household_id?: string
          id?: string
          is_paid?: boolean | null
          name?: string
          owner_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
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
          household_id: string
          id: string
          name: string
          target_amount: number
          target_date: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          current_amount?: number
          household_id: string
          id?: string
          name: string
          target_amount: number
          target_date?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          current_amount?: number
          household_id?: string
          id?: string
          name?: string
          target_amount?: number
          target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          attachment_path: string | null
          created_at: string | null
          date: string
          household_id: string
          id: string
          is_recurring: boolean | null
          owner_profile_id: string | null
          source: string
        }
        Insert: {
          amount: number
          attachment_path?: string | null
          created_at?: string | null
          date: string
          household_id: string
          id?: string
          is_recurring?: boolean | null
          owner_profile_id?: string | null
          source: string
        }
        Update: {
          amount?: number
          attachment_path?: string | null
          created_at?: string | null
          date?: string
          household_id?: string
          id?: string
          is_recurring?: boolean | null
          owner_profile_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          household_id: string
          id: string
          is_paid: boolean
          loan_id: string
          number: number
          paid_date: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          household_id: string
          id?: string
          is_paid?: boolean
          loan_id: string
          number: number
          paid_date?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          household_id?: string
          id?: string
          is_paid?: boolean
          loan_id?: string
          number?: number
          paid_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_installments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_installments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          attachment_path: string | null
          created_at: string | null
          first_due_date: string
          household_id: string
          id: string
          interest_rate: number
          monthly_payment: number
          name: string
          owner_profile_id: string | null
          remaining_installments: number
          total_amount: number
          total_installments: number
        }
        Insert: {
          attachment_path?: string | null
          created_at?: string | null
          first_due_date?: string
          household_id: string
          id?: string
          interest_rate: number
          monthly_payment: number
          name: string
          owner_profile_id?: string | null
          remaining_installments: number
          total_amount: number
          total_installments: number
        }
        Update: {
          attachment_path?: string | null
          created_at?: string | null
          first_due_date?: string
          household_id?: string
          id?: string
          interest_rate?: number
          monthly_payment?: number
          name?: string
          owner_profile_id?: string | null
          remaining_installments?: number
          total_amount?: number
          total_installments?: number
        }
        Relationships: [
          {
            foreignKeyName: "loans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          household_id: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          household_id?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          household_id?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_household: {
        Args: { p_display_name: string; p_household_name: string }
        Returns: string
      }
      is_household_member: {
        Args: { p_household_id: string }
        Returns: boolean
      }
      join_household: {
        Args: { p_display_name: string; p_invite_code: string }
        Returns: string
      }
      regenerate_invite_code: {
        Args: { p_household_id: string }
        Returns: string
      }
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
