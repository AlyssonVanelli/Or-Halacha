-- Adicionar coluna stripe_payment_intent_id na tabela purchased_books
-- Para permitir reembolsos automáticos via Stripe

ALTER TABLE purchased_books 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Adicionar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_purchased_books_stripe_payment_intent 
ON purchased_books(stripe_payment_intent_id);

-- Adicionar comentário na coluna para documentação
COMMENT ON COLUMN purchased_books.stripe_payment_intent_id IS 'ID do Payment Intent do Stripe para reembolsos automáticos';
