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
        }
        Relationships: []
      }
    }
    Views: {
      [_ WITH_TOTAL_VALUE]: {
        Row: {
          age: number | null
          ban_expiry: number | null
          ban_reason: string | null
          banner_color: string | null
          booms: Json | null
          daily_tokens: number | null
          email: string | null
          id: string | null
          is_banned: boolean | null
          is_muted: boolean | null
          is_owner: boolean | null
          is_plus_user: boolean | null
          join_date: string | null
          last_daily_spin: string | null
          last_seen: number | null
          mute_expiry: number | null
          name_color: string | null
          packs: string[] | null
          profile_picture: string | null
          reason: string | null
          role: string | null
          status: string | null
          tokens: number | null
          total_value: number | null
          username: string | null
          badges: string[] | null
        }
      }
    }
    Functions: {
      [_ WITH_TOTAL_VALUE]: {
        Args: Record<PropertyKey, never>
        Returns: {
          age: number | null
          ban_expiry: number | null
          ban_reason: string | null
          banner_color: string | null
          booms: Json | null
          daily_tokens: number | null
          email: string | null
          id: string | null
          is_banned: boolean | null
          is_muted: boolean | null
          is_owner: boolean | null
          is_plus_user: boolean | null
          join_date: string | null
          last_daily_spin: string | null
          last_seen: number | null
          mute_expiry: number | null
          name_color: string | null
          packs: string[] | null
          profile_picture: string | null
          reason: string | null
          role: string | null
          status: string | null
          tokens: number | null
          total_value: number | null
          username: string | null
          badges: string[] | null
        }
      }
    }
    Enums: {
      [_ WITH_TOTAL_VALUE]: "test"
    }
    CompositeTypes: {
      [_ WITH_TOTAL_VALUE]: {
        age: number | null
        ban_expiry: number | null
        ban_reason: string | null
        banner_color: string | null
        booms: Json | null
        daily_tokens: number | null
        email: string | null
        id: string | null
        is_banned: boolean | null
        is_muted: boolean | null
        is_owner: boolean | null
        is_plus_user: boolean | null
        join_date: string | null
        last_daily_spin: string | null
        last_seen: number | null
        mute_expiry: number | null
        name_color: string | null
        packs: string[] | null
        profile_picture: string | null
        reason: string | null
        role: string | null
        status: string | null
        tokens: number | null
        total_value: number | null
        username: string | null
        badges: string[] | null
      }
    }
  }
}

export type Tables<
  T extends keyof Database['public']['Tables'],
  K extends keyof Database['public']['Tables'][T]['Row'] = keyof Database['public']['Tables'][T]['Row']
> = Database['public']['Tables'][T]['Row'][K]
