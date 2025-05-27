import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/database.types'

// Cria uma instância do cliente Supabase para componentes do lado do servidor
export const createClient = () => {
  return createServerComponentClient<Database>({
    cookies,
  })
}
