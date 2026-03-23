// src/lib/schemas/hr.ts
import { z } from "zod";

/* ─── Departments ─────────────────────────────────────────────────── */

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required").optional(),
  description: z.string().optional(),
});

/* ─── Positions ───────────────────────────────────────────────────── */

export const createPositionSchema = z.object({
  title: z.string().min(1, "Position title is required"),
  description: z.string().optional(),
  departmentId: z.number().int().positive("Department is required"),
});

export const updatePositionSchema = z.object({
  title: z.string().min(1, "Position title is required").optional(),
  description: z.string().optional(),
  departmentId: z.number().int().positive().optional(),
});

/* ─── Employee Identity (Step 1) ─────────────────────────────────── */

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, "Last name is required"),
  nameExtension: z.string().optional().nullable(),
  birthDate: z.string().min(1, "Birth date is required"),
  placeOfBirth: z.string().optional().nullable(),
  gender: z.string().min(1, "Gender is required"),
  civilStatus: z.string().optional().nullable(),
  citizenship: z.string().optional().nullable(),
  phone: z.string().min(1, "Phone is required"),
  personalEmail: z.string().email("Invalid personal email").optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  employeeNo: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  // Current address
  currentStreet: z.string().optional().nullable(),
  currentBarangay: z.string().optional().nullable(),
  currentCity: z.string().optional().nullable(),
  currentProvince: z.string().optional().nullable(),
  currentZip: z.string().optional().nullable(),
  // Permanent address
  permanentStreet: z.string().optional().nullable(),
  permanentBarangay: z.string().optional().nullable(),
  permanentCity: z.string().optional().nullable(),
  permanentProvince: z.string().optional().nullable(),
  permanentZip: z.string().optional().nullable(),
  // Education
  educationalBackground: z.string().optional().nullable(),
  school: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  yearGraduated: z.string().optional().nullable(),
  certifications: z.string().optional().nullable(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, "Last name is required").optional(),
  nameExtension: z.string().optional().nullable(),
  birthDate: z.string().optional(),
  placeOfBirth: z.string().optional().nullable(),
  gender: z.string().optional(),
  civilStatus: z.string().optional().nullable(),
  citizenship: z.string().optional().nullable(),
  phone: z.string().optional(),
  personalEmail: z.string().email("Invalid personal email").optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  employeeNo: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  active: z.boolean().optional(),
  // Current address
  currentStreet: z.string().optional().nullable(),
  currentBarangay: z.string().optional().nullable(),
  currentCity: z.string().optional().nullable(),
  currentProvince: z.string().optional().nullable(),
  currentZip: z.string().optional().nullable(),
  // Permanent address
  permanentStreet: z.string().optional().nullable(),
  permanentBarangay: z.string().optional().nullable(),
  permanentCity: z.string().optional().nullable(),
  permanentProvince: z.string().optional().nullable(),
  permanentZip: z.string().optional().nullable(),
  // Education
  educationalBackground: z.string().optional().nullable(),
  school: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  yearGraduated: z.string().optional().nullable(),
  certifications: z.string().optional().nullable(),
});

/* ─── Employment Assignment (Step 2) ─────────────────────────────── */

export const createEmploymentSchema = z.object({
  clientId: z.number().int().positive("Client is required"),
  departmentId: z.number().int().positive().optional().nullable(),
  positionId: z.number().int().positive().optional().nullable(),
  teamId: z.number().int().positive().optional().nullable(),
  employmentType: z
    .enum(["REGULAR", "PROBATIONARY", "CONTRACTUAL", "PROJECT_BASED", "PART_TIME", "INTERN"])
    .optional()
    .nullable(),
  employeeStatus: z
    .enum(["ACTIVE", "RESIGNED", "TERMINATED", "ON_LEAVE", "SUSPENDED", "RETIRED"])
    .optional()
    .default("ACTIVE"),
  employeeLevelId: z.number().int().positive().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  regularizationDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  reportingManagerId: z.number().int().positive().optional().nullable(),
});

export const updateEmploymentSchema = createEmploymentSchema.partial();

/* ─── Contract (Step 3) ───────────────────────────────────────────── */

export const createContractSchema = z.object({
  employmentId: z.number().int().positive("Employment record is required"),
  contractType: z.enum(["PROBATIONARY", "REGULAR", "CONTRACTUAL", "PROJECT_BASED", "CONSULTANT", "INTERN"]),
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"]).default("DRAFT"),
  contractStart: z.string().min(1, "Contract start date is required"),
  contractEnd: z.string().optional().nullable(),
  monthlyRate: z.string().optional().nullable(),
  dailyRate: z.string().optional().nullable(),
  hourlyRate: z.string().optional().nullable(),
  disbursedMethod: z.enum(["CASH_SALARY", "FUND_TRANSFER"]).optional().nullable(),
  payType: z.string().optional().nullable(),
  bankDetails: z.string().optional().nullable(),
  scheduleId: z.number().int().positive().optional().nullable(),
  workingHoursPerWeek: z.number().int().min(0).optional().nullable(),
  signedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateContractSchema = createContractSchema.omit({ employmentId: true }).partial();

/* ─── Work Schedule (Step 4) ─────────────────────────────────────── */

export const workScheduleDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  breakStart: z.string().optional().nullable(),
  breakEnd: z.string().optional().nullable(),
  isWorkingDay: z.boolean().default(true),
});

export const createWorkScheduleSchema = z.object({
  name: z.string().min(1, "Schedule name is required"),
  timezone: z.string().default("Asia/Manila"),
  days: z.array(workScheduleDaySchema).min(1, "At least one day is required"),
});

/* ─── App Access (Step 5) ─────────────────────────────────────────── */

export const upsertAccessSchema = z.object({
  entries: z.array(
    z.object({
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
    }),
  ),
});

/* ─── Government IDs ─────────────────────────────────────────────── */

export const updateGovernmentIdsSchema = z.object({
  sss: z.string().optional().nullable(),
  pagibig: z.string().optional().nullable(),
  philhealth: z.string().optional().nullable(),
  tin: z.string().optional().nullable(),
});

/* ─── Inferred types ─────────────────────────────────────────────── */

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreatePositionInput = z.infer<typeof createPositionSchema>;
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateEmploymentInput = z.infer<typeof createEmploymentSchema>;
export type UpdateEmploymentInput = z.infer<typeof updateEmploymentSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type CreateWorkScheduleInput = z.infer<typeof createWorkScheduleSchema>;
export type UpsertAccessInput = z.infer<typeof upsertAccessSchema>;
export type UpdateGovernmentIdsInput = z.infer<typeof updateGovernmentIdsSchema>;
