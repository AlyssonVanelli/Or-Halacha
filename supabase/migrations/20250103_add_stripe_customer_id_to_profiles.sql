-- Adicionar coluna stripe_customer_id na tabela profiles
-- Para vincular usuários aos customers do Stripe

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Adicionar índice único para melhor performance nas consultas
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON profiles(stripe_customer_id);

-- Adicionar comentário na coluna para documentação
COMMENT ON COLUMN profiles.stripe_customer_id IS 'ID do Customer no Stripe para integração de pagamentos';
