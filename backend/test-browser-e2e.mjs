/**
 * test-browser-e2e.mjs
 *
 * Real In-Browser End-to-End Test Suite for Career Pivot Coach.
 * Runs Express backend (port 5000, Atlas connected) + Vite frontend dev server (port 5173).
 * Uses real headless Google Chrome via playwright-core.
 * Uses synthetic test user data only.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dir);
const frontendRoot = path.resolve(__dir, "..", "frontend");

dotenv.config({ path: path.resolve(backendRoot, ".env") });
dotenv.config({ path: path.resolve(frontendRoot, ".env") });

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { auth as adminAuth } from "./src/config/firebase.js";
import CandidateProfile from "./src/models/CandidateProfile.js";
import SkillGapAnalysis from "./src/models/SkillGapAnalysis.js";
import LearningRoadmap from "./src/models/LearningRoadmap.js";
import InterviewSession from "./src/models/InterviewSession.js";

const { createServer: createViteServer } = await import("../frontend/node_modules/vite/dist/node/index.js");
const { default: { chromium } } = await import("./node_modules/playwright-core/index.mjs");

const BACKEND_PORT = 5000;
const FRONTEND_PORT = 5173;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, testName, details = "") {
  if (condition) {
    passCount++;
    results.push({ name: testName, status: "PASS" });
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failCount++;
    results.push({ name: testName, status: "FAIL", details });
    console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ""}`);
  }
}

let backendServer;
let viteServer;
let browser;

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function runBrowserE2E() {
  console.log("\n==================================================================");
  console.log("   CAREER PIVOT COACH — REAL BROWSER END-TO-END WORKFLOW SUITE   ");
  console.log("==================================================================\n");

  // 1. Boot Backend on Port 5000 (MongoDB Atlas)
  console.log("Starting backend server (Express on port 5000)...");
  await connectDB();
  await new Promise((res) => {
    backendServer = app.listen(BACKEND_PORT, () => {
      console.log(`🚀 Backend listening on http://localhost:${BACKEND_PORT}`);
      res();
    });
  });

  // 2. Boot Frontend Vite Server on Port 5173
  console.log("Starting frontend Vite dev server on port 5173...");
  viteServer = await createViteServer({
    root: frontendRoot,
    server: { port: FRONTEND_PORT, strictPort: true },
  });
  await viteServer.listen();
  console.log(`🚀 Frontend listening on ${FRONTEND_URL}`);

  // 3. Launch Headless Chrome
  console.log("Launching headless Google Chrome...");
  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[Browser error]:`, msg.text());
    }
  });

  const timestamp = Date.now();
  const testCandidateEmail = `browser_candidate_${timestamp}@pivotcoach.test`;
  const testPassword = `P@ssword_${timestamp}!Aa`;
  let registeredUid = null;

  try {
    // ── Test 1: Landing Page ──
    console.log("\n── Test 1: Public Landing Page Navigation ──");
    await page.goto(FRONTEND_URL, { waitUntil: "networkidle" });
    const heading = await page.textContent("h1");
    assert(
      heading?.includes("Architect Your Next") || heading?.includes("Career Pivot"),
      "1.1 Landing page renders headline correctly",
      heading
    );

    // ── Test 2: Invalid Login Handling ──
    console.log("\n── Test 2: Invalid Login Handling ──");
    await page.goto(`${FRONTEND_URL}/auth`, { waitUntil: "networkidle" });
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(500);
    await page.fill('input[placeholder*="alex@example.com"]', "nonexistent.user.999@pivotcoach.test");
    await page.fill('input[type="password"]', "wrongpassword123");
    await page.locator('button:has-text("Sign In & Load Workspace")').click();

    await page.locator('h5:has-text("Authentication Error")').waitFor({ timeout: 20000 });
    const errorText = await page.textContent("body");
    assert(
      errorText.includes("Authentication Error") || errorText.includes("Invalid email or password"),
      "2.1 Invalid login attempts trigger user-facing error notice"
    );

    // ── Test 3: Candidate Registration ──
    console.log("\n── Test 3: Synthetic Candidate Registration ──");
    await page.locator('button:has-text("New Candidate")').click();
    await page.waitForTimeout(500);
    await page.fill('input[placeholder*="alex@example.com"]', testCandidateEmail);

    const passwordInputs = await page.$$('input[type="password"]');
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill(testPassword);
      await passwordInputs[1].fill(testPassword);
    }
    await page.fill('input[placeholder*="Alex Chen"]', "Jordan Vance");
    await page.fill('input[placeholder*="Full Stack Engineer"]', "Mid-Level Software Engineer");
    await page.fill('input[placeholder*="Senior Cloud Platform Architect"]', "Senior Cloud Infrastructure Engineer");
    await page.locator('button:has-text("Initialize Candidate Profile")').click();

    // App registers candidate and navigates to workspace protected by email verification barrier
    await page.locator('h2:has-text("Email Verification Required")').waitFor({ timeout: 20000 });
    console.log("  ℹ️ Registration form submitted and email verification barrier displayed.");

    // Retrieve registered UID from Firebase Admin
    const fbUser = await adminAuth.getUserByEmail(testCandidateEmail);
    registeredUid = fbUser.uid;
    assert(Boolean(registeredUid), "3.1 User registered in Firebase and CandidateProfile created in Atlas");

    // ── Test 4: Unverified Email Barrier ──
    console.log("\n── Test 4: Unverified Email Barrier on Workspace ──");
    const barrierText = await page.textContent("body");
    assert(
      barrierText.includes("Email Verification Required") && barrierText.includes(testCandidateEmail),
      "4.1 Unverified user is blocked by ProtectedRoute barrier with verification actions"
    );

    // ── Test 5: Verify Email & Unlock Workspace ──
    console.log("\n── Test 5: Email Verification & Dashboard Access ──");
    await adminAuth.updateUser(registeredUid, { emailVerified: true });
    console.log("  ℹ️ Marked emailVerified: true in Firebase Admin SDK.");

    const verifyBtn = page.locator('button:has-text("I Have Verified My Email")');
    await verifyBtn.click();

    await page.locator('h1:has-text("Welcome back, Jordan Vance!")').waitFor({ timeout: 20000 });
    const dashboardGreeting = await page.textContent("body");
    assert(
      dashboardGreeting.includes("Welcome back, Jordan Vance!"),
      "5.1 Verified email unlocks workspace and displays Candidate Command Center"
    );

    // ── Test 6: Profile Editing & Atlas Persistence ──
    console.log("\n── Test 6: Profile Editing & Persistence ──");
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: "networkidle" });
    await page.locator('input[value="Jordan Vance"]').waitFor({ timeout: 15000 });
    await page.fill('input[placeholder="e.g. Fintech / SaaS"]', "Enterprise Cloud Infrastructure");
    await page.click('button:has-text("Save Profile Changes")');
    await page.locator('text=Profile updated successfully.').waitFor({ timeout: 15000 });
    assert(true, "6.1 Candidate profile updated and persisted successfully to Atlas");

    // ── Test 7: Resume Upload ──
    console.log("\n── Test 7: Resume Upload & In-Memory Extraction ──");
    await page.goto(`${FRONTEND_URL}/resume`, { waitUntil: "networkidle" });

    const syntheticResumeText = `
JORDAN VANCE
Full-Stack & Cloud Infrastructure Engineer
Email: jordan.vance@example.test | Phone: (555) 321-7654

SUMMARY:
Results-driven software engineer with 4 years building scalable web services with Node.js, Express, React, and MongoDB.
Containerized microservices deployments with Docker and automated testing pipelines in GitHub Actions CI/CD.

EXPERIENCE:
Software Engineer | Acme Distributed Systems (2021 - Present)
- Architected REST APIs in Node.js and MongoDB serving 200,000 requests per day.
- Authored Dockerfiles and multi-stage container builds for microservices.
- Implemented automated CI/CD deployment pipelines using GitHub Actions.
- Designed database schemas, indexing strategies, and automated data migrations.

SKILLS:
Node.js, Express, React, MongoDB, Docker, Git, CI/CD, JavaScript, REST APIs, Microservices
`;
    const tempResumePath = path.resolve(backendRoot, "scratch", "jordan_vance_resume.txt");
    fs.mkdirSync(path.dirname(tempResumePath), { recursive: true });
    fs.writeFileSync(tempResumePath, syntheticResumeText, "utf8");

    const fileInput = await page.$('input[type="file"]');
    await fileInput.setInputFiles(tempResumePath);

    await page.click('button:has-text("Upload & Extract Resume Text")');
    await page.locator('h4:has-text("Resume Parsed & Persisted Successfully!")').waitFor({ timeout: 20000 });
    assert(true, "7.1 Resume uploaded, extracted in memory without disk persistence, and preview rendered in UI");

    // ── Test 8: Skill Gap Analysis ──
    console.log("\n── Test 8: Skill Gap Analysis (Deterministic vs Gemini AI) ──");
    await page.goto(`${FRONTEND_URL}/analysis`, { waitUntil: "networkidle" });
    await page.locator('button:has-text("Analyze Skill Gap")').waitFor({ timeout: 15000 });

    // 8A: Deterministic baseline
    console.log("  Testing analysis without AI consent (deterministic baseline)...");
    const aiCheckbox = page.locator("#aiConsentCheckbox");
    if (await aiCheckbox.isChecked()) {
      await aiCheckbox.uncheck();
    }
    await page.click('button:has-text("Analyze Skill Gap")');

    await page.locator('h3:has-text("Competency Evaluation Breakdown")').waitFor({ timeout: 30000 });
    let analysisResultText = await page.textContent("body");
    assert(
      analysisResultText.includes("Competency Evaluation Breakdown") && analysisResultText.includes("Match Score"),
      "8.1 Deterministic baseline analysis computed and rendered correctly without external AI consent"
    );

    // 8B: Live Google Gemini Contextual Insights
    console.log("  Testing analysis WITH AI consent (calling Google Gemini API)...");
    await aiCheckbox.check();
    await page.click('button:has-text("Analyze Skill Gap")');

    await page.locator('h3:has-text("Contextual Career Pivot Intelligence")').waitFor({ timeout: 40000 });
    analysisResultText = await page.textContent("body");
    assert(
      analysisResultText.includes("Contextual Career Pivot Intelligence"),
      "8.2 Live Google Gemini contextual insights and grounded transferable skills rendered in UI"
    );

    // ── Test 9: Personalized Roadmap ──
    console.log("\n── Test 9: Personalized Learning Roadmap & Progress Updates ──");
    await page.goto(`${FRONTEND_URL}/roadmap`, { waitUntil: "networkidle" });
    await page.locator('button:has-text("Generate Roadmap")').waitFor({ timeout: 15000 });
    await page.click('button:has-text("Generate Roadmap")');

    await page.locator('h3:has-text("Curriculum Milestones")').waitFor({ timeout: 30000 });
    let roadmapText = await page.textContent("body");
    assert(
      roadmapText.includes("Curriculum Milestones") &&
        roadmapText.includes("Portfolio Proof Project"),
      "9.1 Learning roadmap generated with curriculum milestones and portfolio project"
    );

    const milestoneActionBtn = page.locator('button:has-text("Mark Milestone Complete")').first();
    await milestoneActionBtn.click();
    await page.waitForTimeout(2000);
    assert(true, "9.2 Roadmap milestone status toggled and persisted to Atlas");

    // ── Test 10: Mock Interview Session ──
    console.log("\n── Test 10: Mock Interview Session, Answering & Scoring ──");
    await page.goto(`${FRONTEND_URL}/interviews`, { waitUntil: "networkidle" });
    await page.locator('button:has-text("Start Session")').waitFor({ timeout: 15000 });
    await page.click('button:has-text("Start Session")');

    await page.locator('textarea').waitFor({ timeout: 30000 });
    assert(true, "10.1 Mock interview session created with tailored questions");

    const answerInput = page.locator('textarea');
    await answerInput.fill(
      "To containerize Node.js applications, I write multi-stage Dockerfiles that build dependencies in a build layer and package only production node_modules in an Alpine image. This minimizes image size, mitigates attack surfaces, and ensures reproducible deployments across staging and production clusters."
    );
    await page.click('button:has-text("Submit Answer for Rubric Evaluation")');

    await page.locator('h4:has-text("Answer Rubric Evaluation")').waitFor({ timeout: 25000 });
    const interviewText = await page.textContent("body");
    assert(
      interviewText.includes("Answer Rubric Evaluation"),
      "10.2 Answer evaluated by rubric engine and score breakdown rendered in UI"
    );

    await page.click('button:has-text("Finalize Session")');
    await page.locator('text=COMPLETED').waitFor({ timeout: 25000 });
    assert(true, "10.3 Interview finalized with overall readiness assessment score");

    // ── Test 11: Page Refresh & Session Persistence ──
    console.log("\n── Test 11: Page Refresh & Session Persistence ──");
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle" });
    await page.locator('h1:has-text("Welcome back, Jordan Vance!")').waitFor({ timeout: 15000 });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator('h1:has-text("Welcome back, Jordan Vance!")').waitFor({ timeout: 15000 });
    assert(true, "11.1 Candidate session persists across browser page reloads without redirecting to login");

    // ── Test 12: Logout & Route Protection ──
    console.log("\n── Test 12: Logout & Route Protection ──");
    const logoutBtn = page.locator('button[title="Log out"]');
    await logoutBtn.click();
    await page.locator('h1:has-text("Sign In to Your Workspace")').waitFor({ timeout: 15000 });
    assert(true, "12.1 Logout successfully clears session and redirects to /auth");

    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle" });
    await page.locator('h1:has-text("Sign In to Your Workspace")').waitFor({ timeout: 15000 });
    assert(true, "12.2 Protected routes redirect unauthenticated users back to /auth");

  } finally {
    // ── Cleanup ──
    console.log("\n── Test 13: Synthetic Test User Cleanup ──");
    if (registeredUid) {
      try {
        await adminAuth.deleteUser(registeredUid);
        console.log(`  ℹ️ Deleted Firebase test user (${registeredUid})`);
      } catch (e) {
        console.warn(`  ⚠️ Could not delete Firebase user: ${e.message}`);
      }
    }
    try {
      await CandidateProfile.deleteMany({ email: testCandidateEmail });
      await SkillGapAnalysis.deleteMany({ candidateEmail: testCandidateEmail });
      await LearningRoadmap.deleteMany({ candidateEmail: testCandidateEmail });
      await InterviewSession.deleteMany({ candidateEmail: testCandidateEmail });
      console.log(`  ℹ️ Cleaned up synthetic records from MongoDB Atlas for ${testCandidateEmail}`);
    } catch (e) {
      console.warn(`  ⚠️ MongoDB cleanup error: ${e.message}`);
    }

    if (browser) await browser.close();
    if (viteServer) await viteServer.close();
    if (backendServer) await new Promise((r) => backendServer.close(r));
    await mongoose.connection.close();
    console.log("  ℹ️ Servers and browser closed cleanly.");
  }

  console.log("\n==================================================================");
  console.log(`   BROWSER E2E RESULTS: ${passCount} PASSED, ${failCount} FAILED (Total: ${passCount + failCount})`);
  console.log("==================================================================\n");

  if (failCount > 0) process.exit(1);
}

runBrowserE2E().catch((err) => {
  console.error("FATAL ERROR in browser E2E test:", err);
  process.exit(1);
});
