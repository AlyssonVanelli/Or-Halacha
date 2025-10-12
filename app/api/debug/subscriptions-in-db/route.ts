import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createClient()

    console.log('=== VERIFICANDO ASSINATURAS NO BANCO ===')

    // Buscar todas as assinaturas no banco
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar assinaturas:', error)
      return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 })
    }

    console.log('=== ASSINATURAS NO BANCO ===')
    console.log('Total de assinaturas:', subscriptions?.length || 0)

    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        console.log('---')
        console.log('ID:', sub.id)
        console.log('User ID:', sub.user_id)
        console.log('Status:', sub.status)
        console.log('Plan Type:', sub.plan_type)
        console.log('Price ID:', sub.price_id)
        console.log('Subscription ID:', sub.subscription_id)
        console.log('Current Period Start:', sub.current_period_start)
        console.log('Current Period End:', sub.current_period_end)
        console.log('Explicação Prática:', sub.explicacao_pratica)
        console.log('Created At:', sub.created_at)
        console.log('Updated At:', sub.updated_at)
        console.log('---')
      }
    } else {
      console.log('Nenhuma assinatura encontrada no banco')
    }

    return NextResponse.json({
      success: true,
      count: subscriptions?.length || 0,
      subscriptions: subscriptions || [],
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
