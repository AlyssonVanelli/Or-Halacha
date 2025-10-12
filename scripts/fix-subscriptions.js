#!/usr/bin/env node

/**
 * Script para corrigir assinaturas existentes
 * Executa a correção de assinaturas Plus e sincronização com Stripe
 */

async function fixSubscriptions() {
  console.log('=== INICIANDO CORREÇÃO DE ASSINATURAS ===')

  try {
    const response = await fetch('http://localhost:3000/api/fix-subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ Correção executada com sucesso!')
      console.log(`📊 Assinaturas processadas: ${result.processed}`)
    } else {
      console.error('❌ Erro na correção:', result.error)
      if (result.details) {
        console.error('Detalhes:', result.details)
      }
    }
  } catch (error) {
    console.error('❌ Erro ao executar correção:', error.message)
  }
}

async function syncSubscription(userId, subscriptionId) {
  console.log('=== SINCRONIZANDO ASSINATURA ESPECÍFICA ===')

  if (!userId) {
    console.error('❌ userId é obrigatório para a sincronização')
    console.log('Uso: node scripts/fix-subscriptions.js sync <userId> [subscriptionId]')
    return
  }

  try {
    const response = await fetch('http://localhost:3000/api/sync-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, subscriptionId }),
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ Sincronização executada com sucesso!')
      console.log('📊 Dados atualizados:')
      console.log(`- Status: ${result.stripeData.status}`)
      console.log(`- Período início: ${result.stripeData.current_period_start}`)
      console.log(`- Período fim: ${result.stripeData.current_period_end}`)
      console.log(`- Cancelado em: ${result.stripeData.canceled_at}`)
      console.log(`- É Plus: ${result.stripeData.isPlus}`)
    } else {
      console.error('❌ Erro na sincronização:', result.error)
      if (result.details) {
        console.error('Detalhes:', result.details)
      }
    }
  } catch (error) {
    console.error('❌ Erro ao executar sincronização:', error.message)
  }
}

async function simulateWebhook(userId) {
  console.log('=== SIMULANDO WEBHOOK ===')

  if (!userId) {
    console.error('❌ userId é obrigatório para a simulação')
    console.log('Uso: node scripts/fix-subscriptions.js simulate <userId>')
    return
  }

  try {
    const response = await fetch('http://localhost:3000/api/simulate-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ Simulação executada com sucesso!')
      console.log('📊 Assinatura atualizada:')
      console.log(`- Status: ${result.subscription.status}`)
      console.log(`- Plan Type: ${result.subscription.plan_type}`)
      console.log(`- Current Period Start: ${result.subscription.current_period_start}`)
      console.log(`- Current Period End: ${result.subscription.current_period_end}`)
      console.log(`- Explicação Prática: ${result.subscription.explicacao_pratica}`)
    } else {
      console.error('❌ Erro na simulação:', result.error)
      if (result.details) {
        console.error('Detalhes:', result.details)
      }
    }
  } catch (error) {
    console.error('❌ Erro ao executar simulação:', error.message)
  }
}

async function testWebhook(userId) {
  console.log('=== TESTANDO WEBHOOK COM DADOS REAIS ===')

  if (!userId) {
    console.error('❌ userId é obrigatório para o teste')
    console.log('Uso: node scripts/fix-subscriptions.js webhook <userId>')
    return
  }

  try {
    const response = await fetch('http://localhost:3000/api/test-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ Webhook testado com sucesso!')
      console.log('📊 Assinatura criada:')
      console.log(`- Status: ${result.subscription.status}`)
      console.log(`- Plan Type: ${result.subscription.plan_type}`)
      console.log(`- Current Period Start: ${result.subscription.current_period_start}`)
      console.log(`- Current Period End: ${result.subscription.current_period_end}`)
      console.log(`- Explicação Prática: ${result.subscription.explicacao_pratica}`)
      console.log('🔍 Debug da detecção Plus:')
      console.log(`- Price ID: ${result.debug.priceId}`)
      console.log(`- É Plus: ${result.debug.isPlusSubscription}`)
      console.log(`- Detecção por Price ID: ${result.debug.detection.byPriceId}`)
      console.log(`- Detecção por Metadata: ${result.debug.detection.byMetadata}`)
      console.log(`- Detecção forçada: ${result.debug.detection.forced}`)
    } else {
      console.error('❌ Erro no teste do webhook:', result.error)
      if (result.details) {
        console.error('Detalhes:', result.details)
      }
    }
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message)
  }
}

async function testCompleteFlow(userId) {
  console.log('=== TESTANDO FLUXO COMPLETO ===')

  if (!userId) {
    console.error('❌ userId é obrigatório para o teste')
    console.log('Uso: node scripts/fix-subscriptions.js test <userId>')
    return
  }

  try {
    const response = await fetch('http://localhost:3000/api/test-complete-flow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ Teste executado com sucesso!')
      console.log('📊 Resultado:')
      console.log(`- Usuário: ${result.user.id}`)
      console.log(`- Assinatura ativa: ${result.user.hasActiveSubscription}`)
      console.log(`- Tem acesso: ${result.user.hasAccess}`)
      console.log(`- Recursos Plus: ${result.user.hasPlusFeatures}`)

      if (result.user.subscription) {
        console.log('📋 Detalhes da assinatura:')
        console.log(`  - Status: ${result.user.subscription.status}`)
        console.log(`  - Plano: ${result.user.subscription.plan_type}`)
        console.log(`  - Explicação Prática: ${result.user.subscription.explicacao_pratica}`)
        console.log(`  - Fim do período: ${result.user.subscription.current_period_end}`)
      }

      console.log(`📚 Livros comprados: ${result.user.purchasedBooks.length}`)
    } else {
      console.error('❌ Erro no teste:', result.error)
      if (result.details) {
        console.error('Detalhes:', result.details)
      }
    }
  } catch (error) {
    console.error('❌ Erro ao executar teste:', error.message)
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2)
const command = args[0]

if (command === 'fix') {
  fixSubscriptions()
} else if (command === 'sync') {
  const userId = args[1]
  const subscriptionId = args[2]
  syncSubscription(userId, subscriptionId)
} else if (command === 'simulate') {
  const userId = args[1]
  simulateWebhook(userId)
} else if (command === 'webhook') {
  const userId = args[1]
  testWebhook(userId)
} else if (command === 'test') {
  const userId = args[1]
  testCompleteFlow(userId)
} else {
  console.log('Uso:')
  console.log('  node scripts/fix-subscriptions.js fix                    - Corrigir assinaturas')
  console.log(
    '  node scripts/fix-subscriptions.js sync <userId> [subId]  - Sincronizar assinatura específica'
  )
  console.log(
    '  node scripts/fix-subscriptions.js simulate <userId>      - Simular webhook com dados corretos'
  )
  console.log(
    '  node scripts/fix-subscriptions.js webhook <userId>     - Testar webhook com dados reais'
  )
  console.log(
    '  node scripts/fix-subscriptions.js test <userId>          - Testar fluxo para usuário'
  )
  console.log('')
  console.log('Exemplos:')
  console.log('  node scripts/fix-subscriptions.js fix')
  console.log('  node scripts/fix-subscriptions.js sync 123e4567-e89b-12d3-a456-426614174000')
  console.log('  node scripts/fix-subscriptions.js simulate 3f0e0184-c0a7-487e-b611-72890b39dcce')
  console.log('  node scripts/fix-subscriptions.js webhook 3f0e0184-c0a7-487e-b611-72890b39dcce')
  console.log('  node scripts/fix-subscriptions.js test 123e4567-e89b-12d3-a456-426614174000')
}
