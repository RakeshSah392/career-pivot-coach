/**
 * roadmapController.js
 *
 * HTTP controller layer for Personalized Learning Roadmaps and Portfolio Projects.
 */

import {
  generateRoadmapSchema,
  updateMilestoneStatusSchema,
} from "../utils/roadmapValidation.js";
import * as roadmapService from "../services/roadmapService.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const generateRoadmap = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email) {
    res.status(400);
    throw new Error("Candidate email parameter is required.");
  }

  const parsed = generateRoadmapSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400);
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(" | ")
    );
  }

  const result = await roadmapService.createRoadmap(email, parsed.data);

  res.status(201).json({
    success: true,
    message: "Personalized learning roadmap and portfolio projects generated successfully.",
    data: result,
  });
});

export const getRoadmaps = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email) {
    res.status(400);
    throw new Error("Candidate email parameter is required.");
  }

  const roadmaps = await roadmapService.getRoadmapsForCandidate(email);

  res.status(200).json({
    success: true,
    count: roadmaps.length,
    data: roadmaps,
  });
});

export const getRoadmap = asyncHandler(async (req, res) => {
  const { email, roadmapId } = req.params;

  if (!email || !roadmapId) {
    res.status(400);
    throw new Error("Both email and roadmapId are required parameters.");
  }

  const roadmap = await roadmapService.getRoadmapById(email, roadmapId);

  res.status(200).json({
    success: true,
    data: roadmap,
  });
});

export const updateMilestone = asyncHandler(async (req, res) => {
  const { email, roadmapId, milestoneId } = req.params;

  if (!email || !roadmapId || !milestoneId) {
    res.status(400);
    throw new Error("email, roadmapId, and milestoneId parameters are required.");
  }

  const parsed = updateMilestoneStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400);
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(" | ")
    );
  }

  const updatedRoadmap = await roadmapService.updateMilestoneProgress(
    email,
    roadmapId,
    milestoneId,
    parsed.data
  );

  res.status(200).json({
    success: true,
    message: "Milestone status updated and progress recalculated successfully.",
    data: updatedRoadmap,
  });
});

