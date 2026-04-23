import { NextRequest } from "next/server"
import { addComment, removeComment } from "@/src/services/community.controller"

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  return await addComment(request, postId)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  return await removeComment(request, postId)
}
