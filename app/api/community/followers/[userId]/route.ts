import { NextRequest, NextResponse } from "next/server";
import { getFollowers } from "@/src/controllers/community.controller";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const resolvedParams = await params;
  return await getFollowers(request, { params: resolvedParams });
}
