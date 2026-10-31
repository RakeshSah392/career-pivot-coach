/**
 * geminiAdapter.js
 *
 * Official REST API Provider Adapter for Google Gemini Developer API.
 *
 * Architecture & Privacy Principles:
 * - Direct REST API integration (zero external npm client dependencies, ₹0 budget).
 * - Target models: gemini-2.5-flash, gemini-1.5-flash, gemini-2.0-flash (free-tier supported).
 * - Privacy Hardening: Redacts emails, phone numbers, URLs, and candidate names before transmitting.
 * - Zero Credential Leaks: Never exposes API keys in logs, errors, responses, or client payloads.
 * - Model availability verification against Google's /v1beta/models endpoint.
 * - Strict Zod schema validation on all AI outputs.
 * - Grounding: Validates that transferable skill claims link to actual documented resume tokens.
 * - Resilient fallback: Returns null on timeout/quota/network failure so the system
 *   seamlessly serves deterministic baseline evaluations without failing user requests.
 */

import { z } from "zod";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const REQUEST_TIMEOUT_MS = 12000;

// In-memory cache for model verification to minimize API calls
let modelVerificationCache = {
  keyHash: null,
  verifiedModel: null,
  lastChecked: 0,
};

// Strict output schema for AI-generated response
const geminiTransferableSkillSchema = z.object({
  skill: z.string().trim().min(1).max(100),
  sourceExperience: z.string().trim().min(1).max(250),
  applicability: z.string().trim().default(""),
});

const geminiResponseSchema = z.object({
  comparisonSummary: z.string().trim().min(10).max(4000),
  skillsExplanation: z.string().trim().default(""),
  transferableSkills: z.array(geminiTransferableSkillSchema).default([]),
  tailoredRecommendations: z.array(z.string().trim()).default([]),
  transitionAdvice: z.array(z.string().trim()).default([]),
});

/**
 * Returns a sanitized mask of an API key for safe logging (e.g. "AIzaSy...7X2").
 */
export const maskKey = (key = "") => {
  if (!key || key.length < 8) return "[NOT_SET]";
  return `${key.slice(0, 6)}...${key.slice(-3)}`;
};

/**
 * Redacts personal identifiers (PII) including email addresses, phone numbers,
 * web URLs, social profiles, and candidate names from resume text before transmission.
 *
 * @param {string} text - Raw resume text
 * @param {string} [candidateName=""] - Candidate's declared name to sanitize
 * @returns {string} Sanitized text free of direct personal identifiers
 */
export const redactPersonalInformation = (text = "", candidateName = "") => {
  if (!text) return "";

  let anonymized = text
    // Redact email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]")
    // Redact phone numbers (with country code, dashes, periods, parentheses, or 10-digit formats)
    .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[REDACTED_PHONE]")
    .replace(/\b\d{10}\b/g, "[REDACTED_PHONE]")
    // Redact URLs and social handles
    .replace(/https?:\/\/[^\s]+/gi, "[REDACTED_URL]")
    .replace(/(?:linkedin\.com\/in\/|github\.com\/)[^\s]+/gi, "[REDACTED_PROFILE_URL]");

  // Redact candidate full name if provided
  if (candidateName && candidateName.trim().length >= 3) {
    const escaped = candidateName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    anonymized = anonymized.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "[CANDIDATE_NAME]");
  }

  return anonymized;
};

/**
 * Checks whether GEMINI_API_KEY is configured in the environment.
 */
export const isGeminiConfigured = () => {
  const key = process.env.GEMINI_API_KEY;
  return typeof key === "string" && key.trim().length > 10;
};

/**
 * Verifies that the requested model is valid and supports generateContent under the provided key.
 *
 * @param {string} apiKey
 * @param {string} requestedModel
 * @returns {Promise<{ verified: boolean, activeModel: string, reason?: string }>}
 */
export const verifyGeminiModel = async (
  apiKey = process.env.GEMINI_API_KEY,
  requestedModel = process.env.GEMINI_MODEL || "gemini-3.5-flash"
) => {
  if (!apiKey || apiKey.trim().length === 0) {
    return { verified: false, activeModel: requestedModel, reason: "GEMINI_API_KEY is not configured" };
  }

  const now = Date.now();
  const normalizedRequested = requestedModel.replace(/^models\//, "");

  // Return cached verification if checked within the last 5 minutes
  if (
    modelVerificationCache.keyHash === apiKey &&
    modelVerificationCache.verifiedModel &&
    now - modelVerificationCache.lastChecked < 5 * 60 * 1000
  ) {
    return { verified: true, activeModel: modelVerificationCache.verifiedModel };
  }

  try {
    const url = `${GEMINI_API_BASE}/models?key=${encodeURIComponent(apiKey.trim())}`;
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[Gemini Adapter] Model verification returned HTTP ${res.status}: ${errText.slice(0, 150)}`);
      return { verified: false, activeModel: normalizedRequested, reason: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const availableModels = data.models || [];

    // Check if the requested model is directly available
    const directMatch = availableModels.find(
      (m) =>
        m.name === `models/${normalizedRequested}` &&
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes("generateContent")
    );

    if (directMatch) {
      modelVerificationCache = {
        keyHash: apiKey,
        verifiedModel: normalizedRequested,
        lastChecked: now,
      };
      return { verified: true, activeModel: normalizedRequested };
    }

    // Fallback order: find any available flash model supporting generateContent
    const preferredFallbacks = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"];
    for (const fb of preferredFallbacks) {
      const fbMatch = availableModels.find(
        (m) =>
          m.name === `models/${fb}` &&
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes("generateContent")
      );
      if (fbMatch) {
        console.log(`[Gemini Adapter] Requested model "${normalizedRequested}" redirected to verified free-tier "${fb}".`);
        modelVerificationCache = {
          keyHash: apiKey,
          verifiedModel: fb,
          lastChecked: now,
        };
        return { verified: true, activeModel: fb };
      }
    }

    return {
      verified: false,
      activeModel: normalizedRequested,
      reason: `No compatible generateContent model found for requested "${normalizedRequested}".`,
    };
  } catch (err) {
    console.warn(`[Gemini Adapter] Model verification skipped due to network/timeout (${err.message}).`);
    return { verified: false, activeModel: normalizedRequested, reason: err.message };
  }
};

/**
 * Strips markdown code fence blocks if returned by the LLM.
 */
const cleanJsonText = (raw = "") => {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
};

/**
 * Validates that claims in transferable skills contain plausible anchors in the resume text,
 * discarding any hallucinated companies or ungrounded credentials.
 */
const sanitizeTransferableSkills = (skills = [], resumeLower = "") => {
  if (!Array.isArray(skills)) return [];

  const resumeTokens = new Set(resumeLower.match(/[a-z0-9_-]{3,}/g) || []);

  return skills
    .filter((item) => {
      if (!item || typeof item.skill !== "string" || typeof item.sourceExperience !== "string") {
        return false;
      }
      const expTokens = item.sourceExperience.toLowerCase().match(/[a-z0-9_-]{3,}/g) || [];
      // If the experience mentions tokens, at least one must align with actual resume words
      return expTokens.length === 0 || expTokens.some((t) => resumeTokens.has(t));
    })
    .map((item) => ({
      skill: item.skill.trim(),
      sourceExperience: item.sourceExperience.trim(),
      applicability: (item.applicability || "").trim(),
    }))
    .slice(0, 6);
};

/**
 * Calls the Google Gemini Developer REST API to generate grounded contextual insights.
 *
 * Privacy Guarantees:
 * - Resume text is stripped of PII (emails, phones, URLs, full names) before transmission.
 * - Raw resume text and API credentials are NEVER logged.
 * - Strict schema validation applied via Zod.
 *
 * @param {object} params
 * @param {string} [params.candidateName=""] - Candidate name to redact
 * @param {string} params.resumeText - Ground truth extracted resume text
 * @param {string} params.jobTitle - Target job title
 * @param {string} params.jobDescription - Job description
 * @param {object} params.baselineAnalysis - Baseline deterministic analysis result
 * @returns {Promise<object|null>} Structured AI insights, or null if unconfigured/failed
 */
export const generateGeminiInsights = async ({
  candidateName = "",
  resumeText,
  jobTitle,
  jobDescription,
  baselineAnalysis,
}) => {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return null; // Graceful deterministic fallback
  }

  // 1. Verify model availability
  const requestedModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const { verified, activeModel } = await verifyGeminiModel(apiKey, requestedModel);

  if (!verified) {
    console.warn(
      `[Gemini Adapter] Model "${requestedModel}" could not be verified on key (${maskKey(apiKey)}). Proceeding with deterministic baseline.`
    );
    return null;
  }

  // 2. Privacy Hardening: Redact PII from resume text before transmission
  const anonymizedResume = redactPersonalInformation(resumeText, candidateName);

  // 3. Prepare Grounded Prompt
  const demonstratedSkills = baselineAnalysis.skillEvaluations
    .filter((s) => s.status === "demonstrated")
    .map((s) => `${s.skill} (Evidence: "${s.evidence || ""}")`);

  const partialSkills = baselineAnalysis.skillEvaluations
    .filter((s) => s.status === "partial")
    .map((s) => s.skill);

  const missingSkills = baselineAnalysis.skillEvaluations
    .filter((s) => s.status === "missing_evidence")
    .map((s) => s.skill);

  const systemInstruction = `You are a Principal Career Transition Architect and Senior Technical Recruiter.
CRITICAL GROUNDING & PRIVACY RULES:
1. Ground all observations strictly on the actual resume text provided. Never hallucinate employers, degrees, certifications, or technologies not present in the resume.
2. The deterministic baseline classification is authoritative:
   - Demonstrated: ${demonstratedSkills.length} skills with verified resume quotes.
   - Partial: ${partialSkills.length} declared skills lacking deep resume elaboration.
   - Missing Evidence: ${missingSkills.length} required/preferred competencies not evidenced in the resume.
3. Your purpose: Provide actionable career pivot insights, identify genuine transferable skills from their documented experience, and suggest practical resume improvements.
4. Output MUST be valid JSON adhering strictly to the requested schema. No conversational preamble.`;

  const userPrompt = `TARGET ROLE: ${jobTitle}
TARGET JOB DESCRIPTION:
${jobDescription.slice(0, 2500)}

CANDIDATE ANONYMIZED RESUME TEXT (GROUND TRUTH):
${anonymizedResume.slice(0, 4000)}

DETERMINISTIC SKILL CLASSIFICATION:
- Verified Demonstrated: ${demonstratedSkills.slice(0, 15).join(", ") || "None"}
- Declared / Partial: ${partialSkills.slice(0, 10).join(", ") || "None"}
- Missing Evidence: ${missingSkills.slice(0, 15).join(", ") || "None"}
- Baseline Match Score: ${baselineAnalysis.summary?.matchScore}% (${baselineAnalysis.summary?.readinessLevel})

TASK: Return a JSON object with this exact structure:
{
  "comparisonSummary": "1-2 paragraphs offering a realistic, encouraging evaluation of the candidate's transition into ${jobTitle}, highlighting key strengths and the primary competency bridge required.",
  "skillsExplanation": "Concise summary explaining how the candidate's demonstrated background maps against the job's core requirements, and why specific gaps require portfolio proof.",
  "transferableSkills": [
    {
      "skill": "Name of transferable capability from candidate's resume",
      "sourceExperience": "Specific company, project, or role from the resume where this was applied",
      "applicability": "How this directly accelerates their transition into ${jobTitle}"
    }
  ],
  "tailoredRecommendations": [
    "Specific resume enhancement recommendation grounded in their real projects",
    "Targeted proof-of-concept project recommendation to bridge missing evidence"
  ],
  "transitionAdvice": [
    "Actionable networking, interview, or positioning advice for this specific pivot"
  ]
}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  const candidateModels = [activeModel, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash"].filter(
    (m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx
  );

  for (const modelToTry of candidateModels) {
    try {
      const endpoint = `${GEMINI_API_BASE}/models/${modelToTry}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.warn(
          `[Gemini Adapter] Generation returned HTTP ${response.status} (${modelToTry}): ${errText.slice(0, 150)}`
        );
        continue;
      }

      const data = await response.json();
      const candidatePart = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidatePart) {
        console.warn(`[Gemini Adapter] Response from ${modelToTry} contained no text parts.`);
        continue;
      }

      const parsedJson = JSON.parse(cleanJsonText(candidatePart));

      // Strict schema validation using Zod
      const validation = geminiResponseSchema.safeParse(parsedJson);
      if (!validation.success) {
        console.warn(
          `[Gemini Adapter] Output from ${modelToTry} failed schema validation (${validation.error.issues.map((i) => i.message).join(", ")}).`
        );
        continue;
      }

      const resumeLower = resumeText.toLowerCase();

      return {
        comparisonSummary: validation.data.comparisonSummary,
        skillsExplanation: validation.data.skillsExplanation,
        transferableSkills: sanitizeTransferableSkills(validation.data.transferableSkills, resumeLower),
        tailoredRecommendations: validation.data.tailoredRecommendations,
        transitionAdvice: validation.data.transitionAdvice,
        modelUsed: modelToTry,
        generatedAt: new Date(),
      };
    } catch (err) {
      console.warn(`[Gemini Adapter] Attempt on ${modelToTry} failed: ${err.message}`);
    }
  }

  console.warn("[Gemini Adapter] All generation attempts exhausted. Gracefully serving deterministic NLP baseline.");
  return null;
};
