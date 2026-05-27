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
      blacklisted_ips: {
        Row: {
          ip: string
          reason: string | null
          banned_at: string
          banned_by: string | null
        }
        Insert: {
          ip: string
          reason?: string | null
          banned_at?: string
          banned_by?: string | null
        }
        Update: {
          ip?: string
          reason?: string | null
          banned_at?: string
          banned_by?: string | null
        }
        Relationships: []
      }
      auction_items: {
        Row: {
          id: string
          boom_name: string
          seller: string
          current_bid: number
          top_bidder: string | null
          top_bidder_id: string | null
          ends_at: string
          created_at: string
          bidders: Json | null
          status: string | null
          time_left: number | null
        }
        Insert: {
          id?: string
          boom_name: string
          seller: string
          current_bid: number
          top_bidder?: string | null
          top_bidder_id?: string | null
          ends_at: string
          created_at?: string
          bidders?: Json | null
          status?: string | null
          time_left?: number | null
        }
        Update: {
          id?: string
          boom_name?: string
          seller?: string
          current_bid?: number
          top_bidder?: string | null
          top_bidder_id?: string | null
          ends_at?: string
          created_at?: string
          bidders?: Json | null
          status?: string | null
          time_left?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          message: string
          role: string
          timestamp: number | null
          username: string
          inserted_at: string
          reactions: Json | null
        }
        Insert: {
          id: string
          message: string
          role: string
          timestamp?: number | null
          username: string
          inserted_at?: string
          reactions?: Json | null
        }
        Update: {
          id?: string
          message?: string
          role?: string
          timestamp?: number | null
          username?: string
          inserted_at?: string
          reactions?: Json | null
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
          boom_score: number | null
          password_hash: string | null
          password_reset_required: boolean | null
          last_ip: string | null
          login_streak: number | null
          last_streak_claim: string | null
          season_xp: number | null
          has_plus_pass: boolean | null
          games_played: number | null
          total_tokens_earned: number | null
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
          boom_score?: number | null
          password_hash?: string | null
          password_reset_required?: boolean | null
          last_ip?: string | null
          login_streak?: number | null
          last_streak_claim?: string | null
          season_xp?: number | null
          has_plus_pass?: boolean | null
          games_played?: number | null
          total_tokens_earned?: number | null
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
          boom_score?: number | null
          password_hash?: string | null
          password_reset_required?: boolean | null
          last_ip?: string | null
          login_streak?: number | null
          last_streak_claim?: string | null
          season_xp?: number | null
          has_plus_pass?: boolean | null
          games_played?: number | null
          total_tokens_earned?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          name: string | null
          is_group: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          is_group?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          is_group?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          sender_username: string
          message: string
          inserted_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          sender_username: string
          message: string
          inserted_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          sender_username?: string
          message?: string
          inserted_at?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          id: string
          sender_id: string
          sender_username: string
          receiver_id: string
          receiver_username: string
          sender_booms: Json
          receiver_booms: Json
          sender_tokens: number
          receiver_tokens: number
          status: string
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          sender_username: string
          receiver_id: string
          receiver_username: string
          sender_booms?: Json
          receiver_booms?: Json
          sender_tokens?: number
          receiver_tokens?: number
          status?: string
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          sender_username?: string
          receiver_id?: string
          receiver_username?: string
          sender_booms?: Json
          receiver_booms?: Json
          sender_tokens?: number
          receiver_tokens?: number
          status?: string
          message?: string | null
          created_at?: string
          updated_at?: string
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
