import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Função para obter a URL base correta
function getBaseUrl() {
  // Se NEXT_PUBLIC_APP_URL estiver definida, usar ela (prioridade)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Em produção (Vercel), usar a URL do domínio
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Fallback para localhost em desenvolvimento
  return 'http://localhost:3000'
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const divisionId = searchParams.get('divisionId')

    // Fallback para método antigo (compatibilidade)
    if (!divisionId) {
      return NextResponse.redirect(`${getBaseUrl()}/dashboard/biblioteca/shulchan-aruch`)
    }

    // Buscar informações da divisão
    const supabase = await createClient()
    const { data: division, error: divisionError } = await supabase
      .from('divisions')
      .select('id, title, book_id')
      .eq('id', divisionId)
      .single()

    if (divisionError || !division) {
      return NextResponse.redirect(`${getBaseUrl()}/dashboard/biblioteca/shulchan-aruch`)
    }

    // Buscar informações do livro
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title')
      .eq('id', division.book_id)
      .single()

    if (bookError || !book) {
      return NextResponse.redirect(`${getBaseUrl()}/dashboard/biblioteca/shulchan-aruch`)
    }

    // Buscar informações do usuário para obter o email
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(`${getBaseUrl()}/dashboard/biblioteca/shulchan-aruch`)
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
      success_url: `${getBaseUrl()}/payment/success?divisionId=${divisionId}`,
      cancel_url: `${getBaseUrl()}/dashboard/biblioteca/shulchan-aruch`,
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
    return NextResponse.redirect(`${getBaseUrl()}/dashboard/biblioteca/shulchan-aruch`)
  }
}
