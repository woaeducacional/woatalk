import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('users')
      .select('badges')
      .eq('email', session.user.email)
      .single()

    if (error || !data) return NextResponse.json({ badges: [] })

    const badges = data.badges
      ? data.badges.split(',').map((b: string) => b.trim()).filter(Boolean)
      : []

    return NextResponse.json({ badges })
  } catch (err) {
    console.error('Error fetching badges:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
