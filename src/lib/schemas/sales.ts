// src/lib/schemas/sales.ts
import { z } from "zod";

/* ─── Government Offices ─────────────────────────────────────────── */

export const createGovernmentOfficeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

/* ─── Cities ─────────────────────────────────────────────────────── */

export const createCitySchema = z.object({
  name: z.string().min(1, "City name is required"),
  province: z.string().optional(),
  region: z.string().optional(),
  zipCode: z.string().optional(),
});

/* ─── Service Inclusions ─────────────────────────────────────────── */

export const createServiceInclusionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
});

/* ─── Service Plan (Recurring) ───────────────────────────────────── */

export const createServicePlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  recurring: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).default("MONTHLY"),
  serviceRate: z
    .number({ message: "Service rate is required" })
    .positive("Service rate must be positive"),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  governmentOfficeIds: z.array(z.number().int().positive()).default([]),
  cityIds: z.array(z.number().int().positive()).default([]),
  inclusionIds: z.array(z.number().int().positive()).default([]),
  taskTemplateId: z.number().int().positive().optional().nullable(),
  promoIds: z.array(z.number().int().positive()).default([]),
});

export const updateServicePlanSchema = z.object({
  name: z.string().min(1, "Plan name is required").optional(),
  description: z.string().optional().nullable(),
  recurring: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  serviceRate: z.number().positive("Service rate must be positive").optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  governmentOfficeIds: z.array(z.number().int().positive()).optional(),
  cityIds: z.array(z.number().int().positive()).optional(),
  inclusionIds: z.array(z.number().int().positive()).optional(),
  taskTemplateId: z.number().int().positive().optional().nullable(),
  promoIds: z.array(z.number().int().positive()).optional(),
});

export type CreateServicePlanInput = z.infer<typeof createServicePlanSchema>;
export type UpdateServicePlanInput = z.infer<typeof updateServicePlanSchema>;

/* ─── Service One-Time ───────────────────────────────────────────── */

export const createServiceOneTimeSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  serviceRate: z
    .number({ message: "Service rate is required" })
    .positive("Service rate must be positive"),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  governmentOfficeIds: z.array(z.number().int().positive()).default([]),
  cityIds: z.array(z.number().int().positive()).default([]),
  inclusionIds: z.array(z.number().int().positive()).default([]),
  taskTemplateId: z.number().int().positive().optional().nullable(),
  promoIds: z.array(z.number().int().positive()).default([]),
});

export const updateServiceOneTimeSchema = z.object({
  name: z.string().min(1, "Service name is required").optional(),
  description: z.string().optional().nullable(),
  serviceRate: z.number().positive("Service rate must be positive").optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  governmentOfficeIds: z.array(z.number().int().positive()).optional(),
  cityIds: z.array(z.number().int().positive()).optional(),
  inclusionIds: z.array(z.number().int().positive()).optional(),
  taskTemplateId: z.number().int().positive().optional().nullable(),
  promoIds: z.array(z.number().int().positive()).optional(),
});

export type CreateServiceOneTimeInput = z.infer<typeof createServiceOneTimeSchema>;
export type UpdateServiceOneTimeInput = z.infer<typeof updateServiceOneTimeSchema>;

/* ─── Promo ──────────────────────────────────────────────────────── */

export const createPromoSchema = z.object({
  name: z.string().min(1, "Promo name is required"),
  description: z.string().optional(),
  code: z.string().optional().nullable(),
  promoFor: z.enum(["SERVICE_PLAN", "SERVICE_ONE_TIME", "BOTH"]).default("BOTH"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountRate: z
    .number({ message: "Discount rate is required" })
    .nonnegative("Discount rate cannot be negative"),
  minimumRate: z.number().nonnegative().optional().nullable(),
  maxUsage: z.number().int().positive().optional().nullable(),
  validFrom: z.string().datetime({ offset: true }).optional().nullable(),
  validUntil: z.string().datetime({ offset: true }).optional().nullable(),
  isActive: z.boolean().default(true),
  servicePlanIds: z.array(z.number().int().positive()).default([]),
  serviceOneTimePlanIds: z.array(z.number().int().positive()).default([]),
});

export const updatePromoSchema = z.object({
  name: z.string().min(1, "Promo name is required").optional(),
  description: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  promoFor: z.enum(["SERVICE_PLAN", "SERVICE_ONE_TIME", "BOTH"]).optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountRate: z.number().nonnegative().optional(),
  minimumRate: z.number().nonnegative().optional().nullable(),
  maxUsage: z.number().int().positive().optional().nullable(),
  validFrom: z.string().datetime({ offset: true }).optional().nullable(),
  validUntil: z.string().datetime({ offset: true }).optional().nullable(),
  isActive: z.boolean().optional(),
  servicePlanIds: z.array(z.number().int().positive()).optional(),
  serviceOneTimePlanIds: z.array(z.number().int().positive()).optional(),
});

export type CreatePromoInput = z.infer<typeof createPromoSchema>;
export type UpdatePromoInput = z.infer<typeof updatePromoSchema>;
