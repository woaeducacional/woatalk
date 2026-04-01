import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phase_id, activity_index, xp_earned, step_completed } = body

    if (!phase_id || activity_index === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // TODO: Save to activity_progress table
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Activity progress saved',
      data: {
        phase_id,
        activity_index,
        xp_earned,
        step_completed,
        saved_at: new Date(),
      },
    })
  } catch (error) {
    console.error('Error saving activity progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const phaseId = searchParams.get('phase_id')

    if (!phaseId) {
      return NextResponse.json({ error: 'Missing phase_id' }, { status: 400 })
    }

    // TODO: Fetch activity_progress for this phase
    // For now, return empty array
    return NextResponse.json({
      activities: [],
    })
  } catch (error) {
    console.error('Error fetching activity progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
