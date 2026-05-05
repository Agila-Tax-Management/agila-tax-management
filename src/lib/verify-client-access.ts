// src/lib/verify-client-access.ts
//
// Shared guard for all /api/v1/clients/[id]/ routes.
//
// Every portal request must carry:
//   Authorization: Bearer <ATMS_API_KEY>   ← system API key
//   X-Client-User-Id: <ClientUser.id>      ← logged-in portal user
//
// This utility:
//   1. Verifies the API key is valid (delegates to verifyClientApiToken)
//   2. Reads X-Client-User-Id from the request headers
//   3. Checks the user has a ClientUserAssignment for the requested clientId
//   4. Returns the assignment (which includes the role) or null if unauthorized

import { NextRequest } from "next/server";
import { verifyClientApiToken } from "@/lib/verify-client-api-token";
import prisma from "@/lib/db";

export type ClientAccessResult = {
  clientUserId: string;
  clientId: number;
  role: "OWNER" | "ADMIN" | "EMPLOYEE" | "VIEWER";
};

/**
 * Verifies that the incoming request:
 *   - Has a valid system API key
 *   - Has a X-Client-User-Id header that maps to an active assignment for clientId
 *
 * Returns the access result (userId, clientId, role) or null if unauthorized.
 */
export async function verifyClientAccess(
  request: NextRequest,
  clientId: number
): Promise<ClientAccessResult | null> {
  const apiKey = await verifyClientApiToken(request);
  if (!apiKey) return null;

  const clientUserId = request.headers.get("x-client-user-id");
  if (!clientUserId) return null;

  const assignment = await prisma.clientUserAssignment.findUnique({
    where: { clientUserId_clientId: { clientUserId, clientId } },
    select: { clientUserId: true, clientId: true, role: true },
  });

  if (!assignment) return null;

  return {
    clientUserId: assignment.clientUserId,
    clientId: assignment.clientId,
    role: assignment.role as ClientAccessResult["role"],
  };
}

/**
 * Returns true only if the role is OWNER or ADMIN (write-capable).
 */
export function canWrite(role: ClientAccessResult["role"]): boolean {
  return role === "OWNER" || role === "ADMIN";
}
