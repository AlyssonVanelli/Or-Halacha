import { supabase } from '@/lib/supabase'

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}
