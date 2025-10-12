#!/usr/bin/env node

/**
 * Script para corrigir assinatura específica
 * Execute: node scripts/test-fix-subscription.js SUBSCRIPTION_ID
 */

const https = require('https')
const http = require('http')

// Configuração
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const SUBSCRIPTION_ID = process.argv[2] || 'sub_1SHAHWFLuMsSi0YiAyJp6KZH'

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

async function fixSubscription() {
  log('🔧 CORRIGINDO ASSINATURA COM DATAS E STATUS', 'bold')
  log(`Subscription ID: ${SUBSCRIPTION_ID}`, 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/test-complete-subscription`, {
      body: {
        subscriptionId: SUBSCRIPTION_ID,
      },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Assinatura corrigida com sucesso!', 'green')

      const data = response.data.data

      log('\n📊 DADOS DO STRIPE:', 'blue')
      log(`- ID: ${data.stripe.id}`, 'blue')
      log(`- Status: ${data.stripe.status}`, 'blue')
      log(`- Current Period Start: ${data.stripe.current_period_start}`, 'blue')
      log(`- Current Period End: ${data.stripe.current_period_end}`, 'blue')

      log('\n📊 DADOS DO BANCO:', 'blue')
      log(`- ID: ${data.database.id}`, 'blue')
      log(`- Status: ${data.database.status}`, 'blue')
      log(`- Current Period Start: ${data.database.current_period_start}`, 'blue')
      log(`- Current Period End: ${data.database.current_period_end}`, 'blue')
      log(`- Explicação Prática: ${data.database.explicacao_pratica}`, 'blue')

      log('\n✅ VERIFICAÇÃO:', 'blue')
      log(
        `- Datas Corretas: ${data.verification.datesCorrect}`,
        data.verification.datesCorrect ? 'green' : 'red'
      )
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

      if (data.verification.datesCorrect && data.verification.statusActive) {
        log('\n🎉 PROBLEMA RESOLVIDO!', 'green')
        log('A assinatura agora tem:', 'green')
        log('✅ Status: active', 'green')
        log('✅ Datas preenchidas', 'green')
        log('✅ Sincronização funcionando', 'green')
      } else {
        log('\n⚠️ AINDA HÁ PROBLEMAS', 'yellow')
        log('Verifique os dados acima para identificar o que ainda está incorreto.', 'yellow')
      }
    } else {
      log(`❌ Erro ao corrigir assinatura: ${response.data.error}`, 'red')
      if (response.data.details) {
        log(`Detalhes: ${response.data.details}`, 'red')
      }
    }
  } catch (error) {
    log(`❌ Erro na requisição: ${error.message}`, 'red')
  }
}

// Executar correção
if (require.main === module) {
  fixSubscription()
}

module.exports = { fixSubscription }
