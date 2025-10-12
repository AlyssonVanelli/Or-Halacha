#!/usr/bin/env node

/**
 * Script para criar assinatura ativa diretamente no banco
 * Execute: node scripts/test-create-active.js
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

async function createActiveSubscription(planType, isPlus) {
  log(
    `\n=== CRIANDO ASSINATURA ATIVA: ${planType.toUpperCase()} ${isPlus ? 'PLUS' : 'NORMAL'} ===`,
    'blue'
  )

  try {
    const response = await makeRequest(`${BASE_URL}/api/test-create-active-subscription`, {
      body: {
        userId: TEST_USER_ID,
        planType: planType,
        isPlus: isPlus,
      },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Assinatura ativa criada com sucesso!', 'green')

      const data = response.data.data

      log('\n📊 DADOS SALVOS:', 'blue')
      log(`- ID: ${data.subscription.id}`, 'blue')
      log(`- Status: ${data.subscription.status}`, 'blue')
      log(`- Plan Type: ${data.subscription.plan_type}`, 'blue')
      log(`- Current Period Start: ${data.subscription.current_period_start}`, 'blue')
      log(`- Current Period End: ${data.subscription.current_period_end}`, 'blue')
      log(`- Explicação Prática: ${data.subscription.explicacao_pratica}`, 'blue')

      log('\n✅ VERIFICAÇÃO:', 'blue')
      log(
        `- Status Ativo: ${data.verification.statusActive}`,
        data.verification.statusActive ? 'green' : 'red'
      )
      log(
        `- Tem Data Início: ${data.verification.hasStartDate}`,
        data.verification.hasStartDate ? 'green' : 'red'
      )
      log(
        `- Tem Data Fim: ${data.verification.hasEndDate}`,
        data.verification.hasEndDate ? 'green' : 'red'
      )
      log(
        `- Plus Correto: ${data.verification.isPlusCorrect}`,
        data.verification.isPlusCorrect ? 'green' : 'red'
      )
      log(
        `- Tudo Correto: ${data.verification.allCorrect}`,
        data.verification.allCorrect ? 'green' : 'red'
      )

      if (data.verification.allCorrect) {
        log('\n🎉 PROBLEMA RESOLVIDO!', 'green')
        log('A assinatura foi criada com:', 'green')
        log('✅ Status: active', 'green')
        log('✅ Datas preenchidas', 'green')
        log('✅ Explicação Prática correta', 'green')
        log('✅ Salva diretamente no banco', 'green')
      } else {
        log('\n⚠️ AINDA HÁ PROBLEMAS', 'yellow')
        log('Verifique os dados acima para identificar o que ainda está incorreto.', 'yellow')
      }

      return data.verification.allCorrect
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

async function testAllActiveSubscriptions() {
  log('🚀 TESTANDO CRIAÇÃO DE ASSINATURAS ATIVAS', 'bold')
  log(`Base URL: ${BASE_URL}`, 'blue')
  log(`User ID: ${TEST_USER_ID}`, 'blue')
  log('Este teste cria assinaturas diretamente ativas no banco, sem Stripe.', 'yellow')

  const results = {
    monthlyNormal: false,
    yearlyNormal: false,
    monthlyPlus: false,
    yearlyPlus: false,
  }

  try {
    // Testar todos os tipos
    results.monthlyNormal = await createActiveSubscription('monthly', false)
    results.yearlyNormal = await createActiveSubscription('yearly', false)
    results.monthlyPlus = await createActiveSubscription('monthly', true)
    results.yearlyPlus = await createActiveSubscription('yearly', true)

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
      log('\n🎉 TODAS AS ASSINATURAS ATIVAS FORAM CRIADAS!', 'green')
      log('O problema das datas e status foi resolvido!', 'green')
      log('Agora você pode criar assinaturas diretamente no banco com dados corretos.', 'green')
    } else {
      log('\n⚠️ ALGUMAS ASSINATURAS FALHARAM', 'yellow')
      log('Verifique os erros acima para identificar problemas específicos.', 'yellow')
    }
  } catch (error) {
    log(`\n💥 ERRO GERAL: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Executar testes
if (require.main === module) {
  testAllActiveSubscriptions().catch(console.error)
}

module.exports = {
  createActiveSubscription,
  testAllActiveSubscriptions,
}
