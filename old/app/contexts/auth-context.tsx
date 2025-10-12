import { createClient } from '@/lib/supabase/client'

export async function afterLogin(user: { id: string }) {
  const sessionId = crypto.randomUUID()
  localStorage.setItem('session_id', sessionId)
  const supabase = createClient()
  await supabase.from('profiles').update({ current_session_id: sessionId }).eq('id', user.id)
}
