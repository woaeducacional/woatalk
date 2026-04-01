import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json([])
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json([])
    }

    const userId = userData.id

    // Get all completed phases for this user
    const { data: completedData, error: phaseError } = await supabase
      .from('user_phase_completion')
      .select('phase_id')
      .eq('user_id', userId)
      .order('phase_id', { ascending: true })

    if (phaseError) {
      console.error('Error fetching phases:', phaseError)
      return NextResponse.json([])
    }

    const completedPhases = (completedData || []).map((row: any) => row.phase_id)

    return NextResponse.json(completedPhases)
  } catch (error) {
    console.error('Error fetching completed phases:', error)
    return NextResponse.json([])
  }
}
