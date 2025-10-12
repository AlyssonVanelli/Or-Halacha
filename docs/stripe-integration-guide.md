# Guia de Integração com Stripe - Sistema Refatorado

## Visão Geral

Este documento descreve o novo sistema de integração com Stripe, completamente refatorado para ser mais robusto, escalável e fácil de manter.

## Arquitetura

### 1. Configuração Centralizada (`lib/stripe.ts`)

- Configuração única do Stripe
- Validação de price IDs
- Funções utilitárias para criar customers e sessões de checkout
- Tipos TypeScript para planos

### 2. Serviços Especializados

#### SubscriptionService (`lib/services/subscription-service.ts`)

- Gerenciamento completo de assinaturas
- Sincronização com Stripe
- Verificação de status e acesso Plus

#### PurchaseService (`lib/services/purchase-service.ts`)

- Gerenciamento de compras avulsas
- Verificação de acesso a divisões específicas
- Controle de expiração

#### AccessService (`lib/services/access-service.ts`)

- Serviço unificado de verificação de acesso
- Combina assinaturas e compras
- Interface limpa para componentes

### 3. Endpoints da API

#### Checkout (`/api/checkout/create`)

- Criação de sessões de checkout
- Suporte a assinaturas e compras avulsas
- Validação robusta de dados

#### Webhooks (`/api/webhooks/stripe`)

- Processamento de eventos do Stripe
- Sincronização automática com banco
- Tratamento de erros

#### Gerenciamento de Assinaturas

- `/api/subscription/status` - Status da assinatura
- `/api/subscription/cancel` - Cancelar assinatura
- `/api/subscription/reactivate` - Reativar assinatura

#### Verificação de Acesso

- `/api/access/check` - Verificar acesso específico
- `/api/access/info` - Informações completas de acesso

### 4. Componentes Frontend

#### Hooks

- `useSubscription` - Hook para gerenciar estado de assinatura
- Integração com serviços de backend

#### Componentes

- `SubscriptionButton` - Botão para iniciar checkout
- `BookAccessGuard` - Proteção de acesso a livros
- `DivisionAccessGuard` - Proteção de acesso a divisões
- `SubscriptionManager` - Interface de gerenciamento

## Fluxo de Assinatura

### 1. Início do Checkout

```typescript
// Usuário clica em "Assinar"
<SubscriptionButton planType="mensal-basico">
  Assinar Plano Mensal
</SubscriptionButton>
```

### 2. Criação da Sessão

```typescript
// POST /api/checkout/create
{
  "planType": "mensal-basico",
  "userId": "uuid",
  "userEmail": "user@example.com",
  "successUrl": "https://app.com/dashboard",
  "cancelUrl": "https://app.com/dashboard"
}
```

### 3. Processamento do Webhook

```typescript
// Eventos processados:
// - checkout.session.completed
// - customer.subscription.created/updated
// - invoice.payment_succeeded
// - payment_intent.succeeded
```

### 4. Verificação de Acesso

```typescript
// Hook no frontend
const { hasAccess, canAccessDivision } = useSubscription()

// Verificação específica
const canAccess = canAccessDivision('division-id')
```

## Configuração

### 1. Variáveis de Ambiente

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
NEXT_PUBLIC_STRIPE_PRICE_MENSAL=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ANUAL=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_SINGLE_BOOK=price_xxxxx
```

### 2. Webhook do Stripe

Configure o webhook no dashboard do Stripe:

- URL: `https://yourdomain.com/api/webhooks/stripe`
- Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`, `payment_intent.succeeded`

## Tipos de Planos

### Assinaturas

- `mensal-basico` - Assinatura mensal básica
- `mensal-plus` - Assinatura mensal Plus
- `anual-basico` - Assinatura anual básica
- `anual-plus` - Assinatura anual Plus

### Compras Avulsas

- `tratado-avulso` - Compra de tratado específico

## Controle de Acesso

### Níveis de Acesso

1. **Nenhum** - Usuário sem assinatura ou compras
2. **Compra** - Acesso apenas a tratados comprados
3. **Assinatura** - Acesso completo a todos os livros

### Verificação de Acesso Plus

```typescript
const { hasPlusAccess } = useSubscription()
// true se usuário tem assinatura Plus ativa
```

## Tratamento de Erros

### Validação de Dados

- Schema Zod para validação de requests
- Verificação de price IDs no Stripe
- Validação de usuários e customers

### Fallbacks

- Redirecionamento para signup em caso de erro
- Retry automático em falhas de rede
- Logs detalhados para debugging

## Monitoramento

### Logs Estruturados

```typescript
console.log('=== PROCESSANDO WEBHOOK ===')
console.log('Event Type:', event.type)
console.log('Event ID:', event.id)
```

### Métricas

- Taxa de conversão de checkout
- Falhas de webhook
- Sincronização de assinaturas

## Testes

### Teste de Checkout

1. Criar sessão de checkout
2. Completar pagamento no Stripe
3. Verificar webhook
4. Confirmar acesso no frontend

### Teste de Webhook

```bash
# Usar Stripe CLI para testar webhooks localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Migração

### Backup

1. Fazer backup do banco de dados
2. Exportar configurações do Stripe
3. Documentar price IDs atuais

### Deploy

1. Deploy do novo código
2. Configurar webhooks
3. Testar fluxo completo
4. Monitorar logs

## Suporte

### Debugging

- Logs detalhados em todos os endpoints
- Rastreamento de eventos do Stripe
- Verificação de status de assinaturas

### Troubleshooting

1. Verificar logs do webhook
2. Confirmar configuração de price IDs
3. Validar sincronização com banco
4. Testar fluxo de checkout
