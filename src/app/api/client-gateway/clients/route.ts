// src/app/api/client-gateway/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import { getClientGatewayClients } from '@/lib/data/client-gateway/clients';

/**
 * GET /api/client-gateway/clients
 * Returns all clients in a lightweight list format for the Client Gateway module.
 * Delegates to cached data function (tag: client-gateway-clients).
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await getClientGatewayClients();
  return NextResponse.json({ data });
}
