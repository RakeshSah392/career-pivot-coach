/**
 * analysisService.js
 *
 * Domain service coordinating CandidateProfile retrieval,
 * skill gap analysis execution, and MongoDB persistence.
 */

import SkillGapAnalysis from "../models/SkillGapAnalysis.js";
import { getProfileByEmail } from "./candidateService.js";
import { runAnalysis } from "./ai/index.js";

/**
 * Executes a skill gap analysis for a candidate profile against a job description.
 *
 * @param {string} email - Candidate's unique email identifier
 * @param {object} input - { jobTitle, jobDescription, company }
 * @returns {Promise<SkillGapAnalysis>} Persisted analysis record
 */
export const createSkillGapAnalysis = async (email, input) => {
  const profile = await getProfileByEmail(email);

  if (!profile.resume || !profile.resume.extractedText) {
    const error = new Error(
      "Candidate does not have an uploaded resume with extracted text. Upload a resume before running analysis."
    );
    error.statusCode = 400;
    throw error;
  }

  const analysisPayload = await runAnalysis({
    candidateProfile: profile,
    jobTitle: input.jobTitle,
    jobDescription: input.jobDescription,
    targetCompany: input.company || "",
    consentToAiProcessing: Boolean(input.consentToAiProcessing),
  });

  const record = await SkillGapAnalysis.create(analysisPayload);
  return record;
};

/**
 * Retrieves all analyses conducted for a given candidate email.
 *
 * @param {string} email
 * @returns {Promise<SkillGapAnalysis[]>} List of historical analyses
 */
export const getAnalysesForCandidate = async (email) => {
  // Confirm candidate exists
  await getProfileByEmail(email);

  const history = await SkillGapAnalysis.find({
    candidateEmail: email.toLowerCase(),
  }).sort({ createdAt: -1 });

  return history;
};

/**
 * Retrieves a single analysis record by ID for a specific candidate.
 *
 * @param {string} email
 * @param {string} analysisId
 * @returns {Promise<SkillGapAnalysis>}
 */
export const getAnalysisById = async (email, analysisId) => {
  const analysis = await SkillGapAnalysis.findOne({
    _id: analysisId,
    candidateEmail: email.toLowerCase(),
  });

  if (!analysis) {
    const error = new Error("Analysis record not found for this candidate.");
    error.statusCode = 404;
    throw error;
  }

  return analysis;
};

