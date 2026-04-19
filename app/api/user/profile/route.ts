import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabaseServer } from '@/lib/supabaseServer'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate Supabase connection
    if (!supabaseServer) {
      console.error('Supabase server client not initialized. Check environment variables.')
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    let avatarUrl = null

    // Handle avatar file upload
    const avatarFile = formData.get('avatar') as File
    if (avatarFile && avatarFile.size > 0) {
      // Validate file size (5MB max)
      const MAX_SIZE = 5 * 1024 * 1024
      if (avatarFile.size > MAX_SIZE) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 5MB.' },
          { status: 400 }
        )
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(avatarFile.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Use JPG, PNG, or WebP.' },
          { status: 400 }
        )
      }

      // Generate filename with userId
      const userId = session.user.id || session.user.email?.split('@')[0] || 'user'
      const ext = getFileExtension(avatarFile.name)
      const fileName = `perfil-${userId}.${ext}`

      // Convert file to buffer
      const arrayBuffer = await avatarFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabaseServer.storage
        .from('avatars')
        .upload(fileName, buffer, {
          upsert: true, // Replace if exists
          contentType: avatarFile.type,
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        console.error('Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          fileName,
          fileSize: buffer.length,
        })
        return NextResponse.json(
          { error: `Failed to upload avatar: ${uploadError.message}` },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: publicUrlData } = supabaseServer.storage
        .from('avatars')
        .getPublicUrl(fileName)
      
      avatarUrl = publicUrlData?.publicUrl || null
    }

    // Extract profile fields
    const profile = {
      nickname: formData.get('nickname') || null,
      phone: formData.get('phone') || null,
      bio: formData.get('bio') || null,
      country: formData.get('country') || null,
      language: formData.get('language') || 'pt-BR',
      gender: formData.get('gender') || null,
      ...(avatarUrl && { avatar_url: avatarUrl }),
      updated_at: new Date().toISOString(),
    }

    // Update user profile in database
    const { error: updateError } = await supabaseServer
      .from('users')
      .update(profile)
      .eq('email', session.user.email)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile in database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      avatar_url: avatarUrl,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getFileExtension(fileName: string): string {
  const ext = path.extname(fileName).slice(1).toLowerCase()
  return ext || 'jpg'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user profile from database
    const { data, error } = await supabaseServer
      .from('users')
      .select('id, name, email, nickname, phone, bio, country, language, gender, avatar_url, xp_total, streak_count, badges, created_at, updated_at')
      .eq('email', session.user.email)
      .single()

    if (error) {
      console.error('Database fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: data,
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
