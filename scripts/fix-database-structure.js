#!/usr/bin/env node

/**
 * Script para corrigir a estrutura do banco de dados
 * Execute: node scripts/fix-database-structure.js
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
      method: options.method || 'GET',
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

async function checkDatabaseStructure() {
  log('\n=== VERIFICANDO ESTRUTURA DO BANCO ===', 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/database/check-subscriptions-table`)

    if (response.status === 200 && response.data.success) {
      log('✅ Verificação da estrutura: SUCESSO', 'green')

      const data = response.data.data
      log(`\n📊 RESUMO:`, 'blue')
      log(`- Tabela existe: ${data.tableExists}`, 'blue')
      log(`- Total de colunas: ${data.summary.totalColumns}`, 'blue')
      log(`- Colunas esperadas: ${data.summary.expectedColumns}`, 'blue')
      log(`- Colunas faltando: ${data.summary.missingColumns}`, 'blue')
      log(`- Problemas de tipo: ${data.summary.typeIssues}`, 'blue')
      log(`- Total de assinaturas: ${data.summary.totalSubscriptions}`, 'blue')

      if (data.missingColumns.length > 0) {
        log('\n⚠️  COLUNAS FALTANDO:', 'yellow')
        data.missingColumns.forEach(col => {
          log(`- ${col}`, 'red')
        })
      }

      if (data.typeIssues.length > 0) {
        log('\n⚠️  PROBLEMAS DE TIPO:', 'yellow')
        data.typeIssues.forEach(issue => {
          log(`- ${issue.column}: esperado ${issue.expected}, atual ${issue.actual}`, 'red')
        })
      }

      if (data.subscriptions && data.subscriptions.length > 0) {
        log('\n📋 ASSINATURAS EXISTENTES:', 'blue')
        data.subscriptions.forEach(sub => {
          log(`- ID: ${sub.id}`, 'blue')
          log(`  Status: ${sub.status}`, 'blue')
          log(`  Plan Type: ${sub.plan_type}`, 'blue')
          log(`  Current Period Start: ${sub.current_period_start}`, 'blue')
          log(`  Current Period End: ${sub.current_period_end}`, 'blue')
          log(`  Explicação Prática: ${sub.explicacao_pratica}`, 'blue')
        })
      }

      return data
    } else {
      log(`❌ Verificação da estrutura: FALHOU - ${response.data.error}`, 'red')
      return null
    }
  } catch (error) {
    log(`❌ Verificação da estrutura: ERRO - ${error.message}`, 'red')
    return null
  }
}

async function fixDatabaseStructure() {
  log('\n=== CORRIGINDO ESTRUTURA DO BANCO ===', 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/database/fix-subscriptions-table`, {
      method: 'POST',
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Correção da estrutura: SUCESSO', 'green')

      const data = response.data.data
      log(`\n📊 RESULTADO:`, 'blue')
      log(`- Tabela criada: ${data.tableCreated}`, 'blue')
      log(`- Total de colunas: ${data.summary.totalColumns}`, 'blue')
      log(`- Tem explicacao_pratica: ${data.summary.hasExplicacaoPratica}`, 'blue')

      if (data.columns) {
        log('\n📋 COLUNAS DA TABELA:', 'blue')
        data.columns.forEach(col => {
          log(
            `- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`,
            'blue'
          )
        })
      }

      return true
    } else {
      log(`❌ Correção da estrutura: FALHOU - ${response.data.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Correção da estrutura: ERRO - ${error.message}`, 'red')
    return false
  }
}

async function testSubscriptionAfterFix() {
  log('\n=== TESTANDO ASSINATURA APÓS CORREÇÃO ===', 'blue')

  try {
    const response = await makeRequest(`${BASE_URL}/api/subscription/debug`, {
      method: 'POST',
      body: { userId: '3f0e0184-c0a7-487e-b611-72890b39dcce' },
    })

    if (response.status === 200 && response.data.success) {
      log('✅ Teste de assinatura: SUCESSO', 'green')

      const data = response.data.data
      if (data.database) {
        log('\n📊 DADOS DO BANCO APÓS CORREÇÃO:', 'blue')
        log(`- Status: ${data.database.status}`, 'blue')
        log(`- Current Period Start: ${data.database.current_period_start}`, 'blue')
        log(`- Current Period End: ${data.database.current_period_end}`, 'blue')
        log(`- Explicação Prática: ${data.database.explicacao_pratica}`, 'blue')
      }

      if (data.differences && data.differences.length > 0) {
        log('\n⚠️  AINDA HÁ DIFERENÇAS:', 'yellow')
        data.differences.forEach(diff => {
          log(`- ${diff.field}:`, 'yellow')
          log(`  Banco: ${diff.database}`, 'red')
          log(`  Stripe: ${diff.stripe}`, 'green')
        })
      } else {
        log('\n✅ Dados sincronizados!', 'green')
      }

      return true
    } else {
      log(`❌ Teste de assinatura: FALHOU - ${response.data.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Teste de assinatura: ERRO - ${error.message}`, 'red')
    return false
  }
}

async function runAllTests() {
  log('🚀 CORRIGINDO ESTRUTURA DO BANCO DE DADOS', 'bold')
  log(`Base URL: ${BASE_URL}`, 'blue')

  try {
    // 1. Verificar estrutura atual
    const structure = await checkDatabaseStructure()

    if (!structure) {
      log('\n❌ Não foi possível verificar a estrutura do banco', 'red')
      return
    }

    // 2. Corrigir estrutura se necessário
    if (structure.summary.missingColumns > 0 || structure.summary.typeIssues > 0) {
      log('\n🔧 Estrutura precisa ser corrigida...', 'yellow')
      const fixed = await fixDatabaseStructure()

      if (!fixed) {
        log('\n❌ Não foi possível corrigir a estrutura', 'red')
        return
      }
    } else {
      log('\n✅ Estrutura já está correta', 'green')
    }

    // 3. Testar assinatura após correção
    await testSubscriptionAfterFix()

    log('\n🎉 CORREÇÃO CONCLUÍDA', 'green')
    log('\nPróximos passos:', 'yellow')
    log('1. Teste uma sincronização de assinatura', 'blue')
    log('2. Verifique se as datas estão sendo salvas', 'blue')
    log('3. Teste cancelamento direto no Stripe', 'blue')
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
  checkDatabaseStructure,
  fixDatabaseStructure,
  testSubscriptionAfterFix,
  runAllTests,
}
