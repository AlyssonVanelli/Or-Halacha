import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  try {
    console.log('=== LIMPEZA COMPLETA ===')

    const supabase = createClient()
    const userId = '4a5d37b9-fa2b-45f7-96c2-12a9fd766d3c'

    const results: {
      subscriptions: { deleted: number; errors: Array<{ id: string; error: string }> }
      customers: { deleted: number; errors: Array<{ id: string; error: string }> }
      database: { deleted: number; errors: Array<{ table: string; error: string }> }
    } = {
      subscriptions: { deleted: 0, errors: [] },
      customers: { deleted: 0, errors: [] },
      database: { deleted: 0, errors: [] },
    }

    // 1. DELETAR ASSINATURAS DO STRIPE
    console.log('1. Deletando assinaturas do Stripe...')
    try {
      const subscriptions = await stripe.subscriptions.list({ limit: 100 })
      for (const subscription of subscriptions.data) {
        try {
          await stripe.subscriptions.cancel(subscription.id)
          results.subscriptions.deleted++
          console.log(`✅ Assinatura ${subscription.id} deletada`)
        } catch (error) {
          results.subscriptions.errors.push({
            id: subscription.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    } catch (error) {
      results.subscriptions.errors.push({
        id: 'general',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // 2. DELETAR CUSTOMERS DO STRIPE
    console.log('2. Deletando customers do Stripe...')
    try {
      const customers = await stripe.customers.list({ limit: 100 })
      for (const customer of customers.data) {
        try {
          await stripe.customers.del(customer.id)
          results.customers.deleted++
          console.log(`✅ Customer ${customer.id} deletado`)
        } catch (error) {
          results.customers.errors.push({
            id: customer.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    } catch (error) {
      results.customers.errors.push({
        id: 'general',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // 3. DELETAR DO BANCO
    console.log('3. Deletando do banco...')
    try {
      // Deletar assinaturas
      const { error: subscriptionsError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userId)

      if (subscriptionsError) {
        results.database.errors.push({ table: 'subscriptions', error: subscriptionsError.message })
      } else {
        results.database.deleted++
        console.log('✅ Assinaturas deletadas do banco')
      }

      // Deletar profile
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId)

      if (profileError) {
        results.database.errors.push({ table: 'profiles', error: profileError.message })
      } else {
        results.database.deleted++
        console.log('✅ Profile deletado do banco')
      }
    } catch (error) {
      results.database.errors.push({
        table: 'general',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    console.log('=== LIMPEZA CONCLUÍDA ===')
    console.log('Resultados:', results)

    return NextResponse.json({
      success: true,
      message: 'Limpeza completa realizada',
      results,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
