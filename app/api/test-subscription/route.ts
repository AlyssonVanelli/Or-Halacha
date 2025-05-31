import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const now = new Date().toISOString()
    const insertData = {
      user_id: body.user_id,
      status: body.status || 'active',
      plan_type: body.plan_type || 'monthly',
      price_id: body.price_id || 'price_test',
      subscription_id: body.subscription_id || 'sub_test',
      current_period_start: now,
      current_period_end: now,
      cancel_at_period_end: false,
      explicacao_pratica: true,
      created_at: now,
      updated_at: now,
    }
    const result = await db.subscriptions.create(insertData)
    return NextResponse.json({ ok: true, result })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
