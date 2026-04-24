import { NextRequest } from "next/server";
import { getFeed } from "@/src/services/community.controller";

export async function GET(request: NextRequest) {
  return await getFeed(request);
}
