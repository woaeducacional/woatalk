// ============================================================
// Asaas API Client
// Docs: https://docs.asaas.com/
// ============================================================

const ASAAS_BASE_URL = 'https://api.asaas.com/v3'

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
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Asaas retornou resposta não-JSON (${res.status}): ${text}`)
  }

  if (!res.ok) {
    const errors = (data as { errors?: { description: string }[] }).errors
    const message = errors?.map(e => e.description).join('; ') ?? `HTTP ${res.status}`
    throw new Error(`[Asaas] ${method} ${path} → ${message}`)
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

// ── Plan definitions ───────────────────────────────────────

export const ASAAS_PLANS = {
  starter_monthly: {
    label: 'Starter Mensal',
    value: 19.90,
    cycle: 'MONTHLY' as AsaasSubscriptionCycle,
  },
  starter_yearly: {
    label: 'Starter Anual',
    value: 238.90,
    cycle: 'YEARLY' as AsaasSubscriptionCycle,
  },
  premium_monthly: {
    label: 'Premium Mensal',
    value: 59.90,
    cycle: 'MONTHLY' as AsaasSubscriptionCycle,
  },
  premium_yearly: {
    label: 'Premium Anual',
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
