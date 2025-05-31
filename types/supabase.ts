export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      parashiot: {
        Row: {
          id: number
          nome: string
          haftarah: string
          semana_atual: boolean
          data_inicio: string
          data_fim: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          haftarah: string
          semana_atual?: boolean
          data_inicio: string
          data_fim: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          haftarah?: string
          semana_atual?: boolean
          data_inicio?: string
          data_fim?: string
          created_at?: string
          updated_at?: string
        }
      }
      leituras_especiais: {
        Row: {
          id: number
          parasha_id: number
          nome: string
          referencia: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          parasha_id: number
          nome: string
          referencia: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          parasha_id?: number
          nome?: string
          referencia?: string
          created_at?: string
          updated_at?: string
        }
      }
      ultimo_siman_mostrado: {
        Row: {
          id: number
          siman_id: number
          data_atualizacao: string
        }
        Insert: {
          id?: number
          siman_id: number
          data_atualizacao?: string
        }
        Update: {
          id?: number
          siman_id?: number
          data_atualizacao?: string
        }
      }
      simanim: {
        Row: {
          id: number
          numero: number
          titulo: string
          seifim: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          numero: number
          titulo: string
          seifim: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          numero?: number
          titulo?: string
          seifim?: string[]
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
