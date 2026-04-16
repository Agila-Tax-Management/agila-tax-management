// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { auth } from "./lib/auth";
import prisma from "./lib/db";
import { getPortalFromRoute } from "./lib/portal-mapping";

/**
 * Next.js 16+ middleware (proxy) for authentication and role-based access control.
 * 
 * - Redirects unauthenticated users to /sign-in
 * - SUPER_ADMIN: Full access to all routes including /dashboard/settings
 * - ADMIN: Access to all portals but NOT /dashboard/settings
 * - EMPLOYEE: Access only to portals they have been granted (via EmployeeAppAccess)
 */
export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // No session cookie → redirect to sign-in
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const pathname = request.nextUrl.pathname;

  // ─── Settings Access Control ───
  // Only SUPER_ADMIN can access /dashboard/settings
  if (pathname.startsWith('/dashboard/settings')) {
    try {
      const reqHeaders = await headers();
      const currentSession = await auth.api.getSession({ headers: reqHeaders });
      
      if (!currentSession) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: currentSession.user.id },
        select: { role: true, active: true },
      });

      if (!dbUser || !dbUser.active) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }

      // Only SUPER_ADMIN can access settings
      if (dbUser.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // ─── Portal Access Control ───
  // Check if user has access to the requested portal
  if (pathname.startsWith('/portal/')) {
    const portal = getPortalFromRoute(pathname);
    
    if (portal) {
      try {
        const reqHeaders = await headers();
        const currentSession = await auth.api.getSession({ headers: reqHeaders });
        
        if (!currentSession) {
          return NextResponse.redirect(new URL('/sign-in', request.url));
        }

        const dbUser = await prisma.user.findUnique({
          where: { id: currentSession.user.id },
          select: { role: true, active: true },
        });

        if (!dbUser || !dbUser.active) {
          return NextResponse.redirect(new URL('/sign-in', request.url));
        }

        const role = dbUser.role;

        // SUPER_ADMIN and ADMIN have access to all portals
        if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
          return NextResponse.next();
        }

        // EMPLOYEE — check EmployeeAppAccess
        if (role === 'EMPLOYEE') {
          const employee = await prisma.employee.findUnique({
            where: { userId: currentSession.user.id },
            select: {
              appAccess: {
                where: {
                  app: { name: portal },
                },
                select: { role: true },
              },
            },
          });

          // No employee record or no access to this portal → redirect to dashboard
          if (!employee || employee.appAccess.length === 0) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }

          // Has access (any role: VIEWER, USER, ADMIN, SETTINGS)
          return NextResponse.next();
        }

        // Unknown role → redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  // All other routes under /dashboard and /portal → allow if session exists
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/portal/:path*",
  ],
};
