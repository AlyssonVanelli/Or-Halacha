import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config'

// Implementar padrão singleton para evitar múltiplas instâncias do GoTrueClient
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Cria uma instância do cliente Supabase para componentes do lado do cliente
export const createClient = () => {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    )
  }
  return supabaseClient
}
