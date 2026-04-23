import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: adminUser } = await supabaseServer
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, action } = body

    if (!user_id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Get the user's current data
    const { data: targetUser } = await supabaseServer
      .from('users')
      .select('id, name, avatar_url, avatar_status')
      .eq('id', user_id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.avatar_status !== 'pending') {
      return NextResponse.json({ error: 'No pending photo for this user' }, { status: 400 })
    }

    if (action === 'approve') {
      // Approve: set avatar_status to 'approved'
      await supabaseServer
        .from('users')
        .update({ avatar_status: 'approved' })
        .eq('id', user_id)

      // Notify the user
      await supabaseServer.from('notifications').insert({
        user_id: user_id,
        type: 'photo_approved',
        title: 'Foto de perfil aprovada!',
        message: 'Sua foto de perfil foi aprovada e já está visível para todos.',
        data: {},
      })
    } else {
      // Reject: set avatar_status to 'rejected', clear avatar_url
      await supabaseServer
        .from('users')
        .update({ avatar_status: 'rejected', avatar_url: null })
        .eq('id', user_id)

      // Notify the user
      await supabaseServer.from('notifications').insert({
        user_id: user_id,
        type: 'photo_rejected',
        title: 'Foto de perfil rejeitada',
        message: 'Sua foto de perfil foi rejeitada. Você pode enviar uma nova foto.',
        data: {},
      })
    }

    // Remove all pending photo_approval notifications for this user from all admins
    await supabaseServer
      .from('notifications')
      .delete()
      .eq('type', 'photo_approval')
      .contains('data', { requester_id: user_id })

    return NextResponse.json({ success: true, action })
  } catch (error) {
    console.error('Photo moderation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
