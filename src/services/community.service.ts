import { supabase } from '../lib/supabaseClient'

export type PostType = 'badge_earned' | 'streak_milestone' | 'journey_completed' | 'block_completed' | 'xp_milestone'
export type Reaction = 'heart'
export type CommentPhrase = 'congrats' | 'amazing' | 'onfire' | 'inspiring'

class CommunityService {
  private db() {
    if (!supabase) throw new Error('Supabase not initialized')
    return supabase
  }

  async createPost(userId: string, postType: PostType, payload: Record<string, unknown>) {
    return this.db().from('community_posts').insert({ user_id: userId, post_type: postType, payload }).select().single()
  }

  async getFeed(page = 1, limit = 20) {
    const from = (page - 1) * limit
    const { data: posts, error } = await this.db()
      .from('community_posts')
      .select('*, users!community_posts_user_id_fkey(name, email)')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (error || !posts) return { data: posts, error }

    const postIds = posts.map((p: { id: string }) => p.id)
    const [{ data: reactions }, { data: comments }] = await Promise.all([
      this.db().from('community_reactions').select('post_id, reaction, user_id').in('post_id', postIds),
      this.db().from('community_comments').select('post_id, phrase, user_id, users!community_comments_user_id_fkey(name)').in('post_id', postIds),
    ])

    const reactionMap: Record<string, { reaction: string; user_id: string }[]> = {}
    for (const r of reactions ?? []) {
      if (!reactionMap[r.post_id]) reactionMap[r.post_id] = []
      reactionMap[r.post_id].push(r)
    }
    const commentMap: Record<string, { phrase: string; user_id: string; user_name?: string }[]> = {}
    for (const c of comments ?? []) {
      if (!commentMap[c.post_id]) commentMap[c.post_id] = []
      const row = c as unknown as { post_id: string; phrase: string; user_id: string; users?: { name: string } }
      commentMap[row.post_id].push({ phrase: row.phrase, user_id: row.user_id, user_name: row.users?.name })
    }

    const enriched = posts.map((p: Record<string, unknown>) => ({
      ...p,
      reactions: reactionMap[p.id as string] ?? [],
      comments: commentMap[p.id as string] ?? [],
    }))
    return { data: enriched, error: null }
  }

  async addReaction(postId: string, userId: string, reaction: Reaction) {
    return this.db().from('community_reactions').upsert({ post_id: postId, user_id: userId, reaction }, { onConflict: 'post_id,user_id,reaction' })
  }

  async removeReaction(postId: string, userId: string, reaction: Reaction) {
    return this.db().from('community_reactions').delete().match({ post_id: postId, user_id: userId, reaction })
  }

  async addComment(postId: string, userId: string, phrase: CommentPhrase) {
    return this.db().from('community_comments').upsert({ post_id: postId, user_id: userId, phrase }, { onConflict: 'post_id,user_id,phrase' })
  }

  async removeComment(postId: string, userId: string, phrase: CommentPhrase) {
    return this.db().from('community_comments').delete().match({ post_id: postId, user_id: userId, phrase })
  }

  async deletePost(postId: string) {
    return this.db().from('community_posts').delete().eq('id', postId)
  }

  async getRecentActivity(limit = 5) {
    return this.db()
      .from('community_posts')
      .select('id, post_type, payload, created_at, users!community_posts_user_id_fkey(id, name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit)
  }

  async getRankings() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [{ data: xpHistory }, { data: streakRanking }] = await Promise.all([
      this.db()
        .from('xp_history')
        .select('user_id, amount, users!xp_history_user_id_fkey(id, name)')
        .gte('created_at', weekAgo),
      this.db()
        .from('users')
        .select('id, name, streak_count')
        .order('streak_count', { ascending: false })
        .gt('streak_count', 0)
        .limit(10),
    ])

    // Aggregate weekly XP per user
    const map: Record<string, { id: string; name: string; xp_total: number }> = {}
    for (const row of xpHistory ?? []) {
      const u = (row as unknown as { users: { id: string; name: string } }).users
      if (!u?.id) continue
      if (!map[u.id]) map[u.id] = { id: u.id, name: u.name, xp_total: 0 }
      map[u.id].xp_total += row.amount
    }
    const xpRanking = Object.values(map)
      .sort((a, b) => b.xp_total - a.xp_total)
      .slice(0, 10)

    return { xpRanking, streakRanking: streakRanking ?? [] }
  }
}

export const communityService = new CommunityService()