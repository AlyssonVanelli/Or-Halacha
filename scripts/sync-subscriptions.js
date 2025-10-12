#!/usr/bin/env node

/**
 * Script para sincronizar assinaturas com o Stripe
 *
 * Este script:
 * 1. Busca todas as assinaturas ativas no banco
 * 2. Verifica o status real no Stripe
 * 3. Atualiza o banco se necessário
 */

const https = require('https')
const http = require('http')

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http

    const req = protocol.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      },
      res => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data)
            resolve({ status: res.statusCode, data: jsonData })
          } catch (e) {
            resolve({ status: res.statusCode, data: data })
          }
        })
      }
    )

    req.on('error', reject)

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

async function syncAllSubscriptions() {
  console.log('🔄 Sincronizando todas as assinaturas...')

  try {
    const response = await makeRequest(`${BASE_URL}/api/force-sync-all-subscriptions`, {
      method: 'POST',
    })

    if (response.status === 200 && response.data && response.data.success) {
      console.log('✅ Sincronização concluída com sucesso')
      if (response.data.summary) {
        console.log(
          `📊 Resumo: ${response.data.summary.success} sucessos, ${response.data.summary.errors} erros`
        )
      }

      if (response.data.results && response.data.results.length > 0) {
        console.log('\n📋 Detalhes dos resultados:')
        response.data.results.forEach((result, index) => {
          const status = result.success ? '✅' : '❌'
          console.log(`  ${index + 1}. ${status} Usuário: ${result.userId}`)
          if (result.changes) {
            console.log(`     Mudança: ${result.changes.oldStatus} → ${result.changes.newStatus}`)
          }
          if (result.error) {
            console.log(`     Erro: ${result.error}`)
          }
        })
      }

      return true
    } else {
      console.log('❌ Erro na sincronização:', response.data)
      return false
    }
  } catch (error) {
    console.log('❌ Erro ao executar sincronização:', error.message)
    return false
  }
}

async function checkCurrentSubscriptions() {
  console.log('🔍 Verificando assinaturas atuais...')

  try {
    const response = await makeRequest(`${BASE_URL}/api/check-subscriptions`)

    if (response.status === 200 && response.data.success) {
      const data = response.data.data
      console.log(`📊 Assinaturas encontradas: ${data.totalSubscriptions}`)
      console.log(`📊 Perfis com Stripe ID: ${data.totalProfilesWithStripeId}`)

      if (data.subscriptions.length > 0) {
        console.log('\n📋 Assinaturas ativas:')
        data.subscriptions.forEach((sub, index) => {
          console.log(
            `  ${index + 1}. Status: ${sub.status} | Plano: ${sub.plan_type} | Usuário: ${sub.user_id}`
          )
        })
      }

      return true
    } else {
      console.log('❌ Erro ao verificar assinaturas:', response.data)
      return false
    }
  } catch (error) {
    console.log('❌ Erro ao verificar assinaturas:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando sincronização de assinaturas...\n')

  // 1. Verificar estado atual
  console.log('--- Estado Atual ---')
  const checkSuccess = await checkCurrentSubscriptions()

  if (!checkSuccess) {
    console.log('❌ Não foi possível verificar o estado atual')
    return
  }

  console.log('\n--- Sincronizando com Stripe ---')
  const syncSuccess = await syncAllSubscriptions()

  if (syncSuccess) {
    console.log('\n--- Estado Após Sincronização ---')
    await checkCurrentSubscriptions()

    console.log('\n🎉 Sincronização concluída com sucesso!')
    console.log('\n💡 Próximos passos:')
    console.log('1. Verifique se as assinaturas canceladas no Stripe foram atualizadas')
    console.log('2. Teste o acesso aos livros para confirmar que está funcionando')
    console.log('3. Configure o webhook do Stripe para evitar problemas futuros')
  } else {
    console.log('\n⚠️  Sincronização falhou. Verifique os logs acima para mais detalhes.')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { main }
