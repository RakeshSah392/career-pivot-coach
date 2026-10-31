import { z } from "zod";

// ─── Profile creation / update ────────────────────────────────────────────────

export const createProfileSchema = z.object({
  firebaseUid: z.string().trim().min(1, "Firebase UID cannot be empty.").optional(),

  email: z
    .string({ required_error: "Email is required." })
    .email("Invalid email format.")
    .toLowerCase()
    .trim(),

  fullName: z
    .string({ required_error: "Full name is required." })
    .min(1, "Full name cannot be empty.")
    .max(120, "Name may not exceed 120 characters.")
    .trim(),

  currentTitle:    z.string().trim().max(120).optional().default(""),
  currentIndustry: z.string().trim().max(120).optional().default(""),
  targetRole:      z.string().trim().max(120).optional().default(""),
  targetIndustry:  z.string().trim().max(120).optional().default(""),

  yearsOfExperience: z
    .number()
    .int()
    .min(0, "Years of experience cannot be negative.")
    .max(60, "Years of experience cannot exceed 60.")
    .optional()
    .default(0),

  skills: z
    .array(z.string().trim().min(1).max(80))
    .max(50, "Provide at most 50 skills.")
    .optional()
    .default([]),

  socialLinks: z
    .object({
      linkedin:  z.string().url("Invalid LinkedIn URL.").optional().or(z.literal("")).default(""),
      github:    z.string().url("Invalid GitHub URL.").optional().or(z.literal("")).default(""),
      portfolio: z.string().url("Invalid portfolio URL.").optional().or(z.literal("")).default(""),
    })
    .optional()
    .default({}),
});

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name cannot be empty.")
    .max(120, "Name may not exceed 120 characters.")
    .trim()
    .optional(),

  currentTitle: z.string().trim().max(120).optional(),
  currentIndustry: z.string().trim().max(120).optional(),
  targetRole: z.string().trim().max(120).optional(),
  targetIndustry: z.string().trim().max(120).optional(),

  yearsOfExperience: z
    .number()
    .int()
    .min(0, "Years of experience cannot be negative.")
    .max(60, "Years of experience cannot exceed 60.")
    .optional(),

  skills: z
    .array(z.string().trim().min(1).max(80))
    .max(50, "Provide at most 50 skills.")
    .optional(),

  socialLinks: z
    .object({
      linkedin: z.string().url("Invalid LinkedIn URL.").optional().or(z.literal("")),
      github: z.string().url("Invalid GitHub URL.").optional().or(z.literal("")),
      portfolio: z.string().url("Invalid portfolio URL.").optional().or(z.literal("")),
    })
    .optional(),
});

