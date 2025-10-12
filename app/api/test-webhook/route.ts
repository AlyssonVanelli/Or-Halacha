import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { subscriptionService } from '@/lib/services/subscription-service'
import { purchaseService } from '@/lib/services/purchase-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTE DE WEBHOOK ===')

    const { userId, testMode = true } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    console.log('User ID:', userId)
    console.log('Test Mode:', testMode)

    // 1. Testar conexão com Stripe
    console.log('\n--- TESTANDO CONEXÃO COM STRIPE ---')
    try {
      const prices = await stripe.prices.list({ limit: 1 })
      console.log('✅ Conexão com Stripe: OK')
      console.log('Prices encontrados:', prices.data.length)
    } catch (error) {
      console.error('❌ Erro na conexão com Stripe:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro na conexão com Stripe',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    // 2. Testar busca de customer
    console.log('\n--- TESTANDO BUSCA DE CUSTOMER ---')
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profile) {
        console.error('❌ Usuário não encontrado no banco')
        return NextResponse.json(
          {
            success: false,
            error: 'Usuário não encontrado',
            message: 'O usuário não existe na tabela profiles',
          },
          { status: 404 }
        )
      }

      console.log('✅ Usuário encontrado:', profile.id)
      console.log('Stripe Customer ID:', profile.stripe_customer_id)

      if (!profile.stripe_customer_id) {
        console.error('❌ Usuário não tem stripe_customer_id')
        return NextResponse.json(
          {
            success: false,
            error: 'Usuário não tem Stripe Customer ID',
            message: 'O usuário precisa ter um customer_id no Stripe',
          },
          { status: 400 }
        )
      }

      // Buscar customer no Stripe
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
      console.log('✅ Customer encontrado no Stripe:', customer.id)
      console.log('Customer email:', (customer as any).email)
    } catch (error) {
      console.error('❌ Erro ao buscar customer:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar customer',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    // 3. Testar busca de assinaturas
    console.log('\n--- TESTANDO BUSCA DE ASSINATURAS ---')
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profile?.stripe_customer_id) {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          limit: 5,
        })

        console.log('✅ Assinaturas encontradas no Stripe:', subscriptions.data.length)

        if (subscriptions.data.length > 0) {
          subscriptions.data.forEach((sub, index) => {
            console.log(`Assinatura ${index + 1}:`)
            console.log(`- ID: ${sub.id}`)
            console.log(`- Status: ${sub.status}`)
            console.log(`- Current Period Start: ${(sub as any).current_period_start}`)
            console.log(`- Current Period End: ${(sub as any).current_period_end}`)
            console.log(`- Cancel At Period End: ${sub.cancel_at_period_end}`)
          })
        } else {
          console.log('⚠️ Nenhuma assinatura encontrada no Stripe')
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar assinaturas:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar assinaturas',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    // 4. Testar sincronização
    console.log('\n--- TESTANDO SINCRONIZAÇÃO ---')
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profile?.stripe_customer_id) {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          limit: 1,
        })

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0]
          console.log('Testando sincronização da assinatura:', subscription.id)

          const result = await subscriptionService.syncWithStripe(subscription.id)

          if (result) {
            console.log('✅ Sincronização bem-sucedida')
            console.log('Dados sincronizados:', {
              id: result.id,
              status: result.status,
              current_period_start: result.current_period_start,
              current_period_end: result.current_period_end,
              explicacao_pratica: result.explicacao_pratica,
            })
          } else {
            console.error('❌ Falha na sincronização')
          }
        } else {
          console.log('⚠️ Nenhuma assinatura para sincronizar')
        }
      }
    } catch (error) {
      console.error('❌ Erro na sincronização:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro na sincronização',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    // 5. Verificar dados no banco
    console.log('\n--- VERIFICANDO DADOS NO BANCO ---')
    try {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)

      console.log('Assinaturas no banco:', subscriptions?.length || 0)

      if (subscriptions && subscriptions.length > 0) {
        subscriptions.forEach((sub, index) => {
          console.log(`Assinatura ${index + 1} no banco:`)
          console.log(`- ID: ${sub.id}`)
          console.log(`- Status: ${sub.status}`)
          console.log(`- Current Period Start: ${sub.current_period_start}`)
          console.log(`- Current Period End: ${sub.current_period_end}`)
          console.log(`- Explicação Prática: ${sub.explicacao_pratica}`)
        })
      } else {
        console.log('⚠️ Nenhuma assinatura encontrada no banco')
      }
    } catch (error) {
      console.error('❌ Erro ao verificar banco:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao verificar banco',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Teste de webhook concluído',
      data: {
        stripeConnection: true,
        userFound: true,
        customerFound: true,
        subscriptionsFound: true,
        syncWorking: true,
        databaseWorking: true,
      },
    })
  } catch (error) {
    console.error('Erro geral no teste de webhook:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
