import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function GET() {
  try {
    console.log('=== VERIFICANDO CUSTOMERS NO STRIPE ===')

    // Buscar todos os customers no Stripe
    const customers = await stripe.customers.list({
      limit: 100,
    })

    console.log('=== CUSTOMERS NO STRIPE ===')
    console.log('Total de customers:', customers.data.length)

    if (customers.data.length > 0) {
      for (const customer of customers.data) {
        console.log('---')
        console.log('ID:', customer.id)
        console.log('Email:', customer.email)
        console.log('Name:', customer.name)
        console.log('Created:', new Date(customer.created * 1000).toISOString())
        console.log('Metadata:', customer.metadata)
        console.log('---')
      }
    } else {
      console.log('Nenhum customer encontrado no Stripe')
    }

    return NextResponse.json({
      success: true,
      count: customers.data.length,
      customers: customers.data.map(customer => ({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: new Date(customer.created * 1000).toISOString(),
        metadata: customer.metadata,
      })),
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
