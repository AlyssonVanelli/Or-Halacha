#!/usr/bin/env node

/**
 * Script para testar criação de assinatura diretamente
 * Execute: node scripts/test-create-subscription.js
 */

const https = require('https')
const http = require('http')

// Configuração
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const TEST_USER_ID = '3f0e0184-c0a7-487e-b611-72890b39dcce'

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

async function testCreateSubscription(planType, isPlus) {
  log(
    `\n=== CRIANDO ASSINATURA ${planType.toUpperCase()} ${isPlus ? 'PLUS' : 'NORMAL'} ===`,
    'blue'
  )

  try {
    const response = await makeRequest(`${BASE_URL}/api/test-create-subscription`, {
      body: {
        userId: TEST_USER_ID,
        planType: planType,
        isPlus: isPlus,
      },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Assinatura criada com sucesso!', 'green')

      const data = response.data.data

      log('\n📊 DADOS DO STRIPE:', 'blue')
      log(`- ID: ${data.stripe.id}`, 'blue')
      log(`- Status: ${data.stripe.status}`, 'blue')
      log(`- Customer: ${data.stripe.customer}`, 'blue')
      log(`- Current Period Start: ${data.stripe.current_period_start}`, 'blue')
      log(`- Current Period End: ${data.stripe.current_period_end}`, 'blue')

      log('\n📊 DADOS DO BANCO:', 'blue')
      log(`- ID: ${data.database.id}`, 'blue')
      log(`- Status: ${data.database.status}`, 'blue')
      log(`- Plan Type: ${data.database.plan_type}`, 'blue')
      log(`- Current Period Start: ${data.database.current_period_start}`, 'blue')
      log(`- Current Period End: ${data.database.current_period_end}`, 'blue')
      log(`- Explicação Prática: ${data.database.explicacao_pratica}`, 'blue')

      return true
    } else {
      log(`❌ Erro ao criar assinatura: ${response.data.error}`, 'red')
      if (response.data.details) {
        log(`Detalhes: ${response.data.details}`, 'red')
      }
      return false
    }
  } catch (error) {
    log(`❌ Erro na requisição: ${error.message}`, 'red')
    return false
  }
}

async function testAllSubscriptions() {
  log('🚀 TESTANDO CRIAÇÃO DE ASSINATURAS', 'bold')
  log(`Base URL: ${BASE_URL}`, 'blue')
  log(`User ID: ${TEST_USER_ID}`, 'blue')

  const results = {
    monthlyNormal: false,
    yearlyNormal: false,
    monthlyPlus: false,
    yearlyPlus: false,
  }

  try {
    // Testar assinatura mensal normal
    results.monthlyNormal = await testCreateSubscription('monthly', false)

    // Testar assinatura anual normal
    results.yearlyNormal = await testCreateSubscription('yearly', false)

    // Testar assinatura mensal Plus
    results.monthlyPlus = await testCreateSubscription('monthly', true)

    // Testar assinatura anual Plus
    results.yearlyPlus = await testCreateSubscription('yearly', true)

    // Resumo
    log('\n🎯 RESUMO DOS TESTES:', 'bold')
    log(
      `Mensal Normal: ${results.monthlyNormal ? '✅' : '❌'}`,
      results.monthlyNormal ? 'green' : 'red'
    )
    log(
      `Anual Normal: ${results.yearlyNormal ? '✅' : '❌'}`,
      results.yearlyNormal ? 'green' : 'red'
    )
    log(`Mensal Plus: ${results.monthlyPlus ? '✅' : '❌'}`, results.monthlyPlus ? 'green' : 'red')
    log(`Anual Plus: ${results.yearlyPlus ? '✅' : '❌'}`, results.yearlyPlus ? 'green' : 'red')

    const allWorking = Object.values(results).every(result => result)

    if (allWorking) {
      log('\n🎉 TODAS AS ASSINATURAS FORAM CRIADAS!', 'green')
      log('A integração está funcionando perfeitamente.', 'green')
    } else {
      log('\n⚠️ ALGUMAS ASSINATURAS FALHARAM', 'yellow')
      log('Verifique os erros acima para identificar o problema.', 'yellow')
    }
  } catch (error) {
    log(`\n💥 ERRO GERAL: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Executar testes
if (require.main === module) {
  testAllSubscriptions().catch(console.error)
}

module.exports = {
  testCreateSubscription,
  testAllSubscriptions,
}
