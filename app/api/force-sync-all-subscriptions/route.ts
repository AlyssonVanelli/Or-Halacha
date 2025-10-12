import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST() {
  console.log('=== FORÇANDO SINCRONIZAÇÃO DE TODAS AS ASSINATURAS ===')

  const supabase = createClient()

  try {
    // Buscar todas as assinaturas ativas no banco
    const { data: activeSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')

    if (fetchError) {
      console.error('ERRO ao buscar assinaturas:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar assinaturas',
          details: fetchError,
        },
        { status: 500 }
      )
    }

    console.log(`Encontradas ${activeSubscriptions?.length || 0} assinaturas ativas`)

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma assinatura ativa encontrada',
      })
    }

    const results: Array<{
      userId: string
      subscriptionId: string
      success: boolean
      message: string
      changes?: any
      error?: string
    }> = []

    // Para cada assinatura, tentar sincronizar
    for (const subscription of activeSubscriptions) {
      try {
        console.log(`Sincronizando assinatura do usuário: ${subscription.user_id}`)

        // Chamar endpoint de sincronização
        const syncResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sync-stripe-subscriptions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: subscription.user_id,
            }),
          }
        )

        const syncData = await syncResponse.json()
        results.push({
          userId: subscription.user_id,
          subscriptionId: subscription.subscription_id,
          success: syncData.success,
          message: syncData.message,
          changes: syncData.changes,
        })

        console.log(
          `Resultado para ${subscription.user_id}:`,
          syncData.success ? 'SUCESSO' : 'ERRO'
        )
      } catch (error) {
        console.error(`ERRO ao sincronizar ${subscription.user_id}:`, error)
        results.push({
          userId: subscription.user_id,
          subscriptionId: subscription.subscription_id,
          success: false,
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    console.log(`Sincronização concluída: ${successCount} sucessos, ${errorCount} erros`)

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${successCount} sucessos, ${errorCount} erros`,
      results: results,
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount,
      },
    })
  } catch (error) {
    console.error('ERRO geral na sincronização:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro geral na sincronização',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
