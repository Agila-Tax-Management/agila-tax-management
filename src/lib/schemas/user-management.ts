// src/lib/schemas/user-management.ts
import { z } from "zod";

/* ─── Portal access entry ─────────────────────────────────────────── */

const portalAccessEntrySchema = z.object({
  portal: z.enum([
    "SALES",
    "COMPLIANCE",
    "LIAISON",
    "ACCOUNTING",
    "OPERATIONS_MANAGEMENT",
    "HR",
    "TASK_MANAGEMENT",
    "CLIENT_RELATIONS",
  ]),
  canRead: z.boolean().default(false),
  canWrite: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
});

/* ─── Create user (also creates Employee + Employment for ATMS) ──── */

export const createUserSchema = z.object({
  // User fields
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]),
  active: z.boolean().default(true),

  // Employee fields
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional().default(""),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  gender: z.string().min(1, "Gender is required"),

  // Portal access (assigned on create)
  portalAccess: z.array(portalAccessEntrySchema).optional().default([]),
  employeeLevelId: z.number().int().positive().optional().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/* ─── Update user ──────────────────────────────────────────────────── */

export const updateUserSchema = z.object({
  // User fields
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]),
  active: z.boolean().default(true),

  // Employee fields
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional().default(""),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  gender: z.string().min(1, "Gender is required"),

  // Portal access
  portalAccess: z.array(portalAccessEntrySchema).optional(),
  employeeLevelId: z.number().int().positive().optional().nullable(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/* ─── Shared types for API responses ───────────────────────────────── */

export interface PortalAccessEntry {
  portal: string;
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: number;
    firstName: string;
    middleName: string | null;
    lastName: string;
    employeeNo: string | null;
    phone: string;
    birthDate: string;
    gender: string;
    employment: {
      department: string | null;
      position: string | null;
      employmentType: string | null;
      employmentStatus: string;
      employeeLevel: string | null;
      employeeLevelId: number | null;
      hireDate: string | null;
    } | null;
  } | null;
  portalAccess: PortalAccessEntry[];
}
