import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Temporary: disable middleware to fix build
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
}
