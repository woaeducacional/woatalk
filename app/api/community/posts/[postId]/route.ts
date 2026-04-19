import { NextRequest } from "next/server"
import { deletePost } from "@/src/controllers/community.controller"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  return await deletePost(request, postId)
}
