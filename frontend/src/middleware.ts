import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Chỉ áp dụng middleware cho các route cần authentication
  const protectedRoutes = ['/']
  const authRoutes = ['/login', '/register']
  
  const { pathname } = request.nextUrl
  
  // Cho phép tất cả các route khác không cần kiểm tra authentication ở middleware level
  // Authentication sẽ được xử lý ở client-side bằng AuthContext
  if (!protectedRoutes.includes(pathname) && !authRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Đối với protected routes và auth routes, chúng ta sẽ để client-side xử lý
  // vì token được lưu trong localStorage, không phải cookies
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}