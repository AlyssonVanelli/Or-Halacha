import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  console.log('=== TESTANDO FLUXO COMPLETO ===')

  const body = await req.json()
  const { userId } = body

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: 'userId é obrigatório',
      },
      { status: 400 }
    )
  }

  const supabase = createClient()

  try {
    // 1. Verificar assinatura no banco
    console.log('1. Verificando assinatura no banco...')
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (subError) {
      console.error('ERRO ao buscar assinatura:', subError)
    }

    console.log('Assinatura encontrada:', !!subscription)
    console.log('Status:', subscription?.status)
    console.log('Plan Type:', subscription?.plan_type)
    console.log('Explicação Prática:', subscription?.explicacao_pratica)
    console.log('Current Period End:', subscription?.current_period_end)

    // 2. Verificar se assinatura está ativa
    const hasActiveSubscription =
      !!subscription &&
      subscription.status === 'active' &&
      (subscription.current_period_end
        ? new Date(subscription.current_period_end) > new Date()
        : true)

    console.log('Assinatura ativa:', hasActiveSubscription)

    // 3. Verificar livros comprados
    console.log('2. Verificando livros comprados...')
    const { data: purchasedBooks, error: purchasedError } = await supabase
      .from('purchased_books')
      .select('*')
      .eq('user_id', userId)

    if (purchasedError) {
      console.error('ERRO ao buscar livros comprados:', purchasedError)
    }

    const validPurchases = (purchasedBooks || []).filter(pb => new Date(pb.expires_at) > new Date())

    console.log('Livros comprados válidos:', validPurchases.length)

    // 4. Verificar acesso geral
    const hasAccess = hasActiveSubscription || validPurchases.length > 0

    console.log('Tem acesso geral:', hasAccess)

    // 5. Verificar acesso a uma divisão específica (exemplo)
    console.log('3. Verificando acesso a divisão específica...')
    const { data: divisions } = await supabase.from('divisions').select('id').limit(1)

    if (divisions && divisions.length > 0) {
      const divisionId = divisions[0].id

      // Verificar se tem acesso a esta divisão
      const hasDivisionAccess =
        hasActiveSubscription || validPurchases.some(pb => pb.division_id === divisionId)

      console.log('Tem acesso à divisão:', hasDivisionAccess)
    }

    // 6. Verificar recursos Plus
    const hasPlusFeatures = hasActiveSubscription && !!subscription?.explicacao_pratica

    console.log('Tem recursos Plus:', hasPlusFeatures)

    const result = {
      success: true,
      user: {
        id: userId,
        hasActiveSubscription,
        hasAccess,
        hasPlusFeatures,
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status,
              plan_type: subscription.plan_type,
              explicacao_pratica: subscription.explicacao_pratica,
              current_period_end: subscription.current_period_end,
            }
          : null,
        purchasedBooks: validPurchases.map(pb => ({
          id: pb.id,
          division_id: pb.division_id,
          expires_at: pb.expires_at,
        })),
      },
    }

    console.log('=== RESULTADO DO TESTE ===')
    console.log(JSON.stringify(result, null, 2))

    return NextResponse.json(result)
  } catch (error) {
    console.error('ERRO no teste:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno no teste',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
