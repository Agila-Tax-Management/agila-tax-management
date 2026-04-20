// src/app/api/profile/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAccess } from "@/lib/session";
import { uploadToCloudinary, getPublicIdFromUrl, deleteFromCloudinary } from "@/lib/cloudinary";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import prisma from "@/lib/db";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the 5 MB size limit." },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Use user-{id} as the fixed public_id so re-uploads overwrite the previous image.
  const publicId = `user-${session.user.id}`;

  let uploadResult;
  try {
    uploadResult = await uploadToCloudinary(buffer, "atms/profiles", publicId);
  } catch {
    return NextResponse.json(
      { error: "Failed to upload image. Please try again." },
      { status: 500 },
    );
  }

  // Delete the old avatar from Cloudinary if it exists and differs from the new one.
  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  if (existingUser?.image) {
    const oldPublicId = getPublicIdFromUrl(existingUser.image);
    if (oldPublicId && oldPublicId !== uploadResult.publicId) {
      // Fire-and-forget — failure here should not block the response.
      void deleteFromCloudinary(oldPublicId);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: { image: uploadResult.secureUrl },
    select: { id: true, image: true },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "User",
    entityId: updatedUser.id,
    description: `Updated profile picture for ${session.user.name}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { imageUrl: updatedUser.image } });
}
