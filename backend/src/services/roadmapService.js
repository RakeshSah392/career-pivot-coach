/**
 * roadmapService.js
 *
 * Domain service coordinating Roadmap generation, progress tracking,
 * and MongoDB persistence.
 */

import mongoose from "mongoose";
import LearningRoadmap from "../models/LearningRoadmap.js";
import SkillGapAnalysis from "../models/SkillGapAnalysis.js";
import { getProfileByEmail } from "./candidateService.js";
import { generateRoadmapFromAnalysis } from "./ai/curriculumEngine.js";

/**
 * Generates and persists a personalized learning roadmap and portfolio project recommendations.
 *
 * @param {string} email - Candidate's email
 * @param {object} [input={}] - { analysisId?: string }
 * @returns {Promise<LearningRoadmap>}
 */
export const createRoadmap = async (email, input = {}) => {
  const candidate = await getProfileByEmail(email);

  let analysis = null;

  if (input.analysisId) {
    if (!mongoose.Types.ObjectId.isValid(input.analysisId)) {
      const err = new Error("Invalid analysisId format.");
      err.statusCode = 400;
      throw err;
    }

    // Security & isolation check: ensure analysis belongs to THIS candidate
    analysis = await SkillGapAnalysis.findOne({
      _id: input.analysisId,
      candidateEmail: email.toLowerCase(),
    });

    if (!analysis) {
      const err = new Error(
        "Specified SkillGapAnalysis was not found for this candidate."
      );
      err.statusCode = 404;
      throw err;
    }
  } else {
    // Automatically select candidate's latest analysis
    analysis = await SkillGapAnalysis.findOne({
      candidateEmail: email.toLowerCase(),
    }).sort({ createdAt: -1 });

    if (!analysis) {
      const err = new Error(
        "No SkillGapAnalysis record found for this candidate. Run a skill gap analysis before generating a roadmap."
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const roadmapPayload = generateRoadmapFromAnalysis({
    candidate,
    analysis,
  });

  const record = await LearningRoadmap.create(roadmapPayload);
  return record;
};

/**
 * Retrieves all learning roadmaps generated for a candidate.
 *
 * @param {string} email
 * @returns {Promise<LearningRoadmap[]>}
 */
export const getRoadmapsForCandidate = async (email) => {
  await getProfileByEmail(email);

  const roadmaps = await LearningRoadmap.find({
    candidateEmail: email.toLowerCase(),
  }).sort({ createdAt: -1 });

  return roadmaps;
};

/**
 * Retrieves a single roadmap by ID, enforcing candidate isolation.
 *
 * @param {string} email
 * @param {string} roadmapId
 * @returns {Promise<LearningRoadmap>}
 */
export const getRoadmapById = async (email, roadmapId) => {
  if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
    const err = new Error("Invalid roadmapId format.");
    err.statusCode = 400;
    throw err;
  }

  const roadmap = await LearningRoadmap.findOne({
    _id: roadmapId,
    candidateEmail: email.toLowerCase(),
  });

  if (!roadmap) {
    const err = new Error("Roadmap not found for this candidate.");
    err.statusCode = 404;
    throw err;
  }

  return roadmap;
};

/**
 * Updates a milestone's completion status and recalculates roadmap progress metrics.
 *
 * @param {string} email
 * @param {string} roadmapId
 * @param {string} milestoneId
 * @param {object} updateData - { status?: string, completed?: boolean }
 * @returns {Promise<LearningRoadmap>}
 */
export const updateMilestoneProgress = async (
  email,
  roadmapId,
  milestoneId,
  updateData
) => {
  if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
    const err = new Error("Invalid roadmapId format.");
    err.statusCode = 400;
    throw err;
  }
  if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
    const err = new Error("Invalid milestoneId format.");
    err.statusCode = 400;
    throw err;
  }

  const roadmap = await LearningRoadmap.findOne({
    _id: roadmapId,
    candidateEmail: email.toLowerCase(),
  });

  if (!roadmap) {
    const err = new Error("Roadmap not found for this candidate.");
    err.statusCode = 404;
    throw err;
  }

  const milestone = roadmap.milestones.id(milestoneId);
  if (!milestone) {
    const err = new Error("Milestone not found in this roadmap.");
    err.statusCode = 404;
    throw err;
  }

  // Resolve target status
  let targetStatus = updateData.status;
  if (!targetStatus) {
    targetStatus = updateData.completed ? "completed" : "pending";
  }

  milestone.status = targetStatus;
  milestone.completedAt = targetStatus === "completed" ? new Date() : null;

  // Recalculate progress metrics accurately
  const completedCount = roadmap.milestones.filter(
    (m) => m.status === "completed"
  ).length;

  roadmap.completedMilestones = completedCount;
  roadmap.progressPercentage =
    roadmap.totalMilestones > 0
      ? Math.round((completedCount / roadmap.totalMilestones) * 100)
      : 0;

  if (completedCount === roadmap.totalMilestones && roadmap.totalMilestones > 0) {
    roadmap.status = "completed";
  } else {
    roadmap.status = "active";
  }

  await roadmap.save();
  return roadmap;
};

