import { z } from "zod";

export const createAnalysisSchema = z.object({
  jobTitle: z
    .string({ required_error: "Job title is required." })
    .trim()
    .min(2, "Job title must be at least 2 characters.")
    .max(150, "Job title may not exceed 150 characters."),

  jobDescription: z
    .string({ required_error: "Job description is required." })
    .trim()
    .min(20, "Job description must be at least 20 characters long.")
    .max(25000, "Job description exceeds maximum length of 25,000 characters."),

  company: z
    .string()
    .trim()
    .max(120, "Company name cannot exceed 120 characters.")
    .optional()
    .default(""),

  consentToAiProcessing: z
    .boolean({ invalid_type_error: "consentToAiProcessing must be a boolean." })
    .optional()
    .default(false),
});

