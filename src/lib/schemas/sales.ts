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
  // Scheduling & Engagements
  isCallRequest: z.boolean().default(false).optional(),
  phoneCallSchedule: z.string().datetime({ offset: true }).optional().nullable(),
  isOfficeVisit: z.boolean().default(false).optional(),
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
  // Scheduling & Engagements
  isCallRequest: z.boolean().optional(),
  phoneCallSchedule: z.string().datetime({ offset: true }).optional().nullable(),
  isOfficeVisit: z.boolean().optional(),
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
