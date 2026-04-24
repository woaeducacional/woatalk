import { notFound } from 'next/navigation'
import { ClientProfileContent } from './client-profile'

interface UserProfile {
  id: string
  name: string
  email: string
  nickname?: string
  phone?: string
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
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    
    const url = `${baseUrl}/api/user/profile/public?id=${encodeURIComponent(userId)}`
    console.log('Fetching profile from:', url)
    
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
      const text = await response.text()
      console.error(`Profile fetch failed: ${response.status}`, text)
      return null
    }

    const data = await response.json()
    console.log('Profile fetched successfully:', data.profile?.id)
    return data.profile || null
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
