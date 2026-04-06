// src/lib/schemas/sales.ts
import { z } from "zod";

/* ─── Government Offices ─────────────────────────────────────────── */

export const createGovernmentOfficeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export const updateGovernmentOfficeSchema = z.object({
  code: z.string().min(1, "Code is required").optional(),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateGovernmentOfficeInput = z.infer<typeof createGovernmentOfficeSchema>;
export type UpdateGovernmentOfficeInput = z.infer<typeof updateGovernmentOfficeSchema>;

/* ─── Cities ─────────────────────────────────────────────────────── */

export const createCitySchema = z.object({
  name: z.string().min(1, "City name is required"),
  province: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export const updateCitySchema = z.object({
  name: z.string().min(1, "City name is required").optional(),
  province: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;

/* ─── Service Inclusions ─────────────────────────────────────────── */

export const createServiceInclusionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
});

/* ─── Service (Unified) ─────────────────────────────────────────── */

export const createServiceSchema = z.object({
  code: z.string().min(1, "Service code is required"),
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  billingType: z.enum(["RECURRING", "ONE_TIME"]).default("RECURRING"),
  frequency: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "SEMI_ANNUALLY", "ANNUALLY", "NONE"])
    .default("MONTHLY"),
  serviceRate: z
    .number({ message: "Service rate is required" })
    .positive("Service rate must be positive"),
  isVatable: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  governmentOfficeIds: z.array(z.number().int().positive()).default([]),
  cityIds: z.array(z.number().int().positive()).default([]),
  inclusionIds: z.array(z.number().int().positive()).default([]),
  taskTemplateIds: z.array(z.number().int().positive()).default([]),
  promoIds: z.array(z.number().int().positive()).default([]),
});

export const updateServiceSchema = z.object({
  code: z.string().min(1, "Service code is required").optional(),
  name: z.string().min(1, "Service name is required").optional(),
  description: z.string().optional().nullable(),
  billingType: z.enum(["RECURRING", "ONE_TIME"]).optional(),
  frequency: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "SEMI_ANNUALLY", "ANNUALLY", "NONE"])
    .optional(),
  serviceRate: z.number().positive("Service rate must be positive").optional(),
  isVatable: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  governmentOfficeIds: z.array(z.number().int().positive()).optional(),
  cityIds: z.array(z.number().int().positive()).optional(),
  inclusionIds: z.array(z.number().int().positive()).optional(),
  taskTemplateIds: z.array(z.number().int().positive()).optional(),
  promoIds: z.array(z.number().int().positive()).optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

/* ─── Service Package ────────────────────────────────────────────── */

export const createServicePackageSchema = z.object({
  code: z.string().min(1, "Package code is required"),
  name: z.string().min(1, "Package name is required"),
  description: z.string().optional(),
  packageRate: z
    .number({ message: "Package rate is required" })
    .positive("Package rate must be positive"),
  isVatable: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  items: z
    .array(
      z.object({
        serviceId: z.number().int().positive(),
        quantity: z.number().int().positive().default(1),
        overrideRate: z.number().min(0).optional().nullable(),
      }),
    )
    .default([]),
});

export const updateServicePackageSchema = z.object({
  code: z.string().min(1, "Package code is required").optional(),
  name: z.string().min(1, "Package name is required").optional(),
  description: z.string().optional().nullable(),
  packageRate: z.number().positive("Package rate must be positive").optional(),
  isVatable: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  items: z
    .array(
      z.object({
        serviceId: z.number().int().positive(),
        quantity: z.number().int().positive().default(1),
        overrideRate: z.number().min(0).optional().nullable(),
      }),
    )
    .optional(),
});

export type CreateServicePackageInput = z.infer<typeof createServicePackageSchema>;
export type UpdateServicePackageInput = z.infer<typeof updateServicePackageSchema>;

/* ─── Promo ──────────────────────────────────────────────────────── */

export const createPromoSchema = z.object({
  name: z.string().min(1, "Promo name is required"),
  description: z.string().optional(),
  code: z.string().optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountRate: z
    .number({ message: "Discount rate is required" })
    .nonnegative("Discount rate cannot be negative"),
  minimumRate: z.number().nonnegative().optional().nullable(),
  maxUsage: z.number().int().positive().optional().nullable(),
  validFrom: z.string().datetime({ offset: true }).optional().nullable(),
  validUntil: z.string().datetime({ offset: true }).optional().nullable(),
  isActive: z.boolean().default(true),
  serviceIds: z.array(z.number().int().positive()).default([]),
});

export const updatePromoSchema = z.object({
  name: z.string().min(1, "Promo name is required").optional(),
  description: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountRate: z.number().nonnegative().optional(),
  minimumRate: z.number().nonnegative().optional().nullable(),
  maxUsage: z.number().int().positive().optional().nullable(),
  validFrom: z.string().datetime({ offset: true }).optional().nullable(),
  validUntil: z.string().datetime({ offset: true }).optional().nullable(),
  isActive: z.boolean().optional(),
  serviceIds: z.array(z.number().int().positive()).optional(),
});

export type CreatePromoInput = z.infer<typeof createPromoSchema>;
export type UpdatePromoInput = z.infer<typeof updatePromoSchema>;

/* ─── Lead Status (Pipeline) ─────────────────────────────────────── */

export const createLeadStatusSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional().nullable(),
  sequence: z.number().int().nonnegative().default(0),
  isDefault: z.boolean().default(false),
  isOnboarding: z.boolean().default(false),
  isConverted: z.boolean().default(false),
});

export const updateLeadStatusSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  color: z.string().optional().nullable(),
  sequence: z.number().int().nonnegative().optional(),
  isDefault: z.boolean().optional(),
  isOnboarding: z.boolean().optional(),
  isConverted: z.boolean().optional(),
});

export type CreateLeadStatusInput = z.infer<typeof createLeadStatusSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

/* ─── Leads ──────────────────────────────────────────────────────── */

export const createLeadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, "Last name is required"),
  businessName: z.string().optional().nullable(),
  contactNumber: z.string().optional().nullable(),
  businessType: z.string().default("Not Specified"),
  leadSource: z.string().default("Manual"),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  statusId: z.number().int().positive().optional(),
  assignedAgentId: z.string().optional().nullable(),
  promoId: z.number().int().positive().optional().nullable(),
  // Scheduling & Engagements
  officeVisitSchedule: z.string().datetime({ offset: true }).optional().nullable(),
  isClientVisit: z.boolean().default(false).optional(),
  clientVisitSchedule: z.string().datetime({ offset: true }).optional().nullable(),
  clientVisitLocation: z.string().optional().nullable(),
  isVirtualMeeting: z.boolean().default(false).optional(),
  virtualMeetingSchedule: z.string().datetime({ offset: true }).optional().nullable(),
  onboardingSchedule: z.string().datetime({ offset: true }).optional().nullable(),
});

export const updateLeadSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, "Last name is required").optional(),
  businessName: z.string().optional().nullable(),
  contactNumber: z.string().optional().nullable(),
  businessType: z.string().optional(),
  leadSource: z.string().optional(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  statusId: z.number().int().positive().optional(),
  assignedAgentId: z.string().optional().nullable(),
  isAccountCreated: z.boolean().optional(),
  // TSA Document
  signedTsaUrl: z.string().url('Invalid URL format').optional().nullable(),
  isSignedTSA: z.boolean().optional(),
  promoId: z.number().int().positive().optional().nullable(),
  // Scheduling & Engagements
  officeVisitSchedule: z.string().datetime({ offset: true }).optional().nullable(),
  isClientVisit: z.boolean().optional(),
  clientVisitSchedule: z.string().datetime({ offset: true }).optional().nullable(),
  clientVisitLocation: z.string().optional().nullable(),
  isVirtualMeeting: z.boolean().optional(),
  virtualMeetingSchedule: z.string().datetime({ offset: true }).optional().nullable(),
  onboardingSchedule: z.string().datetime({ offset: true }).optional().nullable(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
