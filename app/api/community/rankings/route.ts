import { NextResponse } from 'next/server'
import { communityService } from '@/src/services/community.service'

export async function GET() {
  try {
    const data = await communityService.getRankings()
    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/community/rankings error:', err)
    return NextResponse.json({ xpRanking: [], streakRanking: [] }, { status: 500 })
  }
}
