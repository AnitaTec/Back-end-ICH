import * as z from "zod";
import { passwordRegexp, emailRegexp } from "../constants/auth.constants.js";

// ========== Register
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .regex(emailRegexp, "Email must contain @ and not contain spaces"),

  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(50, "Full name must be less than 50 characters"),

  username: z
    .string()
    .min(1, "Username is required")
    .max(20, "Username must be less than 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can contain only letters, numbers and _",
    ),

  password: z
    .string()
    .min(8, "Password must contain at least 8 symbols")
    .regex(passwordRegexp, "Password must have at least 1 letter and 1 number"),
});

export type RegisterPayload = z.infer<typeof registerSchema>;

// ========== Login
export const loginSchema = z.object({
  username: z.string().optional(),
  email: z
    .string()
    .min(1, "Email is required")
    .regex(emailRegexp, "Email must contain @ and not contain spaces")
    .optional(),
  password: z
    .string()
    .min(8, "Password must contain at least 8 symbols")
    .regex(passwordRegexp, "Password must have at least 1 letter and 1 number"),
});

export type LoginPayload = z.infer<typeof loginSchema>;

// ========== Reset Password
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .regex(emailRegexp, "Email must contain @ and not contain spaces"),
});

export type ResetPasswordPayload = z.infer<typeof resetPasswordSchema>;
