import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')

    console.log('Public profile request for id:', id)

    if (!id) {
      console.error('ID parameter missing')
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Fetch all available columns from users table by id
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    console.log('Query result:', { data, error, id })

    if (error) {
      console.error('Database fetch error:', {
        message: error.message,
        code: error.code,
        id,
        status: error.status,
      })
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      console.error('No user found for id:', id)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('Profile found for id:', id)
    return NextResponse.json({
      success: true,
      profile: data,
    })
  } catch (error) {
    console.error('Public profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
