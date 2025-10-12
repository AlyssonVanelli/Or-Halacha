#!/usr/bin/env node

/**
 * Script completo para testar fluxo de assinatura
 * Execute: node scripts/test-complete-subscription-flow.js
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

async function createAndActivateSubscription(planType, isPlus) {
  log(`\n=== FLUXO COMPLETO: ${planType.toUpperCase()} ${isPlus ? 'PLUS' : 'NORMAL'} ===`, 'blue')

  try {
    // 1. Criar assinatura
    log('1. Criando assinatura...', 'yellow')
    const createResponse = await makeRequest(`${BASE_URL}/api/test-create-subscription`, {
      body: {
        userId: TEST_USER_ID,
        planType: planType,
        isPlus: isPlus,
      },
    })

    if (!createResponse.data.success) {
      log(`❌ Erro ao criar assinatura: ${createResponse.data.error}`, 'red')
      return false
    }

    const subscriptionId = createResponse.data.data.stripe.id
    log(`✅ Assinatura criada: ${subscriptionId}`, 'green')
    log(`Status inicial: ${createResponse.data.data.stripe.status}`, 'blue')

    // 2. Ativar assinatura
    log('2. Ativando assinatura...', 'yellow')
    const activateResponse = await makeRequest(`${BASE_URL}/api/test-activate-subscription`, {
      body: {
        subscriptionId: subscriptionId,
      },
    })

    if (!activateResponse.data.success) {
      log(`❌ Erro ao ativar assinatura: ${activateResponse.data.error}`, 'red')
      return false
    }

    log(`✅ Assinatura ativada: ${subscriptionId}`, 'green')

    // 3. Verificar dados finais
    const finalData = activateResponse.data.data
    log('\n📊 DADOS FINAIS:', 'blue')
    log(`Stripe Status: ${finalData.stripe.status}`, 'blue')
    log(`Stripe Start: ${finalData.stripe.current_period_start}`, 'blue')
    log(`Stripe End: ${finalData.stripe.current_period_end}`, 'blue')
    log(`Banco Status: ${finalData.database.status}`, 'blue')
    log(`Banco Start: ${finalData.database.current_period_start}`, 'blue')
    log(`Banco End: ${finalData.database.current_period_end}`, 'blue')
    log(`Explicação Prática: ${finalData.database.explicacao_pratica}`, 'blue')

    // 4. Verificar se está tudo correto
    const isCorrect =
      finalData.stripe.status === 'active' &&
      finalData.database.status === 'active' &&
      finalData.database.current_period_start !== null &&
      finalData.database.current_period_end !== null

    if (isCorrect) {
      log('✅ FLUXO COMPLETO FUNCIONOU!', 'green')
      return true
    } else {
      log('❌ FLUXO INCOMPLETO - DADOS INCORRETOS', 'red')
      return false
    }
  } catch (error) {
    log(`❌ Erro no fluxo: ${error.message}`, 'red')
    return false
  }
}

async function runCompleteTest() {
  log('🚀 TESTE COMPLETO DO FLUXO DE ASSINATURA', 'bold')
  log(`Base URL: ${BASE_URL}`, 'blue')
  log('Este teste vai:', 'yellow')
  log('1. Criar assinatura no Stripe', 'yellow')
  log('2. Salvar no banco de dados', 'yellow')
  log('3. Ativar a assinatura', 'yellow')
  log('4. Sincronizar dados atualizados', 'yellow')
  log('5. Verificar se tudo está correto', 'yellow')

  const results = {
    monthlyNormal: false,
    yearlyNormal: false,
    monthlyPlus: false,
    yearlyPlus: false,
  }

  try {
    // Testar todos os tipos
    results.monthlyNormal = await createAndActivateSubscription('monthly', false)
    results.yearlyNormal = await createAndActivateSubscription('yearly', false)
    results.monthlyPlus = await createAndActivateSubscription('monthly', true)
    results.yearlyPlus = await createAndActivateSubscription('yearly', true)

    // Resumo final
    log('\n🎯 RESUMO FINAL:', 'bold')
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
      log('\n🎉 TODOS OS FLUXOS FUNCIONARAM PERFEITAMENTE!', 'green')
      log('A integração Stripe → Banco está 100% funcional!', 'green')
      log('\n✅ Problema resolvido!', 'green')
    } else {
      log('\n⚠️ ALGUNS FLUXOS FALHARAM', 'yellow')
      log('Verifique os erros acima para identificar problemas específicos.', 'yellow')
    }
  } catch (error) {
    log(`\n💥 ERRO GERAL: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Executar teste completo
if (require.main === module) {
  runCompleteTest().catch(console.error)
}

module.exports = {
  createAndActivateSubscription,
  runCompleteTest,
}
