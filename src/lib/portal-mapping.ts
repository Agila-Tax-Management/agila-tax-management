// src/lib/portal-mapping.ts
import type { AppPortal } from "@/generated/prisma/client";

/**
 * Maps frontend route paths to AppPortal enum values.
 * Used for filtering sidebar/dashboard items and middleware access control.
 */
export const PORTAL_ROUTE_MAP: Record<string, AppPortal> = {
  '/portal/sales': 'SALES',
  '/portal/compliance': 'COMPLIANCE',
  '/portal/liaison': 'LIAISON',
  '/portal/accounting-and-finance': 'ACCOUNTING',
  '/portal/account-officer': 'CLIENT_RELATIONS',
  '/portal/hr': 'HR',
  '/portal/task-management': 'TASK_MANAGEMENT',
  '/portal/operation': 'OPERATIONS_MANAGEMENT',
  '/portal/client-gateway': 'CLIENT_RELATIONS',
};

/**
 * Extracts the AppPortal enum value from a given pathname.
 * Matches exact routes or prefixes (e.g., /portal/sales/leads → SALES).
 * 
 * @param pathname - The request pathname (e.g., "/portal/sales/leads")
 * @returns The matched AppPortal or null if no match
 */
export function getPortalFromRoute(pathname: string): AppPortal | null {
  for (const [route, portal] of Object.entries(PORTAL_ROUTE_MAP)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return portal;
    }
  }
  return null;
}
