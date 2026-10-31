/**
 * test-e2e-workflow.mjs
 *
 * Full End-to-End Workflow Verification Suite for Career Pivot Coach.
 *
 * Verifies:
 * 1. Firebase registration/login and verified-email barrier enforcement.
 * 2. Candidate profile creation and retrieval (/profile/me).
 * 3. Resume upload (synthetic multipart text file via memory storage).
 * 4. Skill gap analysis:
 *    - With consent=false: purely deterministic baseline, zero external AI calls.
 *    - With consent=true: live Gemini AI analysis with grounded transferable skills.
 * 5. Personalized learning roadmap generation and milestone progress updates.
 * 6. Mock interview session creation, answer submission, and finalization.
 * 7. Candidate cleanup in Firebase and MongoDB.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dir, ".env") });

// Also load frontend .env for VITE_FIREBASE_API_KEY
const frontendEnvPath = path.resolve(__dir, "..", "frontend", ".env");
if (fs.existsSync(frontendEnvPath)) {
  const feEnv = dotenv.parse(fs.readFileSync(frontendEnvPath));
  for (const [k, v] of Object.entries(feEnv)) {
    if (!process.env[k]) process.env[k] = v;
  }
}

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { auth as adminAuth } from "./src/config/firebase.js";
import CandidateProfile from "./src/models/CandidateProfile.js";
import SkillGapAnalysis from "./src/models/SkillGapAnalysis.js";
import LearningRoadmap from "./src/models/LearningRoadmap.js";
import InterviewSession from "./src/models/InterviewSession.js";

const PORT = 5098;
const BASE = `http://localhost:${PORT}/api`;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

let passed = 0;
let failed = 0;

function assert(condition, name, details = "") {
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${name} ${details ? `(${details})` : ""}`);
  }
}

let server;

async function run() {
  console.log("\n==================================================================");
  console.log("   CAREER PIVOT COACH — COMPLETE LOCAL WORKFLOW AUDIT             ");
  console.log("==================================================================\n");

  await connectDB();
  await new Promise((res) => {
    server = app.listen(PORT, () => {
      console.log(`🚀 Test server listening on http://localhost:${PORT}`);
      res();
    });
  });

  const timestamp = Date.now();
  const testEmail = `synthetic_candidate_${timestamp}@pivotcoach.test`;
  const testPassword = `P@ssword_${timestamp}!Aa`;
  let firebaseUid = null;
  let idToken = null;

  try {
    // ── 1. Firebase Registration & Auth Gate ──────────────────────────────────
    console.log("Step 1: Firebase Registration & Verified-Email Barrier");

    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
    const signUpRes = await fetch(signUpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        returnSecureToken: true,
      }),
    });

    const signUpData = await signUpRes.json();
    assert(signUpRes.ok && signUpData.localId, "1.1 User successfully registered in Firebase Auth");
    firebaseUid = signUpData.localId;
    idToken = signUpData.idToken;

    // Verify unverified email barrier: attempt to access protected endpoint
    const unverifiedCheck = await fetch(`${BASE}/candidates/profile/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    // Profile/me allows access for profile setup even if unverified, but resume upload strictly requires verified email
    const resumeGateCheck = await fetch(`${BASE}/candidates/${encodeURIComponent(testEmail)}/resume`, {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const resumeGateData = await resumeGateCheck.json();
    assert(
      resumeGateCheck.status === 403 && resumeGateData.code === "EMAIL_NOT_VERIFIED",
      "1.2 Unverified email blocked with HTTP 403 (EMAIL_NOT_VERIFIED) on protected resources",
      `Status: ${resumeGateCheck.status}, Code: ${resumeGateData.code}`
    );

    // Verify email via Admin SDK
    await adminAuth.updateUser(firebaseUid, { emailVerified: true });
    console.log("  ℹ️ Marked email verified via Firebase Admin SDK.");

    // Sign in again to obtain fresh ID token with email_verified: true
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    const signInRes = await fetch(signInUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        returnSecureToken: true,
      }),
    });
    const signInData = await signInRes.json();
    assert(signInRes.ok, "1.3 Signed in with verified credentials");
    idToken = signInData.idToken;

    const authHeaders = {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    };

    // ── 2. Candidate Profile Setup ────────────────────────────────────────────
    console.log("\nStep 2: Candidate Profile Creation & Retrieval");

    const profilePayload = {
      fullName: "Alex Rivera",
      targetRole: "Full-Stack Cloud Engineer",
      currentRole: "Frontend Developer",
      yearsOfExperience: 3,
      skills: ["JavaScript", "React", "HTML/CSS", "Git"],
      bio: "Frontend engineer pivoting into full-stack and cloud architecture.",
    };

    const createProfileRes = await fetch(`${BASE}/candidates`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(profilePayload),
    });
    const createProfileData = await createProfileRes.json();
    assert(
      createProfileRes.ok && createProfileData.data?.email === testEmail,
      "2.1 Candidate profile created and linked to Firebase UID",
      createProfileData.message
    );

    const getProfileRes = await fetch(`${BASE}/candidates/profile/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const getProfileData = await getProfileRes.json();
    assert(
      getProfileRes.ok && getProfileData.data?.fullName === "Alex Rivera",
      "2.2 Candidate profile retrieved via canonical /profile/me"
    );

    // ── 3. Resume Upload (Synthetic Data Only) ─────────────────────────────────
    console.log("\nStep 3: Resume Upload (Synthetic Memory Parsing)");

    const syntheticResumeContent = `
Alex Rivera
Full-Stack Cloud Engineer Candidate
Summary: 3 years building web apps with JavaScript, React, and Git. Recently built REST APIs with Node.js and containerized apps with Docker.
Experience:
Frontend Developer at TechNova (2022 - Present)
- Developed responsive web interfaces using React and JavaScript.
- Configured Git version control and collaborative GitHub review workflows.
- Built initial Docker container configurations for staging environments.
Skills: JavaScript, React, Git, HTML, CSS, Node.js, Docker
`;

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    let bodyMultipart = "";
    bodyMultipart += `--${boundary}\r\n`;
    bodyMultipart += `Content-Disposition: form-data; name="resume"; filename="alex_rivera_resume.txt"\r\n`;
    bodyMultipart += `Content-Type: text/plain\r\n\r\n`;
    bodyMultipart += syntheticResumeContent;
    bodyMultipart += `\r\n--${boundary}--\r\n`;

    const uploadRes = await fetch(`${BASE}/candidates/${encodeURIComponent(testEmail)}/resume`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: bodyMultipart,
    });
    const uploadData = await uploadRes.json();
    assert(
      uploadRes.ok && uploadData.success === true && Boolean(uploadData.data?.textPreview),
      "3.1 Synthetic resume uploaded and extracted in memory without disk persistence",
      uploadData.message
    );

    // ── 4. Skill Gap Analysis & Privacy Consent Gate ──────────────────────────
    console.log("\nStep 4: Skill Gap Analysis (Deterministic vs. AI Consent Gate)");

    const targetJobTitle = "Senior Full-Stack Cloud Engineer";
    const targetJobDescription = `
We are looking for a Senior Full-Stack Cloud Engineer to join our team.
Required skills:
- Strong experience with JavaScript, React, and Node.js.
- Containerization with Docker and deployment pipelines.
- Hands-on experience with AWS cloud services (S3, ECS, Lambda).
- Experience with Kubernetes cluster operations.
`;

    // 4A: Without AI consent -> strictly deterministic
    const analysisNoConsentRes = await fetch(`${BASE}/analysis/${encodeURIComponent(testEmail)}/run`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        jobTitle: targetJobTitle,
        jobDescription: targetJobDescription,
        consentToAiProcessing: false,
      }),
    });
    const analysisNoConsentData = await analysisNoConsentRes.json();
    assert(
      analysisNoConsentRes.ok &&
        analysisNoConsentData.data?.aiInsights === null &&
        analysisNoConsentData.data?.metadata?.isAiGenerated === false,
      "4.1 When consentToAiProcessing=false: AI skipped, purely deterministic baseline returned"
    );

    // 4B: With AI consent -> Live Gemini integration
    const analysisWithConsentRes = await fetch(`${BASE}/analysis/${encodeURIComponent(testEmail)}/run`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        jobTitle: targetJobTitle,
        jobDescription: targetJobDescription,
        consentToAiProcessing: true,
      }),
    });
    const analysisWithConsentData = await analysisWithConsentRes.json();
    const aiInsights = analysisWithConsentData.data?.aiInsights;
    assert(
      analysisWithConsentRes.ok &&
        aiInsights !== null &&
        aiInsights?.comparisonSummary?.length > 20 &&
        aiInsights?.transferableSkills?.length >= 1,
      `4.2 When consentToAiProcessing=true: Live Gemini contextual insights generated (${aiInsights?.modelUsed})`,
      analysisWithConsentData.message
    );
    console.log(`      * Model: ${aiInsights?.modelUsed}`);
    console.log(`      * Grounded transferable skills: ${aiInsights?.transferableSkills?.map((s) => s.skill).join(", ")}`);

    // ── 5. Personalized Learning Roadmap ──────────────────────────────────────
    console.log("\nStep 5: Personalized Learning Roadmap & Progress Tracking");

    const roadmapRes = await fetch(`${BASE}/roadmaps/${encodeURIComponent(testEmail)}/generate`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        targetRole: targetJobTitle,
      }),
    });
    const roadmapData = await roadmapRes.json();
    const roadmap = roadmapData.data;
    assert(
      roadmapRes.ok && roadmap?.milestones?.length > 0 && roadmap?.portfolioProjects?.length > 0,
      `5.1 Learning roadmap generated with ${roadmap?.milestones?.length} milestones and ${roadmap?.portfolioProjects?.length} portfolio projects`
    );

    // Update milestone progress
    const firstMilestone = roadmap.milestones[0];
    const updateMilestoneRes = await fetch(
      `${BASE}/roadmaps/${encodeURIComponent(testEmail)}/${roadmap._id}/milestones/${firstMilestone._id}`,
      {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: "in_progress" }),
      }
    );
    const updateMilestoneData = await updateMilestoneRes.json();
    assert(
      updateMilestoneRes.ok && updateMilestoneData.data?.milestones[0]?.status === "in_progress",
      "5.2 Roadmap milestone progress updated to 'in_progress'"
    );

    // ── 6. Mock Interview Session ─────────────────────────────────────────────
    console.log("\nStep 6: Mock Interview Session, Answering, and Finalization");

    const interviewRes = await fetch(`${BASE}/interviews/${encodeURIComponent(testEmail)}/sessions`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        targetRole: targetJobTitle,
        category: "technical",
        difficulty: "mid",
        questionCount: 3,
      }),
    });
    const interviewData = await interviewRes.json();
    const session = interviewData.data;
    assert(
      interviewRes.ok && session?.questions?.length === 3,
      `6.1 Mock interview session created with ${session?.questions?.length} tailored questions`
    );

    // Submit answer to question 0
    const q0 = session.questions[0];
    const answerRes = await fetch(
      `${BASE}/interviews/${encodeURIComponent(testEmail)}/sessions/${session._id}/answers`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          questionId: q0._id,
          answerText:
            "I use Docker to containerize our Node.js microservices into lightweight images, using multi-stage builds to optimize footprint and security.",
        }),
      }
    );
    const answerData = await answerRes.json();
    const qScore = answerData.data?.evaluation?.overallQuestionScore;
    assert(
      answerRes.ok && qScore !== undefined,
      `6.2 Answer submitted and scored by interview evaluation engine (Score: ${qScore}/100)`
    );

    // Finalize session
    const finalizeRes = await fetch(
      `${BASE}/interviews/${encodeURIComponent(testEmail)}/sessions/${session._id}/finalize`,
      {
        method: "POST",
        headers: authHeaders,
      }
    );
    const finalizeData = await finalizeRes.json();
    assert(
      finalizeRes.ok && finalizeData.data?.status === "completed" && finalizeData.data?.overallScore !== undefined,
      `6.3 Mock interview finalized with overall readiness score: ${finalizeData.data?.overallScore}%`
    );

    // ── 7. Health Endpoint Verification ───────────────────────────────────────
    console.log("\nStep 7: Public API Health Verification");
    const healthRes = await fetch(`${BASE}/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 && healthData.success === true && healthData.database?.status === "connected",
      "7.1 /api/health returns HTTP 200 with database: connected"
    );

  } finally {
    // ── 8. Cleanup Synthetic Test Data ────────────────────────────────────────
    console.log("\nStep 8: Cleanup Synthetic Test Data");
    if (firebaseUid) {
      try {
        await adminAuth.deleteUser(firebaseUid);
        console.log(`  ℹ️ Deleted synthetic Firebase user (${firebaseUid})`);
      } catch (e) {
        console.warn(`  ⚠️ Could not delete Firebase user: ${e.message}`);
      }
    }
    try {
      await CandidateProfile.deleteMany({ email: testEmail });
      await SkillGapAnalysis.deleteMany({ candidateEmail: testEmail });
      await LearningRoadmap.deleteMany({ candidateEmail: testEmail });
      await InterviewSession.deleteMany({ candidateEmail: testEmail });
      console.log(`  ℹ️ Cleaned up synthetic records from MongoDB for ${testEmail}`);
    } catch (e) {
      console.warn(`  ⚠️ MongoDB cleanup error: ${e.message}`);
    }

    if (server) {
      await new Promise((r) => server.close(r));
      console.log("  ℹ️ Test server closed.");
    }
    await mongoose.connection.close();
  }

  console.log("\n==================================================================");
  console.log(`   WORKFLOW AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log("==================================================================\n");

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("FATAL ERROR in workflow test:", err);
  process.exit(1);
});
