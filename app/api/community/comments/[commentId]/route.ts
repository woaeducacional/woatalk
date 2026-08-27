import { NextRequest } from 'next/server'
import { deleteComment } from '@/src/services/community.controller'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params
  return await deleteComment(request, commentId)
}
