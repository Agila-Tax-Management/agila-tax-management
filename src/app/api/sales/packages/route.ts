// src/app/api/sales/packages/route.ts
import { NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import { getSalesActivePackages } from "@/lib/data/sales/services";

/**
 * GET /api/sales/packages
 * Returns all active service packages with their line items.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const packages = await getSalesActivePackages();

  return NextResponse.json({ data: packages });
}
