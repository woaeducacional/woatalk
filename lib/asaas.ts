// ============================================================
// Asaas API Client
// Docs: https://docs.asaas.com/
// ============================================================

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL?.replace(/\/$/, '') ?? 'https://api.asaas.com/v3'

async function asaasRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const rawKey = process.env.ASAAS_API_KEY ?? ''
  // The key must start with '$'. Store it WITHOUT '$' in .env.local to avoid dotenv-expand interpolation.
  const apiKey = rawKey ? (rawKey.startsWith('$') ? rawKey : `$${rawKey}`) : ''
  if (!apiKey) {
    console.warn('[Asaas] ASAAS_API_KEY não configurado — pagamentos desabilitados')
  } else {
    console.log('[Asaas] Usando key:', apiKey.slice(0, 12) + '...')
  }
  // Log request attempt (do not log the API key itself)
  try {
    console.log('[Asaas] ▶ Request:', { method, path, body: body ?? null })
  } catch {}

  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  // Read raw response text for robust logging and debugging
  const text = await res.text()
  // Log status and a few headers for context
  try {
    console.log('[Asaas] ◀ Response status:', res.status, 'content-type:', res.headers.get('content-type'))
    console.log('[Asaas] ◀ Response body (raw):', text)
  } catch {}

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (parseErr) {
    // If response is not JSON, include raw text in error to help debugging
    throw new Error(`[Asaas] ${method} ${path} → resposta não-JSON (${res.status}): ${text}`)
  }

  if (!res.ok) {
    // Try to extract friendly Asaas errors from the parsed body, but also include raw
    const errors = (data as { errors?: { description: string }[] }).errors
    const message = errors?.map(e => e.description).join('; ') ?? `HTTP ${res.status}`
    const raw = typeof data === 'object' ? JSON.stringify(data) : String(data)
    throw new Error(`[Asaas] ${method} ${path} → ${message} | raw: ${raw}`)
  }

  return data as T
}

// ── Types ──────────────────────────────────────────────────

export type AsaasBillingType = 'CREDIT_CARD' | 'PIX' | 'BOLETO'

export type AsaasSubscriptionCycle = 'MONTHLY' | 'YEARLY'

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
}

export interface AsaasSubscription {
  id: string
  customer: string
  billingType: AsaasBillingType
  cycle: AsaasSubscriptionCycle
  value: number
  nextDueDate: string
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  description?: string
  paymentLink?: string
}

export interface AsaasPayment {
  id: string
  subscription?: string
  billingType: AsaasBillingType
  status: string
  value: number
  dueDate: string
  invoiceUrl?: string
  bankSlipUrl?: string
  pixQrCodeId?: string
  pixTransaction?: {
    authorizationUrl?: string
    qrCode?: {
      encodedImage?: string
      payload?: string
    }
  }
  /** URL de autorização do Pix Automático */
  authorizationUrl?: string
}

// ── Customer ───────────────────────────────────────────────

export async function createCustomer(params: {
  name: string
  email: string
  cpfCnpj: string
  phone?: string
}): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>('POST', '/customers', params)
}

export async function findCustomerByCpf(cpfCnpj: string): Promise<AsaasCustomer | null> {
  const cpfClean = cpfCnpj.replace(/\D/g, '')
  const data = await asaasRequest<{ data: AsaasCustomer[] }>('GET', `/customers?cpfCnpj=${cpfClean}`)
  return data.data?.[0] ?? null
}

// ── Subscriptions ──────────────────────────────────────────

export async function createSubscription(params: {
  customer: string
  billingType: AsaasBillingType
  value: number
  nextDueDate: string
  cycle: AsaasSubscriptionCycle
  description: string
  redirectUrl?: string
  externalReference?: string
}): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>('POST', '/subscriptions', params)
}

export async function getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>('GET', `/subscriptions/${subscriptionId}`)
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await asaasRequest('DELETE', `/subscriptions/${subscriptionId}`)
}

export async function cancelPixAutomaticAuthorization(authorizationId: string): Promise<void> {
  await asaasRequest('DELETE', `/pix/automatic/authorizations/${authorizationId}`)
}

// ── Checkout (recurring) ───────────────────────────────────

export interface AsaasCheckoutResponse {
  id: string
  url?: string
  link?: string
  paymentLink?: string
  subscription?: AsaasSubscription
}

export async function createCheckoutWithSubscription(params: Record<string, unknown>): Promise<AsaasCheckoutResponse> {
  return asaasRequest<AsaasCheckoutResponse>('POST', '/checkouts', params)
}

// ── Payments ───────────────────────────────────────────────

/** Busca a primeira cobrança pendente de uma assinatura (para obter URL de pagamento) */
export async function getFirstPendingPayment(subscriptionId: string): Promise<AsaasPayment | null> {
  const data = await asaasRequest<{ data: AsaasPayment[] }>(
    'GET',
    `/payments?subscription=${subscriptionId}&status=PENDING`
  )
  return data.data?.[0] ?? null
}

export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>('GET', `/payments/${paymentId}`)
}

export async function updatePayment(paymentId: string, data: Record<string, unknown>): Promise<void> {
  await asaasRequest('POST', `/payments/${paymentId}`, data)
}

/** Para Pix Automático: busca a URL de autorização da solicitação de débito */
export async function getPixAuthorizationUrl(paymentId: string): Promise<string | null> {
  try {
    const data = await asaasRequest<{ authorizationUrl?: string; pixTransaction?: { authorizationUrl?: string } }>(
      'GET',
      `/payments/${paymentId}/pixQrCode`
    )
    return data.authorizationUrl ?? data.pixTransaction?.authorizationUrl ?? null
  } catch {
    return null
  }
}

export type AsaasPixAutomaticAuthorizationFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'ANNUALLY'

export interface AsaasPixAutomaticAuthorization {
  id: string
  customer: string
  frequency: AsaasPixAutomaticAuthorizationFrequency
  contractId: string
  startDate: string
  finishDate?: string
  value: number
  description: string
  status: string
  immediateQrCode?: {
    authorizationId?: string
    authorizationUrl?: string
    pixTransaction?: {
      authorizationUrl?: string
      qrCode?: {
        encodedImage?: string
        payload?: string
      }
    }
    conciliationIdentifier?: string
    value?: number
    originalValue?: number
    dueDate?: string
    expirationSeconds?: number
  }
  conciliationIdentifier?: string
}

export async function createPixAutomaticAuthorization(params: {
  customer: string
  frequency: AsaasPixAutomaticAuthorizationFrequency
  contractId: string
  startDate: string
  finishDate?: string
  value: number
  description: string
  immediateQrCode: {
    value: number
    originalValue: number
    dueDate: string
    description: string
    expirationSeconds: number
  }
}): Promise<AsaasPixAutomaticAuthorization> {
  return asaasRequest<AsaasPixAutomaticAuthorization>('POST', '/pix/automatic/authorizations', params)
}

export async function createPixAutomaticPayment(params: {
  pixAutomaticAuthorizationId: string
  value: number
  dueDate: string
  description: string
  externalReference?: string
}): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>('POST', '/payments', params)
}

// ── Plan definitions ───────────────────────────────────────

export const ASAAS_PLANS = {
  starter_monthly: {
    label: 'Starter Mensal',
    value: 29.90,
    cycle: 'MONTHLY' as AsaasSubscriptionCycle,
  },
  starter_yearly: {
    label: 'Starter Anual',
    value: 287.00,
    cycle: 'YEARLY' as AsaasSubscriptionCycle,
  },
  premium_monthly: {
    label: 'Premium Mensal',
    value: 89.90,
    cycle: 'MONTHLY' as AsaasSubscriptionCycle,
  },
  premium_yearly: {
    label: 'Premium Anual',
    value: 867.00,
    cycle: 'YEARLY' as AsaasSubscriptionCycle,
  },
  // Planos promocionais — acesso via /premium-point (vendedores)
  starter_monthly_promo: {
    label: 'Starter Mensal — Promo',
    value: 19.90,
    cycle: 'MONTHLY' as AsaasSubscriptionCycle,
  },
  starter_yearly_promo: {
    label: 'Starter Anual — Promo',
    value: 238.90,
    cycle: 'YEARLY' as AsaasSubscriptionCycle,
  },
  premium_monthly_promo: {
    label: 'Premium Mensal — Promo',
    value: 59.90,
    cycle: 'MONTHLY' as AsaasSubscriptionCycle,
  },
  premium_yearly_promo: {
    label: 'Premium Anual — Promo',
    value: 718.00,
    cycle: 'YEARLY' as AsaasSubscriptionCycle,
  },
} as const

export type AsaasPlanId = keyof typeof ASAAS_PLANS

/** Calcula o próximo vencimento (amanhã) */
export function getNextDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

/** Calcula o vencimento do trial (hoje + 30 dias) — usado para cartão e PIX automático */
export function getTrialDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}
