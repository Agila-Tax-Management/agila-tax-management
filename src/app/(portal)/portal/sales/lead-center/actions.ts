// src/app/(portal)/portal/sales/lead-center/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { hashPassword } from 'better-auth/crypto';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { logActivity } from '@/lib/activity-log';

// ─── Input Schema ────────────────────────────────────────────────
const provisionSchema = z.object({
  leadId: z.number().int().positive(),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  businessName: z.string().min(1, 'Business name is required'),
  businessEntity: z.enum([
    'INDIVIDUAL',
    'SOLE_PROPRIETORSHIP',
    'PARTNERSHIP',
    'CORPORATION',
    'COOPERATIVE',
  ]),
});

export type ProvisionLeadAccountInput = z.infer<typeof provisionSchema>;

type ProvisionResult =
  | { data: { leadId: number; isAccountCreated: true } }
  | { error: string };

// ─── Helper: derive a unique portal slug ─────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ─── Server Action ───────────────────────────────────────────────
export async function provisionLeadAccountAction(
  input: ProvisionLeadAccountInput,
): Promise<ProvisionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: 'Unauthorized' };

  const parsed = provisionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const { leadId, fullName, email, password, businessName, businessEntity } = parsed.data;

  // Pre-flight checks (outside transaction for fast failure)
  const existingUser = await prisma.clientUser.findUnique({ where: { email } });
  if (existingUser) {
    return { error: 'A client portal user with this email already exists.' };
  }

  const hashedPw = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      // ── Fetch the lead inside the transaction ──────────────────
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
      });
      if (!lead) throw new Error('Lead not found');
      if (lead.isAccountCreated) throw new Error('Account has already been provisioned for this lead');

      // ── Step 1: Generate a unique portalName slug ──────────────
      const baseSlug = toSlug(businessName) || 'client';
      let portalName = baseSlug;
      let slugSuffix = 0;
      while (await tx.client.findFirst({ where: { portalName } })) {
        slugSuffix++;
        portalName = `${baseSlug}-${slugSuffix}`;
      }

      // ── Step 1b: Generate unique clientNo (e.g. 2026-0001) and companyCode ──
      const year = new Date().getFullYear();
      const yearPrefix = `${year}-`;

      // clientNo sequence (YEAR-0001) — the human-readable client number
      const latestClientNo = await tx.client.findFirst({
        where: { clientNo: { startsWith: yearPrefix } },
        orderBy: { clientNo: 'desc' },
        select: { clientNo: true },
      });
      let nextClientNoSeq = 1;
      if (latestClientNo?.clientNo) {
        const parts = latestClientNo.clientNo.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]!, 10);
        if (!isNaN(lastSeq)) nextClientNoSeq = lastSeq + 1;
      }
      const clientNo = `${yearPrefix}${String(nextClientNoSeq).padStart(4, '0')}`;

      // companyCode: 4-letter prefix from business name + 3-digit sequence (e.g. ACME-001)
      const codePrefix = (businessName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()) || 'COMP';
      const latestCode = await tx.client.findFirst({
        where: { companyCode: { startsWith: `${codePrefix}-` } },
        orderBy: { companyCode: 'desc' },
        select: { companyCode: true },
      });
      let nextCodeSeq = 1;
      if (latestCode?.companyCode) {
        const parts = latestCode.companyCode.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]!, 10);
        if (!isNaN(lastSeq)) nextCodeSeq = lastSeq + 1;
      }
      const companyCode = `${codePrefix}-${String(nextCodeSeq).padStart(3, '0')}`;

      // ── Step 1c: Create Client (active) ───────────────────────
      const newClient = await tx.client.create({
        data: {
          portalName,
          companyCode,
          clientNo,
          businessName,
          businessEntity,
          active: true,
        },
        select: { id: true },
      });

      // ── Step 1d: Create ClientUser (inactive) + assignment ────
      await tx.clientUser.create({
        data: {
          name: fullName,
          email,
          active: false,
          status: 'INACTIVE',
          emailVerified: false,
          accounts: {
            create: {
              id: `credential-cu-${crypto.randomUUID()}`,
              accountId: email,
              providerId: 'credential',
              password: hashedPw,
            },
          },
          assignments: {
            create: { clientId: newClient.id, role: 'OWNER' },
          },
        },
      });

      // ── Step 1e: Migrate lead invoices to the new client ─────
      await tx.invoice.updateMany({
        where: { leadId },
        data: { clientId: newClient.id, leadId: null },
      });

      // ── Step 2: Update the lead record ────────────────────────
      await tx.lead.update({
        where: { id: leadId },
        data: {
          isAccountCreated: true,
          convertedClientId: newClient.id,
        },
      });

      // ── Step 2a: Lead history — ACCOUNT_CREATED ───────────────
      await tx.leadHistory.create({
        data: {
          leadId,
          actorId: session.user.id,
          changeType: 'ACCOUNT_CREATED',
          newValue: `Provisioned Client "${businessName}" and portal user for ${email}`,
        },
      });
    });

    void logActivity({
      userId: session.user.id,
      action: 'CREATED',
      entity: 'Client',
      entityId: String(leadId),
      description: `Provisioned client account for lead #${leadId} — "${businessName}" (${email})`,
    });

    revalidatePath('/portal/sales/lead-center');

    return { data: { leadId, isAccountCreated: true } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Surface known business-rule errors directly; suppress internal details
    if (
      message === 'Lead not found' ||
      message === 'Account has already been provisioned for this lead'
    ) {
      return { error: message };
    }
    console.error('[provisionLeadAccountAction]', err);
    return { error: 'Failed to provision account. Please try again.' };
  }
}
