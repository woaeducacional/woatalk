import { NextRequest, NextResponse } from "next/server";
import { commentOnPost } from "@/src/controllers/community.controller";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const resolvedParams = await params;
  return await commentOnPost(request, { params: resolvedParams });
}
