import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

function normalizePlanLabel(plan: string | null): string {
  if (!plan) return 'free'
  if (plan.includes('premium')) return 'premium'
  if (plan.includes('starter')) return 'starter'
  return plan
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabase) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, subject, problem, status, created_at')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tickets: data ?? [] })
  } catch (error) {
    console.error('Error in support-tickets GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabase) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
    }

    const body = await request.json()
    const subject = String(body?.subject ?? '').trim()
    const problem = String(body?.problem ?? '').trim()

    if (subject.length < 4 || subject.length > 120) {
      return NextResponse.json({ error: 'Assunto deve ter entre 4 e 120 caracteres.' }, { status: 400 })
    }
    if (problem.length < 10 || problem.length > 5000) {
      return NextResponse.json({ error: 'Descrição do problema deve ter entre 10 e 5000 caracteres.' }, { status: 400 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, subscription_plan')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userData.id,
        subject,
        problem,
      })
      .select('id, subject, problem, status, created_at')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create ticket' }, { status: 500 })
    }

    return NextResponse.json({
      ticket: data,
      user: {
        name: userData.name,
        email: userData.email,
        plan: normalizePlanLabel(userData.subscription_plan),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error in support-tickets POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
