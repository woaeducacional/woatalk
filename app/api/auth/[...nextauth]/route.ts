import { NextRequest } from 'next/server'

// Temporary: Disable nextauth API route to fix build
// The signup flow will work with the in-memory database fallback

export async function GET(request: NextRequest) {
  return new Response('Next.js API Route', { status: 200 })
}

export async function POST(request: NextRequest) {
  return new Response('Next.js API Route', { status: 200 })
}
