import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_PLACEHOLDER') {
  console.warn('[Stripe] STRIPE_SECRET_KEY não configurado — pagamentos desabilitados')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_PLACEHOLDER', {
  apiVersion: '2026-04-22.dahlia',
})
