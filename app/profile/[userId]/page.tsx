import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'
import { ClientProfileContent } from './client-profile'

interface UserProfile {
  id: string
  name: string
  nickname?: string
  bio?: string
  country?: string
  language?: string
  gender?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
  xp_total?: number
  streak_count?: number
  badges?: string
}

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabaseServer
      .from('users')
      .select('id, name, nickname, bio, country, language, gender, avatar_url, xp_total, streak_count, badges, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Profile fetch error:', error.message)
      return null
    }

    return data ?? null
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const profile = await fetchUserProfile(userId)

  return {
    title: profile ? `${profile.name} - WOA Talk` : 'Perfil - WOA Talk',
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const profile = await fetchUserProfile(userId)

  if (!profile) {
    notFound()
  }

  return <ClientProfileContent profile={profile} />
}
