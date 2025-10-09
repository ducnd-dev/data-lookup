import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Chỉ áp dụng middleware cho các route cần authentication
  const protectedRoutes = ['/']
  const authRoutes = ['/login', '/register']
  
  const { pathname } = request.nextUrl
  
  // Lấy token từ cookie
  const token = request.cookies.get('auth-token')?.value

  // Nếu đang ở trang auth và đã đăng nhập, redirect về home
  if (authRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Nếu đang ở trang protected và chưa đăng nhập, redirect về login
  if (protectedRoutes.includes(pathname) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

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