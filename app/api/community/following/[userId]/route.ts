import { NextRequest, NextResponse } from "next/server";
import { getFollowing } from "@/src/controllers/community.controller";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const resolvedParams = await params;
  return await getFollowing(request, { params: resolvedParams });
}
