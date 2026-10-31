/**
 * ai/index.js
 *
 * Pluggable AI Service Provider Interface.
 *
 * Architecture:
 * - Checks environment for active AI providers.
 * - When no external provider is configured (or when budget is ₹0), defaults
 *   seamlessly to the deterministic NLP baseline.
 * - Guarantees transparency: Never labels rule-based output as LLM-generated.
 */

import { evaluateSkillGaps } from "./skillGapEngine.js";
import { isGeminiConfigured, generateGeminiInsights } from "./geminiAdapter.js";

/**
 * Standard interface for running skill gap analysis on a candidate profile.
 *
 * @param {object} params
 * @param {object} params.candidateProfile - CandidateProfile document from Mongoose
 * @param {string} params.jobTitle - Target job title
 * @param {string} params.jobDescription - Full job description text
 * @param {string} [params.targetCompany=""] - Optional company name
 * @returns {Promise<object>} Analysis results matching SkillGapAnalysis model
 */
export const runAnalysis = async ({
  candidateProfile,
  jobTitle,
  jobDescription,
  targetCompany = "",
  consentToAiProcessing = false,
}) => {
  const resumeText = candidateProfile.resume?.extractedText || "";

  if (!resumeText || resumeText.trim().length === 0) {
    const err = new Error(
      "Candidate does not have an uploaded resume with extracted text. Please upload a resume before running skill gap analysis."
    );
    err.statusCode = 400;
    throw err;
  }

  // 1. Authoritative baseline: Deterministic NLP extraction and scoring
  const analysisResult = evaluateSkillGaps({
    resumeText,
    declaredSkills: candidateProfile.skills || [],
    jobTitle,
    jobDescription,
    targetCompany,
  });

  // 2. Privacy-Guarded AI Processing:
  // Requires EXPLICIT candidate consent. If consent is false/missing, resume content
  // is NEVER transmitted to external AI endpoints.
  let aiInsights = null;
  if (consentToAiProcessing && isGeminiConfigured()) {
    aiInsights = await generateGeminiInsights({
      candidateName: candidateProfile.fullName || "",
      resumeText,
      jobTitle,
      jobDescription,
      baselineAnalysis: analysisResult,
    });

    if (aiInsights) {
      analysisResult.metadata = {
        engine: `${aiInsights.modelUsed} + deterministic-nlp-grounding`,
        isAiGenerated: true,
        transparencyNotice:
          "Enhanced with Google Gemini contextual analysis, strictly grounded against verified resume text and deterministic evidence matching.",
      };
    }
  } else if (!consentToAiProcessing && isGeminiConfigured()) {
    analysisResult.metadata.transparencyNotice +=
      " Note: External AI processing was skipped because explicit candidate privacy consent was not provided.";
  }

  return {
    ...analysisResult,
    aiInsights,
    candidateId: candidateProfile._id,
    candidateEmail: candidateProfile.email,
    resumeSnapshot: {
      originalName: candidateProfile.resume.originalName,
      extractedAt: candidateProfile.resume.parsedMeta?.extractedAt || candidateProfile.resume.updatedAt,
      charCount: candidateProfile.resume.parsedMeta?.charCount || resumeText.length,
      wordCount: candidateProfile.resume.parsedMeta?.wordCount || 0,
    },
  };
};

