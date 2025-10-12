#!/usr/bin/env node

/**
 * Script para corrigir problemas de sincronização de assinaturas
 * Execute: node scripts/fix-subscription-sync.js
 */

const https = require('https')
const http = require('http')

// Configuração
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://')
    const client = isHttps ? https : http

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const req = client.request(url, requestOptions, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({ status: res.statusCode, data: jsonData })
        } catch (error) {
          resolve({ status: res.statusCode, data: data })
        }
      })
    })

    req.on('error', reject)

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

async function fixAllSubscriptions() {
  log('\n=== CORRIGINDO TODAS AS ASSINATURAS ===', 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/subscription/sync-all`)

    if (response.status === 200 && response.data.success) {
      log('✅ Sincronização completa: SUCESSO', 'green')
      log(`Total: ${response.data.summary.total}`, 'blue')
      log(`Sucessos: ${response.data.summary.success}`, 'green')
      log(`Falhas: ${response.data.summary.failed}`, 'red')

      if (response.data.results.length > 0) {
        log('\nDetalhes dos resultados:', 'yellow')
        response.data.results.forEach((result, index) => {
          const status = result.status === 'success' ? '✅' : '❌'
          log(
            `${status} ${result.subscription_id}: ${result.status}`,
            result.status === 'success' ? 'green' : 'red'
          )

          if (result.data) {
            log(`   Status: ${result.data.status}`, 'blue')
            log(`   Período início: ${result.data.current_period_start}`, 'blue')
            log(`   Período fim: ${result.data.current_period_end}`, 'blue')
            log(`   Cancelar no fim: ${result.data.cancel_at_period_end}`, 'blue')
            log(`   É Plus: ${result.data.explicacao_pratica}`, 'blue')
          }

          if (result.error) {
            log(`   Erro: ${result.error}`, 'red')
          }
        })
      }
    } else {
      log(`❌ Sincronização completa: FALHOU - ${response.data.error}`, 'red')
    }
  } catch (error) {
    log(`❌ Sincronização completa: ERRO - ${error.message}`, 'red')
  }
}

async function testSpecificSubscription() {
  log('\n=== TESTANDO ASSINATURA ESPECÍFICA ===', 'blue')

  const testCases = [
    {
      name: 'Assinatura do log (User ID)',
      userId: '3f0e0184-c0a7-487e-b611-72890b39dcce',
    },
    {
      name: 'Assinatura do log (Subscription ID)',
      subscriptionId: 'sub_1SH9diFLuMsSi0Yi7JfAzxZV',
    },
  ]

  for (const testCase of testCases) {
    try {
      log(`\nTestando: ${testCase.name}`, 'yellow')

      const body = testCase.userId
        ? { userId: testCase.userId }
        : { subscriptionId: testCase.subscriptionId }

      // Primeiro debug
      const debugResponse = await makeRequest(`${BASE_URL}/api/subscription/debug`, { body })

      if (debugResponse.status === 200 && debugResponse.data.success) {
        log('✅ Debug: SUCESSO', 'green')

        if (debugResponse.data.data.differences.length > 0) {
          log('⚠️  Diferenças encontradas:', 'yellow')
          debugResponse.data.data.differences.forEach(diff => {
            log(`- ${diff.field}:`, 'yellow')
            log(`  Banco: ${diff.database}`, 'red')
            log(`  Stripe: ${diff.stripe}`, 'green')
          })

          // Tentar sincronizar
          log('Tentando sincronizar...', 'yellow')
          const syncResponse = await makeRequest(`${BASE_URL}/api/subscription/sync`, { body })

          if (syncResponse.status === 200 && syncResponse.data.success) {
            log('✅ Sincronização: SUCESSO', 'green')
            log('Dados sincronizados:', JSON.stringify(syncResponse.data.data, null, 2), 'blue')
          } else {
            log(`❌ Sincronização: FALHOU - ${syncResponse.data.error}`, 'red')
          }
        } else {
          log('✅ Dados já sincronizados!', 'green')
        }
      } else {
        log(`❌ Debug: FALHOU - ${debugResponse.data.error}`, 'red')
      }
    } catch (error) {
      log(`❌ ${testCase.name}: ERRO - ${error.message}`, 'red')
    }
  }
}

async function runAllTests() {
  log('🚀 INICIANDO CORREÇÃO DE SINCRONIZAÇÃO DE ASSINATURAS', 'bold')
  log(`Base URL: ${BASE_URL}`, 'blue')

  try {
    await testSpecificSubscription()
    await fixAllSubscriptions()

    log('\n🎉 CORREÇÃO CONCLUÍDA', 'green')
    log('\nPróximos passos:', 'yellow')
    log('1. Verifique os logs do servidor', 'blue')
    log('2. Teste uma assinatura específica', 'blue')
    log('3. Verifique se as datas estão corretas no banco', 'blue')
    log('4. Teste o cancelamento direto no Stripe', 'blue')
  } catch (error) {
    log(`\n💥 ERRO GERAL: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Executar testes
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = {
  fixAllSubscriptions,
  testSpecificSubscription,
  runAllTests,
}
