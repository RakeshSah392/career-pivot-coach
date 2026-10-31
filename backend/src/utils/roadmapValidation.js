import { z } from "zod";
import mongoose from "mongoose";

const objectIdValidator = (val) => mongoose.Types.ObjectId.isValid(val);

export const generateRoadmapSchema = z.object({
  analysisId: z
    .string()
    .trim()
    .refine(objectIdValidator, {
      message: "analysisId must be a valid 24-character hexadecimal ObjectId.",
    })
    .optional(),
});

export const updateMilestoneStatusSchema = z
  .object({
    status: z
      .enum(["pending", "in_progress", "completed"], {
        errorMap: () => ({
          message: "Status must be 'pending', 'in_progress', or 'completed'.",
        }),
      })
      .optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => data.status !== undefined || data.completed !== undefined, {
    message: "Either 'status' or 'completed' boolean must be provided.",
  });

