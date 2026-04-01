import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json([])
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phaseId: phaseIdStr } = await params
    const phaseId = parseInt(phaseIdStr)

    if (isNaN(phaseId)) {
      return NextResponse.json([])
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

    // Get all completed mission groups for this phase
    const { data: completedData, error: dataError } = await supabase
      .from('user_mission_group_completion')
      .select('mission_group_id')
      .eq('user_id', userId)
      .eq('phase_id', phaseId)
      .order('mission_group_id', { ascending: true })

    if (dataError) {
      console.error('Error fetching mission groups:', dataError)
      return NextResponse.json([])
    }

    const completedGroups = (completedData || []).map((row: any) => row.mission_group_id)

    return NextResponse.json(completedGroups)
  } catch (error) {
    console.error('Error fetching completed mission groups:', error)
    return NextResponse.json([])
  }
}
