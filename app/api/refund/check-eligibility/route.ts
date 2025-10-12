import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { type, id } = await req.json()

    if (!type || !id) {
      return NextResponse.json({ error: 'Tipo e ID são obrigatórios' }, { status: 400 })
    }

    if (type === 'subscription') {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!subscription) {
        return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
      }

      const subscriptionDate = new Date(subscription.created_at)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const eligible = subscriptionDate >= sevenDaysAgo

      // Determinar nome do plano baseado no tipo
      let planName = ''
      if (subscription.plan_type === 'monthly') {
        planName = subscription.explicacao_pratica ? 'Mensal Plus' : 'Mensal Básico'
      } else {
        planName = subscription.explicacao_pratica ? 'Anual Plus' : 'Anual Básico'
      }

      return NextResponse.json({
        type: 'subscription',
        id: subscription.id,
        title: planName,
        amount: 'R$ ' + (subscription.plan_type === 'monthly' ? '99,90' : '79,90'),
        date: subscriptionDate.toLocaleDateString('pt-BR'),
        eligible,
      })
    }

    if (type === 'purchase') {
      const { data: purchase } = await supabase
        .from('purchased_books')
        .select(
          `
          *,
          divisions!inner(title),
          books!inner(title)
        `
        )
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!purchase) {
        return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
      }

      const purchaseDate = new Date(purchase.created_at)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const eligible = purchaseDate >= sevenDaysAgo

      // Construir nome do tratado
      const bookTitle = purchase.books?.title || 'Livro'
      const divisionTitle = purchase.divisions?.title || 'Divisão'
      const treatiseName = `${bookTitle} - ${divisionTitle}`

      return NextResponse.json({
        type: 'purchase',
        id: purchase.id,
        title: treatiseName,
        amount: 'R$ 29,90',
        date: purchaseDate.toLocaleDateString('pt-BR'),
        eligible,
      })
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao verificar elegibilidade:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
