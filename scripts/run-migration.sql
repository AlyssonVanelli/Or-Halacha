-- Script para executar a migração da coluna stripe_payment_intent_id
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna stripe_payment_intent_id na tabela purchased_books
ALTER TABLE purchased_books 
ADD COLUMN stripe_payment_intent_id TEXT;

-- Adicionar índice para melhor performance nas consultas
CREATE INDEX idx_purchased_books_stripe_payment_intent 
ON purchased_books(stripe_payment_intent_id);

-- Adicionar comentário na coluna para documentação
COMMENT ON COLUMN purchased_books.stripe_payment_intent_id IS 'ID do Payment Intent do Stripe para reembolsos automáticos';

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'purchased_books' 
AND column_name = 'stripe_payment_intent_id';
