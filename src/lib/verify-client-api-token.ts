// src/lib/verify-client-api-token.ts
//
// Utility for authenticating server-to-server requests from the external
// client portal against /api/v1/ routes.
//
// Flow:
//   1. External portal sends:  Authorization: Bearer <plaintext_key>
//   2. This utility hashes the key with SHA-256 and looks it up in
//      the client_api_key table (we never store the plaintext).
//   3. Returns the matching ClientApiKey record (with clientUser + assignments)
//      or null if invalid / revoked / expired.

import { createHash } from "crypto";
import prisma from "@/lib/db";
import { NextRequest } from "next/server";

export type ClientApiKeyWithUser = Awaited<
  ReturnType<typeof verifyClientApiToken>
>;

/**
 * Hashes a plaintext API key using SHA-256.
 * Used both at generation time and verification time.
 */
export function hashApiKey(plaintextKey: string): string {
  return createHash("sha256").update(plaintextKey).digest("hex");
}

/**
 * Generates a new plaintext API key with a recognisable prefix.
 * Format: `catms_<32 random hex chars>`
 * The prefix "catms_" stands for "Client ATMS" — easy to identify in logs.
 */
export function generateApiKey(): { plaintext: string; prefix: string; hash: string } {
  const random = createHash("sha256")
    .update(crypto.randomUUID())
    .digest("hex")
    .slice(0, 32);
  const plaintext = `catms_${random}`;
  const prefix = plaintext.slice(0, 12); // "catms_" + first 6 hex chars
  const hash = hashApiKey(plaintext);
  return { plaintext, prefix, hash };
}

/**
 * Verifies the Bearer token from an incoming request.
 * Returns null on any failure (missing, malformed, revoked, expired, disabled).
 * Updates `lastUsedAt` on successful verification (fire-and-forget).
 */
export async function verifyClientApiToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const plaintextKey = authHeader.slice(7).trim();
  if (!plaintextKey) return null;

  const keyHash = hashApiKey(plaintextKey);

  const apiKey = await prisma.clientApiKey.findUnique({
    where: { keyHash },
    include: {
      clientUser: {
        include: {
          assignments: {
            include: { client: true },
          },
        },
      },
    },
  });

  if (!apiKey) return null;
  if (!apiKey.enabled) return null;
  if (apiKey.revokedAt) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Fire-and-forget: update lastUsedAt without blocking the response
  void prisma.clientApiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // Non-critical — never block the request for this
    });

  return apiKey;
}
