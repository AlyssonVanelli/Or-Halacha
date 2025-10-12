# Correção do Problema de Assinaturas no Banco de Dados

## Problema Identificado

As assinaturas criadas pelo Stripe não estavam sendo salvas no banco de dados devido a dois problemas principais:

1. **Coluna `stripe_customer_id` ausente na tabela `profiles`**
2. **Falta de logs detalhados para debug do webhook**

## Soluções Implementadas

### 1. Migração do Banco de Dados

Criada migração `20250103_add_stripe_customer_id_to_profiles.sql`:

```sql
-- Adicionar coluna stripe_customer_id na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Adicionar índice único para melhor performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
ON profiles(stripe_customer_id);

-- Adicionar comentário na coluna
COMMENT ON COLUMN profiles.stripe_customer_id IS 'ID do Customer no Stripe para integração de pagamentos';
```

### 2. Atualização dos Tipos TypeScript

Atualizado `lib/supabase/database.types.ts` para incluir a coluna `stripe_customer_id`:

```typescript
profiles: {
  Row: {
    id: string
    full_name: string | null
    avatar_url: string | null
    stripe_customer_id: string | null // ← Nova coluna
    created_at: string
    updated_at: string
  }
  // ... Insert e Update também atualizados
}
```

### 3. Melhorias no Webhook do Stripe

Aprimorado `app/api/webhooks/stripe/route.ts` com:

- **Logs detalhados** para debug
- **Verificação de assinatura existente** antes de inserir
- **Tratamento de erros melhorado** com códigos e mensagens específicas
- **Validação de conexão** com banco de dados

### 4. Endpoints de Teste e Diagnóstico

Criados endpoints para facilitar o debug:

- `GET /api/check-webhook-config` - Verifica configuração
- `GET /api/check-subscriptions` - Lista assinaturas existentes
- `POST /api/test-subscription-webhook` - Testa inserção de assinatura
- `POST /api/simulate-subscription-webhook` - Simula criação de assinatura

### 5. Script de Diagnóstico

Criado `scripts/fix-subscription-issue.js` para:

- Verificar configuração do webhook
- Testar conexão com banco
- Verificar assinaturas existentes
- Simular criação de assinatura

## Como Executar a Correção

### 1. Executar a Migração

```bash
# Se usando Supabase local
supabase db push

# Se usando Supabase Cloud
# A migração será executada automaticamente no próximo deploy
```

### 2. Executar o Script de Diagnóstico

```bash
node scripts/fix-subscription-issue.js
```

### 3. Verificar os Logs

Após criar uma assinatura, verifique os logs do webhook para confirmar que:

1. A conexão com banco está OK
2. O perfil do usuário é encontrado
3. A assinatura é inserida com sucesso

## Fluxo Corrigido

1. **Usuário cria assinatura** → Stripe Checkout
2. **Stripe processa pagamento** → Webhook enviado
3. **Webhook recebido** → Verifica conexão com banco
4. **Busca perfil do usuário** → Usa `stripe_customer_id`
5. **Insere assinatura** → Tabela `subscriptions`
6. **Logs detalhados** → Confirma sucesso

## Verificação da Solução

Para verificar se a correção funcionou:

1. **Crie uma nova assinatura** pelo site
2. **Verifique os logs** do webhook
3. **Consulte o banco** usando `/api/check-subscriptions`
4. **Confirme que a assinatura** aparece na tabela `subscriptions`

## Próximos Passos

1. **Monitorar logs** do webhook por alguns dias
2. **Verificar se todas as assinaturas** estão sendo salvas
3. **Testar diferentes tipos de plano** (mensal/anual)
4. **Remover endpoints de teste** após confirmação

## Arquivos Modificados

- `supabase/migrations/20250103_add_stripe_customer_id_to_profiles.sql` (novo)
- `lib/supabase/database.types.ts` (atualizado)
- `app/api/webhooks/stripe/route.ts` (melhorado)
- `app/api/check-webhook-config/route.ts` (novo)
- `app/api/check-subscriptions/route.ts` (novo)
- `app/api/test-subscription-webhook/route.ts` (novo)
- `app/api/simulate-subscription-webhook/route.ts` (novo)
- `scripts/fix-subscription-issue.js` (novo)
- `docs/subscription-database-fix.md` (novo)
