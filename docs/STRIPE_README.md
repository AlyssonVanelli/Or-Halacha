# Sistema de Integração com Stripe - Refatorado

## 🎯 Objetivo

Este sistema foi completamente refatorado para resolver todos os problemas de integração com o Stripe, fornecendo uma solução robusta, escalável e fácil de manter.

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
lib/
├── stripe.ts                          # Configuração central do Stripe
└── services/
    ├── subscription-service.ts         # Gerenciamento de assinaturas
    ├── purchase-service.ts            # Gerenciamento de compras avulsas
    └── access-service.ts              # Controle de acesso unificado

app/api/
├── checkout/create/route.ts           # Criação de checkout
├── webhooks/stripe/route.ts           # Webhook handler
├── subscription/
│   ├── status/route.ts               # Status da assinatura
│   ├── cancel/route.ts               # Cancelar assinatura
│   └── reactivate/route.ts          # Reativar assinatura
└── access/
    ├── check/route.ts                 # Verificar acesso específico
    └── info/route.ts                  # Informações de acesso

components/
├── SubscriptionButton.tsx             # Botão de assinatura
├── BookAccessGuard.tsx               # Proteção de livros
├── DivisionAccessGuard.tsx           # Proteção de divisões
└── SubscriptionManager.tsx           # Gerenciamento de assinatura

hooks/
└── useSubscription.ts                # Hook para assinaturas
```

## 🚀 Funcionalidades

### ✅ Checkout Robusto

- Criação de sessões de checkout para assinaturas e compras avulsas
- Validação completa de dados com Zod
- Verificação de price IDs no Stripe
- Tratamento de erros com fallbacks

### ✅ Webhook Handler

- Processamento de todos os eventos do Stripe
- Sincronização automática com banco de dados
- Tratamento de erros e retry
- Logs detalhados para debugging

### ✅ Gerenciamento de Assinaturas

- Criação, atualização e cancelamento
- Verificação de status e acesso Plus
- Sincronização bidirecional com Stripe
- Controle de períodos e expiração

### ✅ Controle de Acesso

- Verificação unificada de acesso
- Suporte a assinaturas e compras avulsas
- Controle granular por livro/divisão
- Interface limpa para componentes

## 🔧 Configuração

### 1. Variáveis de Ambiente

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (substitua pelos seus)
NEXT_PUBLIC_STRIPE_PRICE_MENSAL=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ANUAL=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_SINGLE_BOOK=price_xxxxx
```

### 2. Webhook do Stripe

Configure no dashboard do Stripe:

- **URL**: `https://yourdomain.com/api/webhooks/stripe`
- **Eventos**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `payment_intent.succeeded`

## 📋 Tipos de Planos

### Assinaturas

- `mensal-basico` - Assinatura mensal básica
- `mensal-plus` - Assinatura mensal Plus
- `anual-basico` - Assinatura anual básica
- `anual-plus` - Assinatura anual Plus

### Compras Avulsas

- `tratado-avulso` - Compra de tratado específico

## 🎮 Como Usar

### 1. Botão de Assinatura

```tsx
import { SubscriptionButton } from '@/components/SubscriptionButton'

// Assinatura
<SubscriptionButton planType="mensal-basico">
  Assinar Plano Mensal
</SubscriptionButton>

// Compra avulsa
<SubscriptionButton
  planType="tratado-avulso"
  divisionId="division-id"
>
  Comprar Tratado
</SubscriptionButton>
```

### 2. Proteção de Acesso

```tsx
import { BookAccessGuard, DivisionAccessGuard } from '@/components'

// Proteger livro
<BookAccessGuard bookId="shulchan-aruch">
  <BookContent />
</BookAccessGuard>

// Proteger divisão
<DivisionAccessGuard divisionId="division-id">
  <DivisionContent />
</DivisionAccessGuard>
```

### 3. Hook de Assinatura

```tsx
import { useSubscription } from '@/hooks/useSubscription'

function MyComponent() {
  const { hasAccess, hasPlusAccess, canAccessDivision, loading } = useSubscription()

  if (loading) return <Loading />

  return (
    <div>
      {hasAccess ? 'Você tem acesso!' : 'Sem acesso'}
      {hasPlusAccess && 'Você tem acesso Plus!'}
    </div>
  )
}
```

### 4. Gerenciamento de Assinatura

```tsx
import { SubscriptionManager } from '@/components/SubscriptionManager'
;<SubscriptionManager showDetails={true} showActions={true} />
```

## 🧪 Testes

### Script de Teste

```bash
# Executar testes de integração
node scripts/test-stripe-integration.js

# Com URL customizada
TEST_BASE_URL=https://yourdomain.com node scripts/test-stripe-integration.js
```

### Teste Manual

1. **Checkout**: Criar sessão e completar pagamento
2. **Webhook**: Verificar processamento de eventos
3. **Acesso**: Confirmar liberação de conteúdo
4. **Cancelamento**: Testar cancelamento e reativação

## 🔍 Debugging

### Logs Estruturados

```typescript
console.log('=== PROCESSANDO WEBHOOK ===')
console.log('Event Type:', event.type)
console.log('Event ID:', event.id)
```

### Verificação de Status

```bash
# Verificar status da assinatura
curl -X POST http://localhost:3000/api/subscription/status \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id"}'
```

### Verificação de Acesso

```bash
# Verificar acesso a divisão
curl -X POST http://localhost:3000/api/access/check \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id", "resourceType": "division", "resourceId": "division-id"}'
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Webhook não processa**

   - Verificar URL do webhook no Stripe
   - Confirmar STRIPE_WEBHOOK_SECRET
   - Verificar logs do servidor

2. **Checkout não funciona**

   - Verificar price IDs configurados
   - Confirmar STRIPE_SECRET_KEY
   - Validar dados do usuário

3. **Acesso não libera**
   - Verificar sincronização com banco
   - Confirmar status da assinatura
   - Verificar logs de webhook

### Comandos de Debug

```bash
# Verificar configuração
npm run type-check

# Testar webhook localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Verificar logs
tail -f logs/app.log
```

## 📊 Monitoramento

### Métricas Importantes

- Taxa de conversão de checkout
- Falhas de webhook
- Sincronização de assinaturas
- Tempo de resposta da API

### Alertas

- Webhook falhando
- Assinaturas não sincronizadas
- Erros de checkout
- Falhas de acesso

## 🔄 Migração

### Backup

1. Fazer backup do banco de dados
2. Exportar configurações do Stripe
3. Documentar price IDs atuais

### Deploy

1. Deploy do novo código
2. Configurar webhooks
3. Testar fluxo completo
4. Monitorar logs

### Rollback

1. Reverter para versão anterior
2. Restaurar configurações
3. Verificar funcionamento

## 📞 Suporte

### Logs Importantes

- Webhook events
- Checkout sessions
- Subscription updates
- Access checks

### Informações para Debug

- User ID
- Session ID
- Subscription ID
- Error messages
- Timestamps

---

## 🎉 Conclusão

Este sistema refatorado resolve todos os problemas anteriores e fornece uma base sólida para o crescimento do negócio. Com arquitetura limpa, testes abrangentes e documentação completa, você tem uma solução profissional e confiável.
