// src/lib/lead-history.ts
/**
 * Reusable utility for creating LeadHistory entries.
 * Call with `void logLeadHistory(...)` so it never blocks the response.
 */
import prisma from "@/lib/db";

export type LeadChangeType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "DETAILS_UPDATED"
  | "SCHEDULE_UPDATED"
  | "INVOICE_GENERATED"
  | "CONTRACT_GENERATED"
  | "CONTRACT_SIGNED"
  | "TSA_GENERATED"
  | "TSA_SIGNED"
  | "JOB_ORDER_GENERATED"
  | "ACCOUNT_CREATED"
  | "CONVERTED";

interface LogLeadHistoryOptions {
  leadId: number;
  actorId: string;
  changeType: LeadChangeType;
  oldValue?: string | null;
  newValue?: string | null;
}

export async function logLeadHistory({
  leadId,
  actorId,
  changeType,
  oldValue,
  newValue,
}: LogLeadHistoryOptions): Promise<void> {
  await prisma.leadHistory.create({
    data: {
      leadId,
      actorId,
      changeType,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
    },
  });
}
