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
      barbershops: {
        Row: {
          id: string
          slug: string
          name: string
          timezone: string
          theme_settings: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          timezone?: string
          theme_settings?: Json
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          timezone?: string
          theme_settings?: Json
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      barbershop_memberships: {
        Row: {
          id: string
          barbershop_id: string
          profile_id: string
          role: 'owner' | 'manager'
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          profile_id: string
          role: 'owner' | 'manager'
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          profile_id?: string
          role?: 'owner' | 'manager'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'barbershop_memberships_barbershop_id_fkey'
            columns: ['barbershop_id']
            isRelationOneToOne: false
            referencedRelation: 'barbershops'
          },
          {
            foreignKeyName: 'barbershop_memberships_profile_id_fkey'
            columns: ['profile_id']
            isRelationOneToOne: false
            referencedRelation: 'profiles'
          }
        ]
      }
      turns: {
        Row: {
          id: string
          barbershop_id: string
          turn_number: number
          client_name: string
          source: 'walk-in' | 'remote'
          status: 'waiting' | 'called' | 'attended' | 'cancelled'
          joined_at: string
          called_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          created_by_membership_id: string | null
        }
        Insert: {
          id?: string
          barbershop_id: string
          turn_number: number
          client_name: string
          source: 'walk-in' | 'remote'
          status?: 'waiting' | 'called' | 'attended' | 'cancelled'
          joined_at?: string
          called_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          created_by_membership_id?: string | null
        }
        Update: {
          id?: string
          barbershop_id?: string
          turn_number?: number
          client_name?: string
          source?: 'walk-in' | 'remote'
          status?: 'waiting' | 'called' | 'attended' | 'cancelled'
          joined_at?: string
          called_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          created_by_membership_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'turns_barbershop_id_fkey'
            columns: ['barbershop_id']
            isRelationOneToOne: false
            referencedRelation: 'barbershops'
          },
          {
            foreignKeyName: 'turns_created_by_membership_id_fkey'
            columns: ['created_by_membership_id']
            isRelationOneToOne: false
            referencedRelation: 'barbershop_memberships'
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_turn: {
        Args: {
          target_barbershop_id: string
        }
        Returns: {
          previous_turn_id: string | null
          new_called_turn_id: string | null
          affected_turns: string[]
        }[]
      }
      seed_demo_admin: {
        Args: {
          admin_user_id: string
        }
        Returns: undefined
      }
      seed_demo_environment: {
        Args: Record<string, never>
        Returns: Json
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

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'] extends Record<string, unknown>
    ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
    : never
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never
