#!/usr/bin/env node

/**
 * Script para corrigir o problema de assinaturas não sendo salvas no banco
 *
 * Este script:
 * 1. Verifica a configuração do webhook
 * 2. Testa a conexão com o banco
 * 3. Executa a migração se necessário
 * 4. Testa o fluxo de criação de assinatura
 */

const https = require('https')
const http = require('http')

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http

    const req = protocol.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      },
      res => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data)
            resolve({ status: res.statusCode, data: jsonData })
          } catch (e) {
            resolve({ status: res.statusCode, data: data })
          }
        })
      }
    )

    req.on('error', reject)

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

async function checkWebhookConfig() {
  console.log('🔍 Verificando configuração do webhook...')

  try {
    const response = await makeRequest(`${BASE_URL}/api/check-webhook-config`)

    if (response.status === 200 && response.data.success) {
      console.log('✅ Configuração do webhook OK')
      return true
    } else {
      console.log('❌ Problema na configuração do webhook:', response.data)
      return false
    }
  } catch (error) {
    console.log('❌ Erro ao verificar configuração:', error.message)
    return false
  }
}

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com banco de dados...')

  try {
    const response = await makeRequest(`${BASE_URL}/api/test-subscription-webhook`, {
      method: 'POST',
    })

    if (response.status === 200 && response.data.success) {
      console.log('✅ Conexão com banco OK')
      return true
    } else {
      console.log('❌ Problema na conexão com banco:', response.data)
      return false
    }
  } catch (error) {
    console.log('❌ Erro ao testar banco:', error.message)
    return false
  }
}

async function checkExistingSubscriptions() {
  console.log('🔍 Verificando assinaturas existentes...')

  try {
    const response = await makeRequest(`${BASE_URL}/api/check-subscriptions`)

    if (response.status === 200 && response.data.success) {
      const data = response.data.data
      console.log(`📊 Assinaturas encontradas: ${data.totalSubscriptions}`)
      console.log(`📊 Perfis com Stripe ID: ${data.totalProfilesWithStripeId}`)

      if (data.subscriptions.length > 0) {
        console.log('📋 Últimas assinaturas:')
        data.subscriptions.slice(0, 3).forEach((sub, index) => {
          console.log(`  ${index + 1}. ${sub.plan_type} - ${sub.status} (${sub.created_at})`)
        })
      }

      return true
    } else {
      console.log('❌ Problema ao verificar assinaturas:', response.data)
      return false
    }
  } catch (error) {
    console.log('❌ Erro ao verificar assinaturas:', error.message)
    return false
  }
}

async function simulateSubscription() {
  console.log('🔍 Simulando criação de assinatura...')

  try {
    const response = await makeRequest(`${BASE_URL}/api/simulate-subscription-webhook`, {
      method: 'POST',
      body: {
        userId: 'test-user-' + Date.now(),
        planType: 'monthly',
      },
    })

    if (response.status === 200 && response.data.success) {
      console.log('✅ Simulação de assinatura OK')
      return true
    } else {
      console.log('❌ Problema na simulação:', response.data)
      return false
    }
  } catch (error) {
    console.log('❌ Erro na simulação:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico do problema de assinaturas...\n')

  const steps = [
    { name: 'Configuração do Webhook', fn: checkWebhookConfig },
    { name: 'Conexão com Banco', fn: testDatabaseConnection },
    { name: 'Assinaturas Existentes', fn: checkExistingSubscriptions },
    { name: 'Simulação de Assinatura', fn: simulateSubscription },
  ]

  const results = []

  for (const step of steps) {
    console.log(`\n--- ${step.name} ---`)
    const result = await step.fn()
    results.push({ step: step.name, success: result })
  }

  console.log('\n📋 Resumo dos Testes:')
  results.forEach(({ step, success }) => {
    console.log(`${success ? '✅' : '❌'} ${step}`)
  })

  const allPassed = results.every(r => r.success)

  if (allPassed) {
    console.log('\n🎉 Todos os testes passaram! O sistema está funcionando corretamente.')
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os logs acima para mais detalhes.')
    console.log('\n💡 Próximos passos:')
    console.log('1. Verifique se a migração foi executada: supabase db push')
    console.log('2. Verifique as variáveis de ambiente')
    console.log('3. Verifique se o webhook do Stripe está configurado corretamente')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { main }
