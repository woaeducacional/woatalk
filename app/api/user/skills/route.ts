import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Each mission group index maps to a skill
// Group 0 → Listening (Block1: video + listen-repeat)
// Group 1 → Vocabulary (Block2: vocabulary matching)
// Group 2 → Speaking (Block3: sentence building + speak)
// Group 3 → Writing (Block4: expressions + fill)
// Group 4 → Reading (Block5: free expression prompt)
const SKILL_NAMES = ['Listening', 'Vocabulary', 'Speaking', 'Writing', 'Reading']

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Fetch all journey phases with their mission_groups
  const { data: phases } = await supabase
    .from('journey_content')
    .select('phase_id, mission_groups')
    .order('phase_id', { ascending: true })

  // Fetch user progress
  const { data: user } = await supabase
    .from('users')
    .select('journey_progress')
    .eq('id', session.user.id)
    .single()

  const journeyProgress: Record<string, number[]> = user?.journey_progress ?? {}
  const allPhases = phases ?? []

  // For each skill (group index 0-4):
  // total = phases that have at least (index+1) mission groups
  // completed = phases where user has completed that group index
  const skills = SKILL_NAMES.map((name, groupIndex) => {
    const totalPhases = allPhases.filter((p) => {
      const groups = Array.isArray(p.mission_groups) ? p.mission_groups : []
      return groups.length > groupIndex
    })

    const completedCount = totalPhases.filter((p) => {
      const completedGroups: number[] = Array.isArray(journeyProgress[String(p.phase_id)])
        ? journeyProgress[String(p.phase_id)]
        : []
      return completedGroups.includes(groupIndex)
    }).length

    const total = totalPhases.length
    const value = total > 0 ? Math.round((completedCount / total) * 100) : 0

    return { name, value, completed: completedCount, total }
  })

  return NextResponse.json({ skills })
}
