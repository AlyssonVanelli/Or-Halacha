const { createClient } = require('@supabase/supabase-js')

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDuplicateSubscriptions() {
  console.log('=== CORRIGINDO ASSINATURAS DUPLICADAS ===')

  try {
    // 1. Buscar todas as assinaturas
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('ERRO ao buscar assinaturas:', fetchError)
      return
    }

    console.log(`Encontradas ${subscriptions.length} assinaturas`)

    // 2. Agrupar por subscription_id
    const groupedBySubscriptionId = {}
    const groupedByUserId = {}

    subscriptions.forEach(sub => {
      // Agrupar por subscription_id
      if (sub.subscription_id) {
        if (!groupedBySubscriptionId[sub.subscription_id]) {
          groupedBySubscriptionId[sub.subscription_id] = []
        }
        groupedBySubscriptionId[sub.subscription_id].push(sub)
      }

      // Agrupar por user_id
      if (!groupedByUserId[sub.user_id]) {
        groupedByUserId[sub.user_id] = []
      }
      groupedByUserId[sub.user_id].push(sub)
    })

    console.log('\n=== ANÁLISE DE DUPLICATAS ===')

    // 3. Verificar duplicatas por subscription_id
    const duplicateSubscriptionIds = Object.keys(groupedBySubscriptionId).filter(
      id => groupedBySubscriptionId[id].length > 1
    )

    if (duplicateSubscriptionIds.length > 0) {
      console.log(`\nDUPLICATAS POR SUBSCRIPTION_ID: ${duplicateSubscriptionIds.length}`)
      duplicateSubscriptionIds.forEach(id => {
        console.log(`\nSubscription ID: ${id}`)
        groupedBySubscriptionId[id].forEach((sub, index) => {
          console.log(
            `  ${index + 1}. User: ${sub.user_id}, Status: ${sub.status}, Created: ${sub.created_at}`
          )
        })
      })
    }

    // 4. Verificar duplicatas por user_id
    const duplicateUserIds = Object.keys(groupedByUserId).filter(
      id => groupedByUserId[id].length > 1
    )

    if (duplicateUserIds.length > 0) {
      console.log(`\nDUPLICATAS POR USER_ID: ${duplicateUserIds.length}`)
      duplicateUserIds.forEach(id => {
        console.log(`\nUser ID: ${id}`)
        groupedByUserId[id].forEach((sub, index) => {
          console.log(
            `  ${index + 1}. Subscription: ${sub.subscription_id}, Status: ${sub.status}, Created: ${sub.created_at}`
          )
        })
      })
    }

    // 5. Limpar duplicatas por subscription_id
    console.log('\n=== LIMPANDO DUPLICATAS POR SUBSCRIPTION_ID ===')
    for (const subscriptionId of duplicateSubscriptionIds) {
      const subs = groupedBySubscriptionId[subscriptionId]
      // Manter apenas a mais recente
      const toKeep = subs[0] // Já ordenado por created_at desc
      const toDelete = subs.slice(1)

      console.log(`\nMantendo: ${toKeep.id} (User: ${toKeep.user_id})`)

      for (const sub of toDelete) {
        console.log(`Deletando: ${sub.id} (User: ${sub.user_id})`)
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .delete()
          .eq('id', sub.id)

        if (deleteError) {
          console.error(`ERRO ao deletar ${sub.id}:`, deleteError)
        } else {
          console.log(`✅ Deletado: ${sub.id}`)
        }
      }
    }

    // 6. Limpar duplicatas por user_id (manter apenas a mais recente ativa)
    console.log('\n=== LIMPANDO DUPLICATAS POR USER_ID ===')
    for (const userId of duplicateUserIds) {
      const subs = groupedByUserId[userId]

      // Ordenar por status (active primeiro) e depois por created_at
      const statusOrder = {
        active: 0,
        trialing: 1,
        past_due: 2,
        unpaid: 3,
        canceled: 4,
        incomplete: 5,
        incomplete_expired: 6,
      }
      subs.sort((a, b) => {
        const statusA = statusOrder[a.status] ?? 999
        const statusB = statusOrder[b.status] ?? 999
        if (statusA !== statusB) return statusA - statusB
        return new Date(b.created_at) - new Date(a.created_at)
      })

      const toKeep = subs[0]
      const toDelete = subs.slice(1)

      console.log(`\nUser: ${userId}`)
      console.log(
        `Mantendo: ${toKeep.id} (Status: ${toKeep.status}, Subscription: ${toKeep.subscription_id})`
      )

      for (const sub of toDelete) {
        console.log(
          `Deletando: ${sub.id} (Status: ${sub.status}, Subscription: ${sub.subscription_id})`
        )
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .delete()
          .eq('id', sub.id)

        if (deleteError) {
          console.error(`ERRO ao deletar ${sub.id}:`, deleteError)
        } else {
          console.log(`✅ Deletado: ${sub.id}`)
        }
      }
    }

    console.log('\n=== LIMPEZA CONCLUÍDA ===')

    // 7. Verificar resultado final
    const { data: finalSubs, error: finalError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (finalError) {
      console.error('ERRO ao verificar resultado:', finalError)
      return
    }

    console.log(`\nAssinaturas restantes: ${finalSubs.length}`)

    // Verificar se ainda há duplicatas
    const finalGroupedByUserId = {}
    finalSubs.forEach(sub => {
      if (!finalGroupedByUserId[sub.user_id]) {
        finalGroupedByUserId[sub.user_id] = []
      }
      finalGroupedByUserId[sub.user_id].push(sub)
    })

    const remainingDuplicates = Object.keys(finalGroupedByUserId).filter(
      id => finalGroupedByUserId[id].length > 1
    )

    if (remainingDuplicates.length > 0) {
      console.log(`\n⚠️ AINDA HÁ DUPLICATAS: ${remainingDuplicates.length}`)
      remainingDuplicates.forEach(id => {
        console.log(`User ${id}: ${finalGroupedByUserId[id].length} assinaturas`)
      })
    } else {
      console.log('\n✅ NENHUMA DUPLICATA RESTANTE!')
    }
  } catch (error) {
    console.error('ERRO geral:', error)
  }
}

// Executar
fixDuplicateSubscriptions()
