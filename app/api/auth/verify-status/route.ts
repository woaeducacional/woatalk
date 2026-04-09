import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { apiService } from '@/lib/api.service'

/**
 * GET /api/auth/verify-status
 * Returns { verified: boolean } for the currently logged-in user.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ verified: true }, { status: 200 })
  }

  try {
    const user = await apiService.getUserByEmail(session.user.email)
    // If column doesn't exist yet (before migration), default to true to avoid false banners
    const verified = user?.email_verified ?? true
    return NextResponse.json({ verified }, { status: 200 })
  } catch {
    return NextResponse.json({ verified: true }, { status: 200 })
  }
}
