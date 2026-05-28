import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    p => pathname === p || pathname.startsWith(`${p}/`)
  );
  const token = request.cookies.get('accessToken')?.value
    ?? request.headers.get('authorization')?.replace('Bearer ', '');

  if (!isPublic && !token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && token && !pathname.startsWith('/api/')) {
    const chatUrl = request.nextUrl.clone();
    chatUrl.pathname = '/chat';
    return NextResponse.redirect(chatUrl);
  }

  return NextResponse.next();
}

export const config = {
  // /api/ 경로는 rewrites로 백엔드에 프록시되므로 미들웨어 제외
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|api/).*)'],
};
