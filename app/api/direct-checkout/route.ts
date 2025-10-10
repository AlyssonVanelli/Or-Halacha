import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionToken = searchParams.get('sessionToken')
    const divisionId = searchParams.get('divisionId')

    // Se tem sessionToken, usar ele; senão usar divisionId (compatibilidade)
    if (sessionToken) {
      // Buscar sessão no banco de dados
      const supabase = await createClient()
      const { data: session, error: sessionError } = await supabase
        .from('checkout_sessions')
        .select('*')
        .eq('id', sessionToken)
        .eq('status', 'pending')
        .single()

      if (sessionError || !session) {
        // Se sessão não existe ou já foi processada, redirecionar para biblioteca
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`
        )
      }

      // Verificar se não expirou
      if (new Date(session.expires_at) < new Date()) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`
        )
      }

      // Marcar como processada
      await supabase
        .from('checkout_sessions')
        .update({ status: 'processed' })
        .eq('id', sessionToken)

      // Usar divisionId da sessão
      const divisionIdFromSession = session.division_id

      // Buscar informações da divisão
      const { data: division, error: divisionError } = await supabase
        .from('divisions')
        .select('id, title, book_id')
        .eq('id', divisionIdFromSession)
        .single()

      if (divisionError || !division) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`
        )
      }

      // Buscar informações do livro
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('id, title')
        .eq('id', division.book_id)
        .single()

      if (bookError || !book) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`
        )
      }

      // Buscar informações do usuário
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`
        )
      }

      // Criar sessão do Stripe
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: `${division.title} - ${book.title}`,
                description: `Acesso completo ao tratado ${division.title}`,
              },
              unit_amount: 2990, // R$ 29,90 em centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?divisionId=${divisionIdFromSession}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`,
        metadata: {
          divisionId: divisionIdFromSession,
          bookId: book.id,
          userId: user.id,
          type: 'tratado-individual',
        },
      })

      return NextResponse.redirect(stripeSession.url!)
    }

    // Fallback para método antigo (compatibilidade)
    if (!divisionId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`
      )
    }

    // Buscar informações da divisão
    const supabase = await createClient()
    const { data: division, error: divisionError } = await supabase
      .from('divisions')
      .select('id, title, book_id')
      .eq('id', divisionId)
      .single()

    if (divisionError || !division) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`
      )
    }

    // Buscar informações do livro
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title')
      .eq('id', division.book_id)
      .single()

    if (bookError || !book) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`
      )
    }

    // Buscar informações do usuário para obter o email
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`
      )
    }

    // Preço fixo para tratado individual (R$ 29,90)
    const priceInCents = 2990 // R$ 29,90 em centavos

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `${division.title} - ${book.title}`,
              description: `Acesso completo ao tratado ${division.title}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?divisionId=${divisionId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`,
      metadata: {
        divisionId,
        bookId: book.id,
        userId: user.id,
        type: 'tratado-individual',
      },
    })

    // Redirecionar para o Stripe
    return NextResponse.redirect(session.url!)
  } catch (error) {
    // Em caso de erro, redirecionar para biblioteca
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/biblioteca/shulchan-aruch`
    )
  }
}
