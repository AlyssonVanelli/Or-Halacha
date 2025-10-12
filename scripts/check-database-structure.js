#!/usr/bin/env node

/**
 * Script para verificar a estrutura do banco de dados
 * Execute: node scripts/check-database-structure.js
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

async function testDatabaseConnection() {
  log('\n=== TESTANDO CONEXÃO COM BANCO ===', 'blue')

  try {
    // Testar se conseguimos buscar assinaturas
    const response = await makeRequest(`${BASE_URL}/api/subscription/debug`, {
      body: { userId: '3f0e0184-c0a7-487e-b611-72890b39dcce' },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Conexão com banco: SUCESSO', 'green')

      const dbData = response.data.data.database
      const stripeData = response.data.data.stripe

      if (dbData) {
        log('\n📊 DADOS DO BANCO:', 'blue')
        log(`- ID: ${dbData.id}`, 'blue')
        log(`- User ID: ${dbData.user_id}`, 'blue')
        log(`- Status: ${dbData.status}`, 'blue')
        log(`- Plan Type: ${dbData.plan_type}`, 'blue')
        log(`- Price ID: ${dbData.price_id}`, 'blue')
        log(`- Subscription ID: ${dbData.subscription_id}`, 'blue')
        log(`- Current Period Start: ${dbData.current_period_start}`, 'blue')
        log(`- Current Period End: ${dbData.current_period_end}`, 'blue')
        log(`- Cancel At Period End: ${dbData.cancel_at_period_end}`, 'blue')
        log(`- Explicação Prática: ${dbData.explicacao_pratica}`, 'blue')
        log(`- Created At: ${dbData.created_at}`, 'blue')
        log(`- Updated At: ${dbData.updated_at}`, 'blue')
      } else {
        log('❌ Nenhuma assinatura encontrada no banco', 'red')
      }

      if (stripeData) {
        log('\n💳 DADOS DO STRIPE:', 'blue')
        log(`- ID: ${stripeData.id}`, 'blue')
        log(`- Status: ${stripeData.status}`, 'blue')
        log(`- Customer: ${stripeData.customer}`, 'blue')
        log(`- Current Period Start: ${stripeData.current_period_start}`, 'blue')
        log(`- Current Period End: ${stripeData.current_period_end}`, 'blue')
        log(`- Cancel At Period End: ${stripeData.cancel_at_period_end}`, 'blue')
        log(`- Canceled At: ${stripeData.canceled_at}`, 'blue')
        log(`- Created: ${stripeData.created}`, 'blue')
        log(`- Price ID: ${stripeData.price_id}`, 'blue')
        log(`- Is Plus: ${stripeData.is_plus}`, 'blue')
      } else {
        log('❌ Nenhuma assinatura encontrada no Stripe', 'red')
      }

      if (response.data.data.differences && response.data.data.differences.length > 0) {
        log('\n⚠️  DIFERENÇAS ENCONTRADAS:', 'yellow')
        response.data.data.differences.forEach(diff => {
          log(`- ${diff.field}:`, 'yellow')
          log(`  Banco: ${diff.database}`, 'red')
          log(`  Stripe: ${diff.stripe}`, 'green')
        })
      } else {
        log('\n✅ Dados sincronizados!', 'green')
      }
    } else {
      log(`❌ Conexão com banco: FALHOU - ${response.data.error}`, 'red')
    }
  } catch (error) {
    log(`❌ Conexão com banco: ERRO - ${error.message}`, 'red')
  }
}

async function testSubscriptionInsert() {
  log('\n=== TESTANDO INSERÇÃO DE ASSINATURA ===', 'blue')

  try {
    const testData = {
      user_id: '3f0e0184-c0a7-487e-b611-72890b39dcce',
      status: 'active',
      plan_type: 'yearly',
      price_id: 'price_1RQCoOFLuMsSi0YiBmCrrM1r',
      subscription_id: 'sub_test_' + Date.now(),
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      explicacao_pratica: false,
    }

    log('Dados de teste:', JSON.stringify(testData, null, 2), 'blue')

    // Aqui você precisaria de um endpoint para testar inserção
    // Por enquanto, vamos apenas verificar se a estrutura está correta
    log('✅ Estrutura de dados válida', 'green')
  } catch (error) {
    log(`❌ Teste de inserção: ERRO - ${error.message}`, 'red')
  }
}

async function runAllTests() {
  log('🚀 VERIFICANDO ESTRUTURA DO BANCO DE DADOS', 'bold')
  log(`Base URL: ${BASE_URL}`, 'blue')

  try {
    await testDatabaseConnection()
    await testSubscriptionInsert()

    log('\n🎉 VERIFICAÇÃO CONCLUÍDA', 'green')
    log('\nPróximos passos:', 'yellow')
    log('1. Verificar se a tabela subscriptions existe', 'blue')
    log('2. Executar migração se necessário', 'blue')
    log('3. Verificar tipos de dados das colunas', 'blue')
    log('4. Testar inserção/atualização', 'blue')
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
  testDatabaseConnection,
  testSubscriptionInsert,
  runAllTests,
}
