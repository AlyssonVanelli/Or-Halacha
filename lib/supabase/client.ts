import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase/database.types'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config'

// Implementar padrão singleton para evitar múltiplas instâncias do GoTrueClient
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Cria uma instância do cliente Supabase para componentes do lado do cliente
export const createClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
    })
  }
  return supabaseClient
}
