export interface WOAPlayMaterial {
  id: string
  file_name: string
  file_url: string
}

export interface WOAPlayModule {
  id: string
  position: number
  video_title: string
  video_url: string
  has_practice_video: boolean
  practice_video_url?: string
  materials: WOAPlayMaterial[]
}

export interface WOAPlayCourse {
  id: string
  title: string
  description: string
  cover_url: string
  is_published: boolean
  modules: WOAPlayModule[]
  user_progress: Record<string, string[]>
  created_at: string
  updated_at: string
}

/** Extracts a YouTube video ID from any YouTube URL or embed URL */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/** Normalizes a YouTube URL to embed format */
export function toYouTubeEmbed(url: string): string {
  const id = extractYouTubeId(url)
  if (id) return `https://www.youtube.com/embed/${id}`
  return url
}
