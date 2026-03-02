import { NextRequest, NextResponse } from "next/server";
import { createPost } from "@/src/controllers/community.controller";

export async function POST(request: NextRequest) {
  return await createPost(request);
}
