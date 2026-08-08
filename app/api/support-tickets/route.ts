import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'
import { normalizeSupportScreenshotPath, resolveSupportScreenshotUrl } from '@/lib/supportTicketStorage'

const SCREENSHOT_BUCKET = 'journey-assets'
const SCREENSHOT_BASE_PATH = 'support/tickets'
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024
const ALLOWED_SCREENSHOT_TYPES = ['image/png', 'image/jpeg', 'image/webp']

function extFromFileName(fileName: string): string {
  const clean = fileName.trim().toLowerCase()
  if (clean.endsWith('.png')) return 'png'
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'jpg'
  if (clean.endsWith('.webp')) return 'webp'
  return 'png'
}

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
      .select('id, subject, problem, status, screenshot_url, created_at')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      tickets: (data ?? []).map((ticket: any) => ({
        ...ticket,
        screenshot_url: resolveSupportScreenshotUrl(ticket.screenshot_url),
      })),
    })
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

    const formData = await request.formData()
    const subject = String(formData.get('subject') ?? '').trim()
    const problem = String(formData.get('problem') ?? '').trim()
    const screenshotFile = formData.get('screenshot') as File | null

    if (subject.length < 4 || subject.length > 120) {
      return NextResponse.json({ error: 'Assunto deve ter entre 4 e 120 caracteres.' }, { status: 400 })
    }
    if (problem.length < 10 || problem.length > 5000) {
      return NextResponse.json({ error: 'Descrição do problema deve ter entre 10 e 5000 caracteres.' }, { status: 400 })
    }

    let screenshotPath: string | null = null
    let screenshotPublicUrl: string | null = null

    if (screenshotFile && screenshotFile.size > 0) {
      if (!ALLOWED_SCREENSHOT_TYPES.includes(screenshotFile.type)) {
        return NextResponse.json({ error: 'Print inválido. Use PNG, JPG ou WebP.' }, { status: 400 })
      }
      if (screenshotFile.size > MAX_SCREENSHOT_SIZE) {
        return NextResponse.json({ error: 'Print muito grande. Máximo de 5MB.' }, { status: 400 })
      }
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, subscription_plan')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (screenshotFile && screenshotFile.size > 0) {
      const ext = extFromFileName(screenshotFile.name)
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const filePath = `${SCREENSHOT_BASE_PATH}/${userData.id}/${unique}.${ext}`
      const bytes = await screenshotFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const { error: uploadError } = await supabase.storage
        .from(SCREENSHOT_BUCKET)
        .upload(filePath, buffer, {
          contentType: screenshotFile.type,
          upsert: false,
        })

      if (uploadError) {
        return NextResponse.json({ error: `Falha ao enviar print: ${uploadError.message}` }, { status: 500 })
      }

      screenshotPath = normalizeSupportScreenshotPath(filePath)
      const { data: publicUrlData } = supabase.storage
        .from(SCREENSHOT_BUCKET)
        .getPublicUrl(filePath)
      screenshotPublicUrl = publicUrlData?.publicUrl ?? null
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userData.id,
        subject,
        problem,
        screenshot_url: screenshotPath,
      })
      .select('id, subject, problem, status, screenshot_url, created_at')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create ticket' }, { status: 500 })
    }

    return NextResponse.json({
      ticket: {
        ...data,
        screenshot_url: screenshotPublicUrl ?? resolveSupportScreenshotUrl(data.screenshot_url),
      },
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
