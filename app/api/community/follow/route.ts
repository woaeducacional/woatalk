import { NextRequest, NextResponse } from "next/server";
import { followUser } from "@/src/controllers/community.controller";

export async function POST(request: NextRequest) {
  return await followUser(request);
}
