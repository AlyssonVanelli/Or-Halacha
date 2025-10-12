#!/usr/bin/env node

/**
 * Script para testar sincronização de assinaturas
 * Execute: node scripts/test-subscription-sync.js
 */

const https = require('https')
const http = require('http')

// Configuração
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const TEST_USER_ID = '3f0e0184-c0a7-487e-b611-72890b39dcce' // ID do usuário do log
const TEST_SUBSCRIPTION_ID = 'sub_1SH9diFLuMsSi0Yi7JfAzxZV' // ID da assinatura do log

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

async function testSubscriptionDebug() {
  log('\n=== TESTANDO DEBUG DE ASSINATURA ===', 'blue')

  try {
    log('Testando debug por User ID...', 'yellow')

    const response = await makeRequest(`${BASE_URL}/api/subscription/debug`, {
      body: { userId: TEST_USER_ID },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Debug por User ID: SUCESSO', 'green')
      log('Dados do banco:', JSON.stringify(response.data.data.database, null, 2), 'blue')
      log('Dados do Stripe:', JSON.stringify(response.data.data.stripe, null, 2), 'blue')

      if (response.data.data.differences.length > 0) {
        log('⚠️  DIFERENÇAS ENCONTRADAS:', 'yellow')
        response.data.data.differences.forEach(diff => {
          log(`- ${diff.field}:`, 'yellow')
          log(`  Banco: ${diff.database}`, 'red')
          log(`  Stripe: ${diff.stripe}`, 'green')
        })
      } else {
        log('✅ Dados sincronizados!', 'green')
      }
    } else {
      log(`❌ Debug por User ID: FALHOU - ${response.data.error}`, 'red')
    }
  } catch (error) {
    log(`❌ Debug por User ID: ERRO - ${error.message}`, 'red')
  }

  try {
    log('\nTestando debug por Subscription ID...', 'yellow')

    const response = await makeRequest(`${BASE_URL}/api/subscription/debug`, {
      body: { subscriptionId: TEST_SUBSCRIPTION_ID },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Debug por Subscription ID: SUCESSO', 'green')
      log('Dados do banco:', JSON.stringify(response.data.data.database, null, 2), 'blue')
      log('Dados do Stripe:', JSON.stringify(response.data.data.stripe, null, 2), 'blue')

      if (response.data.data.differences.length > 0) {
        log('⚠️  DIFERENÇAS ENCONTRADAS:', 'yellow')
        response.data.data.differences.forEach(diff => {
          log(`- ${diff.field}:`, 'yellow')
          log(`  Banco: ${diff.database}`, 'red')
          log(`  Stripe: ${diff.stripe}`, 'green')
        })
      } else {
        log('✅ Dados sincronizados!', 'green')
      }
    } else {
      log(`❌ Debug por Subscription ID: FALHOU - ${response.data.error}`, 'red')
    }
  } catch (error) {
    log(`❌ Debug por Subscription ID: ERRO - ${error.message}`, 'red')
  }
}

async function testSubscriptionSync() {
  log('\n=== TESTANDO SINCRONIZAÇÃO DE ASSINATURA ===', 'blue')

  try {
    log('Testando sincronização por User ID...', 'yellow')

    const response = await makeRequest(`${BASE_URL}/api/subscription/sync`, {
      body: { userId: TEST_USER_ID },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Sincronização por User ID: SUCESSO', 'green')
      log('Dados sincronizados:', JSON.stringify(response.data.data, null, 2), 'blue')
    } else {
      log(`❌ Sincronização por User ID: FALHOU - ${response.data.error}`, 'red')
    }
  } catch (error) {
    log(`❌ Sincronização por User ID: ERRO - ${error.message}`, 'red')
  }

  try {
    log('\nTestando sincronização por Subscription ID...', 'yellow')

    const response = await makeRequest(`${BASE_URL}/api/subscription/sync`, {
      body: { subscriptionId: TEST_SUBSCRIPTION_ID },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Sincronização por Subscription ID: SUCESSO', 'green')
      log('Dados sincronizados:', JSON.stringify(response.data.data, null, 2), 'blue')
    } else {
      log(`❌ Sincronização por Subscription ID: FALHOU - ${response.data.error}`, 'red')
    }
  } catch (error) {
    log(`❌ Sincronização por Subscription ID: ERRO - ${error.message}`, 'red')
  }
}

async function testSubscriptionStatus() {
  log('\n=== TESTANDO STATUS DA ASSINATURA ===', 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/subscription/status`, {
      body: { userId: TEST_USER_ID },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Status da Assinatura: SUCESSO', 'green')
      log('Dados de status:', JSON.stringify(response.data.data, null, 2), 'blue')
    } else {
      log(`❌ Status da Assinatura: FALHOU - ${response.data.error}`, 'red')
    }
  } catch (error) {
    log(`❌ Status da Assinatura: ERRO - ${error.message}`, 'red')
  }
}

async function runAllTests() {
  log('🚀 INICIANDO TESTES DE SINCRONIZAÇÃO DE ASSINATURAS', 'bold')
  log(`Base URL: ${BASE_URL}`, 'blue')
  log(`User ID: ${TEST_USER_ID}`, 'blue')
  log(`Subscription ID: ${TEST_SUBSCRIPTION_ID}`, 'blue')

  try {
    await testSubscriptionDebug()
    await testSubscriptionSync()
    await testSubscriptionStatus()

    log('\n🎉 TODOS OS TESTES CONCLUÍDOS', 'green')
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
  testSubscriptionDebug,
  testSubscriptionSync,
  testSubscriptionStatus,
  runAllTests,
}
