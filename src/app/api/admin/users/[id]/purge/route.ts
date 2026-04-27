// src/app/api/admin/users/[id]/purge/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { revalidateTag } from "next/cache";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/admin/users/[id]/purge
 *
 * Permanently and irreversibly deletes a user and ALL associated data.
 * Only SUPER_ADMIN may call this endpoint.
 *
 * Deletion order:
 *  1. Delete non-nullable audit/history records authored by this user
 *     (no cascade defined — must be done manually before the User delete)
 *  2. Nullify nullable FK references pointing to this user
 *  3. Delete the linked Employee record (cascades its children)
 *  4. Delete the User record (Session + Account + ActivityLog + Notification cascade automatically)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Hard delete is SUPER_ADMIN only
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // ── Step 1: Delete non-nullable audit/history records ──────────────
      // These have no onDelete behaviour — must be removed first to avoid FK constraint errors.

      // Lead audit trail authored by this user
      await tx.leadComment.deleteMany({ where: { authorId: id } });
      await tx.leadHistory.deleteMany({ where: { actorId: id } });

      // Task audit trail authored by this user
      await tx.taskConversation.deleteMany({ where: { authorId: id } });
      await tx.taskHistory.deleteMany({ where: { actorId: id } });
      await tx.taskSubtaskHistory.deleteMany({ where: { actorId: id } });

      // Compliance audit trail authored by this user
      await tx.complianceNote.deleteMany({ where: { authorId: id } });
      await tx.ewtItemHistory.deleteMany({ where: { actorId: id } });

      // ── Step 2: Nullify nullable FK references ─────────────────────────

      // CRM client assignments
      await tx.client.updateMany({
        where: { clientRelationOfficerId: id },
        data: { clientRelationOfficerId: null },
      });
      await tx.client.updateMany({
        where: { operationsManagerId: id },
        data: { operationsManagerId: null },
      });

      // Leads assigned to this user
      await tx.lead.updateMany({
        where: { assignedAgentId: id },
        data: { assignedAgentId: null },
      });

      // ClientCompliance default assignees
      await tx.clientCompliance.updateMany({
        where: { processorId: id },
        data: { processorId: null },
      });
      await tx.clientCompliance.updateMany({
        where: { verifierId: id },
        data: { verifierId: null },
      });
      await tx.clientCompliance.updateMany({
        where: { paymentProcessorId: id },
        data: { paymentProcessorId: null },
      });
      await tx.clientCompliance.updateMany({
        where: { paymentApproverId: id },
        data: { paymentApproverId: null },
      });
      await tx.clientCompliance.updateMany({
        where: { finalApproverId: id },
        data: { finalApproverId: null },
      });
      await tx.clientCompliance.updateMany({
        where: { salesOfficerId: id },
        data: { salesOfficerId: null },
      });

      // ComplianceRecord actual/assigned assignees
      await tx.complianceRecord.updateMany({
        where: { assignedProcessorId: id },
        data: { assignedProcessorId: null },
      });
      await tx.complianceRecord.updateMany({
        where: { actualProcessorId: id },
        data: { actualProcessorId: null },
      });
      await tx.complianceRecord.updateMany({
        where: { assignedVerifierId: id },
        data: { assignedVerifierId: null },
      });
      await tx.complianceRecord.updateMany({
        where: { actualVerifierId: id },
        data: { actualVerifierId: null },
      });
      await tx.complianceRecord.updateMany({
        where: { assignedPaymentProcessorId: id },
        data: { assignedPaymentProcessorId: null },
      });
      await tx.complianceRecord.updateMany({
        where: { actualPaymentProcessorId: id },
        data: { actualPaymentProcessorId: null },
      });
      await tx.complianceRecord.updateMany({
        where: { assignedPaymentApproverId: id },
        data: { assignedPaymentApproverId: null },
      });
      await tx.complianceRecord.updateMany({
        where: { actualPaymentApproverId: id },
        data: { actualPaymentApproverId: null },
      });
      await tx.complianceRecord.updateMany({
        where: { assignedFinalApproverId: id },
        data: { assignedFinalApproverId: null },
      });
      await tx.complianceRecord.updateMany({
        where: { actualFinalApproverId: id },
        data: { actualFinalApproverId: null },
      });
      await tx.complianceRecord.updateMany({
        where: { salesOfficerId: id },
        data: { salesOfficerId: null },
      });

      // ComplianceSetting global defaults
      await tx.complianceSetting.updateMany({
        where: { defaultProcessorId: id },
        data: { defaultProcessorId: null },
      });
      await tx.complianceSetting.updateMany({
        where: { defaultVerifierId: id },
        data: { defaultVerifierId: null },
      });
      await tx.complianceSetting.updateMany({
        where: { defaultPaymentProcessorId: id },
        data: { defaultPaymentProcessorId: null },
      });
      await tx.complianceSetting.updateMany({
        where: { defaultPaymentApproverId: id },
        data: { defaultPaymentApproverId: null },
      });
      await tx.complianceSetting.updateMany({
        where: { defaultFinalApproverId: id },
        data: { defaultFinalApproverId: null },
      });
      await tx.complianceSetting.updateMany({
        where: { defaultSalesOfficerId: id },
        data: { defaultSalesOfficerId: null },
      });

      // Job order assignees
      await tx.jobOrder.updateMany({
        where: { assignedAccountManagerId: id },
        data: { assignedAccountManagerId: null },
      });
      await tx.jobOrder.updateMany({
        where: { actualAccountManagerId: id },
        data: { actualAccountManagerId: null },
      });
      await tx.jobOrder.updateMany({
        where: { assignedOperationsManagerId: id },
        data: { assignedOperationsManagerId: null },
      });
      await tx.jobOrder.updateMany({
        where: { actualOperationsManagerId: id },
        data: { actualOperationsManagerId: null },
      });
      await tx.jobOrder.updateMany({
        where: { assignedExecutiveId: id },
        data: { assignedExecutiveId: null },
      });
      await tx.jobOrder.updateMany({
        where: { actualExecutiveId: id },
        data: { actualExecutiveId: null },
      });

      // ── Step 3: Delete the Employee record (cascades its children) ──────
      await tx.employee.deleteMany({ where: { userId: id } });

      // ── Step 4: Delete the User ─────────────────────────────────────────
      // Session, Account, ActivityLog, and Notification cascade automatically.
      await tx.user.delete({ where: { id } });
    });

    // Log to a different actor's log (since this user's logs are gone)
    void logActivity({
      userId: session.user.id,
      action: "DELETED",
      entity: "User",
      entityId: id,
      description: `Permanently deleted user ${user.name} (${user.email}) and all associated data`,
      ...getRequestMeta(request),
    });

    revalidateTag("admin-users-list", "max");
    revalidateTag(`portal-access-${id}`, "max");

    return NextResponse.json({ data: { id } });
  } catch (err: unknown) {
    console.error("[DELETE /api/admin/users/[id]/purge] Error:", err);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
