import Link from 'next/link'
import { Check, Minus, ShieldCheck } from 'lucide-react'
import {
  PLANS,
  PLAN_ORDER,
  REFUND_DAYS,
  TREATISE_PRICE,
  annualFreeMonths,
  brl,
  perMonth,
  type PlanId,
} from '@/lib/plans'

// Cards de planos usados na home, em /planos e no dashboard (sem estado: serve para páginas do
// servidor e do cliente). Os botões levam a /checkout/<plano>, que abre o pagamento da Hotmart.

const BASE_FEATURES = [
  'Os 4 tratados completos em português',
  'Assunto de cada siman e busca por tema',
  'Favoritos para voltar ao que importa',
]
const PLUS_FEATURE = 'Explicação prática em mais de 11 mil seifim'

const HIGHLIGHT: PlanId = 'anual-plus'

export function PlanCards({ treatiseHref = '/livros' }: { treatiseHref?: string }) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map(id => {
          const plan = PLANS[id]
          const yearly = plan.interval === 'year'
          const highlighted = id === HIGHLIGHT
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-lg ${
                highlighted
                  ? 'border-blue-600'
                  : plan.plus
                    ? 'border-purple-200'
                    : 'border-gray-200'
              }`}
            >
              {highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  Mais vantajoso
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-600">
                {plan.plus
                  ? 'Texto completo + explicações práticas'
                  : 'Texto completo do Shulchan Aruch'}
              </p>

              <div className="mt-4">
                <span
                  className={`whitespace-nowrap text-3xl font-bold ${plan.plus ? 'text-purple-700' : 'text-blue-700'}`}
                >
                  {brl(plan.price)}
                </span>
                <span className="text-gray-500">{yearly ? '/ano' : '/mês'}</span>
              </div>
              <p className="mt-1 min-h-[2.5rem] text-sm text-gray-600">
                {yearly ? (
                  <>
                    À vista, no Pix ou cartão.{' '}
                    <span className="font-semibold text-green-700">
                      {annualFreeMonths(plan)} meses grátis
                    </span>{' '}
                    (≈ {brl(perMonth(plan))}/mês)
                  </>
                ) : (
                  'Cobrança mensal no Pix ou cartão'
                )}
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {BASE_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-gray-700">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" aria-hidden />
                    {f}
                  </li>
                ))}
                <li
                  className={`flex items-start gap-2 ${plan.plus ? 'font-medium text-gray-900' : 'text-gray-400'}`}
                >
                  {plan.plus ? (
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" aria-hidden />
                  ) : (
                    <Minus className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
                  )}
                  <span>
                    {PLUS_FEATURE}
                    {!plan.plus && <span className="sr-only"> (não incluso)</span>}
                  </span>
                </li>
              </ul>

              <p className="mt-4 text-xs text-gray-500">
                {yearly ? 'Renova a cada 12 meses' : 'Renova todo mês'}. Cancele quando quiser.
              </p>
              <Link
                href={`/checkout/${id}`}
                prefetch={false}
                className={`mt-3 block rounded-lg px-4 py-3 text-center font-semibold text-white shadow-md transition hover:shadow-lg ${
                  plan.plus
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                }`}
              >
                Assinar {plan.name}
              </Link>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Prefere um tratado só? {brl(TREATISE_PRICE)} por 1 mês
          </h3>
          <p className="text-sm text-gray-600">
            Pagamento único, sem renovação automática: escolha Orach Chayim, Yoreh De&apos;ah, Even
            HaEzer ou Choshen Mishpat.
          </p>
        </div>
        <Link
          href={treatiseHref}
          className="whitespace-nowrap rounded-lg border-2 border-blue-600 px-5 py-2 font-semibold text-blue-700 hover:bg-blue-50"
        >
          Escolher tratado
        </Link>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-gray-600">
        <ShieldCheck className="h-4 w-4 flex-shrink-0 text-green-600" aria-hidden />
        Pagamento seguro pela Hotmart, com Pix ou cartão de crédito. Garantia de {REFUND_DAYS} dias:
        se não gostar, devolvemos o valor integral.
      </p>
    </div>
  )
}
