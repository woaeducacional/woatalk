import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { communityService, Reaction, CommentPhrase } from "../services/community.service"
import { supabase } from "../lib/supabaseClient"

async function getUserId(email: string): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.from('users').select('id').eq('email', email).single()
  return data?.id ?? null
}

export async function getFeed(request: NextRequest) {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1', 10)
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)
  const { data, error } = await communityService.getFeed(page, Math.min(limit, 50))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data })
}

export async function deletePost(request: NextRequest, postId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const { error } = await communityService.deletePost(postId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function addReaction(request: NextRequest, postId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = await getUserId(session.user.email)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const { reaction } = await request.json()
  const { error } = await communityService.addReaction(postId, userId, reaction as Reaction)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function removeReaction(request: NextRequest, postId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = await getUserId(session.user.email)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const url = new URL(request.url)
  const reaction = url.searchParams.get('reaction') as Reaction
  if (!reaction) return NextResponse.json({ error: 'Missing reaction' }, { status: 400 })
  const { error } = await communityService.removeReaction(postId, userId, reaction)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function addComment(request: NextRequest, postId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = await getUserId(session.user.email)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const { phrase } = await request.json()
  const { error } = await communityService.addComment(postId, userId, phrase as CommentPhrase)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function removeComment(request: NextRequest, postId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = await getUserId(session.user.email)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const url = new URL(request.url)
  const phrase = url.searchParams.get('phrase') as CommentPhrase
  if (!phrase) return NextResponse.json({ error: 'Missing phrase' }, { status: 400 })
  const { error } = await communityService.removeComment(postId, userId, phrase)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function getRecentActivity() {
  const { data, error } = await communityService.getRecentActivity(5)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data })
}