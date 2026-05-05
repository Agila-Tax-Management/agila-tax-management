// src/app/api/v1/clients/[id]/hr-settings/route.ts
//
// GET /api/v1/clients/{id}/hr-settings
// Returns the HR settings for the client (read-only from portal).
//
// Auth: Bearer <ATMS_API_KEY> + X-Client-User-Id header

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyClientAccess } from "@/lib/verify-client-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID." }, { status: 400 });

  const access = await verifyClientAccess(request, clientId);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await prisma.hrSetting.findUnique({
    where: { clientId },
    select: {
      id: true,
      employeeNumberPrefix: true,
      strictOvertimeApproval: true,
      disableLateUndertimeGlobal: true,
      enableAutoTimeOut: true,
      autoTimeOutTime: true,
    },
  });

  return NextResponse.json({ data: setting ?? null });
}
