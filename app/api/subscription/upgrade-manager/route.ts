import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getUpgradeOptions, 
  calculatePricing, 
  executeUpgrade, 
  executeRenewal,
  checkDuplicateSubscriptions,
  cleanupDuplicateSubscriptions,
  type SubscriptionPlan 
} from '@/lib/subscription-manager'

/**
 * GET - Obter opções de upgrade
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar assinatura atual
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subError && subError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Erro ao buscar assinatura' }, { status: 500 })
    }

    // Verificar duplicatas
    const { hasDuplicates, activeSubscriptions } = await checkDuplicateSubscriptions(user.id)

    // Determinar plano atual
    let currentPlan: SubscriptionPlan | null = null
    if (subscription) {
      // Mapear plano atual baseado no price_id
      const planMap: Record<string, SubscriptionPlan> = {
        [process.env.STRIPE_PRICE_MENSAL_BASICO!]: {
          id: 'mensal-basico',
          name: 'Mensal Básico',
          price: 99.90,
          interval: 'month',
          isPlus: false,
          stripePriceId: process.env.STRIPE_PRICE_MENSAL_BASICO!,
        },
        [process.env.STRIPE_PRICE_MENSAL_PLUS!]: {
          id: 'mensal-plus',
          name: 'Mensal Plus',
          price: 149.90,
          interval: 'month',
          isPlus: true,
          stripePriceId: process.env.STRIPE_PRICE_MENSAL_PLUS!,
        },
        [process.env.STRIPE_PRICE_ANUAL_BASICO!]: {
          id: 'anual-basico',
          name: 'Anual Básico',
          price: 958.80,
          interval: 'year',
          isPlus: false,
          stripePriceId: process.env.STRIPE_PRICE_ANUAL_BASICO!,
        },
        [process.env.STRIPE_PRICE_ANUAL_PLUS!]: {
          id: 'anual-plus',
          name: 'Anual Plus',
          price: 1078.80,
          interval: 'year',
          isPlus: true,
          stripePriceId: process.env.STRIPE_PRICE_ANUAL_PLUS!,
        },
      }
      
      currentPlan = planMap[subscription.stripe_price_id] || null
    }

    // Obter opções de upgrade
    const upgradeOptions = getUpgradeOptions(currentPlan)

    return NextResponse.json({
      success: true,
      data: {
        upgradeOptions,
        hasDuplicates,
        activeSubscriptions: activeSubscriptions.length,
        currentSubscription: subscription,
      },
    })
  } catch (error) {
    console.error('Erro ao obter opções de upgrade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * POST - Executar upgrade/renewal
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { planId, action } = await request.json()

    if (!planId || !action) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar assinatura atual
    const { data: currentSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subError && subError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Erro ao buscar assinatura atual' }, { status: 500 })
    }

    // Mapear plano selecionado
    const planMap: Record<string, SubscriptionPlan> = {
      'mensal-basico': {
        id: 'mensal-basico',
        name: 'Mensal Básico',
        price: 99.90,
        interval: 'month',
        isPlus: false,
        stripePriceId: process.env.STRIPE_PRICE_MENSAL_BASICO!,
      },
      'mensal-plus': {
        id: 'mensal-plus',
        name: 'Mensal Plus',
        price: 149.90,
        interval: 'month',
        isPlus: true,
        stripePriceId: process.env.STRIPE_PRICE_MENSAL_PLUS!,
      },
      'anual-basico': {
        id: 'anual-basico',
        name: 'Anual Básico',
        price: 958.80,
        interval: 'year',
        isPlus: false,
        stripePriceId: process.env.STRIPE_PRICE_ANUAL_BASICO!,
      },
      'anual-plus': {
        id: 'anual-plus',
        name: 'Anual Plus',
        price: 1078.80,
        interval: 'year',
        isPlus: true,
        stripePriceId: process.env.STRIPE_PRICE_ANUAL_PLUS!,
      },
    }

    const selectedPlan = planMap[planId]
    if (!selectedPlan) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    // Verificar duplicatas e limpar se necessário
    const { hasDuplicates } = await checkDuplicateSubscriptions(user.id)
    if (hasDuplicates) {
      await cleanupDuplicateSubscriptions(user.id, currentSubscription?.stripe_subscription_id || '')
    }

    // Executar upgrade/renewal
    const result = currentSubscription 
      ? await executeUpgrade(user.id, currentSubscription.stripe_subscription_id, selectedPlan)
      : await executeRenewal(user.id, selectedPlan)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Atualizar banco de dados
    if (currentSubscription) {
      // Atualizar assinatura existente
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          stripe_subscription_id: result.subscriptionId,
          stripe_price_id: selectedPlan.stripePriceId,
          plan_type: selectedPlan.interval,
          explicacao_pratica: selectedPlan.isPlus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSubscription.id)

      if (updateError) {
        console.error('Erro ao atualizar assinatura:', updateError)
        return NextResponse.json({ error: 'Erro ao atualizar assinatura' }, { status: 500 })
      }
    } else {
      // Criar nova assinatura
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          stripe_subscription_id: result.subscriptionId,
          stripe_price_id: selectedPlan.stripePriceId,
          plan_type: selectedPlan.interval,
          explicacao_pratica: selectedPlan.isPlus,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Erro ao criar assinatura:', insertError)
        return NextResponse.json({ error: 'Erro ao criar assinatura' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: result.subscriptionId,
        plan: selectedPlan,
        action,
      },
    })
  } catch (error) {
    console.error('Erro no upgrade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
