// src/lib/schemas/user-management.ts
import { z } from "zod";

/* ─── Portal access entry ─────────────────────────────────────────── */

const portalAccessEntrySchema = z.object({
  portal: z.enum([
    "SALES",
    "COMPLIANCE",
    "LIAISON",
    "ACCOUNTING",
    "ACCOUNT_OFFICER",
    "HR",
  ]),
  canRead: z.boolean().default(false),
  canWrite: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
});

/* ─── Create user ──────────────────────────────────────────────────── */

export const createUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]),
    active: z.boolean().default(true),
    portalAccess: z.array(portalAccessEntrySchema).optional(),
  })
  .refine(
    (data) => {
      if (data.role === "EMPLOYEE") {
        return (
          data.portalAccess !== undefined && data.portalAccess.length > 0
        );
      }
      return true;
    },
    {
      message: "Portal access is required for employees",
      path: ["portalAccess"],
    }
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;

/* ─── Update user ──────────────────────────────────────────────────── */

export const updateUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional()
      .or(z.literal("")),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]),
    active: z.boolean().default(true),
    portalAccess: z.array(portalAccessEntrySchema).optional(),
  })
  .refine(
    (data) => {
      if (data.role === "EMPLOYEE") {
        return (
          data.portalAccess !== undefined && data.portalAccess.length > 0
        );
      }
      return true;
    },
    {
      message: "Portal access is required for employees",
      path: ["portalAccess"],
    }
  );

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
    lastName: string;
    employeeNo: string | null;
  } | null;
  portalAccess: PortalAccessEntry[];
}
