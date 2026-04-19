import { getRecentActivity } from "@/src/controllers/community.controller"

export async function GET() {
  return await getRecentActivity()
}
