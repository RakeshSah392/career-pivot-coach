/**
 * analysisController.js
 *
 * HTTP controller layer for Skill Gap Analysis.
 * Validates inputs using Zod, invokes domain services, and structures HTTP responses.
 */

import { createAnalysisSchema } from "../utils/analysisValidation.js";
import * as analysisService from "../services/analysisService.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const runAnalysis = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email) {
    res.status(400);
    throw new Error("Candidate email parameter is required.");
  }

  const parsed = createAnalysisSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400);
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(" | ")
    );
  }

  const result = await analysisService.createSkillGapAnalysis(
    email,
    parsed.data
  );

  res.status(201).json({
    success: true,
    message: "Skill gap analysis completed and persisted successfully.",
    data: result,
  });
});

export const getAnalyses = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email) {
    res.status(400);
    throw new Error("Candidate email parameter is required.");
  }

  const records = await analysisService.getAnalysesForCandidate(email);

  res.status(200).json({
    success: true,
    count: records.length,
    data: records,
  });
});

export const getAnalysis = asyncHandler(async (req, res) => {
  const { email, analysisId } = req.params;

  if (!email || !analysisId) {
    res.status(400);
    throw new Error("Both email and analysisId are required.");
  }

  const record = await analysisService.getAnalysisById(email, analysisId);

  res.status(200).json({
    success: true,
    data: record,
  });
});

