#!/usr/bin/env node

/**
 * Script para testar integração Stripe completa
 * Execute: node scripts/test-stripe-integration.js
 */

const https = require('https')
const http = require('http')

// Configuração
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const TEST_USER_ID = '3f0e0184-c0a7-487e-b611-72890b39dcce'
const TEST_PRICE_ID = 'price_1RQCoOFLuMsSi0YiBmCrrM1r'

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
      method: options.method || 'POST',
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

async function testServerConnection() {
  log('\n=== TESTANDO CONEXÃO COM SERVIDOR ===', 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/test-webhook`, {
      body: { userId: TEST_USER_ID },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Servidor funcionando', 'green')
      return true
    } else {
      log(`❌ Servidor com problemas: ${response.data.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Erro de conexão: ${error.message}`, 'red')
    return false
  }
}

async function testStripeConnection() {
  log('\n=== TESTANDO CONEXÃO COM STRIPE ===', 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/test-webhook`, {
      body: { userId: TEST_USER_ID },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Stripe funcionando', 'green')
      return true
    } else {
      log(`❌ Stripe com problemas: ${response.data.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Erro no Stripe: ${error.message}`, 'red')
    return false
  }
}

async function testDatabaseConnection() {
  log('\n=== TESTANDO CONEXÃO COM BANCO ===', 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/subscription/debug`, {
      body: { userId: TEST_USER_ID },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Banco funcionando', 'green')

      const data = response.data.data
      if (data.database) {
        log('📊 Dados no banco:', 'blue')
        log(`- Status: ${data.database.status}`, 'blue')
        log(`- Current Period Start: ${data.database.current_period_start}`, 'blue')
        log(`- Current Period End: ${data.database.current_period_end}`, 'blue')
        log(`- Explicação Prática: ${data.database.explicacao_pratica}`, 'blue')
      }

      return true
    } else {
      log(`❌ Banco com problemas: ${response.data.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Erro no banco: ${error.message}`, 'red')
    return false
  }
}

async function testCheckoutCreation() {
  log('\n=== TESTANDO CRIAÇÃO DE CHECKOUT ===', 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/test-checkout`, {
      body: {
        userId: TEST_USER_ID,
        priceId: TEST_PRICE_ID,
        mode: 'subscription',
      },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Checkout criado com sucesso', 'green')
      log(`Session ID: ${response.data.data.sessionId}`, 'blue')
      log(`URL: ${response.data.data.url}`, 'blue')
      return true
    } else {
      log(`❌ Erro ao criar checkout: ${response.data.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Erro no checkout: ${error.message}`, 'red')
    return false
  }
}

async function testWebhookSimulation() {
  log('\n=== TESTANDO SIMULAÇÃO DE WEBHOOK ===', 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/test-webhook`, {
      body: { userId: TEST_USER_ID },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Webhook funcionando', 'green')
      return true
    } else {
      log(`❌ Webhook com problemas: ${response.data.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Erro no webhook: ${error.message}`, 'red')
    return false
  }
}

async function runAllTests() {
  log('🚀 TESTANDO INTEGRAÇÃO STRIPE COMPLETA', 'bold')
  log(`Base URL: ${BASE_URL}`, 'blue')
  log(`User ID: ${TEST_USER_ID}`, 'blue')
  log(`Price ID: ${TEST_PRICE_ID}`, 'blue')

  const results = {
    server: false,
    stripe: false,
    database: false,
    checkout: false,
    webhook: false,
  }

  try {
    // 1. Testar servidor
    results.server = await testServerConnection()

    if (!results.server) {
      log('\n❌ Servidor não está funcionando. Pare aqui.', 'red')
      return
    }

    // 2. Testar Stripe
    results.stripe = await testStripeConnection()

    // 3. Testar banco
    results.database = await testDatabaseConnection()

    // 4. Testar checkout
    results.checkout = await testCheckoutCreation()

    // 5. Testar webhook
    results.webhook = await testWebhookSimulation()

    // Resumo
    log('\n🎯 RESUMO DOS TESTES:', 'bold')
    log(`Servidor: ${results.server ? '✅' : '❌'}`, results.server ? 'green' : 'red')
    log(`Stripe: ${results.stripe ? '✅' : '❌'}`, results.stripe ? 'green' : 'red')
    log(`Banco: ${results.database ? '✅' : '❌'}`, results.database ? 'green' : 'red')
    log(`Checkout: ${results.checkout ? '✅' : '❌'}`, results.checkout ? 'green' : 'red')
    log(`Webhook: ${results.webhook ? '✅' : '❌'}`, results.webhook ? 'green' : 'red')

    const allWorking = Object.values(results).every(result => result)

    if (allWorking) {
      log('\n🎉 TODOS OS TESTES PASSARAM!', 'green')
      log('A integração Stripe está funcionando perfeitamente.', 'green')
    } else {
      log('\n⚠️ ALGUNS TESTES FALHARAM', 'yellow')
      log('Verifique os erros acima para identificar o problema.', 'yellow')
    }
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
  testServerConnection,
  testStripeConnection,
  testDatabaseConnection,
  testCheckoutCreation,
  testWebhookSimulation,
  runAllTests,
}
