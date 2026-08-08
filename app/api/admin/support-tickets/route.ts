import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'
import { resolveSupportScreenshotUrl } from '@/lib/supportTicketStorage'

type SupportTicketRow = {
  id: string
  subject: string
  problem: string
  screenshot_url: string | null
  status: 'open' | 'in_progress' | 'resolved'
  created_at: string
  users: Array<{
    id: string
    name: string | null
    email: string
    subscription_plan: string | null
  }>
}

function normalizePlanLabel(plan: string | null): string {
  if (!plan) return 'free'
  if (plan.includes('premium')) return 'premium'
  if (plan.includes('starter')) return 'starter'
  return plan
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  }

  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
      id, subject, problem, screenshot_url, status, created_at,
      users!support_tickets_user_id_fkey (id, name, email, subscription_plan)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const tickets = ((data ?? []) as SupportTicketRow[]).map((row) => {
    const user = row.users?.[0]
    return {
    id: row.id,
    subject: row.subject,
    problem: row.problem,
    screenshot_url: resolveSupportScreenshotUrl(row.screenshot_url),
    status: row.status,
    created_at: row.created_at,
    user: {
      id: user?.id ?? '',
      name: user?.name ?? 'Usuário',
      username: user?.email ?? '-',
      plan: normalizePlanLabel(user?.subscription_plan ?? null),
    },
  }})

  return NextResponse.json({ tickets })
}
