-- ============================================================
-- Migration: Add Asaas payment fields to users table
-- Executar no Supabase SQL Editor
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(30);

COMMENT ON COLUMN users.asaas_customer_id IS 'ID do customer no Asaas (cus_...)';
COMMENT ON COLUMN users.subscription_plan IS 'Plano ativo: starter_monthly | starter_yearly | premium_monthly | premium_yearly';

-- subscription_status, subscription_id, subscription_current_period_end
-- já existem da migration anterior (add_subscription_fields.sql) e são reutilizados.
-- subscription_id agora armazena o ID de assinatura do Asaas (sub_...) no lugar do Stripe.
