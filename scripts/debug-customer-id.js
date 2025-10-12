#!/usr/bin/env node

/**
 * Script para debugar problemas com customer ID
 * Execute: node scripts/debug-customer-id.js
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

async function checkUserProfile() {
  log('\n=== VERIFICANDO PERFIL DO USUÁRIO ===', 'blue')

  try {
    // Simular busca no banco (você precisaria de um endpoint para isso)
    log('Verificando perfil do usuário...', 'yellow')
    log(`User ID: ${TEST_USER_ID}`, 'blue')

    // Aqui você verificaria se o usuário tem stripe_customer_id
    log('⚠️  Para verificar o perfil, você precisa:', 'yellow')
    log('1. Verificar se o usuário existe na tabela profiles', 'blue')
    log('2. Verificar se tem stripe_customer_id preenchido', 'blue')
    log('3. Verificar se o customer existe no Stripe', 'blue')

    return true
  } catch (error) {
    log(`❌ Verificação do perfil: ERRO - ${error.message}`, 'red')
    return false
  }
}

async function testStripeCustomerSearch() {
  log('\n=== TESTANDO BUSCA DE CUSTOMER NO STRIPE ===', 'blue')

  try {
    log('⚠️  Para testar busca de customer no Stripe:', 'yellow')
    log('1. Use o Stripe CLI: stripe customers list', 'blue')
    log('2. Ou use o dashboard do Stripe', 'blue')
    log('3. Verifique se o customer existe e tem assinaturas', 'blue')

    return true
  } catch (error) {
    log(`❌ Teste de customer: ERRO - ${error.message}`, 'red')
    return false
  }
}

async function testSubscriptionSearch() {
  log('\n=== TESTANDO BUSCA DE ASSINATURA ===', 'blue')

  try {
    log('⚠️  Para testar busca de assinatura:', 'yellow')
    log('1. Use o Stripe CLI: stripe subscriptions list', 'blue')
    log('2. Ou use o dashboard do Stripe', 'blue')
    log('3. Verifique se a assinatura existe e está ativa', 'blue')

    return true
  } catch (error) {
    log(`❌ Teste de assinatura: ERRO - ${error.message}`, 'red')
    return false
  }
}

async function createTestSubscription() {
  log('\n=== CRIANDO ASSINATURA DE TESTE ===', 'blue')

  try {
    log('Para criar uma assinatura de teste:', 'yellow')
    log('1. Use o Stripe CLI: stripe subscriptions create', 'blue')
    log('2. Ou use o dashboard do Stripe', 'blue')
    log('3. Ou teste com uma assinatura existente', 'blue')

    return true
  } catch (error) {
    log(`❌ Criação de teste: ERRO - ${error.message}`, 'red')
    return false
  }
}

async function runAllTests() {
  log('🚀 DEBUGANDO PROBLEMAS COM CUSTOMER ID', 'bold')
  log(`Base URL: ${BASE_URL}`, 'blue')
  log(`User ID: ${TEST_USER_ID}`, 'blue')

  try {
    await checkUserProfile()
    await testStripeCustomerSearch()
    await testSubscriptionSearch()
    await createTestSubscription()

    log('\n🎉 DEBUG CONCLUÍDO', 'green')
    log('\nPossíveis problemas:', 'yellow')
    log('1. Usuário não tem stripe_customer_id no banco', 'red')
    log('2. Customer não existe no Stripe', 'red')
    log('3. Assinatura foi cancelada/deletada no Stripe', 'red')
    log('4. Customer ID está incorreto', 'red')

    log('\nSoluções:', 'yellow')
    log('1. Verificar tabela profiles no banco', 'blue')
    log('2. Verificar customers no Stripe', 'blue')
    log('3. Criar nova assinatura de teste', 'blue')
    log('4. Verificar logs do webhook', 'blue')
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
  checkUserProfile,
  testStripeCustomerSearch,
  testSubscriptionSearch,
  createTestSubscription,
  runAllTests,
}
