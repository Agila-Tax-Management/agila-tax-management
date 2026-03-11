// src/lib/session.ts
import { headers } from "next/headers";
import { auth } from "./auth";
import prisma from "./db";
import type { AppPortal } from "@/generated/prisma/client";

/**
 * Permission flags for a single portal.
 */
export interface PortalPermissions {
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Authenticated session enriched with employee portal access.
 */
export interface SessionWithAccess {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  };
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNo: string | null;
  } | null;
  portalAccess: Record<AppPortal, PortalPermissions>;
}

/** Default permission set — all denied. */
const DENIED: PortalPermissions = {
  canRead: false,
  canWrite: false,
  canEdit: false,
  canDelete: false,
};

/** SUPER_ADMIN — full access to every portal. */
const FULL_ACCESS: PortalPermissions = {
  canRead: true,
  canWrite: true,
  canEdit: true,
  canDelete: true,
};

/** ADMIN — read, write, edit but NO delete. */
const ADMIN_ACCESS: PortalPermissions = {
  canRead: true,
  canWrite: true,
  canEdit: true,
  canDelete: false,
};

/** All portal keys for initialising the access map. */
const ALL_PORTALS: AppPortal[] = [
  "SALES",
  "COMPLIANCE",
  "LIAISON",
  "ACCOUNTING",
  "ACCOUNT_OFFICER",
  "HR",
];

/**
 * Retrieves the current BetterAuth session and enriches it with the
 * employee's portal-level permissions.
 *
 * Returns `null` when there is no valid session (unauthenticated).
 *
 * Usage in API routes:
 * ```ts
 * const session = await getSessionWithAccess();
 * if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * ```
 */
export async function getSessionWithAccess(): Promise<SessionWithAccess | null> {
  const reqHeaders = await headers();
  const currentSession = await auth.api.getSession({ headers: reqHeaders });

  if (!currentSession) return null;

  const { user, session } = currentSession;

  // Fetch user from DB to reliably get role & active status
  // (BetterAuth may strip undeclared fields from session response)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, active: true },
  });
  if (!dbUser) return null;

  const role = dbUser.role;

  // Build portal access map — start with all portals denied
  const portalAccess = Object.fromEntries(
    ALL_PORTALS.map((p) => [p, { ...DENIED }])
  ) as Record<AppPortal, PortalPermissions>;

  let employeeData: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNo: string | null;
  } | null = null;

  if (role === "SUPER_ADMIN") {
    // SUPER_ADMIN gets full access to all portals — no DB lookup needed
    for (const portal of ALL_PORTALS) {
      portalAccess[portal] = { ...FULL_ACCESS };
    }
  } else if (role === "ADMIN") {
    // ADMIN gets read, write, edit on all portals but NO delete
    for (const portal of ALL_PORTALS) {
      portalAccess[portal] = { ...ADMIN_ACCESS };
    }
  } else if (role === "EMPLOYEE") {
    // EMPLOYEE — resolve permissions from EmployeeAppAccess records
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNo: true,
        appAccess: {
          select: {
            canRead: true,
            canWrite: true,
            canEdit: true,
            canDelete: true,
            app: { select: { name: true } },
          },
        },
      },
    });

    if (employee) {
      employeeData = {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeNo: employee.employeeNo,
      };

      for (const access of employee.appAccess) {
        portalAccess[access.app.name] = {
          canRead: access.canRead,
          canWrite: access.canWrite,
          canEdit: access.canEdit,
          canDelete: access.canDelete,
        };
      }
    }
  }
  // CLIENT role — all portals remain denied (default)

  // For SUPER_ADMIN / ADMIN, still try to load employee profile if linked
  if ((role === "SUPER_ADMIN" || role === "ADMIN") && !employeeData) {
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNo: true,
      },
    });

    if (employee) {
      employeeData = employee;
    }
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
    },
    session: {
      id: session.id,
      token: session.token,
      expiresAt: session.expiresAt,
    },
    employee: employeeData,
    portalAccess,
  };
}

/**
 * Quick helper — checks whether the current session has a specific
 * permission on a given portal.
 *
 * Returns `false` when unauthenticated or the employee has no access.
 *
 * Usage:
 * ```ts
 * if (!(await hasPortalPermission("HR", "canEdit"))) {
 *   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 * }
 * ```
 */
export async function hasPortalPermission(
  portal: AppPortal,
  permission: keyof PortalPermissions
): Promise<boolean> {
  const session = await getSessionWithAccess();
  if (!session) return false;
  return session.portalAccess[portal]?.[permission] ?? false;
}

/**
 * Require a valid session with a specific portal permission.
 * Throws a plain object `{ error, status }` when denied — the caller
 * can forward it straight into `NextResponse.json()`.
 */
export async function requirePortalPermission(
  portal: AppPortal,
  permission: keyof PortalPermissions
): Promise<SessionWithAccess> {
  const session = await getSessionWithAccess();
  if (!session) {
    throw { error: "Unauthorized", status: 401 };
  }
  if (!session.portalAccess[portal]?.[permission]) {
    throw { error: "Forbidden — insufficient portal permissions", status: 403 };
  }
  return session;
}
