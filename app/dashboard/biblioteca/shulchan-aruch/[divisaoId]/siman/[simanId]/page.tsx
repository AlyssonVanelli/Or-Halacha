'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { DashboardAccessGuard } from '@/components/DashboardAccessGuard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Book } from 'lucide-react'
import { useParams } from 'next/navigation'

interface Seif {
  id: string
  title: string
  content: string
  position: number
}

interface Siman {
  id: string
  title: string
  position: number
  division_id: string
}

interface Division {
  id: string
  title: string
  description: string | null
}

export default function SimanPage() {
  const { user } = useAuth()
  const params = useParams()
  const divisaoId = params.divisaoId as string
  const simanId = params.simanId as string
  const [siman, setSiman] = useState<Siman | null>(null)
  const [division, setDivision] = useState<Division | null>(null)
  const [seifim, setSeifim] = useState<Seif[]>([])
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!user || !simanId || !divisaoId) return

      try {
        const supabase = createClient()

        // Carregar siman
        const { data: simanData, error: simanError } = await supabase
          .from('simanim')
          .select('*')
          .eq('id', simanId)
          .single()

        if (simanError) {
          console.error('Erro ao carregar siman:', simanError)
          return
        }

        setSiman(simanData)

        // Carregar divisão
        const { data: divisionData, error: divisionError } = await supabase
          .from('divisions')
          .select('*')
          .eq('id', divisaoId)
          .single()

        if (divisionError) {
          console.error('Erro ao carregar divisão:', divisionError)
          return
        }

        setDivision(divisionData)

        // Carregar seifim
        const { data: seifimData, error: seifimError } = await supabase
          .from('seifim')
          .select('*')
          .eq('siman_id', simanId)
          .order('position')

        if (seifimError) {
          console.error('Erro ao carregar seifim:', seifimError)
          return
        }

        setSeifim(seifimData || [])

        // Verificar acesso ESPECÍFICO para esta divisão
        try {
          const accessResponse = await fetch('/api/check-division-access', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              divisionId: divisaoId,
            }),
          })

          if (!accessResponse.ok) {
            throw new Error(`Erro na verificação de acesso: ${accessResponse.status}`)
          }

          const accessData = await accessResponse.json()

          if (!accessData.success) {
            throw new Error('Falha na verificação de acesso')
          }

          const { hasAccess } = accessData.access

          console.log('🔍 DEBUG ACESSO SIMAN DIVISÃO:', {
            divisaoId,
            simanId,
            hasAccess,
            details: accessData.details,
          })

          setHasAccess(hasAccess)
        } catch (accessError) {
          console.error('Erro na verificação de acesso:', accessError)
          // Fallback para verificação local
          const { data: subscriptionData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle()

          const { data: purchasedData } = await supabase
            .from('purchased_books')
            .select('division_id, expires_at')
            .eq('user_id', user.id)

          const hasActiveSub =
            !!subscriptionData && new Date(subscriptionData.current_period_end) > new Date()
          const validPurchases = (purchasedData || []).filter(
            pb => new Date(pb.expires_at) > new Date()
          )
          const hasPurchasedThisDivision = validPurchases.some(pb => pb.division_id === divisaoId)

          setHasAccess(hasActiveSub || hasPurchasedThisDivision)
        }
      } catch (error) {
        console.error('Erro inesperado:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, simanId, divisaoId])

  if (loading) {
    return (
      <DashboardAccessGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </DashboardAccessGuard>
    )
  }

  if (!hasAccess) {
    return (
      <DashboardAccessGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">Acesso Restrito</h2>
            <p className="mb-6 text-gray-600">
              Você precisa de uma assinatura para acessar este conteúdo.
            </p>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700">Ver Planos</Button>
            </Link>
          </div>
        </div>
      </DashboardAccessGuard>
    )
  }

  return (
    <DashboardAccessGuard>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="flex-1">
          <div className="container py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href={`/dashboard/biblioteca/shulchan-aruch/${divisaoId}`}
                className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para {division?.title}
              </Link>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-500 p-3">
                  <Book className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">
                    Siman {siman?.position} - {siman?.title}
                  </h1>
                </div>
              </div>
            </div>

            {/* Conteúdo do Siman */}
            <div className="mx-auto max-w-4xl">
              <div className="space-y-6">
                {seifim.map(seif => (
                  <div key={seif.id} className="rounded-xl bg-white p-6 shadow-lg">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 px-3 py-1">
                        <span className="text-sm font-bold text-blue-800">
                          Seif {seif.position}
                        </span>
                      </div>
                      {seif.title && (
                        <h3 className="text-lg font-semibold text-gray-800">{seif.title}</h3>
                      )}
                    </div>

                    <div className="prose prose-lg max-w-none">
                      <div
                        className="leading-relaxed text-gray-700"
                        dangerouslySetInnerHTML={{ __html: seif.content }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardAccessGuard>
  )
}
