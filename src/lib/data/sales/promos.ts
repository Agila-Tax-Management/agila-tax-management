// src/lib/data/sales/promos.ts
import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/db";

const PROMO_INCLUDE = {
  services: {
    select: { id: true, name: true, serviceRate: true, billingType: true },
  },
} as const;

/**
 * Fetch all promos with linked services.
 * @tag sales-promos
 */
export async function getSalesPromos(activeOnly?: boolean) {
  "use cache";
  cacheLife("hours");
  cacheTag("sales-promos");

  return prisma.promo.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { createdAt: "desc" },
    include: PROMO_INCLUDE,
  });
}
