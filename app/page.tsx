'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Search, Star } from 'lucide-react'
// import { ParashaSemanal } from './components/parasha-semanal'
import { SimanDoDia, type SimanDoDiaData } from './components/siman-do-dia'
import { Glossary } from '@/components/content/Glossary'
import FaqAccordion from './components/FaqAccordion'
import { HeaderSimplificado } from '@/components/DashboardHeader'
import Chatbot from '@/components/Chatbot'
import { ScrollToSection } from './components/ScrollToSection'
import { PlanCards } from '@/components/PlanCards'
import { useAuth } from '@/contexts/auth-context'
import {
  Display,
  Heading1,
  Heading2,
  Heading3,
  Body,
  BodyLarge,
  BodySmall,
} from '@/components/ui/typography'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Estados para carregar dados dinamicamente
  const [siman, setSiman] = useState<SimanDoDiaData | null>(null)
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
        const simanResponse = await fetch('/api/siman-do-dia')

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

  // A landing é renderizada mesmo enquanto o login é verificado (visível para o Google);
  // quem estiver logado é levado ao dashboard pelo efeito acima.
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
                    <Display className="text-no-clip overflow-visible bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text pb-2 text-4xl font-bold leading-tight tracking-tight text-transparent will-change-transform sm:text-5xl md:pb-6 md:text-6xl md:leading-[1.6]">
                      Shulchan Aruch em Português
                    </Display>
                    <BodyLarge className="max-w-[700px] text-gray-600">
                      O código clássico da lei judaica, inteiro em português, com o assunto de cada
                      capítulo à vista e explicações práticas para o dia a dia. Não precisa saber
                      hebraico: serve para quem vive a tradição e para quem quer conhecer o
                      judaísmo.
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
                  <Heading3 className="text-gray-800">Favoritos</Heading3>
                  <Body className="text-center text-gray-600">
                    Guarde os seifim que você quer rever e volte a eles com um toque.
                  </Body>
                </div>
              </div>
              <div className="mx-auto max-w-5xl">
                <Glossary />
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
                    O siman do dia é sempre grátis. Para ler tudo, escolha um plano: mensal, ou
                    anual à vista com 4 meses grátis.
                  </BodyLarge>
                </div>
              </div>
              <div className="py-12">
                <PlanCards />
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
              © {new Date().getFullYear()} Or Halachá. Todos os direitos reservados.
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
