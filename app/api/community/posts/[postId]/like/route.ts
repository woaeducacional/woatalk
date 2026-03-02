import { NextRequest, NextResponse } from "next/server";
import { likePost } from "@/src/controllers/community.controller";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const resolvedParams = await params;
  return await likePost(request, { params: resolvedParams });
}
