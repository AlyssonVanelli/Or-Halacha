# Correção de Problemas de Sincronização com Stripe

## 🚨 Problemas Identificados

### 1. **Datas não sincronizadas**

- `current_period_start` e `current_period_end` ficam `null` no banco
- Problema na conversão de timestamps do Stripe (Unix timestamp → ISO string)

### 2. **Status não atualizado**

- Cancelamento direto no Stripe não reflete no banco
- Webhook não processa corretamente eventos de cancelamento

### 3. **Detecção de Plus incorreta**

- Campo `explicacao_pratica` não é atualizado corretamente
- Lógica de detecção de preços Plus não funciona

## 🔧 Soluções Implementadas

### 1. **Webhook Robusto** (`app/api/webhooks/stripe/route.ts`)

```typescript
// Logs detalhados para debugging
console.log('Dados do Stripe:')
console.log('- Status:', stripeSubscription.status)
console.log('- Current Period Start:', stripeSubscription.current_period_start)
console.log('- Current Period End:', stripeSubscription.current_period_end)

// Conversão correta de timestamps
current_period_start: stripeSubscription.current_period_start
  ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
  : null,
current_period_end: stripeSubscription.current_period_end
  ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
  : null,
```

### 2. **SubscriptionService Melhorado** (`lib/services/subscription-service.ts`)

```typescript
// Logs detalhados da sincronização
console.log('=== SINCRONIZANDO ASSINATURA COM STRIPE ===')
console.log('Dados do Stripe:', {
  status: stripeSubscription.status,
  current_period_start: stripeSubscription.current_period_start,
  current_period_end: stripeSubscription.current_period_end,
  cancel_at_period_end: stripeSubscription.cancel_at_period_end,
})

// Validação de dados antes de salvar
console.log('Dados para sincronização:', subscriptionData)
```

### 3. **Endpoints de Debug e Sincronização**

#### Debug de Assinatura (`/api/subscription/debug`)

- Compara dados do banco vs Stripe
- Identifica diferenças específicas
- Mostra timestamps convertidos

#### Sincronização Forçada (`/api/subscription/sync`)

- Força sincronização de uma assinatura específica
- Atualiza todos os campos com dados do Stripe
- Logs detalhados do processo

#### Sincronização em Massa (`/api/subscription/sync-all`)

- Sincroniza todas as assinaturas do banco
- Relatório de sucessos e falhas
- Processamento em lote

### 4. **Scripts de Teste e Correção**

#### `scripts/test-subscription-sync.js`

```bash
# Testar sincronização específica
node scripts/test-subscription-sync.js
```

#### `scripts/fix-subscription-sync.js`

```bash
# Corrigir todas as assinaturas
node scripts/fix-subscription-sync.js
```

## 🧪 Como Testar

### 1. **Teste de Debug**

```bash
curl -X POST http://localhost:3000/api/subscription/debug \
  -H "Content-Type: application/json" \
  -d '{"userId": "3f0e0184-c0a7-487e-b611-72890b39dcce"}'
```

### 2. **Teste de Sincronização**

```bash
curl -X POST http://localhost:3000/api/subscription/sync \
  -H "Content-Type: application/json" \
  -d '{"userId": "3f0e0184-c0a7-487e-b611-72890b39dcce"}'
```

### 3. **Sincronização em Massa**

```bash
curl -X POST http://localhost:3000/api/subscription/sync-all
```

## 🔍 Debugging

### 1. **Verificar Logs do Webhook**

```bash
# Logs detalhados mostram:
# - Dados recebidos do Stripe
# - Processo de conversão de timestamps
# - Resultado da sincronização
```

### 2. **Comparar Dados**

```bash
# Debug endpoint mostra:
# - Dados do banco vs Stripe
# - Diferenças específicas
# - Timestamps convertidos
```

### 3. **Teste de Cancelamento**

1. Cancelar assinatura no dashboard do Stripe
2. Verificar webhook `customer.subscription.deleted`
3. Confirmar atualização no banco

## 📊 Monitoramento

### 1. **Logs Importantes**

- `=== PROCESSANDO WEBHOOK ===`
- `=== SINCRONIZANDO ASSINATURA COM STRIPE ===`
- `✅ Assinatura sincronizada com sucesso`
- `❌ Falha ao sincronizar assinatura`

### 2. **Métricas de Sincronização**

- Taxa de sucesso da sincronização
- Tempo de processamento
- Erros de conversão de timestamp

### 3. **Alertas**

- Webhook falhando
- Assinaturas não sincronizadas
- Diferenças entre banco e Stripe

## 🚀 Deploy

### 1. **Backup**

```sql
-- Fazer backup da tabela subscriptions
CREATE TABLE subscriptions_backup AS SELECT * FROM subscriptions;
```

### 2. **Deploy do Código**

```bash
# Deploy das correções
git add .
git commit -m "Fix subscription sync issues"
git push
```

### 3. **Teste Pós-Deploy**

```bash
# Executar script de correção
node scripts/fix-subscription-sync.js

# Verificar logs
tail -f logs/app.log
```

### 4. **Validação**

- Testar cancelamento direto no Stripe
- Verificar se datas são sincronizadas
- Confirmar detecção de Plus

## 🔧 Configuração do Webhook

### Eventos Necessários

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `payment_intent.succeeded`

### URL do Webhook

```
https://yourdomain.com/api/webhooks/stripe
```

## 🎯 Resultado Esperado

Após aplicar as correções:

1. **✅ Datas sincronizadas** - `current_period_start` e `current_period_end` preenchidos
2. **✅ Status atualizado** - Cancelamentos refletem no banco
3. **✅ Plus detectado** - Campo `explicacao_pratica` correto
4. **✅ Logs detalhados** - Debugging facilitado
5. **✅ Sincronização robusta** - Falhas tratadas adequadamente

## 📞 Suporte

### Informações para Debug

- User ID da assinatura
- Subscription ID do Stripe
- Logs do webhook
- Dados do banco vs Stripe
- Timestamps convertidos

### Comandos Úteis

```bash
# Debug específico
curl -X POST http://localhost:3000/api/subscription/debug \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'

# Sincronizar específica
curl -X POST http://localhost:3000/api/subscription/sync \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'

# Sincronizar todas
curl -X POST http://localhost:3000/api/subscription/sync-all
```
