export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status:
            | 'active'
            | 'trialing'
            | 'canceled'
            | 'incomplete'
            | 'incomplete_expired'
            | 'past_due'
            | 'unpaid'
          plan_type: 'monthly' | 'yearly'
          price_id: string | null
          subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          explicacao_pratica: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status:
            | 'active'
            | 'trialing'
            | 'canceled'
            | 'incomplete'
            | 'incomplete_expired'
            | 'past_due'
            | 'unpaid'
          plan_type: 'monthly' | 'yearly'
          price_id?: string | null
          subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          explicacao_pratica?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?:
            | 'active'
            | 'trialing'
            | 'canceled'
            | 'incomplete'
            | 'incomplete_expired'
            | 'past_due'
            | 'unpaid'
          plan_type?: 'monthly' | 'yearly'
          price_id?: string | null
          subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          explicacao_pratica?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          category_id: string | null
          cover_image: string | null
          author: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          category_id?: string | null
          cover_image?: string | null
          author?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          category_id?: string | null
          cover_image?: string | null
          author?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          book_id: string
          title: string
          slug: string
          position: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          title: string
          slug: string
          position: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          title?: string
          slug?: string
          position?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          chapter_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          chapter_id: string
          created_at: string
          seif_number: number | null
        }
        Insert: {
          id?: string
          user_id: string
          chapter_id: string
          created_at?: string
          seif_number?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          chapter_id?: string
          created_at?: string
          seif_number?: number | null
        }
      }
      reading_history: {
        Row: {
          id: string
          user_id: string
          chapter_id: string
          last_read_at: string
          progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          chapter_id: string
          last_read_at?: string
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          chapter_id?: string
          last_read_at?: string
          progress?: number
          created_at?: string
          updated_at?: string
        }
      }
      purchased_books: {
        Row: {
          id: string
          user_id: string
          book_id: string
          division_id: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          division_id: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          division_id?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
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
  }
}
