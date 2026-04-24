// src/lib/data/sales/reference.ts
import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/db";

/**
 * Fetch active service inclusions for multi-select / reference dropdowns.
 * @tag sales-service-inclusions
 */
export async function getSalesServiceInclusions() {
  "use cache";
  cacheLife("days");
  cacheTag("sales-service-inclusions");

  return prisma.serviceInclusion.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, description: true, category: true },
  });
}

/**
 * Fetch government offices for dropdown / reference data.
 * @tag sales-government-offices
 */
export async function getSalesGovernmentOffices(includeInactive?: boolean) {
  "use cache";
  cacheLife("days");
  cacheTag("sales-government-offices");

  return prisma.governmentOffice.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true, description: true, isActive: true },
  });
}

/**
 * Fetch cities for dropdown / reference data.
 * @tag sales-cities
 */
export async function getSalesCities(includeInactive?: boolean) {
  "use cache";
  cacheLife("days");
  cacheTag("sales-cities");

  return prisma.city.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, province: true, region: true, zipCode: true, isActive: true },
  });
}

/**
 * Fetch all task templates for service plan template picker.
 * @tag sales-task-templates
 */
export async function getSalesTaskTemplates() {
  "use cache";
  cacheLife("days");
  cacheTag("sales-task-templates");

  return prisma.taskTemplate.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true },
  });
}

/**
 * Fetch all active users for the assigned sales agent dropdown.
 * @tag sales-agents
 */
export async function getSalesAgents() {
  "use cache";
  cacheLife("hours");
  cacheTag("sales-agents");

  return prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" },
  });
}
