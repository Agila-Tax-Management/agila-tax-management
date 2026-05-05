// src/app/api/v1/clients/[id]/invoices/route.ts
//
// GET /api/v1/clients/{id}/invoices
// Returns invoices for the client (billing history).
//
// Query params:
//   - status: DRAFT | SENT | PAID | OVERDUE | CANCELLED | VOID
//
// Auth: Bearer <ATMS_API_KEY> + X-Client-User-Id header

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyClientAccess } from "@/lib/verify-client-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED", "VOID"] as const;
type InvoiceStatus = (typeof VALID_STATUSES)[number];

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID." }, { status: 400 });

  const access = await verifyClientAccess(request, clientId);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statusParam = request.nextUrl.searchParams.get("status");
  const statusFilter =
    statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as InvoiceStatus)
      : undefined;

  const invoices = await prisma.invoice.findMany({
    where: {
      clientId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { issueDate: "desc" },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      issueDate: true,
      dueDate: true,
      totalAmount: true,
      balanceDue: true,
      subTotal: true,
      taxAmount: true,
      discountAmount: true,
      notes: true,
      items: {
        select: {
          id: true,
          description: true,
          quantity: true,
          unitPrice: true,
          total: true,
        },
      },
      payments: {
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          paymentDate: true,
          method: true,
        },
      },
    },
  });

  return NextResponse.json({
    data: invoices.map((inv) => ({
      ...inv,
      totalAmount: Number(inv.totalAmount),
      balanceDue: Number(inv.balanceDue),
      subTotal: Number(inv.subTotal),
      taxAmount: Number(inv.taxAmount),
      discountAmount: Number(inv.discountAmount),
      items: inv.items.map((it) => ({
        ...it,
        unitPrice: Number(it.unitPrice),
        total: Number(it.total),
      })),
      payments: inv.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    })),
  });
}
