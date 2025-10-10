-- Add explicacao_pratica column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS explicacao_pratica BOOLEAN DEFAULT FALSE;

-- Update existing records to have explicacao_pratica = false
UPDATE subscriptions 
SET explicacao_pratica = FALSE 
WHERE explicacao_pratica IS NULL;

