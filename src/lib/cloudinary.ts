// src/lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

// Configure once using environment variables.
// Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param buffer   - Raw file buffer (e.g. from request.arrayBuffer())
 * @param folder   - Cloudinary folder path (default: "atms/profiles")
 * @param publicId - Optional fixed public_id; if omitted Cloudinary generates one
 * @returns        CloudinaryUploadResult with secureUrl and publicId
 *
 * @example
 * const bytes = await file.arrayBuffer();
 * const result = await uploadToCloudinary(Buffer.from(bytes), 'atms/profiles', `user-${userId}`);
 * // result.secureUrl → "https://res.cloudinary.com/..."
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder = "atms/profiles",
  publicId?: string,
  applyTransform = true,
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder,
      resource_type: "image",
      overwrite: true,
    };

    if (applyTransform) {
      options.transformation = [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ];
    }

    if (publicId) {
      options.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary by its public_id.
 *
 * @param publicId - The Cloudinary public_id of the asset to delete
 * @returns        True if deleted successfully, false otherwise
 *
 * @example
 * await deleteFromCloudinary("atms/profiles/user-abc123");
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
  return result.result === "ok";
}

/**
 * Extract the Cloudinary public_id from a full secure URL.
 * Returns null if the URL is not a valid Cloudinary URL.
 *
 * @example
 * getPublicIdFromUrl("https://res.cloudinary.com/demo/image/upload/v1/atms/profiles/user-abc")
 * // → "atms/profiles/user-abc"
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    // Pattern: .../upload/v{version}/{public_id}.{ext}  OR  .../upload/{public_id}.{ext}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
