# Guia de Correção do Sistema de Assinaturas

## Problemas Identificados e Corrigidos

### 1. Webhook de Cancelamento

**Problema**: Quando uma assinatura era cancelada no Stripe, não estava sendo atualizada no banco de dados.

**Solução**:

- Corrigido o webhook para processar corretamente eventos de cancelamento
- Adicionada lógica para identificar assinaturas Plus baseada em múltiplos critérios
- Melhorado o logging para debug

### 2. Verificação de Acesso

**Problema**: Usuários com assinaturas ativas não conseguiam acessar os livros do Shulchan Aruch.

**Solução**:

- Corrigida a lógica de verificação de assinaturas ativas
- Adicionada verificação de status 'active' além da data de expiração
- Melhorado o tratamento de casos onde não há data de fim de período

### 3. Assinaturas Plus

**Problema**: Assinaturas Plus (mensal e anual) não estavam salvando `explicacao_pratica: true`.

**Solução**:

- Adicionada detecção automática de assinaturas Plus baseada em:
  - Price ID contendo 'plus'
  - Metadata `isPlus: 'true'`
  - Plan type contendo 'plus'
- Corrigido o webhook para definir `explicacao_pratica: true` para assinaturas Plus

## Como Usar

### 1. Corrigir Assinaturas Existentes

Execute o script de correção para sincronizar assinaturas existentes:

```bash
# Corrigir todas as assinaturas
node scripts/fix-subscriptions.js fix
```

### 2. Testar Fluxo Completo

Teste o fluxo para um usuário específico:

```bash
# Testar para um usuário específico
node scripts/fix-subscriptions.js test <userId>
```

### 3. Endpoints de API

#### Corrigir Assinaturas

```bash
POST /api/fix-subscriptions
```

#### Testar Fluxo Completo

```bash
POST /api/test-complete-flow
Content-Type: application/json

{
  "userId": "user-id-here"
}
```

## Verificações Implementadas

### 1. Webhook do Stripe (`/api/webhooks/stripe`)

- ✅ Processa eventos de cancelamento
- ✅ Identifica assinaturas Plus automaticamente
- ✅ Salva `explicacao_pratica: true` para assinaturas Plus
- ✅ Logs detalhados para debug

### 2. Verificação de Acesso (`/api/check-division-access`)

- ✅ Verifica assinaturas ativas corretamente
- ✅ Considera assinaturas sem data de fim como ativas
- ✅ Logs detalhados para debug

### 3. Componentes de Acesso

- ✅ `BookAccessGuard` corrigido
- ✅ Páginas do Shulchan Aruch corrigidas
- ✅ Hook `useAccessInfo` corrigido

## Estrutura de Dados

### Tabela `subscriptions`

```sql
- id: string
- user_id: string
- status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid'
- plan_type: 'monthly' | 'yearly'
- price_id: string
- subscription_id: string
- current_period_start: string
- current_period_end: string
- cancel_at_period_end: boolean
- explicacao_pratica: boolean  -- TRUE para assinaturas Plus
- created_at: string
- updated_at: string
```

### Tabela `purchased_books`

```sql
- id: string
- user_id: string
- book_id: string
- division_id: string
- expires_at: string
- stripe_payment_intent_id: string
- created_at: string
- updated_at: string
```

## Logs e Debug

Todos os endpoints agora incluem logs detalhados para facilitar o debug:

- Webhook: Logs de eventos recebidos e processados
- Verificação de acesso: Logs de assinaturas e acessos verificados
- Correção: Logs de assinaturas processadas e corrigidas

## Próximos Passos

1. **Executar correção**: Use o script para corrigir assinaturas existentes
2. **Testar fluxo**: Teste com usuários reais para verificar funcionamento
3. **Monitorar logs**: Acompanhe os logs para identificar possíveis problemas
4. **Validar webhooks**: Certifique-se de que os webhooks do Stripe estão configurados corretamente

## Troubleshooting

### Assinatura não está sendo cancelada

- Verifique se o webhook está configurado no Stripe
- Confirme se o endpoint `/api/webhooks/stripe` está acessível
- Verifique os logs do webhook

### Usuário não tem acesso mesmo com assinatura ativa

- Execute o teste de fluxo completo
- Verifique se a assinatura está com status 'active'
- Confirme se a data de fim não expirou

### Assinatura Plus não tem recursos extras

- Execute a correção de assinaturas
- Verifique se o price_id contém 'plus'
- Confirme se `explicacao_pratica` está como `true`
