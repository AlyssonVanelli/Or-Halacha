import type { Metadata } from 'next'
import Link from 'next/link'
import { ConditionalLayout } from '@/components/ConditionalLayout'
import { PlanCards } from '@/components/PlanCards'
import { REFUND_DAYS } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Planos',
  description:
    'Assine o Or Halachá: Shulchan Aruch completo em português, com explicações práticas no Plus. Mensal ou anual à vista, no Pix ou cartão, com 7 dias de garantia.',
  alternates: { canonical: '/planos' },
}

const FAQ = [
  {
    q: 'Como pago?',
    a: 'Pelo checkout da Hotmart, com Pix ou cartão de crédito. O acesso é liberado assim que o pagamento é confirmado (no Pix, em geral em poucos segundos).',
  },
  {
    q: 'O anual pode ser parcelado?',
    a: 'Não. O plano anual é pago à vista e, por isso, custa bem menos: equivale a 4 meses grátis em relação ao mensal.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Cancele a renovação na área do comprador da Hotmart (Minhas compras → Or Halachá). Você continua com acesso até o fim do período já pago.',
  },
  {
    q: 'E se eu não gostar?',
    a: `Você tem ${REFUND_DAYS} dias de garantia: peça o reembolso na área do comprador da Hotmart e recebe o valor integral.`,
  },
  {
    q: 'Posso mudar de plano?',
    a: 'Sim. Na área do comprador da Hotmart você troca entre Básico e Plus ou entre mensal e anual.',
  },
  {
    q: 'O que é a explicação prática?',
    a: 'Um comentário em linguagem simples, junto de cada seif, sobre como aquela lei é aplicada no dia a dia. Está em mais de 11 mil seifim e vem nos planos Plus.',
  },
]

export default function PlanosPage() {
  return (
    <ConditionalLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Escolha seu plano</h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            O Shulchan Aruch completo em português. O{' '}
            <Link href="/" className="font-semibold text-blue-700 underline">
              siman do dia
            </Link>{' '}
            é sempre grátis.
          </p>
        </div>

        <PlanCards />

        <div className="mx-auto mt-20 max-w-4xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">
            Perguntas frequentes
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {FAQ.map(item => (
              <div key={item.q} className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ConditionalLayout>
  )
}
