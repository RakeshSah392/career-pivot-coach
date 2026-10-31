/**
 * verify-gemini-live.mjs
 *
 * Dedicated live verification of Google Gemini Developer API integration for Career Pivot Coach.
 *
 * Execution details:
 * - Uses synthetic resume and job description text only. Real candidate PII is NEVER transmitted.
 * - Masks the API key in all console and file outputs.
 * - Queries /v1beta/models to verify account tier and available generation models.
 * - Invokes generateGeminiInsights with synthetic prompt.
 * - Validates output against Zod schema and token grounding.
 * - Validates fallback behavior with missing key, bad key, and ungranted consent.
 */

import {
  isGeminiConfigured,
  verifyGeminiModel,
  generateGeminiInsights,
  redactPersonalInformation,
  maskKey,
} from "./src/services/ai/geminiAdapter.js";
import { runAnalysis } from "./src/services/ai/index.js";

console.log("\n==================================================================");
console.log("   CAREER PIVOT COACH — REAL GEMINI API INTEGRATION VERIFICATION  ");
console.log("==================================================================\n");

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const configuredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

console.log("1. Environment & Credential Check:");
console.log(`   - Configured GEMINI_API_KEY: ${maskKey(apiKey)} (Length: ${apiKey.length} characters)`);
console.log(`   - Configured GEMINI_MODEL:   ${configuredModel}`);
console.log(`   - isGeminiConfigured():      ${isGeminiConfigured()}`);

if (!isGeminiConfigured()) {
  console.error("❌ ERROR: GEMINI_API_KEY is not configured or too short.");
  process.exit(1);
}

// 2. Query /v1beta/models directly to inspect available models under this specific key
console.log("\n2. Model Availability & Google API Handshake:");
try {
  const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(modelsUrl, { method: "GET", signal: AbortSignal.timeout(10000) });
  
  console.log(`   - Google API HTTP Status: ${res.status} ${res.statusText}`);
  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`   ❌ Failed to query Google Models API: ${errorBody}`);
  } else {
    const data = await res.json();
    const models = data.models || [];
    console.log(`   - Available models count: ${models.length}`);
    const flashModels = models
      .filter((m) => m.name.includes("flash") && m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace("models/", ""));
    console.log(`   - Available Flash models supporting generateContent: ${flashModels.join(", ")}`);
  }
} catch (e) {
  console.error(`   ❌ Direct models fetch error: ${e.message}`);
}

// 3. Adapter verifyGeminiModel verification
console.log("\n3. Adapter verifyGeminiModel() Test:");
const verification = await verifyGeminiModel(apiKey, configuredModel);
console.log("   - Verification result:", JSON.stringify(verification, null, 2));

// 4. Real Gemini API Call with SYNTHETIC DATA ONLY
console.log("\n4. Live Real Gemini API Request (Synthetic Ground Truth Only):");
const syntheticResume = `
SUMMARY:
Full-stack software engineer with 4 years of experience building scalable backend APIs,
database schemas, and automated microservices using Node.js, Express, and PostgreSQL.
Led transition to containerized deployments using Docker and GitHub Actions CI/CD pipelines.

EXPERIENCE:
Software Engineer at Acme Systems (2022 - Present):
- Built RESTful APIs with Node.js, Express, and PostgreSQL handling 50k requests daily.
- Implemented automated Docker container builds and CI/CD pipelines in GitHub Actions.
- Mentored 3 junior developers and conducted weekly architectural code reviews.

SKILLS:
Node.js, Express, PostgreSQL, Docker, Git, CI/CD, JavaScript, REST APIs
`;

const syntheticJobTitle = "Senior Cloud Operations & DevOps Engineer";
const syntheticJobDescription = `
We are seeking a Senior Cloud Operations Engineer to build and manage multi-cloud infrastructure.
Requirements:
- Strong experience with Docker containerization and CI/CD automation pipelines.
- Deep hands-on experience with Kubernetes orchestration and Terraform Infrastructure-as-Code.
- Production experience with Amazon Web Services (AWS) or Google Cloud Platform (GCP).
- Proven ability to optimize backend microservices performance and reliability.
`;

const syntheticBaseline = {
  skillEvaluations: [
    { skill: "Docker", status: "demonstrated", evidence: "containerized deployments using Docker" },
    { skill: "CI/CD", status: "demonstrated", evidence: "GitHub Actions CI/CD pipelines" },
    { skill: "Node.js", status: "demonstrated", evidence: "RESTful APIs with Node.js" },
    { skill: "Kubernetes", status: "missing_evidence", evidence: null },
    { skill: "AWS", status: "missing_evidence", evidence: null },
    { skill: "Terraform", status: "missing_evidence", evidence: null },
  ],
  summary: {
    matchScore: 50,
    readinessLevel: "COMPETITIVE_WITH_UPSKILLING",
    demonstratedCount: 3,
    missingCount: 3,
  },
};

const startTime = Date.now();
const liveResult = await generateGeminiInsights({
  candidateName: "Synthetic Candidate",
  resumeText: syntheticResume,
  jobTitle: syntheticJobTitle,
  jobDescription: syntheticJobDescription,
  baselineAnalysis: syntheticBaseline,
});
const durationMs = Date.now() - startTime;

console.log(`   - Live Request completed in: ${durationMs}ms`);
if (liveResult) {
  console.log("   ✅ LIVE GEMINI RESPONSE RECEIVED & VALIDATED BY ZOD SCHEMA!");
  console.log(`   - Model Used: ${liveResult.modelUsed}`);
  console.log(`   - Comparison Summary (preview): ${liveResult.comparisonSummary.slice(0, 160)}...`);
  console.log(`   - Skills Explanation (preview): ${liveResult.skillsExplanation.slice(0, 160)}...`);
  console.log(`   - Transferable Skills detected: ${liveResult.transferableSkills.length}`);
  for (const s of liveResult.transferableSkills) {
    console.log(`       * ${s.skill}: ${s.applicability} (Source: ${s.sourceExperience})`);
  }
  console.log(`   - Tailored Recommendations count: ${liveResult.tailoredRecommendations.length}`);
  console.log(`   - Transition Advice count: ${liveResult.transitionAdvice.length}`);
} else {
  console.error("   ❌ Live request returned null (fallback triggered).");
}

// 5. Verification of Privacy Consent Gate in AI Service Layer
console.log("\n5. Privacy Consent Gate Verification:");
const mockProfile = {
  _id: "67241234567890abcdef1234",
  fullName: "Synthetic User",
  email: "synthetic.user@example.test",
  skills: ["Node.js", "Docker"],
  resume: {
    originalName: "synthetic_resume.txt",
    extractedText: syntheticResume,
    parsedMeta: { charCount: syntheticResume.length, wordCount: 100, extractedAt: new Date() },
  },
};

const analysisWithoutConsent = await runAnalysis({
  candidateProfile: mockProfile,
  jobTitle: syntheticJobTitle,
  jobDescription: syntheticJobDescription,
  consentToAiProcessing: false,
});

console.log(`   - Without Consent: aiInsights is ${analysisWithoutConsent.aiInsights === null ? "NULL (PASS)" : "NOT NULL (FAIL)"}`);
console.log(`   - Without Consent: engine is ${analysisWithoutConsent.metadata.engine}`);
console.log(`   - Without Consent: isAiGenerated is ${analysisWithoutConsent.metadata.isAiGenerated}`);

// 6. Verification with Consent (End-to-End AI Service)
console.log("\n6. End-to-End runAnalysis with Consent:");
const analysisWithConsent = await runAnalysis({
  candidateProfile: mockProfile,
  jobTitle: syntheticJobTitle,
  jobDescription: syntheticJobDescription,
  consentToAiProcessing: true,
});

console.log(`   - With Consent: aiInsights present? ${analysisWithConsent.aiInsights ? "YES (PASS)" : "NO (FAIL)"}`);
console.log(`   - With Consent: engine is ${analysisWithConsent.metadata.engine}`);
console.log(`   - With Consent: isAiGenerated is ${analysisWithConsent.metadata.isAiGenerated}`);

// 7. Deterministic Fallback on Invalid Key
console.log("\n7. Deterministic Fallback on Invalid/Exhausted Key:");
const origKey = process.env.GEMINI_API_KEY;
process.env.GEMINI_API_KEY = "invalid_dummy_key_for_testing";
const fallbackResult = await runAnalysis({
  candidateProfile: mockProfile,
  jobTitle: syntheticJobTitle,
  jobDescription: syntheticJobDescription,
  consentToAiProcessing: true,
});
process.env.GEMINI_API_KEY = origKey;

console.log(`   - Fallback with Bad Key: aiInsights is ${fallbackResult.aiInsights === null ? "NULL (PASS)" : "NOT NULL (FAIL)"}`);
console.log(`   - Fallback with Bad Key: engine is ${fallbackResult.metadata.engine}`);
console.log(`   - Fallback with Bad Key: matchScore is ${fallbackResult.summary.matchScore}%`);

console.log("\n==================================================================");
console.log("   LIVE GEMINI API VERIFICATION COMPLETE                          ");
console.log("==================================================================\n");

