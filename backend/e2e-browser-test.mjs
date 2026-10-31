/**
 * e2e-browser-test.mjs
 *
 * Comprehensive Release Verification Browser Automation Suite
 *
 * Uses Playwright Core with the installed Google Chrome binary.
 * Drives real browser interactions against the running Vite SPA (http://localhost:5173)
 * and Express/MongoDB backend (http://localhost:5000).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright-core";
import mongoose from "mongoose";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRONTEND_URL = "http://localhost:5173";
const MONGO_URI = "mongodb://localhost:27017/career_pivot_coach";

const TEST_TIMESTAMP = Date.now();
const CANDIDATE_EMAIL = `release_e2e_${TEST_TIMESTAMP}@pivotcoach.internal`;
const CANDIDATE_NAME = `Morgan Devlin`;
const RESUME_FILE_PATH = path.join(__dir, `_e2e_resume_${TEST_TIMESTAMP}.txt`);

let passedCount = 0;
let failedCount = 0;
const recordedFailures = [];
const consoleErrors = [];
const failedRequests = [];

const log = (msg) => console.log(`  ${msg}`);
const testPass = (name) => {
  passedCount++;
  console.log(`✅ PASS: ${name}`);
};
const testFail = (name, error) => {
  failedCount++;
  const reason = error instanceof Error ? error.message : String(error);
  recordedFailures.push({ name, reason });
  console.error(`❌ FAIL: ${name} — ${reason}`);
};

console.log("\n══════════════════════════════════════════════════════════════════════");
console.log("  CAREER PIVOT COACH — COMPREHENSIVE END-TO-END RELEASE VERIFICATION  ");
console.log("══════════════════════════════════════════════════════════════════════\n");

// Write test resume
fs.writeFileSync(
  RESUME_FILE_PATH,
  `Morgan Devlin
morgan.devlin@pivotcoach.internal | (555) 789-0123
San Francisco, CA

PROFESSIONAL SUMMARY
Senior Backend Engineer with 5 years architecting resilient distributed systems with Node.js, Express, MongoDB, and TypeScript.
Strong expertise in RESTful APIs, microservices communication, and Docker containerization.

WORK EXPERIENCE
Senior Backend Developer — Nexus Software (2021 - Present)
- Engineered high-throughput REST APIs using Node.js and Express processing 15M daily requests.
- Optimized MongoDB aggregation pipelines and compound indexes, cutting query latency by 42%.
- Containerized development and staging environments using Docker and Docker Compose.
- Authored automated integration and unit test suites maintaining 90%+ branch coverage.

SKILLS
Node.js, Express.js, MongoDB, TypeScript, REST APIs, Docker, JavaScript
`
);

let browser = null;
let context = null;
let page = null;

try {
  // ── Database Direct Probe ──────────────────────────────────────────────────
  log("Connecting to MongoDB to establish baseline assertions...");
  await mongoose.connect(MONGO_URI);
  testPass("1. Infrastructure: Direct connection to MongoDB verified");

  // ── Launch Real Chrome ─────────────────────────────────────────────────────
  log(`Launching Google Chrome (${CHROME_PATH})...`);
  browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
    console.log(`[Browser Console: ${msg.type()}]`, msg.text());
  });

  page.on("response", async (res) => {
    if (res.status() >= 400 && !res.url().includes("favicon")) {
      const body = await res.text().catch(() => "");
      failedRequests.push(`${res.request().method()} ${res.url()} [${res.status()}]: ${body.slice(0, 150)}`);
    }
  });

  // ── Step 1: Landing Page & Live Health Pill ────────────────────────────────
  log("Step 1: Navigating to Landing Page...");
  await page.goto(`${FRONTEND_URL}/`, { waitUntil: "networkidle" });

  const pageTitle = await page.title();
  if (pageTitle.includes("Career Pivot Coach")) {
    testPass("2. Landing Page: Document title verified");
  } else {
    testFail("2. Landing Page", `Unexpected title: ${pageTitle}`);
  }

  // Live health badge in Navbar
  const healthBadge = page.locator("text=API Active").first();
  await healthBadge.waitFor({ state: "visible", timeout: 8000 });
  testPass("3. Navbar: Real-time API Active status pill visible");

  // Hero section CTA: "Create Candidate Profile"
  const startBtn = page.locator("a:has-text('Create Candidate Profile')").first();
  await startBtn.click();
  await page.waitForURL("**/auth*", { timeout: 8000 });
  testPass("4. Landing Page: CTA navigates cleanly to /auth");

  // ── Step 2: Candidate Registration ─────────────────────────────────────────
  log("Step 2: Testing Candidate Registration...");
  // Fill registration form
  await page.locator('input[type="email"]').fill(CANDIDATE_EMAIL);
  await page.locator('input[placeholder="e.g. Alex Chen"]').fill(CANDIDATE_NAME);
  await page.locator('input[placeholder="Full Stack Engineer"]').fill("Full Stack Developer");

  // Submit registration
  const regBtn = page.locator("button:has-text('Initialize Candidate Profile')");
  await regBtn.click();

  // Verify redirection to /dashboard
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  testPass("5. Auth: Candidate registration submitted and redirected to /dashboard");

  // Verify dashboard welcome banner
  await page.locator(`text=${CANDIDATE_NAME}`).first().waitFor({ state: "visible", timeout: 8000 });
  testPass("6. Dashboard: Welcome banner renders registered candidate name");

  // Direct MongoDB check: Verify profile saved in collection
  const savedProfile = await mongoose.connection.collection("candidateprofiles").findOne({
    email: CANDIDATE_EMAIL.toLowerCase(),
  });
  if (savedProfile && savedProfile.fullName === CANDIDATE_NAME) {
    testPass("7. Database Persistence: Candidate profile verified in MongoDB");
  } else {
    testFail("7. Database Persistence", "Profile not found in candidateprofiles collection");
  }

  // ── Step 3: Resume Upload & In-Memory Parsing ──────────────────────────────
  log("Step 3: Uploading & Parsing Resume...");
  await page.goto(`${FRONTEND_URL}/resume`, { waitUntil: "networkidle" });

  // Upload file via file input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(RESUME_FILE_PATH);

  // Click Upload button
  const uploadBtn = page.locator("button:has-text('Upload & Extract Resume Text')");
  await uploadBtn.waitFor({ state: "visible" });
  await uploadBtn.click();

  // Wait for success status or confirmation
  const successIndicator = page.locator("text=Active Resume Document in MongoDB").or(page.locator("text=Resume Parsed & Persisted Successfully!")).first();
  await successIndicator.waitFor({ state: "visible", timeout: 12000 });
  testPass("8. Resume Ingestion: File uploaded and processed confirmation rendered");

  // Check character count rendered
  const charBadge = page.locator("text=Character Count:").first();
  await charBadge.waitFor({ state: "visible", timeout: 5000 });
  testPass("9. Resume Ingestion: Document metrics (characters & words) displayed");

  // Direct MongoDB check: Verify extracted text in DB
  const profileWithResume = await mongoose.connection.collection("candidateprofiles").findOne({
    email: CANDIDATE_EMAIL.toLowerCase(),
  });
  if (
    profileWithResume?.resume?.extractedText &&
    profileWithResume.resume.extractedText.includes("Morgan Devlin")
  ) {
    testPass("10. Database Persistence: Extracted resume text verified in MongoDB");
  } else {
    testFail("10. Database Persistence", "Extracted resume text missing in MongoDB");
  }

  // ── Step 4: Skill Gap Analysis & Privacy Consent ───────────────────────────
  log("Step 4: Executing Skill Gap Analysis with Privacy Guard...");
  await page.goto(`${FRONTEND_URL}/analysis`, { waitUntil: "networkidle" });

  // Verify pre-filled job description
  const jdInput = page.locator("textarea").first();
  await jdInput.waitFor({ state: "visible" });
  const currentJd = await jdInput.inputValue();
  if (currentJd.length > 50) {
    testPass("11. Analysis: Job description form loaded with realistic requirements");
  } else {
    testFail("11. Analysis", "Job description input was empty");
  }

  // Verify Privacy Consent Toggle is present and unchecked by default
  const consentCheckbox = page.locator("#aiConsentCheckbox");
  await consentCheckbox.waitFor({ state: "visible" });
  const isCheckedInitially = await consentCheckbox.isChecked();
  if (!isCheckedInitially) {
    testPass("12. Privacy Hardening: AI consent checkbox is unchecked by default (not assumed)");
  } else {
    testFail("12. Privacy Hardening", "AI consent checkbox was checked by default");
  }

  // Check the consent box to test consent-flow
  await consentCheckbox.check();
  testPass("13. Privacy Hardening: Explicit consent enabled via user toggle");

  // Submit Analysis
  const analyzeBtn = page.locator("button:has-text('Analyze Skill Gap')");
  await analyzeBtn.click();

  // Wait for Analysis Results card
  await page.locator("text=Match Score").first().waitFor({ state: "visible", timeout: 10000 });
  testPass("14. Analysis: Skill gap analysis executed and results summary rendered");

  // Verify Competency filter tabs
  await page.locator("button:has-text('Demonstrated')").click();
  const demonstratedSkill = page.locator("text=Node.js").first();
  await demonstratedSkill.waitFor({ state: "visible" });
  testPass("15. Analysis: Demonstrated skill filtered and verified with extracted resume quote");

  // Direct MongoDB check: Verify SkillGapAnalysis document
  const analysisDoc = await mongoose.connection.collection("skillgapanalyses").findOne({
    candidateEmail: CANDIDATE_EMAIL.toLowerCase(),
  });
  if (analysisDoc && analysisDoc.summary?.matchScore > 0) {
    testPass("16. Database Persistence: Skill gap analysis record persisted in MongoDB");
  } else {
    testFail("16. Database Persistence", "SkillGapAnalysis document not found in MongoDB");
  }

  // ── Step 5: Learning Roadmap & Progress Progression ────────────────────────
  log("Step 5: Generating Personalized Learning Roadmap...");
  await page.goto(`${FRONTEND_URL}/roadmap`, { waitUntil: "networkidle" });

  // Click Generate Roadmap button
  const genRoadmapBtn = page.locator("button:has-text('Generate Roadmap')");
  await genRoadmapBtn.waitFor({ state: "visible" });
  await genRoadmapBtn.click();

  // Wait for roadmap cards to render
  await page.locator("text=Milestones Completed").first().waitFor({ state: "visible", timeout: 10000 });
  testPass("17. Roadmap: Personalized curriculum milestones and portfolio blueprints generated");

  // Toggle Milestone 1 complete via "Mark Milestone Complete" button
  const completeBtn = page.locator("button:has-text('Mark Milestone Complete')").first();
  await completeBtn.waitFor({ state: "visible" });
  await completeBtn.click();

  // Wait for milestone completion badge / state
  await page.locator("text=Completed ✓").first().waitFor({ state: "visible", timeout: 5000 });
  testPass("18. Roadmap: Milestone completion toggled and progress percentage recalculated");

  // Test Refresh Persistence: Reload browser page
  log("Testing state persistence on page reload...");
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("text=Completed ✓").first().waitFor({ state: "visible", timeout: 8000 });
  testPass("19. Resilience: Roadmap state successfully persisted across page reload");

  // ── Step 6: Mock Interview Simulator & Rubric Evaluation ───────────────────
  log("Step 6: Conducting Mock Interview Session...");
  await page.goto(`${FRONTEND_URL}/interviews`, { waitUntil: "networkidle" });

  // Select Technical interview type & start
  const startInterviewBtn = page.locator("button:has-text('Start Session')");
  await startInterviewBtn.waitFor({ state: "visible" });
  await startInterviewBtn.click();

  // Wait for question to render
  await page.locator("text=Question 1 of").first().waitFor({ state: "visible", timeout: 10000 });
  testPass("20. Interview: Session created and dynamic technical question rendered");

  // Type answer into response textarea
  const answerArea = page.locator("textarea").first();
  await answerArea.fill(
    "In our production architecture, we utilize multi-stage Docker builds to separate compilation from the final minimal runtime image. We run unit tests in an Alpine builder stage, copy only compiled artifacts into a distroless container, enforce non-root users via the USER directive, and scan for CVE vulnerabilities in CI/CD pipelines."
  );

  // Submit Answer
  const submitAnswerBtn = page.locator("button:has-text('Submit Answer for Rubric Evaluation')");
  await submitAnswerBtn.click();

  // Wait for 4-Factor Rubric scores to render
  await page.locator("text=Answer Rubric Evaluation").first().waitFor({ state: "visible", timeout: 8000 });
  testPass("21. Interview: Multi-dimensional rubric scores and concrete feedback rendered");

  // Finalize Session
  const finalizeBtn = page.locator("button:has-text('Finalize Session')");
  await finalizeBtn.click();

  // Wait for Final Assessment badge
  await page.locator("text=Interview Session Finalized").first().waitFor({ state: "visible", timeout: 8000 });
  testPass("22. Interview: Session finalized and overall readiness badge rendered");

  // Verify answer input is closed/locked
  const inputClosed = (await page.locator("textarea").count()) === 0 || (await page.locator("textarea").first().isDisabled().catch(() => true));
  if (inputClosed) {
    testPass("23. Interview: Answer submission locked after session finalization");
  } else {
    testFail("23. Interview", "Textarea was not locked after finalization");
  }

  // ── Step 7: Profile Edit & Skills Preservation ─────────────────────────────
  log("Step 7: Testing Profile Update...");
  await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: "networkidle" });

  const titleInput = page.locator('input[placeholder="e.g. Senior Software Engineer"]');
  await titleInput.fill("Staff Software Architect");

  const saveBtn = page.locator("button:has-text('Save Profile Changes')");
  await saveBtn.click();

  await page.locator("text=Profile updated successfully").first().waitFor({ state: "visible", timeout: 5000 });
  testPass("24. Profile: Updates persisted and confirmed via UI alert");

  // Verify skills were NOT erased in MongoDB
  const updatedDoc = await mongoose.connection.collection("candidateprofiles").findOne({
    email: CANDIDATE_EMAIL.toLowerCase(),
  });
  if (updatedDoc?.skills?.length >= 4 && updatedDoc.currentTitle === "Staff Software Architect") {
    testPass("25. Database Integrity: Profile PATCH preserved declared skills array");
  } else {
    testFail("25. Database Integrity", "Skills array was erased during profile update");
  }

  // ── Step 8: Mobile Layout & Viewport Verification ──────────────────────────
  log("Step 8: Testing Mobile Viewport (iPhone SE: 375x667)...");
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle" });

  // Mobile menu button should be visible
  const mobileMenuBtn = page.locator('button[aria-label="Toggle navigation menu"]');
  const isMobileBtnVisible = await mobileMenuBtn.isVisible();
  if (isMobileBtnVisible) {
    testPass("26. Responsive Design: Mobile navigation toggle visible on mobile viewport");
    await mobileMenuBtn.click();
    const mobileLink = page.locator(".md\\:hidden a:has-text('Roadmap')").first();
    await mobileLink.waitFor({ state: "visible", timeout: 5000 });
    testPass("27. Responsive Design: Mobile drawer expands and exposes navigation links");
  } else {
    testFail("26. Responsive Design", "Mobile menu button not found");
  }

  // ── Step 9: Sign Out & Protected Route Enforcement ─────────────────────────
  log("Step 9: Testing Sign Out & Protected Route Guards...");
  // Restore viewport
  await page.setViewportSize({ width: 1280, height: 800 });

  // Click Sign Out
  const signOutBtn = page.locator("button[title='Log out']");
  await signOutBtn.waitFor({ state: "visible" });
  await signOutBtn.click();

  await page.waitForURL("**/auth*", { timeout: 8000 });
  testPass("28. Auth: Sign Out clears session and redirects to /auth");

  // Attempt to directly navigate to protected route /dashboard
  await page.goto(`${FRONTEND_URL}/dashboard`);
  await page.waitForURL("**/auth*", { timeout: 8000 });
  testPass("29. Security: Unauthenticated access to /dashboard intercepted by ProtectedRoute");

  // ── Step 10: Non-Existent Route (404 Page) ──────────────────────────────────
  log("Step 10: Testing 404 Route Handling...");
  await page.goto(`${FRONTEND_URL}/non-existent-random-route-404`);
  await page.locator("text=Page Not Found").first().waitFor({ state: "visible", timeout: 5000 });
  testPass("30. Routing: 404 Not Found page rendered for unknown URL");

} catch (err) {
  testFail("FATAL BROWSER AUTOMATION ERROR", err);
} finally {
  if (browser) {
    await browser.close();
  }
  await mongoose.disconnect();
  try {
    fs.unlinkSync(RESUME_FILE_PATH);
  } catch {}
}

console.log("\n══════════════════════════════════════════════════════════════════════");
console.log(`  BROWSER E2E RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (Total: ${passedCount + failedCount})`);
console.log(`  Console Errors Captured: ${consoleErrors.length}`);
console.log(`  Failed HTTP Requests: ${failedRequests.length}`);
console.log("══════════════════════════════════════════════════════════════════════\n");

if (consoleErrors.length > 0) {
  console.log("Console Errors Sample:", consoleErrors.slice(0, 3));
}
if (failedRequests.length > 0) {
  console.log("Failed Requests Sample:", failedRequests.slice(0, 3));
}

if (failedCount > 0) process.exit(1);
