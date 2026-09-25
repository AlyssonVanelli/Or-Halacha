import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/supabase/config'

// Cliente com service role: ignora RLS. Usar SOMENTE no servidor (rotas de API / webhooks),
// nunca importar em componentes do cliente.
export const createAdminClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient só pode ser usado no servidor')
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas')
  }

  // Sem o genérico Database: os tipos gerados estão desatualizados em relação ao
  // supabase-js instalado e resolvem para `never`.
  return createSupabaseClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
