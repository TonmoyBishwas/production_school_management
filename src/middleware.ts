import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge, ROLE_PERMISSIONS } from './lib/auth';

export function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes that don't need auth
  const { pathname } = request.nextUrl;
  
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/login' ||
    pathname === '/' ||
    pathname === '/simple-login' ||
    pathname === '/test-login' ||
    pathname === '/debug' ||
    pathname === '/test-simple' ||
    pathname.startsWith('/api/auth/login')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = verifyTokenEdge(token);
    
    // Check role-based permissions
    const userRole = payload.role;
    const hasAccess = checkRoleAccess(userRole, pathname);
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-school-id', payload.schoolId);
    requestHeaders.set('x-username', payload.username);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

function checkRoleAccess(role: string, pathname: string): boolean {
  // Superadmin can access everything
  if (role === 'superadmin') {
    return true;
  }

  // Check specific role permissions
  const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
  if (!permissions) {
    return false;
  }

  return permissions.some(permission => pathname.startsWith(permission));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (login endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth/login|_next/static|_next/image|favicon.ico).*)',
  ],
};