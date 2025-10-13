'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Search, Star } from 'lucide-react'
// import { ParashaSemanal } from './components/parasha-semanal'
import { SimanDoDia } from './components/siman-do-dia'
import FaqAccordion from './components/FaqAccordion'
import { HeaderSimplificado } from '@/components/DashboardHeader'
import Chatbot from '@/components/Chatbot'
import { ScrollToSection } from './components/ScrollToSection'
import { SubscriptionButton } from '@/components/SubscriptionButton'
import { useAuth } from '@/contexts/auth-context'
import {
  Display,
  Heading1,
  Heading2,
  Heading3,
  Body,
  BodyLarge,
  BodySmall,
  ButtonText,
} from '@/components/ui/typography'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Estados para carregar dados dinamicamente
  const [siman, setSiman] = useState(null)
  const [simanLoading, setSimanLoading] = useState(true)

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  // Carregar dados do siman do dia e parashá
  useEffect(() => {
    async function loadData() {
      try {
        // Carregar dados do siman
        const simanResponse = await fetch('/api/siman-do-dia', {
          cache: 'force-cache',
          next: { revalidate: 3600 }, // Cache por 1 hora
        })

        // Processar resposta do siman
        if (simanResponse.ok) {
          const simanData = await simanResponse.json()
          setSiman(simanData)
        }
        setSimanLoading(false)
      } catch (error) {
        setSimanLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="ml-4 text-lg text-gray-600">Carregando...</p>
      </div>
    )
  }

  if (user) {
    return null // Redirecionando para dashboard
  }

  return (
    <>
      <HeaderSimplificado />
      <ScrollToSection />
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <section className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 py-12 dark:from-slate-900 dark:to-slate-800">
            <div className="container px-4 md:px-6">
              <div className="grid gap-8 lg:grid-cols-2 lg:gap-8">
                {/* Hero Section - metade */}
                <div className="flex flex-col justify-center space-y-6 overflow-visible">
                  {/* Logo */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                      <BookOpen className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <Heading2 className="text-blue-600">Or Halachá</Heading2>
                      <BodyLarge className="text-gray-600">
                        Plataforma de Estudo Haláchico
                      </BodyLarge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Display className="text-no-clip bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text tracking-tight text-transparent sm:text-5xl md:text-6xl leading-[1.6] md:leading-[1.6] pb-4 md:pb-6 overflow-visible will-change-transform">
                      Shulchan Aruch em Português
                    </Display>
                    <BodyLarge className="max-w-[700px] text-gray-600">
                      Acesse o Shulchan Aruch completo em português, com explicações práticas e
                      navegação fácil por tratados, simanim e seifim. Estude, pesquise e aprofunde
                      seu conhecimento em Halachá clássica.
                    </BodyLarge>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/signup">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-lg hover:from-blue-700 hover:to-blue-800"
                      >
                        Começar agora
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="#planos">
                      <Button size="lg" variant="outline" className="border-2 px-8 py-3 text-lg">
                        Ver planos
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Cards Section - centralizado */}
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    {simanLoading ? (
                      <div className="rounded-xl bg-white p-6 shadow-lg">
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                          <span className="ml-2 text-gray-600">Carregando Siman Gratuito...</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* PARASHÁ DESATIVADA - Código preservado para reativação futura */}
                        {/* {parasha && <ParashaSemanal parasha={parasha} />} */}
                        {siman && <SimanDoDia siman={siman} />}
                      </>
                    )}
                  </div>
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
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
                <div className="flex flex-col items-center space-y-4 rounded-xl border-0 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-lg">
                  <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-4 shadow-lg">
                    <Search className="h-8 w-8 text-white" />
                  </div>
                  <Heading3 className="text-gray-800">Pesquisa Avançada</Heading3>
                  <Body className="text-center text-gray-600">
                    Encontre rapidamente qualquer tópico de Halachá com nossa ferramenta de busca
                    inteligente.
                  </Body>
                </div>
                <div className="flex flex-col items-center space-y-4 rounded-xl border-0 bg-gradient-to-br from-white to-green-50/30 p-8 shadow-lg">
                  <div className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 p-4 shadow-lg">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <Heading3 className="text-gray-800">Biblioteca Completa</Heading3>
                  <Body className="text-center text-gray-600">
                    Acesso ao Shulchan Aruch completo em português, com explicações práticas e
                    navegação por divisões, simanim e seifim.
                  </Body>
                </div>
                <div className="flex flex-col items-center space-y-4 rounded-xl border-0 bg-gradient-to-br from-white to-amber-50/30 p-8 shadow-lg">
                  <div className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 p-4 shadow-lg">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <Heading3 className="text-gray-800">Favoritos e Notas</Heading3>
                  <Body className="text-center text-gray-600">
                    Marque seus trechos favoritos e adicione anotações pessoais para consulta
                    futura.
                  </Body>
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
                  <Heading1 className="tracking-tighter sm:text-4xl md:text-5xl">
                    Planos de Assinatura
                  </Heading1>
                  <BodyLarge className="max-w-[900px] text-gray-500 dark:text-gray-400">
                    Escolha o plano que melhor atende às suas necessidades
                  </BodyLarge>
                </div>
              </div>
              <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-5 xl:gap-12">
                {/* Tratado Avulso */}
                <div className="flex h-full flex-col rounded-xl border-0 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-slate-950">
                  <div className="mb-4 flex flex-col items-start">
                    <Heading2 className="mb-2 leading-tight">
                      Tratado
                      <br />
                      Avulso
                    </Heading2>
                    <div className="whitespace-nowrap text-3xl font-bold">R$ 29,90</div>
                    <div className="-mt-1 text-sm text-gray-500 dark:text-gray-400">por 1 mês</div>
                  </div>
                  <div className="mb-6 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Acesso a 1 tratado principal
                    <br />
                    do Shulchan Aruch
                    <br />
                    por período limitado
                  </div>
                  <ul className="flex-grow space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Leitura por 1 mês
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Sem mensalidade
                    </li>
                    <li className="flex items-center gap-2 opacity-0">
                      <span className="text-green-500">✔</span> Espaço reservado
                    </li>
                    <li className="flex items-center gap-2 opacity-0">
                      <span className="text-green-500">✔</span> Espaço reservado
                    </li>
                  </ul>
                  <div className="mt-6">
                    <Link href="/livros">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg">
                        Assinar tratado
                      </Button>
                    </Link>
                  </div>
                </div>
                {/* Mensal Básico */}
                <div className="flex h-full flex-col rounded-xl border-0 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-slate-950">
                  <div className="mb-4 flex flex-col items-start">
                    <Heading2 className="mb-2 leading-tight">
                      Mensal
                      <br />
                      Básico
                    </Heading2>
                    <div className="whitespace-nowrap text-3xl font-bold">R$ 99,90</div>
                    <div className="-mt-1 text-sm text-gray-500 dark:text-gray-400">por mês</div>
                  </div>
                  <div className="mb-6 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Acesso completo à biblioteca
                    <br />
                    de Halachá com pesquisa
                    <br />
                    avançada e favoritos
                  </div>
                  <ul className="flex-grow space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Acesso à Halachá traduzida
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Pesquisa avançada
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Favoritos e marcadores
                    </li>
                    <li className="flex items-center gap-2 opacity-0">
                      <span className="text-green-500">✔</span> Espaço reservado
                    </li>
                  </ul>
                  <div className="mt-6">
                    <SubscriptionButton
                      planType="mensal-basico"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                    >
                      Assinar agora
                    </SubscriptionButton>
                  </div>
                </div>
                {/* Anual Básico */}
                <div className="flex h-full flex-col rounded-xl border-0 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-slate-950">
                  <div className="mb-4 flex flex-col items-start">
                    <Heading2 className="mb-2 leading-tight">
                      Anual
                      <br />
                      Básico
                    </Heading2>
                    <div className="whitespace-nowrap text-3xl font-bold">R$ 79,90</div>
                    <div className="-mt-1 text-sm text-gray-500 dark:text-gray-400">por mês</div>
                  </div>
                  <div className="mb-6 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Cobrança anual de R$ 958,80
                    <br />
                    (pode parcelar no cartão)
                    <br />
                    Economia de 20% no plano anual
                  </div>
                  <ul className="flex-grow space-y-2">
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
                    <SubscriptionButton
                      planType="anual-basico"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                    >
                      Assinar agora
                    </SubscriptionButton>
                  </div>
                </div>
                {/* Mensal Plus */}
                <div className="flex h-full flex-col rounded-xl border-2 border-blue-600 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-slate-950">
                  <div className="mb-4 flex flex-col items-start">
                    <Heading2 className="mb-2 leading-tight">
                      Mensal
                      <br />
                      Plus
                    </Heading2>
                    <div className="whitespace-nowrap text-3xl font-bold">R$ 119,90</div>
                    <div className="-mt-1 text-sm text-gray-500 dark:text-gray-400">por mês</div>
                  </div>
                  <div className="mb-6 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Inclui explicações práticas
                    <br />
                    da Halachá para o dia a dia
                    <br />
                    com exemplos e aplicações
                  </div>
                  <ul className="flex-grow space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Tudo do plano Mensal
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Explicações práticas da Halachá
                      para o dia a dia
                    </li>
                    <li className="flex items-center gap-2 opacity-0">
                      <span className="text-green-500">✔</span> Espaço reservado
                    </li>
                    <li className="flex items-center gap-2 opacity-0">
                      <span className="text-green-500">✔</span> Espaço reservado
                    </li>
                  </ul>
                  <div className="mt-6">
                    <SubscriptionButton
                      planType="mensal-plus"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                    >
                      Assinar agora
                    </SubscriptionButton>
                  </div>
                </div>
                {/* Anual Plus */}
                <div className="flex h-full flex-col rounded-xl border-2 border-blue-600 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-slate-950">
                  <div className="mb-4 flex flex-col items-start">
                    <Heading2 className="mb-2 leading-tight">
                      Anual
                      <br />
                      Plus
                    </Heading2>
                    <div className="whitespace-nowrap text-3xl font-bold">R$ 89,90</div>
                    <div className="-mt-1 text-sm text-gray-500 dark:text-gray-400">por mês</div>
                  </div>
                  <div className="mb-6 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Cobrança anual de R$ 1.078,80
                    <br />
                    (pode parcelar no cartão)
                    <br />
                    Economia de 20% no plano anual
                  </div>
                  <ul className="flex-grow space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Tudo do plano Anual
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✔</span> Explicações práticas da Halachá
                      para o dia a dia
                    </li>
                    <li className="flex items-center gap-2 opacity-0">
                      <span className="text-green-500">✔</span> Espaço reservado
                    </li>
                    <li className="flex items-center gap-2 opacity-0">
                      <span className="text-green-500">✔</span> Espaço reservado
                    </li>
                  </ul>
                  <div className="mt-6">
                    <SubscriptionButton
                      planType="anual-plus"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                    >
                      Assinar agora
                    </SubscriptionButton>
                  </div>
                </div>
              </div>
              <div className="mt-12 overflow-x-auto">
                <table className="min-w-full rounded-xl border-0 bg-gradient-to-br from-white to-gray-50/30 text-sm shadow-lg dark:bg-slate-950">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-100 to-slate-200 dark:bg-slate-900">
                      <th className="p-3">
                        <ButtonText className="font-bold">Recurso</ButtonText>
                      </th>
                      <th className="p-3">
                        <ButtonText className="font-bold">Tratado Avulso</ButtonText>
                      </th>
                      <th className="p-3">
                        <ButtonText className="font-bold">Mensal Básico</ButtonText>
                      </th>
                      <th className="p-3">
                        <ButtonText className="font-bold">Anual Básico</ButtonText>
                      </th>
                      <th className="p-3">
                        <ButtonText className="font-bold">Mensal Plus</ButtonText>
                      </th>
                      <th className="p-3">
                        <ButtonText className="font-bold">Anual Plus</ButtonText>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3">Favoritos e marcadores</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                    </tr>
                    <tr>
                      <td className="p-3">Acesso completo à biblioteca</td>
                      <td className="p-3 text-center text-xl text-red-500">✗</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                    </tr>
                    <tr>
                      <td className="p-3">Pesquisa avançada</td>
                      <td className="p-3 text-center text-xl text-red-500">✗</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                    </tr>
                    <tr>
                      <td className="p-3">Explicações práticas</td>
                      <td className="p-3 text-center text-xl text-red-500">✗</td>
                      <td className="p-3 text-center text-xl text-red-500">✗</td>
                      <td className="p-3 text-center text-xl text-red-500">✗</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                      <td className="p-3 text-center text-xl text-green-500">✓</td>
                    </tr>
                    <tr>
                      <td className="p-3">Preço</td>
                      <td className="p-3 text-center text-lg font-semibold">R$ 29,90/mês</td>
                      <td className="p-3 text-center text-lg font-semibold">R$ 99,90/mês</td>
                      <td className="p-3 text-center text-lg font-semibold">
                        R$ 79,90/mês
                        <br />
                        <span className="text-sm">(R$ 958,80/ano)</span>
                      </td>
                      <td className="p-3 text-center text-lg font-semibold">R$ 119,90/mês</td>
                      <td className="p-3 text-center text-lg font-semibold">
                        R$ 89,90/mês
                        <br />
                        <span className="text-sm">(R$ 1.078,80/ano)</span>
                      </td>
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
            <BodySmall className="text-center text-gray-500 md:text-left">
              © 2025 Or Halachá. Todos os direitos reservados.
            </BodySmall>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                href="/termos"
                className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
              >
                Termos de Uso
              </Link>
              <Link
                href="/privacidade"
                className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/politica-compra"
                className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
              >
                Política de Compra
              </Link>
              <Link
                href="/politica-reembolso"
                className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
              >
                Política de Reembolso
              </Link>
              <Link
                href="/politica-copia"
                className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-600"
              >
                Política de Cópia
              </Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </>
  )
}
