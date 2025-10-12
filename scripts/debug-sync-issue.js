#!/usr/bin/env node

/**
 * Script para debugar problemas de sincronização
 * Execute: node scripts/debug-sync-issue.js
 */

const https = require('https')
const http = require('http')

// Configuração
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const TEST_USER_ID = '3f0e0184-c0a7-487e-b611-72890b39dcce'
const TEST_SUBSCRIPTION_ID = 'sub_1SH9diFLuMsSi0Yi7JfAzxZV'

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

async function testCurrentSubscriptionData() {
  log('\n=== VERIFICANDO DADOS ATUAIS DA ASSINATURA ===', 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/subscription/debug`, {
      body: { userId: TEST_USER_ID },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Debug da assinatura: SUCESSO', 'green')

      const data = response.data.data

      if (data.database) {
        log('\n📊 DADOS ATUAIS NO BANCO:', 'blue')
        log(`- ID: ${data.database.id}`, 'blue')
        log(`- Status: ${data.database.status}`, 'blue')
        log(`- Plan Type: ${data.database.plan_type}`, 'blue')
        log(`- Price ID: ${data.database.price_id}`, 'blue')
        log(`- Subscription ID: ${data.database.subscription_id}`, 'blue')
        log(`- Current Period Start: ${data.database.current_period_start}`, 'blue')
        log(`- Current Period End: ${data.database.current_period_end}`, 'blue')
        log(`- Cancel At Period End: ${data.database.cancel_at_period_end}`, 'blue')
        log(`- Explicação Prática: ${data.database.explicacao_pratica}`, 'blue')
        log(`- Created At: ${data.database.created_at}`, 'blue')
        log(`- Updated At: ${data.database.updated_at}`, 'blue')

        // Verificar se as datas estão null
        if (!data.database.current_period_start || !data.database.current_period_end) {
          log('\n⚠️  PROBLEMA: Datas estão NULL no banco!', 'yellow')
          log(`- Current Period Start: ${data.database.current_period_start}`, 'red')
          log(`- Current Period End: ${data.database.current_period_end}`, 'red')
        } else {
          log('\n✅ Datas estão preenchidas no banco', 'green')
        }
      } else {
        log('❌ Nenhuma assinatura encontrada no banco', 'red')
      }

      if (data.stripe) {
        log('\n💳 DADOS NO STRIPE:', 'blue')
        log(`- ID: ${data.stripe.id}`, 'blue')
        log(`- Status: ${data.stripe.status}`, 'blue')
        log(`- Customer: ${data.stripe.customer}`, 'blue')
        log(`- Current Period Start: ${data.stripe.current_period_start}`, 'blue')
        log(`- Current Period End: ${data.stripe.current_period_end}`, 'blue')
        log(`- Cancel At Period End: ${data.stripe.cancel_at_period_end}`, 'blue')
        log(`- Canceled At: ${data.stripe.canceled_at}`, 'blue')
        log(`- Created: ${data.stripe.created}`, 'blue')
        log(`- Price ID: ${data.stripe.price_id}`, 'blue')
        log(`- Is Plus: ${data.stripe.is_plus}`, 'blue')

        // Verificar se o Stripe tem as datas
        if (data.stripe.current_period_start && data.stripe.current_period_end) {
          log('\n✅ Stripe tem as datas corretas', 'green')

          // Converter timestamps para ISO
          const startDate = new Date(data.stripe.current_period_start * 1000).toISOString()
          const endDate = new Date(data.stripe.current_period_end * 1000).toISOString()

          log(`- Start Date (converted): ${startDate}`, 'blue')
          log(`- End Date (converted): ${endDate}`, 'blue')
        } else {
          log('\n⚠️  PROBLEMA: Stripe não tem as datas!', 'yellow')
        }
      } else {
        log('❌ Nenhuma assinatura encontrada no Stripe', 'red')
      }

      if (data.differences && data.differences.length > 0) {
        log('\n⚠️  DIFERENÇAS ENCONTRADAS:', 'yellow')
        data.differences.forEach(diff => {
          log(`- ${diff.field}:`, 'yellow')
          log(`  Banco: ${diff.database}`, 'red')
          log(`  Stripe: ${diff.stripe}`, 'green')
        })
      } else {
        log('\n✅ Dados sincronizados!', 'green')
      }

      return data
    } else {
      log(`❌ Debug da assinatura: FALHOU - ${response.data.error}`, 'red')
      return null
    }
  } catch (error) {
    log(`❌ Debug da assinatura: ERRO - ${error.message}`, 'red')
    return null
  }
}

async function testForcedSync() {
  log('\n=== TESTANDO SINCRONIZAÇÃO FORÇADA ===', 'blue')

  try {
    log('Tentando sincronizar assinatura...', 'yellow')

    const response = await makeRequest(`${BASE_URL}/api/subscription/sync`, {
      body: { userId: TEST_USER_ID },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Sincronização: SUCESSO', 'green')

      const data = response.data.data
      log('\n📊 DADOS SINCRONIZADOS:', 'blue')
      log(`- Status: ${data.status}`, 'blue')
      log(`- Plan Type: ${data.plan_type}`, 'blue')
      log(`- Current Period Start: ${data.current_period_start}`, 'blue')
      log(`- Current Period End: ${data.current_period_end}`, 'blue')
      log(`- Cancel At Period End: ${data.cancel_at_period_end}`, 'blue')
      log(`- Explicação Prática: ${data.explicacao_pratica}`, 'blue')
      log(`- Updated At: ${data.updated_at}`, 'blue')

      // Verificar se as datas foram sincronizadas
      if (data.current_period_start && data.current_period_end) {
        log('\n✅ Datas foram sincronizadas com sucesso!', 'green')
      } else {
        log('\n❌ PROBLEMA: Datas ainda estão NULL após sincronização!', 'red')
      }

      return true
    } else {
      log(`❌ Sincronização: FALHOU - ${response.data.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Sincronização: ERRO - ${error.message}`, 'red')
    return false
  }
}

async function testWebhookSimulation() {
  log('\n=== SIMULANDO WEBHOOK ===', 'blue')

  try {
    // Simular evento de webhook
    const webhookEvent = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: TEST_SUBSCRIPTION_ID,
          status: 'active',
          customer: 'cus_test',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 ano
          cancel_at_period_end: false,
          items: {
            data: [
              {
                price: {
                  id: 'price_1RQCoOFLuMsSi0YiBmCrrM1r',
                },
              },
            ],
          },
        },
      },
    }

    log('Evento simulado:', JSON.stringify(webhookEvent, null, 2), 'blue')

    // Aqui você testaria o webhook se tivesse um endpoint de teste
    log('⚠️  Para testar webhook, use o Stripe CLI:', 'yellow')
    log('stripe listen --forward-to localhost:3000/api/webhooks/stripe', 'blue')

    return true
  } catch (error) {
    log(`❌ Simulação de webhook: ERRO - ${error.message}`, 'red')
    return false
  }
}

async function runAllTests() {
  log('🚀 DEBUGANDO PROBLEMAS DE SINCRONIZAÇÃO', 'bold')
  log(`Base URL: ${BASE_URL}`, 'blue')
  log(`User ID: ${TEST_USER_ID}`, 'blue')
  log(`Subscription ID: ${TEST_SUBSCRIPTION_ID}`, 'blue')

  try {
    // 1. Verificar dados atuais
    const currentData = await testCurrentSubscriptionData()

    if (!currentData) {
      log('\n❌ Não foi possível obter dados da assinatura', 'red')
      return
    }

    // 2. Testar sincronização forçada
    const syncResult = await testForcedSync()

    if (syncResult) {
      log('\n✅ Sincronização forçada funcionou', 'green')
    } else {
      log('\n❌ Sincronização forçada falhou', 'red')
    }

    // 3. Simular webhook
    await testWebhookSimulation()

    log('\n🎉 DEBUG CONCLUÍDO', 'green')
    log('\nPróximos passos:', 'yellow')
    log('1. Verificar logs do servidor durante sincronização', 'blue')
    log('2. Testar webhook com Stripe CLI', 'blue')
    log('3. Verificar se as datas estão sendo convertidas corretamente', 'blue')
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
  testCurrentSubscriptionData,
  testForcedSync,
  testWebhookSimulation,
  runAllTests,
}
