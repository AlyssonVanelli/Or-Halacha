import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function GET() {
  try {
    const supabase = createClient()

    console.log('=== VERIFICANDO ESTADO ATUAL ===')

    // 1. Verificar profiles no banco
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*')

    console.log('=== PROFILES NO BANCO ===')
    console.log('Total:', profiles?.length || 0)
    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        console.log(`- ID: ${profile.id}, Stripe Customer ID: ${profile.stripe_customer_id}`)
      }
    }

    // 2. Verificar subscriptions no banco
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')

    console.log('=== SUBSCRIPTIONS NO BANCO ===')
    console.log('Total:', subscriptions?.length || 0)
    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        console.log(`- ID: ${sub.id}, User ID: ${sub.user_id}, Status: ${sub.status}`)
      }
    }

    // 3. Verificar customers no Stripe
    const customers = await stripe.customers.list({ limit: 10 })
    console.log('=== CUSTOMERS NO STRIPE ===')
    console.log('Total:', customers.data.length)
    for (const customer of customers.data) {
      console.log(`- ID: ${customer.id}, Email: ${customer.email}`)
    }

    // 4. Verificar subscriptions no Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({ limit: 10 })
    console.log('=== SUBSCRIPTIONS NO STRIPE ===')
    console.log('Total:', stripeSubscriptions.data.length)
    for (const sub of stripeSubscriptions.data) {
      console.log(`- ID: ${sub.id}, Customer: ${sub.customer}, Status: ${sub.status}`)
    }

    return NextResponse.json({
      success: true,
      database: {
        profiles: profiles || [],
        subscriptions: subscriptions || [],
      },
      stripe: {
        customers: customers.data,
        subscriptions: stripeSubscriptions.data,
      },
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
