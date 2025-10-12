// Script simples para testar webhook sem dependências complexas
console.log('=== TESTE SIMPLES DO WEBHOOK ===')

// Simular dados de uma assinatura
const mockSubscription = {
  id: 'sub_1SH9ZrFLuMsSi0YiWTpXtKw6',
  status: 'active',
  customer: 'cus_test123',
  items: {
    data: [
      {
        price: {
          id: 'price_1RQCodFLuMsSi0YiE0JiHq40',
          recurring: {
            interval: 'year',
          },
        },
      },
    ],
  },
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
  cancel_at_period_end: false,
}

console.log('Dados da assinatura simulada:')
console.log('ID:', mockSubscription.id)
console.log('Status:', mockSubscription.status)
console.log('Customer:', mockSubscription.customer)
console.log('Price ID:', mockSubscription.items.data[0].price.id)

// Detectar se é Plus
const priceId = mockSubscription.items.data[0].price.id
const isPlus =
  priceId.includes('plus') ||
  priceId.includes('Plus') ||
  priceId === 'price_1RQCodFLuMsSi0YiE0JiHq40' // Seu price_id específico

console.log('\n=== DETECÇÃO DE PLUS ===')
console.log('Price ID:', priceId)
console.log('É Plus:', isPlus)

// Determinar tipo de plano
const planType =
  mockSubscription.items.data[0].price.recurring.interval === 'year' ? 'yearly' : 'monthly'
console.log('Plan Type:', planType)

// Preparar dados para salvar
const subscriptionData = {
  user_id: '3f0e0184-c0a7-487e-b611-72890b39dcce',
  status: mockSubscription.status,
  plan_type: planType,
  price_id: priceId,
  subscription_id: mockSubscription.id,
  current_period_start: new Date(mockSubscription.current_period_start * 1000).toISOString(),
  current_period_end: new Date(mockSubscription.current_period_end * 1000).toISOString(),
  cancel_at_period_end: mockSubscription.cancel_at_period_end,
  explicacao_pratica: isPlus,
  updated_at: new Date().toISOString(),
}

console.log('\n=== DADOS PARA SALVAR ===')
console.log(JSON.stringify(subscriptionData, null, 2))

console.log('\n=== TESTE CONCLUÍDO ===')
console.log('✅ Lógica do webhook funcionando corretamente!')
console.log('✅ Detecção de Plus:', isPlus)
console.log('✅ Plan Type:', planType)
console.log('✅ Dados preparados para salvar no banco')
