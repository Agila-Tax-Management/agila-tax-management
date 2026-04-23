// src/lib/data/sales/services.ts
import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/db";

const SERVICE_INCLUDE = {
  governmentOffices: {
    select: { id: true, code: true, name: true },
  },
  cities: {
    select: { id: true, name: true, province: true },
  },
  inclusions: {
    select: { id: true, name: true, category: true },
  },
  taskTemplates: {
    select: { taskTemplate: { select: { id: true, name: true } } },
  },
  promos: {
    select: { id: true, name: true },
  },
} as const;

/**
 * Fetch all services (optionally filtered by billingType/archived).
 * @tag sales-services
 */
export async function getSalesServices(
  billingType?: "RECURRING" | "ONE_TIME" | null,
  archived?: boolean,
) {
  "use cache";
  cacheLife("hours");
  cacheTag("sales-services");

  return prisma.service.findMany({
    where: {
      ...(billingType ? { billingType } : {}),
      ...(!archived ? { status: { not: "ARCHIVED" } } : {}),
    },
    orderBy: { name: "asc" },
    include: SERVICE_INCLUDE,
  });
}

const SERVICE_PACKAGES_INCLUDE = {
  items: {
    include: {
      service: {
        select: {
          id: true,
          code: true,
          name: true,
          billingType: true,
          serviceRate: true,
        },
      },
    },
  },
} as const;

/**
 * Fetch all service packages (admin management — no status filter).
 * @tag sales-service-packages
 */
export async function getSalesServicePackages() {
  "use cache";
  cacheLife("hours");
  cacheTag("sales-service-packages");

  return prisma.servicePackage.findMany({
    orderBy: { name: "asc" },
    include: SERVICE_PACKAGES_INCLUDE,
  });
}

/**
 * Fetch active service packages (for quote builder / public listing).
 * @tag sales-packages
 */
export async function getSalesActivePackages() {
  "use cache";
  cacheLife("hours");
  cacheTag("sales-packages");

  return prisma.servicePackage.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    include: {
      items: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              billingType: true,
              frequency: true,
              serviceRate: true,
              isVatable: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });
}
