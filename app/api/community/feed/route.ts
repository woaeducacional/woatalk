import { NextRequest } from "next/server";
import { getFeed } from "@/src/controllers/community.controller";

export async function GET(request: NextRequest) {
  return await getFeed(request);
}
