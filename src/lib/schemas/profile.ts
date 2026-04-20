// src/lib/schemas/profile.ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  nameExtension: z.string().optional().nullable(),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email").optional().nullable(),
  personalEmail: z.string().email("Invalid personal email").optional().nullable(),
  phone: z.string().optional().nullable(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  placeOfBirth: z.string().optional().nullable(),
  civilStatus: z.string().optional().nullable(),
  citizenship: z.string().optional().nullable(),
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
  username: z.string().optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
