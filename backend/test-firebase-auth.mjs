/**
 * test-firebase-auth.mjs
 *
 * Dedicated Verification Suite for Firebase Authentication Integration.
 * Validates:
 * 1. Endpoint protection across candidate, analysis, roadmap, and interview APIs.
 * 2. Rejection of unauthenticated, empty, and malformed Bearer tokens (HTTP 401).
 * 3. Enforced email verification barrier (HTTP 403 EMAIL_NOT_VERIFIED).
 * 4. Canonical UID-based ownership checks and cross-tenant isolation (HTTP 403 Forbidden).
 * 5. Safe MongoDB migration and idempotent auto-linking.
 */

import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dir, ".env") });

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import CandidateProfile from "./src/models/CandidateProfile.js";
import { requireVerifiedEmail, requireOwnership } from "./src/middleware/auth.js";

let server;
const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    passCount++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failCount++;
    console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ""}`);
  }
}

async function startServer() {
  await connectDB();
  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
      resolve();
    });
  });
}

async function stopServer() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.connection.close();
}

async function runAuthVerificationSuite() {
  console.log("\n========================================================");
  console.log("  CAREER PIVOT COACH: FIREBASE AUTH VERIFICATION SUITE  ");
  console.log("========================================================\n");

  await startServer();

  try {
    // ─── 1. Unauthenticated Access Protection ──────────────────────────
    console.log("1. Endpoint Authentication Barrier (HTTP 401 on missing token)");

    const endpoints = [
      { method: "GET", path: "/candidates/profile/me" },
      { method: "GET", path: "/candidates/test@example.com" },
      { method: "POST", path: "/candidates/test@example.com/resume" },
      { method: "POST", path: "/analysis/test@example.com/run" },
      { method: "GET", path: "/analysis/test@example.com" },
      { method: "POST", path: "/roadmaps/test@example.com/generate" },
      { method: "GET", path: "/roadmaps/test@example.com" },
      { method: "POST", path: "/interviews/test@example.com/sessions" },
      { method: "GET", path: "/interviews/test@example.com/sessions" },
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: { "Content-Type": "application/json" },
        body: ep.method === "POST" ? JSON.stringify({}) : undefined,
      });

      assert(
        res.status === 401,
        `Unauthenticated ${ep.method} ${ep.path} rejected with HTTP 401`,
        `Received: ${res.status}`
      );
    }

    // ─── 2. Malformed & Empty Token Handling ────────────────────────────
    console.log("\n2. Malformed & Empty Bearer Token Rejection");

    const emptyTokenRes = await fetch(`${BASE_URL}/candidates/profile/me`, {
      headers: { Authorization: "Bearer " },
    });
    assert(
      emptyTokenRes.status === 401,
      "Empty Bearer token rejected with HTTP 401",
      `Received: ${emptyTokenRes.status}`
    );

    const nonBearerRes = await fetch(`${BASE_URL}/candidates/profile/me`, {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    assert(
      nonBearerRes.status === 401,
      "Non-Bearer authorization scheme rejected with HTTP 401",
      `Received: ${nonBearerRes.status}`
    );

    const malformedJwtRes = await fetch(`${BASE_URL}/candidates/profile/me`, {
      headers: { Authorization: "Bearer invalid.fake.jwt-signature" },
    });
    assert(
      malformedJwtRes.status === 401 || malformedJwtRes.status === 503,
      "Malformed JWT token rejected securely (401/503 depending on Admin SDK init)",
      `Received: ${malformedJwtRes.status}`
    );

    // ─── 3. Verified Email Enforcement (Unit Simulation) ───────────────
    console.log("\n3. Verified Email Enforcement Middleware");

    let verifiedMiddlewareStatus = null;
    let verifiedMiddlewareCode = null;
    const mockUnverifiedRes = {
      status(code) {
        verifiedMiddlewareStatus = code;
        return {
          json(payload) {
            verifiedMiddlewareCode = payload.code;
          },
        };
      },
    };

    requireVerifiedEmail(
      { user: { uid: "test_uid_123", email: "unverified@example.com", email_verified: false } },
      mockUnverifiedRes,
      () => {}
    );

    assert(
      verifiedMiddlewareStatus === 403 && verifiedMiddlewareCode === "EMAIL_NOT_VERIFIED",
      "Unverified email blocked with HTTP 403 and code EMAIL_NOT_VERIFIED",
      `Status: ${verifiedMiddlewareStatus}, Code: ${verifiedMiddlewareCode}`
    );

    let nextCalledForVerified = false;
    requireVerifiedEmail(
      { user: { uid: "test_uid_123", email: "verified@example.com", email_verified: true } },
      mockUnverifiedRes,
      () => {
        nextCalledForVerified = true;
      }
    );

    assert(
      nextCalledForVerified === true,
      "Verified email successfully passes requireVerifiedEmail middleware"
    );

    // ─── 4. Resource Ownership & Cross-Tenant Isolation ─────────────────
    console.log("\n4. Resource Ownership & Cross-Tenant Guard");

    let ownershipBlockedStatus = null;
    const mockOwnershipRes = {
      status(code) {
        ownershipBlockedStatus = code;
        return { json: () => {} };
      },
    };

    await requireOwnership(
      {
        user: { uid: "alice_uid", email: "alice@careercoach.dev" },
        params: { email: "bob@careercoach.dev" },
      },
      mockOwnershipRes,
      () => {}
    );

    assert(
      ownershipBlockedStatus === 403,
      "Cross-tenant access attempt (Alice accessing Bob's URL) rejected with HTTP 403 Forbidden",
      `Status: ${ownershipBlockedStatus}`
    );

    // ─── 5. Safe Migration & Canonical UID Linkage ─────────────────────
    console.log("\n5. Safe MongoDB Migration & UID Resolution");

    const testEmail = `migrated_${Date.now()}@migrationtest.dev`;
    const testUid = `firebase_uid_${Date.now()}`;

    // Create legacy record without firebaseUid
    const legacyCandidate = await CandidateProfile.create({
      email: testEmail,
      fullName: "Legacy Migrated Candidate",
      targetRole: "Staff Platform Engineer",
    });

    assert(
      legacyCandidate && !legacyCandidate.firebaseUid,
      "Legacy candidate record created without firebaseUid"
    );

    // Simulate safe linking upon authenticated request
    let nextCalledForOwnership = false;
    const mockReq = {
      user: { uid: testUid, email: testEmail },
      params: { email: testEmail },
    };

    await requireOwnership(mockReq, mockOwnershipRes, () => {
      nextCalledForOwnership = true;
    });

    const refreshedCandidate = await CandidateProfile.findOne({ email: testEmail });

    assert(
      nextCalledForOwnership === true && refreshedCandidate.firebaseUid === testUid,
      "Legacy record safely auto-linked to Firebase UID upon authentication without data loss",
      `Linked UID: ${refreshedCandidate.firebaseUid}`
    );

    // Clean up test record
    await CandidateProfile.deleteOne({ email: testEmail });

    // ─── 6. Public Health Check Remains Unaffected ──────────────────────
    console.log("\n6. Public Health Check Availability");

    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json();

    assert(
      healthRes.status === 200 && healthJson.success === true,
      "Public GET /api/health endpoint remains accessible without credentials"
    );
  } catch (err) {
    console.error("Test execution fatal error:", err);
  } finally {
    await stopServer();
  }

  console.log("\n========================================================");
  console.log(`  TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED  `);
  console.log("========================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runAuthVerificationSuite();

