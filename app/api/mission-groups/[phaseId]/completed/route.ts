import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    if (!supabase) return NextResponse.json([])

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { phaseId: phaseIdStr } = await params
    const phaseId = parseInt(phaseIdStr)
    if (isNaN(phaseId)) return NextResponse.json([])

    const { data: userData, error } = await supabase
      .from('users')
      .select('journey_progress')
      .eq('email', session.user.email)
      .single()

    if (error || !userData) return NextResponse.json([])

    const journeyProgress: Record<string, number[]> = userData.journey_progress ?? {}
    const completed = journeyProgress[String(phaseId)]

    return NextResponse.json(Array.isArray(completed) ? completed : [])
  } catch {
    return NextResponse.json([])
  }
}

