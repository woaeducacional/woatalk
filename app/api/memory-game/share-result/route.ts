import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { score, matchedCount, attempts, totalCards } = await req.json()

    // Create post content
    const postContent = `🎮 Completei o WOA Memory com uma pontuação de ${score} pontos! 💪\n\n✅ Encontrei todos os ${matchedCount}/${totalCards} pares em ${attempts} tentativas\n\n💎 Este é um recurso PREMIUM — Faça o upgrade agora e teste suas habilidades! 🚀`

    // Save post to community
    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: session.user.id,
        content: postContent,
        post_type: 'memory_game_result',
        metadata: {
          score,
          matchedCount,
          totalCards,
          attempts,
        },
      })
      .select()

    if (error) {
      console.error('Error creating post:', error)
      return NextResponse.json({ error: 'Failed to share result' }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Error in share-result:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
