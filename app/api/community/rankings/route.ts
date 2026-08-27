import { NextRequest, NextResponse } from 'next/server'
import { communityService } from '@/src/services/community.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') === 'monthly' ? 'monthly' : 'weekly'
    const data = await communityService.getRankings(period)
    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/community/rankings error:', err)
    return NextResponse.json({ xpRanking: [], streakRanking: [] }, { status: 500 })
  }
}
