import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserAccess } from '@/lib/content/server'
import { buildCheckoutUrl, parseCheckoutItem } from '@/lib/hotmart'

// /checkout/<plano> ou /checkout/<id do tratado>: confere login e acesso atual e redireciona
// (HTTP 307, sem esperar a página carregar) para o pagamento da Hotmart, com o e-mail
// preenchido e a conta identificada. Casos especiais vão para /checkout/aviso.
export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ item: string }> }) {
  const { item: raw } = await params
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url), 307)

  const item = parseCheckoutItem(raw)
  if (!item) return to('/planos')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return to(`/signup?redirect=${encodeURIComponent(`/checkout/${raw}`)}`)

  const access = await getUserAccess(user.id)
  if (access.hasSubscription) {
    const motivo = item.kind === 'plan' ? 'assinante' : 'tratado-incluso'
    return to(`/checkout/aviso?motivo=${motivo}&item=${encodeURIComponent(raw)}`)
  }

  const url = buildCheckoutUrl(item, {
    id: user.id,
    email: user.email,
    name: (user.user_metadata?.['full_name'] as string | undefined) || null,
  })
  if (!url) {
    console.error('Checkout: link da Hotmart não configurado para', raw)
    return to(`/checkout/aviso?motivo=indisponivel&item=${encodeURIComponent(raw)}`)
  }

  return NextResponse.redirect(url, 307)
}
