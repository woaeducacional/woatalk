import { getRecentActivity } from "@/src/services/community.controller"

export async function GET() {
  return await getRecentActivity()
}
