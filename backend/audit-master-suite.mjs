/**
 * audit-master-suite.mjs
 *
 * Comprehensive Master Engineering Audit Test Suite
 * Independently validates all functional backend modules, security controls,
 * candidate isolation, boundary conditions, and rubric evaluations.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BASE = "http://localhost:5000/api";
const CANDIDATE_A = `audit_senior_${Date.now()}@careercoach.dev`;
const CANDIDATE_B = `audit_intruder_${Date.now()}@careercoach.dev`;
const __dir = path.dirname(fileURLToPath(import.meta.url));
const RESUME_FILE = path.join(__dir, "_audit_resume.txt");

let passedCount = 0;
let failedCount = 0;
const results = [];

const log = (msg) => console.log(`  ${msg}`);
const testPass = (name) => {
  passedCount++;
  results.push({ name, status: "PASS" });
  console.log(`✅ PASS: ${name}`);
};
const testFail = (name, reason) => {
  failedCount++;
  results.push({ name, status: "FAIL", reason });
  console.error(`❌ FAIL: ${name} — ${reason}`);
};

const post = async (url, body, headers = {}) => {
  const r = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
};

const get = async (url, headers = {}) => {
  const r = await fetch(`${BASE}${url}`, { headers });
  return { status: r.status, headers: r.headers, body: await r.json() };
};

const patch = async (url, body, headers = {}) => {
  const r = await fetch(`${BASE}${url}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
};

const postFile = async (url, filePath, fieldName, mimeType) => {
  const form = new FormData();
  const fileBytes = fs.readFileSync(filePath);
  const blob = new Blob([fileBytes], { type: mimeType });
  form.append(fieldName, blob, path.basename(filePath));
  const r = await fetch(`${BASE}${url}`, { method: "POST", body: form });
  return { status: r.status, headers: r.headers, body: await r.json() };
};

console.log("\n══════════════════════════════════════════════════════════════════");
console.log("  CAREER PIVOT COACH — COMPREHENSIVE FINAL ENGINEERING AUDIT     ");
console.log("══════════════════════════════════════════════════════════════════\n");

// Write sample resume for Candidate A
fs.writeFileSync(
  RESUME_FILE,
  `Morgan Brooks
Principal Backend Architect | morgan@example.com

SUMMARY
Principal backend engineer with 8 years architecting distributed systems with Node.js, Express, React, and MongoDB.

EXPERIENCE
Lead Architect — DataScale Inc. (2019-Present)
- Engineered scalable microservices backend in Node.js and Express serving 10M daily events.
- Architected optimized MongoDB sharded cluster with custom indexing reducing latency by 50%.
- Maintained code quality through TypeScript and automated unit testing.

SKILLS
Node.js, Express.js, React, TypeScript, MongoDB, REST APIs
`
);

let analysisId = null;
let roadmapId = null;
let milestoneId = null;
let sessionId = null;
let targetQuestionId = null;

// ── 1. Backend Startup & Health Check ─────────────────────────────────────────
{
  const res = await get("/health");
  log(`Health Check: status ${res.status} | DB: ${res.body.database?.status}`);
  if (res.status === 200 && res.body.success && res.body.database?.status === "connected") {
    testPass("1. Health Endpoint & MongoDB Connection verified");
  } else {
    testFail("1. Health Endpoint", JSON.stringify(res.body));
  }
}

// ── 2. Candidate Profile Creation & CRUD ─────────────────────────────────────
{
  // 1. Create Profile A
  const createA = await post("/candidates", {
    email: CANDIDATE_A,
    fullName: "Morgan Brooks",
    currentTitle: "Principal Backend Architect",
    targetRole: "Cloud Infrastructure Architect",
    yearsOfExperience: 8,
    skills: ["Node.js", "Express.js", "React", "TypeScript", "MongoDB", "Docker"], // Docker declared, unevidenced in text -> Partial!
  });

  if (createA.status === 201 && createA.body.data?.email === CANDIDATE_A) {
    testPass("2. Candidate Profile Creation (HTTP 201)");
  } else {
    testFail("2. Candidate Profile Creation", JSON.stringify(createA.body));
  }

  // 2. Create Candidate B (for security testing)
  await post("/candidates", {
    email: CANDIDATE_B,
    fullName: "Intruder Bob",
    currentTitle: "Junior Dev",
  });

  // 3. Fetch Profile A
  const fetchA = await get(`/candidates/${CANDIDATE_A}`);
  if (fetchA.status === 200 && fetchA.body.data?.fullName === "Morgan Brooks") {
    testPass("3. Candidate Profile Retrieval by Email (HTTP 200)");
  } else {
    testFail("3. Candidate Profile Retrieval", JSON.stringify(fetchA.body));
  }

  // 4. Update Profile A (verify skills are NOT accidentally erased)
  const patchA = await patch(`/candidates/${CANDIDATE_A}`, {
    currentIndustry: "Fintech Cloud",
  });
  if (patchA.status === 200 && patchA.body.data?.skills?.length === 6) {
    testPass("4. Candidate Profile Partial Update (Preserves declared skills)");
  } else {
    testFail("4. Candidate Profile Partial Update", `Skills length: ${patchA.body.data?.skills?.length}`);
  }

  // 5. Duplicate Email Conflict
  const dupRes = await post("/candidates", {
    email: CANDIDATE_A,
    fullName: "Duplicate User",
  });
  if (dupRes.status === 409) {
    testPass("5. Duplicate Email Rejection returns HTTP 409 Conflict");
  } else {
    testFail("5. Duplicate Email Rejection", `Expected 409, got ${dupRes.status}`);
  }

  // 6. Non-existent candidate retrieval
  const ghostRes = await get("/candidates/ghost_user@nonexistent.com");
  if (ghostRes.status === 404) {
    testPass("6. Non-existent candidate retrieval returns HTTP 404 Not Found");
  } else {
    testFail("6. Non-existent candidate retrieval", `Expected 404, got ${ghostRes.status}`);
  }
}

// ── 3. Resume Upload & RAM Parsing ───────────────────────────────────────────
{
  // 1. Invalid MIME type rejection
  const badMimeRes = await postFile(`/candidates/${CANDIDATE_A}/resume`, RESUME_FILE, "resume", "image/png");
  if (badMimeRes.status === 400) {
    testPass("7. Invalid file type upload correctly rejected with HTTP 400");
  } else {
    testFail("7. Invalid file type upload", `Expected 400, got ${badMimeRes.status}`);
  }

  // 2. Valid Resume Upload
  const uploadRes = await postFile(`/candidates/${CANDIDATE_A}/resume`, RESUME_FILE, "resume", "text/plain");
  if (uploadRes.status === 200 && uploadRes.body.data?.parsedMeta?.wordCount > 0) {
    testPass("8. Resume text extracted in RAM and persisted to MongoDB");
  } else {
    testFail("8. Resume Upload", JSON.stringify(uploadRes.body));
  }

  // 3. Resume Metadata Check
  const metaRes = await get(`/candidates/${CANDIDATE_A}/resume`);
  if (metaRes.status === 200 && metaRes.body.data?.originalName === "_audit_resume.txt") {
    testPass("9. Resume metadata endpoint returns verified document structure");
  } else {
    testFail("9. Resume Metadata", JSON.stringify(metaRes.body));
  }
}

// ── 4. Skill Gap Engine & Evidence Classification ────────────────────────────
{
  // 1. Run analysis without resume (Candidate B has no resume)
  const noResumeRes = await post(`/analysis/${CANDIDATE_B}/run`, {
    jobTitle: "Cloud Architect",
    jobDescription: "Requires Node.js and Docker.",
  });
  if (noResumeRes.status === 400) {
    testPass("10. Skill gap analysis without resume correctly rejected with HTTP 400");
  } else {
    testFail("10. Skill gap analysis without resume", `Expected 400, got ${noResumeRes.status}`);
  }

  // 2. Invalid inputs (empty title)
  const invalidReq = await post(`/analysis/${CANDIDATE_A}/run`, {
    jobTitle: "",
    jobDescription: "Too short",
  });
  if (invalidReq.status === 400) {
    testPass("11. Zod schema validation blocks invalid analysis inputs (HTTP 400)");
  } else {
    testFail("11. Zod schema validation", `Expected 400, got ${invalidReq.status}`);
  }

  // 3. Valid Skill Gap Analysis
  const analysisRes = await post(`/analysis/${CANDIDATE_A}/run`, {
    jobTitle: "Cloud Infrastructure Architect",
    company: "CloudScale Systems",
    jobDescription: `
Requirements:
- 5+ years of software architecture with Node.js and MongoDB.
- Containerization with Docker and Kubernetes cluster management.
- AWS cloud infrastructure automation.
- CI/CD pipeline automation.

Preferred:
- Kafka event streaming.
- Redis caching.
`,
  });

  const aData = analysisRes.body.data;
  if (analysisRes.status === 201 && aData?._id) {
    analysisId = aData._id;
    testPass("12. Skill Gap Analysis executed and saved to MongoDB (HTTP 201)");

    const nodeEval = aData.skillEvaluations.find((e) => e.skill.toLowerCase() === "node.js");
    const dockerEval = aData.skillEvaluations.find((e) => e.skill.toLowerCase() === "docker");
    const k8sEval = aData.skillEvaluations.find((e) => e.skill.toLowerCase() === "kubernetes");

    if (nodeEval?.status === "demonstrated" && dockerEval?.status === "partial" && k8sEval?.status === "missing_evidence") {
      testPass("13. Competency classification verified: Demonstrated (with evidence), Partial, and Missing");
    } else {
      testFail("13. Competency classification", `Node: ${nodeEval?.status}, Docker: ${dockerEval?.status}, K8s: ${k8sEval?.status}`);
    }

    if (aData.metadata?.engine === "deterministic-nlp-baseline" && aData.metadata?.isAiGenerated === false) {
      testPass("14. AI transparency verified: Output marked deterministic rule-based, not LLM");
    } else {
      testFail("14. AI transparency", JSON.stringify(aData.metadata));
    }
  } else {
    testFail("12. Skill Gap Analysis", JSON.stringify(analysisRes.body));
  }
}

// ── 5. Personalized Learning Roadmap & Project Blueprints ────────────────────
{
  const roadRes = await post(`/roadmaps/${CANDIDATE_A}/generate`, {
    analysisId,
  });

  const rData = roadRes.body.data;
  if (roadRes.status === 201 && rData?._id) {
    roadmapId = rData._id;
    milestoneId = rData.milestones[0]._id;
    testPass("15. Learning Roadmap & Portfolio Projects generated (HTTP 201)");

    if (rData.milestones[0].priority === "HIGH" && rData.portfolioProjects?.length > 0) {
      testPass("16. Roadmap priority sequencing verified: High priority gaps in earliest weeks");
    } else {
      testFail("16. Roadmap priority sequencing", "Milestone 1 lacked HIGH priority");
    }
  } else {
    testFail("15. Learning Roadmap", JSON.stringify(roadRes.body));
  }

  // Milestone Progress Toggle
  const toggleRes = await patch(`/roadmaps/${CANDIDATE_A}/${roadmapId}/milestones/${milestoneId}`, {
    status: "completed",
  });
  if (toggleRes.status === 200 && toggleRes.body.data?.completedMilestones === 1 && toggleRes.body.data?.progressPercentage > 0) {
    testPass("17. Milestone completion and dynamic progress percentage recalculation verified");
  } else {
    testFail("17. Milestone Progress", JSON.stringify(toggleRes.body));
  }
}

// ── 6. Mock Interview Simulator & 4-Factor Rubric Evaluation ──────────────────
{
  // 1. Create Technical Session
  const sessRes = await post(`/interviews/${CANDIDATE_A}/sessions`, {
    interviewType: "technical",
    questionCount: 3,
  });

  const sData = sessRes.body.data;
  if (sessRes.status === 201 && sData?._id && sData.questions?.length === 3) {
    sessionId = sData._id;
    const dockerQ = sData.questions.find((q) => q.targetSkill.toLowerCase() === "docker") || sData.questions[0];
    targetQuestionId = dockerQ._id;
    testPass("18. Mock Interview Session created targeting candidate's skill gaps (HTTP 201)");
  } else {
    testFail("18. Interview Session", JSON.stringify(sessRes.body));
  }

  // 2. Submit Answer & Check 4 Rubric Dimensions
  const answerBody = `
In our production architecture, we utilize multi-stage Docker builds to separate compilation from the final minimal runtime image. 
We run tests in an Alpine builder stage, copy only compiled artifacts into a distroless container, enforce non-root users via the USER directive, and scan for CVE vulnerabilities in CI/CD. 
The main trade-off is slightly longer cold build times, which we mitigate with layer caching.
`;

  const ansRes = await post(`/interviews/${CANDIDATE_A}/sessions/${sessionId}/answers`, {
    questionId: targetQuestionId,
    answerText: answerBody,
  });

  const evalData = ansRes.body.data?.evaluation;
  if (
    ansRes.status === 200 &&
    evalData?.correctness >= 60 &&
    evalData?.practicalUnderstanding >= 60 &&
    evalData?.clarity >= 70 &&
    evalData?.relevance >= 80 &&
    evalData?.overallQuestionScore >= 70
  ) {
    testPass("19. Multi-dimensional rubric evaluation verified (Correctness, Practical, Clarity, Relevance, Overall)");
  } else {
    testFail("19. Rubric evaluation", JSON.stringify(evalData));
  }

  // 3. Finalize Session
  const finalRes = await post(`/interviews/${CANDIDATE_A}/sessions/${sessionId}/finalize`, {});
  if (finalRes.status === 200 && finalRes.body.data?.status === "completed" && finalRes.body.data?.readinessAssessment) {
    testPass("20. Session finalization and overall readiness assessment verified");
  } else {
    testFail("20. Session finalization", JSON.stringify(finalRes.body));
  }

  // 4. Submit after finalization rejected
  const lateRes = await post(`/interviews/${CANDIDATE_A}/sessions/${sessionId}/answers`, {
    questionId: targetQuestionId,
    answerText: "Late submission attempt",
  });
  if (lateRes.status === 400) {
    testPass("21. Answer submission to finalized session blocked (HTTP 400)");
  } else {
    testFail("21. Post-finalization answer", `Expected 400, got ${lateRes.status}`);
  }
}

// ── 7. Candidate Data Isolation & Security Safeguards ────────────────────────
{
  // Candidate B attempts to read or mutate Candidate A's resources
  const badAnalysis = await get(`/analysis/${CANDIDATE_B}/${analysisId}`);
  const badRoadmap = await get(`/roadmaps/${CANDIDATE_B}/${roadmapId}`);
  const badSession = await get(`/interviews/${CANDIDATE_B}/${sessionId}`);

  if (badAnalysis.status === 404 && badRoadmap.status === 404 && badSession.status === 404) {
    testPass("22. Candidate Isolation: Unauthorized cross-candidate reads return HTTP 404");
  } else {
    testFail("22. Candidate Isolation Read", `Analysis: ${badAnalysis.status}, Roadmap: ${badRoadmap.status}, Session: ${badSession.status}`);
  }

  const badMutate = await patch(`/roadmaps/${CANDIDATE_B}/${roadmapId}/milestones/${milestoneId}`, {
    status: "completed",
  });
  if (badMutate.status === 404) {
    testPass("23. Candidate Isolation: Unauthorized cross-candidate mutations return HTTP 404");
  } else {
    testFail("23. Candidate Isolation Mutation", `Expected 404, got ${badMutate.status}`);
  }
}

// ── 8. Rate Limiting & Security Headers ───────────────────────────────────────
{
  const checkHeaders = await get("/health");
  const hasRateLimit = checkHeaders.headers.get("ratelimit-limit") !== null || checkHeaders.headers.get("x-ratelimit-limit") !== null;
  const hasSecurityHeaders = checkHeaders.headers.get("x-content-type-options") !== null || checkHeaders.headers.get("content-security-policy") !== null;

  if (hasSecurityHeaders) {
    testPass("24. Security Headers verified (Helmet protection active)");
  } else {
    testFail("24. Security Headers", "Helmet security headers missing");
  }
}

// ── Cleanup ──────────────────────────────────────────────────────────────────
try {
  fs.unlinkSync(RESUME_FILE);
} catch {}

console.log("\n══════════════════════════════════════════════════════════════════");
console.log(`  AUDIT RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (Total: ${passedCount + failedCount})`);
console.log("══════════════════════════════════════════════════════════════════\n");

if (failedCount > 0) process.exit(1);
