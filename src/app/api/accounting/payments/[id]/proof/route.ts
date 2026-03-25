// src/app/api/accounting/payments/[id]/proof/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '@/lib/cloudinary';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.payment.findUnique({
    where: { id },
    select: { id: true, proofOfPaymentUrl: true },
  });
  if (!existing) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed' }, { status: 422 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'File must be 5 MB or smaller' }, { status: 422 });

  // Delete the old proof if it exists
  if (existing.proofOfPaymentUrl) {
    const oldPublicId = getPublicIdFromUrl(existing.proofOfPaymentUrl);
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId).catch(() => null);
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadToCloudinary(buffer, 'atms/proof-payments', `payment-proof-${id}`, false);

  const updated = await prisma.payment.update({
    where: { id },
    data: { proofOfPaymentUrl: result.secureUrl },
    select: { proofOfPaymentUrl: true },
  });

  return NextResponse.json({ data: { proofOfPaymentUrl: updated.proofOfPaymentUrl } });
}
