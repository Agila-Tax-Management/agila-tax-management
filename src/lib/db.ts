import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { prismaQueryInsights } from "@prisma/sqlcommenter-query-insights";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Strip `sslmode` from the connection string so that pg-connection-string does
 * not emit a deprecation warning about 'require'/'prefer'/'verify-ca' being
 * treated as 'verify-full'.  SSL is controlled exclusively by the explicit
 * `ssl` option passed to the Pool constructor below, which already enforces
 * the correct behavior (`rejectUnauthorized: true` in production).
 */
function stripSslMode(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("sslmode");
    return parsed.toString();
  } catch {
    // If the URL can't be parsed (e.g. non-standard format), return as-is
    return url;
  }
}

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL environment variable is not set.");

  const connectionString = stripSslMode(rawUrl);

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    comments: [prismaQueryInsights()],
  });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; 
export default prisma; 