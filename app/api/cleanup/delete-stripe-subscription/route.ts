import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  try {
    console.log('=== DELETANDO ASSINATURA DO STRIPE ===')

    const customerId = 'cus_TDchuNP6TWPMSH'

    // Buscar todas as assinaturas do customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    })

    console.log('Assinaturas encontradas:', subscriptions.data.length)

    const deletedSubscriptions: string[] = []

    // Deletar todas as assinaturas
    for (const subscription of subscriptions.data) {
      try {
        console.log(`Deletando assinatura: ${subscription.id}`)
        await stripe.subscriptions.cancel(subscription.id)
        deletedSubscriptions.push(subscription.id)
        console.log(`✅ Assinatura ${subscription.id} deletada`)
      } catch (error) {
        console.error(`❌ Erro ao deletar assinatura ${subscription.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Assinaturas deletadas do Stripe',
      deletedCount: deletedSubscriptions.length,
      deletedSubscriptions,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
