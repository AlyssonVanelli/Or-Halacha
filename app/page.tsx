import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Search, Star } from 'lucide-react'
import { ParashaSemanal } from './components/parasha-semanal'
import { SimanDoDia } from './components/siman-do-dia'
import { getParashaSemanal } from './lib/parasha-semanal'
import { getSimanDoDia } from './lib/siman-do-dia'
import FaqAccordion from './components/FaqAccordion'
import { HeaderSimplificado } from '@/components/DashboardHeader'

export default async function Home() {
  const parasha = await getParashaSemanal()
  const siman = await getSimanDoDia()

  return (
    <>
      <HeaderSimplificado />
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <section className="w-full bg-slate-50 py-12 dark:bg-slate-900 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                      Shulchan Aruch em Português
                    </h1>
                    <p className="max-w-[600px] text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Acesse o Shulchan Aruch completo em português, com explicações práticas e
                      navegação fácil por tratados, simanim e seifim. Estude, pesquise e aprofunde
                      seu conhecimento em Halachá clássica com conteúdo acessível e didático.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row">
                    <Link href="/signup">
                      <Button className="px-8">
                        Começar agora
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="#planos">
                      <Button variant="outline">Ver planos</Button>
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {parasha && <ParashaSemanal parasha={parasha} />}
                  {siman && <SimanDoDia siman={siman} />}
                </div>
              </div>
            </div>
          </section>
          <section id="recursos" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Recursos
                  </h2>
                  <p className="max-w-[900px] text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Nossa plataforma oferece uma experiência completa para o estudo da Halachá
                  </p>
                </div>
              </div>
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                  <Search className="h-12 w-12 text-slate-800 dark:text-slate-200" />
                  <h3 className="text-xl font-bold">Pesquisa Avançada</h3>
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    Encontre rapidamente qualquer tópico de Halachá com nossa ferramenta de busca
                    inteligente.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                  <BookOpen className="h-12 w-12 text-slate-800 dark:text-slate-200" />
                  <h3 className="text-xl font-bold">Biblioteca Completa</h3>
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    Acesso ao Shulchan Aruch completo em português, com explicações práticas e
                    navegação por divisões, simanim e seifim.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                  <Star className="h-12 w-12 text-slate-800 dark:text-slate-200" />
                  <h3 className="text-xl font-bold">Favoritos e Notas</h3>
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    Marque seus trechos favoritos e adicione anotações pessoais para consulta
                    futura.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section
            id="planos"
            className="w-full bg-slate-50 py-12 dark:bg-slate-900 md:py-24 lg:py-32"
          >
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Planos de Assinatura
                  </h2>
                  <p className="max-w-[900px] text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Escolha o plano que melhor atende às suas necessidades
                  </p>
                </div>
              </div>
              <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-5 xl:gap-12">
                {/* Mensal Básico */}
                <div className="flex flex-col rounded-lg border bg-white p-6 shadow-sm dark:bg-slate-950">
                  <div className="flex flex-col items-start">
                    <h3 className="mb-2 text-2xl font-bold">Mensal</h3>
                    <div className="whitespace-nowrap text-3xl font-bold">R$ 99,90</div>
                    <div className="-mt-1 text-sm text-gray-500 dark:text-gray-400">por mês</div>
                  </div>
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Acesso à Halachá traduzida
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Pesquisa avançada
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Favoritos e marcadores
                    </li>
                  </ul>
                  <div className="mt-6">
                    <Link href="/signup?plan=monthly_basic">
                      <Button className="w-full">Assinar agora</Button>
                    </Link>
                  </div>
                </div>
                {/* Mensal Plus */}
                <div className="flex flex-col rounded-lg border-2 border-blue-600 bg-white p-6 shadow-sm dark:bg-slate-950">
                  <div className="flex flex-col items-start">
                    <h3 className="mb-2 text-2xl font-bold">Mensal Plus</h3>
                    <div className="whitespace-nowrap text-3xl font-bold">R$ 119,90</div>
                    <div className="-mt-1 text-sm text-gray-500 dark:text-gray-400">por mês</div>
                  </div>
                  <div className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-800/30 dark:text-green-500">
                    Inclui explicações práticas
                  </div>
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Tudo do plano Mensal
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Explicações práticas da Halachá
                      para o dia a dia
                    </li>
                  </ul>
                  <div className="mt-6">
                    <Link href="/signup?plan=monthly_plus">
                      <Button className="w-full">Assinar agora</Button>
                    </Link>
                  </div>
                </div>
                {/* Anual Básico */}
                <div className="flex flex-col rounded-lg border bg-white p-6 shadow-sm dark:bg-slate-950">
                  <div className="flex flex-col items-start">
                    <h3 className="mb-2 text-2xl font-bold">Anual</h3>
                    <div className="whitespace-nowrap text-3xl font-bold">R$ 79,90</div>
                    <div className="-mt-1 text-sm text-gray-500 dark:text-gray-400">por mês</div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Cobrança anual de R$ 958,80 (pode parcelar no cartão)
                  </div>
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Acesso à Halachá traduzida
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Pesquisa avançada
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Favoritos e marcadores
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Economia de 20%
                    </li>
                  </ul>
                  <div className="mt-6">
                    <Link href="/signup?plan=yearly_basic">
                      <Button className="w-full">Assinar agora</Button>
                    </Link>
                  </div>
                </div>
                {/* Anual Plus */}
                <div className="flex flex-col rounded-lg border-2 border-blue-600 bg-white p-6 shadow-sm dark:bg-slate-950">
                  <div className="flex flex-col items-start">
                    <h3 className="mb-2 text-2xl font-bold">Anual Plus</h3>
                    <div className="whitespace-nowrap text-3xl font-bold">R$ 89,90</div>
                    <div className="-mt-1 text-sm text-gray-500 dark:text-gray-400">por mês</div>
                  </div>
                  <div className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-800/30 dark:text-green-500">
                    Inclui explicações práticas
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Cobrança anual de R$ 1.078,80 (pode parcelar no cartão)
                  </div>
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Tudo do plano Anual
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Explicações práticas da Halachá
                      para o dia a dia
                    </li>
                  </ul>
                  <div className="mt-6">
                    <Link href="/signup?plan=yearly_plus">
                      <Button className="w-full">Assinar agora</Button>
                    </Link>
                  </div>
                </div>
                {/* Tratado Avulso */}
                <div className="flex flex-col rounded-lg border bg-white p-6 shadow-sm dark:bg-slate-950">
                  <div className="flex flex-col items-start">
                    <h3 className="mb-2 text-2xl font-bold">Tratado Avulso</h3>
                    <div className="whitespace-nowrap text-3xl font-bold">R$ 29,90</div>
                    <div className="-mt-1 text-sm text-gray-500 dark:text-gray-400">por 1 mês</div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Acesso a 1 tratado principal do Shulchan Aruch
                  </div>
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Leitura por 1 mês
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Sem mensalidade
                    </li>
                  </ul>
                  <div className="mt-6">
                    <Link href="/livros">
                      <Button className="w-full">Comprar tratado</Button>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="mt-12 overflow-x-auto">
                <table className="min-w-full rounded-lg border bg-white text-sm dark:bg-slate-950">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900">
                      <th className="p-3 font-bold">Recurso</th>
                      <th className="p-3 font-bold">Mensal</th>
                      <th className="p-3 font-bold">Mensal Plus</th>
                      <th className="p-3 font-bold">Anual</th>
                      <th className="p-3 font-bold">Anual Plus</th>
                      <th className="p-3 font-bold">Tratado Avulso</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3">Acesso completo à biblioteca</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">Pesquisa avançada</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">Favoritos e marcadores</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">Acesso a conteúdos exclusivos</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">Explicações práticas</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">✔</td>
                      <td className="p-3 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">Leitura por 1 mês</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">✔</td>
                    </tr>
                    <tr>
                      <td className="p-3">Sem mensalidade</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center">✔</td>
                    </tr>
                    <tr>
                      <td className="p-3">Preço</td>
                      <td className="p-3 text-center">R$ 99,90/mês</td>
                      <td className="p-3 text-center">R$ 119,90/mês</td>
                      <td className="p-3 text-center">
                        R$ 79,90/mês
                        <br />
                        <span className="text-xs">(R$ 958,80/ano)</span>
                      </td>
                      <td className="p-3 text-center">
                        R$ 89,90/mês
                        <br />
                        <span className="text-xs">(R$ 1.078,80/ano)</span>
                      </td>
                      <td className="p-3 text-center">R$ 29,90/mês</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
        <div className="container my-8 px-4 md:px-6">
          <FaqAccordion />
        </div>
        <footer className="border-t py-6 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
              © 2025 Or Halachá. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <Link
                href="/termos"
                className="text-sm text-gray-500 underline-offset-4 hover:underline"
              >
                Termos de Uso
              </Link>
              <Link
                href="/privacidade"
                className="text-sm text-gray-500 underline-offset-4 hover:underline"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
