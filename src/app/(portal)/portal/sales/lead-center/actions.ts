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
      // ── Fetch the lead (with services) inside the transaction ──
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        include: { servicePlans: true, serviceOneTimePlans: true },
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

      // ── Step 1a: Create Client (active) ───────────────────────
      const newClient = await tx.client.create({
        data: {
          portalName,
          businessName,
          businessEntity,
          active: true,
        },
        select: { id: true },
      });

      // ── Step 1b: Create ClientUser (inactive) + assignment ─────
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

      // ── Step 2: Generate invoice number atomically ─────────────
      const year = new Date().getFullYear();
      const invPrefix = `INV-${year}-`;
      const latestInvoice = await tx.invoice.findFirst({
        where: { invoiceNumber: { startsWith: invPrefix } },
        orderBy: { invoiceNumber: 'desc' },
        select: { invoiceNumber: true },
      });
      let nextSeq = 1;
      if (latestInvoice) {
        const parts = latestInvoice.invoiceNumber.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]!, 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      const invoiceNumber = `${invPrefix}${String(nextSeq).padStart(4, '0')}`;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: newClient.id,
          leadId: leadId,
          status: 'UNPAID',
          dueDate,
        },
        select: { id: true },
      });

      // ── Step 2a: One-time service invoice items ────────────────
      let subTotal = 0;

      for (const svc of lead.serviceOneTimePlans) {
        const unitPrice = Number(svc.serviceRate);
        await tx.invoiceItem.create({
          data: {
            invoiceId: newInvoice.id,
            description: svc.name,
            quantity: 1,
            unitPrice,
            total: unitPrice,
          },
        });
        subTotal += unitPrice;
      }

      // ── Step 2b: Recurring subscriptions + invoice items ───────
      const currentMonthLabel = new Date().toLocaleString('en-PH', {
        month: 'long',
        year: 'numeric',
      });

      for (const plan of lead.servicePlans) {
        await tx.clientSubscription.create({
          data: {
            clientId: newClient.id,
            servicePlanId: plan.id,
            agreedRate: plan.serviceRate,
            effectiveDate: new Date(),
            isActive: true,
          },
        });

        const unitPrice = Number(plan.serviceRate);
        await tx.invoiceItem.create({
          data: {
            invoiceId: newInvoice.id,
            description: `${plan.name} — 1st Month`,
            quantity: 1,
            unitPrice,
            total: unitPrice,
            remarks: `Initial month — ${currentMonthLabel}`,
          },
        });
        subTotal += unitPrice;
      }

      // ── Step 2c: Update invoice totals ─────────────────────────
      await tx.invoice.update({
        where: { id: newInvoice.id },
        data: {
          subTotal,
          totalAmount: subTotal,
          balanceDue: subTotal,
        },
      });

      // ── Step 3: Update the lead record ─────────────────────────
      await tx.lead.update({
        where: { id: leadId },
        data: {
          isAccountCreated: true,
          convertedClientId: newClient.id,
        },
      });

      // ── Step 3a: Lead history — ACCOUNT_CREATED ────────────────
      await tx.leadHistory.create({
        data: {
          leadId,
          actorId: session.user.id,
          changeType: 'ACCOUNT_CREATED',
          newValue: `Provisioned Client "${businessName}" and portal user for ${email}`,
        },
      });

      // ── Step 3b: Lead history — INVOICE_GENERATED ──────────────
      await tx.leadHistory.create({
        data: {
          leadId,
          actorId: session.user.id,
          changeType: 'INVOICE_GENERATED',
          newValue: `Generated initial onboarding invoice ${invoiceNumber} — ₱${subTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
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
