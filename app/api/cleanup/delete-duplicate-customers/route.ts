import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  try {
    console.log('=== DELETANDO CUSTOMERS DUPLICADOS ===')

    // Buscar todos os customers
    const customers = await stripe.customers.list({
      limit: 100,
    })

    console.log('Customers encontrados:', customers.data.length)

    const deletedCustomers: string[] = []
    const keptCustomer = 'cus_TDchuNP6TWPMSH' // Manter este

    // Deletar todos os customers exceto o que queremos manter
    for (const customer of customers.data) {
      if (customer.id !== keptCustomer) {
        try {
          console.log(`Deletando customer: ${customer.id}`)
          await stripe.customers.del(customer.id)
          deletedCustomers.push(customer.id)
          console.log(`✅ Customer ${customer.id} deletado`)
        } catch (error) {
          console.error(`❌ Erro ao deletar customer ${customer.id}:`, error)
        }
      } else {
        console.log(`✅ Mantendo customer: ${customer.id}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Customers duplicados deletados',
      deletedCount: deletedCustomers.length,
      deletedCustomers,
      keptCustomer,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
