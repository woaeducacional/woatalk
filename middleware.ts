import { auth } from '@/auth'

export function middleware(request: any) {
  // This will be extended with route protection logic
  return auth(request)
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
}
