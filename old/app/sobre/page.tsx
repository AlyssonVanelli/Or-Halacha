import { HeaderSimplificado } from '@/components/DashboardHeader'
import { BookOpen, Users, Target, Heart } from 'lucide-react'

export default function SobrePage() {
  return (
    <>
      <HeaderSimplificado />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-16">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight">Sobre a Or Halachá</h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Conectando a tradição judaica com a tecnologia moderna para tornar o estudo da Halachá
              mais acessível e eficiente.
            </p>
          </div>

          {/* Missão */}
          <div className="mb-16">
            <div className="mb-6 flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <h2 className="text-3xl font-bold">Nossa Missão</h2>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Democratizar o acesso ao conhecimento haláchico através de uma plataforma digital
              moderna, intuitiva e completa. Queremos tornar o estudo do Shulchan Aruch mais
              eficiente e acessível para estudantes, rabinos e toda a comunidade judaica.
            </p>
          </div>

          {/* Valores */}
          <div className="mb-16">
            <div className="mb-6 flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-600" />
              <h2 className="text-3xl font-bold">Nossos Valores</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Tradição e Inovação</h3>
                <p className="text-muted-foreground">
                  Respeitamos profundamente a tradição milenar da Halachá, mas utilizamos a
                  tecnologia mais moderna para apresentá-la de forma clara e acessível.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Acessibilidade</h3>
                <p className="text-muted-foreground">
                  Acreditamos que o conhecimento haláchico deve estar disponível para todos,
                  independentemente do nível de estudo ou localização geográfica.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Precisão e Confiabilidade</h3>
                <p className="text-muted-foreground">
                  Mantemos os mais altos padrões de precisão textual e consultamos fontes
                  autorizadas para garantir a confiabilidade do conteúdo.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Comunidade</h3>
                <p className="text-muted-foreground">
                  Fomentamos uma comunidade de aprendizado onde estudantes e estudiosos podem
                  compartilhar conhecimento e crescer juntos.
                </p>
              </div>
            </div>
          </div>

          {/* Equipe */}
          <div className="mb-16">
            <div className="mb-6 flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <h2 className="text-3xl font-bold">Nossa Equipe</h2>
            </div>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
              Somos uma equipe de desenvolvedores, estudiosos e rabinos dedicados a criar a melhor
              experiência possível para o estudo da Halachá. Nossa equipe combina expertise técnica
              com profundo conhecimento da tradição judaica.
            </p>
            <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-950/20">
              <h3 className="mb-4 text-xl font-semibold">Conselho Rabínico</h3>
              <p className="text-muted-foreground">
                Contamos com a orientação de um conselho de rabinos experientes que revisam e
                validam todo o conteúdo disponível na plataforma, garantindo sua precisão e
                relevância haláchica.
              </p>
            </div>
          </div>

          {/* Tecnologia */}
          <div className="mb-16">
            <h2 className="mb-6 text-3xl font-bold">Nossa Tecnologia</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border p-6 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-blue-600" />
                <h3 className="mb-2 text-lg font-semibold">Busca Inteligente</h3>
                <p className="text-muted-foreground">
                  Sistema de busca avançado que encontra exatamente o que você procura
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-green-600" />
                <h3 className="mb-2 text-lg font-semibold">Interface Moderna</h3>
                <p className="text-muted-foreground">
                  Design responsivo e intuitivo para uma experiência de estudo otimizada
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-purple-600" />
                <h3 className="mb-2 text-lg font-semibold">Sincronização</h3>
                <p className="text-muted-foreground">
                  Seus favoritos e anotações sincronizados em todos os dispositivos
                </p>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-900">
            <h2 className="mb-4 text-2xl font-bold">Entre em Contato</h2>
            <p className="mb-6 text-muted-foreground">
              Tem alguma dúvida, sugestão ou feedback? Adoraríamos ouvir de você!
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="mailto:contato@orhalacha.com"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
              >
                Enviar E-mail
              </a>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-green-600 bg-white px-6 py-3 text-base font-medium text-green-600 hover:bg-green-50"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
