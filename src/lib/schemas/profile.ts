// src/lib/schemas/profile.ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().min(1, "Phone is required").optional(),
  address: z.string().min(1, "Address is required").optional(),
  gender: z.string().min(1, "Gender is required").optional(),
  birthDate: z.string().min(1, "Birth date is required").optional(),
  username: z.string().optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
