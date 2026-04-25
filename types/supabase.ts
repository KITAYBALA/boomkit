export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      banned_systems: {
        Row: {
          id: string
          system_signature: string
          banned_at: string
          banned_by: string
          reason: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          id?: string
          system_signature: string
          banned_at?: string
          banned_by: string
          reason?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          id?: string
          system_signature?: string
          banned_at?: string
          banned_by?: string
          reason?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      auction_items: {
        Row: {
          boom_name: string
          current_bid: number
          id: string
          seller: string
          time_left: number
          bidders: string[] | null
        }
        Insert: {
          boom_name: string
          current_bid: number
          id: string
          seller: string
          time_left: number
          bidders?: string[] | null
        }
        Update: {
          boom_name?: string
          current_bid?: number
          id?: string
          seller?: string
          time_left?: number
          bidders?: string[] | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          message: string
          role: string
          timestamp: number
          username: string
        }
        Insert: {
          id: string
          message: string
          role: string
          timestamp: number
          username: string
        }
        Update: {
          id?: string
          message?: string
          role?: string
          timestamp?: number
          username?: string
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          assigned_date: string
          assigned_by: string
          color: string
          id: string
          name: string
        }
        Insert: {
          assigned_date: string
          assigned_by: string
          color: string
          id: string
          name: string
        }
        Update: {
          assigned_date?: string
          assigned_by?: string
          color?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          id: string
          pin: string
          host_id: string
          host_username: string
          grade: number
          subject: string
          questions: Json
          status: string
          duration: number
          players: Json
          mode: string
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          pin: string
          host_id: string
          host_username: string
          grade: number
          subject: string
          questions: Json
          status?: string
          duration: number
          players?: Json
          mode?: string
          settings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          pin?: string
          host_id?: string
          host_username?: string
          grade?: number
          subject?: string
          questions?: Json
          status?: string
          duration?: number
          players?: Json
          mode?: string
          settings?: Json
          created_at?: string
        }
        Relationships: []
      }
      packs: {
        Row: {
          booms: Json
          color: string
          id: string
          image: string
          name: string
          price: number
          rarity: string
        }
        Insert: {
          booms: Json
          color: string
          id: string
          image: string
          name: string
          price: number
          rarity: string
        }
        Update: {
          booms?: Json
          color?: string
          id?: string
          image?: string
          name?: string
          price?: number
          rarity?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          age: number
          ban_expiry: number | null
          ban_reason: string | null
          banner_color: string
          booms: Json
          daily_tokens: number
          email: string
          id: string
          is_banned: boolean
          is_muted: boolean
          is_owner: boolean
          is_plus_user: boolean
          join_date: string
          last_daily_spin: string
          last_seen: number
          mute_expiry: number | null
          name_color: string
          packs: string[]
          profile_picture: string
          reason: string
          role: string
          status: string
          tokens: number
          total_value: number
          username: string
          badges: string[] | null
          xp: number
          level: number
        }
        Insert: {
          age: number
          ban_expiry?: number | null
          ban_reason?: string | null
          banner_color: string
          booms: Json
          daily_tokens: number
          email: string
          id: string
          is_banned?: boolean
          is_muted?: boolean
          is_owner?: boolean
          is_plus_user?: boolean
          join_date: string
          last_daily_spin: string
          last_seen?: number
          mute_expiry?: number | null
          name_color: string
          packs: string[]
          profile_picture: string
          reason: string
          role: string
          status: string
          tokens: number
          total_value: number
          username: string
          badges?: string[] | null
          xp?: number
          level?: number
        }
        Update: {
          age?: number
          ban_expiry?: number | null
          ban_reason?: string | null
          banner_color?: string
          booms?: Json
          daily_tokens?: number
          email?: string
          id?: string
          is_banned?: boolean
          is_muted?: boolean
          is_owner?: boolean
          is_plus_user?: boolean
          join_date?: string
          last_daily_spin?: string
          last_seen?: number
          mute_expiry?: number | null
          name_color?: string
          packs?: string[]
          profile_picture?: string
          reason?: string
          role?: string
          status?: string
          tokens?: number
          total_value?: number
          username?: string
          badges?: string[] | null
          xp?: number
          level?: number
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export type Tables<
  T extends keyof Database['public']['Tables'],
  K extends keyof Database['public']['Tables'][T]['Row'] = keyof Database['public']['Tables'][T]['Row']
> = Database['public']['Tables'][T]['Row'][K]
