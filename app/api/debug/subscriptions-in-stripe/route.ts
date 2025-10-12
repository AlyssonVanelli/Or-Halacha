import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function GET() {
  try {
    console.log('=== VERIFICANDO ASSINATURAS NO STRIPE ===')

    // Buscar todas as assinaturas no Stripe
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
    })

    console.log('=== ASSINATURAS NO STRIPE ===')
    console.log('Total de assinaturas:', subscriptions.data.length)

    if (subscriptions.data.length > 0) {
      for (const sub of subscriptions.data) {
        console.log('---')
        console.log('ID:', sub.id)
        console.log('Status:', sub.status)
        console.log('Customer:', sub.customer)
        console.log('Current Period Start:', (sub as any).current_period_start)
        console.log('Current Period End:', (sub as any).current_period_end)
        console.log('Cancel At Period End:', sub.cancel_at_period_end)
        console.log('Canceled At:', sub.canceled_at)
        console.log(
          'Items:',
          sub.items.data.map(item => ({
            price_id: item.price.id,
            product: item.price.product,
            quantity: item.quantity,
          }))
        )
        console.log('---')
      }
    } else {
      console.log('Nenhuma assinatura encontrada no Stripe')
    }

    return NextResponse.json({
      success: true,
      count: subscriptions.data.length,
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        customer: sub.customer,
        current_period_start: (sub as any).current_period_start,
        current_period_end: (sub as any).current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at,
        items: sub.items.data.map(item => ({
          price_id: item.price.id,
          product: item.price.product,
          quantity: item.quantity,
        })),
      })),
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
