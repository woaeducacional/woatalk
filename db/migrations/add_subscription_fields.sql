-- ============================================================
-- Migration: Add Stripe subscription fields to users table
-- Executar no Supabase SQL Editor
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP;

COMMENT ON COLUMN users.stripe_customer_id IS 'ID do customer no Stripe (cus_...)';
COMMENT ON COLUMN users.subscription_status IS 'Status da assinatura: active | inactive | past_due | canceled';
COMMENT ON COLUMN users.subscription_id IS 'ID da subscription no Stripe (sub_...)';
COMMENT ON COLUMN users.subscription_current_period_end IS 'Data de expiração do período atual da assinatura';
