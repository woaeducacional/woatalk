import { NextRequest } from "next/server"
import { addReaction, removeReaction } from "@/src/services/community.controller"

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  return await addReaction(request, postId)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  return await removeReaction(request, postId)
}
