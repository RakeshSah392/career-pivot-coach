import { z } from "zod";
import mongoose from "mongoose";

const objectIdValidator = (val) => mongoose.Types.ObjectId.isValid(val);

export const createSessionSchema = z.object({
  interviewType: z
    .enum(["technical", "behavioral", "mixed"], {
      errorMap: () => ({
        message: "interviewType must be 'technical', 'behavioral', or 'mixed'.",
      }),
    })
    .optional()
    .default("technical"),

  questionCount: z
    .number()
    .int("questionCount must be an integer.")
    .min(1, "questionCount must be at least 1.")
    .max(8, "questionCount cannot exceed 8 questions per session.")
    .optional()
    .default(3),

  targetRole: z
    .string()
    .trim()
    .max(150, "targetRole cannot exceed 150 characters.")
    .optional(),
});

export const submitAnswerSchema = z.object({
  questionId: z
    .string({ required_error: "questionId is required." })
    .trim()
    .refine(objectIdValidator, {
      message: "questionId must be a valid 24-character hexadecimal ObjectId.",
    }),

  answerText: z
    .string({ required_error: "answerText is required." })
    .trim()
    .min(1, "answerText cannot be empty.")
    .max(10000, "answerText cannot exceed 10,000 characters."),
});

