/**
 * verify-firebase-live.mjs
 *
 * Senior Staff Verification Suite for Firebase Authentication.
 * Validates:
 * 1. Presence and mapping of all 6 VITE_FIREBASE_* variables in frontend/.env.
 * 2. Backend service account JSON file existence, structure, and project ID.
 * 3. Exact match between frontend and backend Firebase project IDs.
 * 4. Safe exclusion of credentials from Git tracking (.gitignore).
 * 5. Initialization of Firebase Client SDK.
 * 6. Live initialization and non-destructive read-only smoke test of Firebase Admin SDK.
 *
 * STRICT SECURITY: Never prints or logs private keys, client secrets, or auth tokens.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backendDir = path.resolve(rootDir, "backend");
const frontendDir = path.resolve(rootDir, "frontend");

let passCount = 0;
let failCount = 0;

function check(passed, description, details = "") {
  if (passed) {
    passCount++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    failCount++;
    console.error(`  ❌ [FAIL] ${description} ${details ? `(${details})` : ""}`);
  }
}

async function run() {
  console.log("===============================================================");
  console.log("  CAREER PIVOT COACH: FIREBASE CONFIGURATION & SDK AUDIT       ");
  console.log("===============================================================\n");

  let frontendProjectId = null;
  let backendProjectId = null;
  let serviceAccount = null;

  // ─── 1. Frontend Environment Variables Verification ──────────────────────────
  console.log("1. Frontend Configuration Check (frontend/.env)");
  const frontendEnvPath = path.resolve(frontendDir, ".env");

  if (!fs.existsSync(frontendEnvPath)) {
    check(false, "frontend/.env file exists", `Not found at ${frontendEnvPath}`);
  } else {
    check(true, "frontend/.env file exists");

    const envContent = fs.readFileSync(frontendEnvPath, "utf8");
    const requiredFrontendVars = [
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_STORAGE_BUCKET",
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
      "VITE_FIREBASE_APP_ID",
    ];

    const parsedVars = {};
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        // Strip surrounding quotes if present (matches Vite's env parser)
        val = val.replace(/^["']|["']$/g, "").trim();
        parsedVars[key] = val;
      }
    }

    let allFrontendVarsValid = true;
    for (const v of requiredFrontendVars) {
      const val = parsedVars[v];
      const isPresent = Boolean(val && val.length > 0);
      if (!isPresent) allFrontendVarsValid = false;
      check(isPresent, `Frontend env variable '${v}' is present and non-empty`);
    }

    frontendProjectId = parsedVars["VITE_FIREBASE_PROJECT_ID"] || null;
  }

  // ─── 2. Backend Environment & Service Account Path Verification ──────────────
  console.log("\n2. Backend Configuration Check (backend/.env)");
  const backendEnvPath = path.resolve(backendDir, ".env");

  if (!fs.existsSync(backendEnvPath)) {
    check(false, "backend/.env file exists", `Not found at ${backendEnvPath}`);
  } else {
    check(true, "backend/.env file exists");

    const envContent = fs.readFileSync(backendEnvPath, "utf8");
    let serviceAccountPathVal = null;

    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.startsWith("FIREBASE_SERVICE_ACCOUNT_PATH=")) {
        serviceAccountPathVal = trimmed.split("=")[1].trim();
      }
    }

    check(
      Boolean(serviceAccountPathVal),
      "FIREBASE_SERVICE_ACCOUNT_PATH variable configured in backend/.env"
    );

    // Resolve path relative to backend directory or root
    const candidates = [
      path.resolve(backendDir, serviceAccountPathVal || ""),
      path.resolve(rootDir, serviceAccountPathVal || ""),
      path.resolve(backendDir, "config", "firebaseServiceAccount.json"),
    ];

    let foundPath = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        foundPath = c;
        break;
      }
    }

    check(
      Boolean(foundPath),
      "Firebase Admin service-account JSON file exists on disk",
      foundPath ? `Resolved to ${path.basename(foundPath)}` : "File not found"
    );

    if (foundPath) {
      try {
        const raw = fs.readFileSync(foundPath, "utf8");
        serviceAccount = JSON.parse(raw);

        const hasType = serviceAccount.type === "service_account";
        const hasProjectId = Boolean(serviceAccount.project_id);
        const hasClientEmail = Boolean(serviceAccount.client_email);
        const hasPrivateKey =
          Boolean(serviceAccount.private_key) &&
          serviceAccount.private_key.includes("BEGIN PRIVATE KEY") &&
          serviceAccount.private_key.includes("END PRIVATE KEY");

        check(hasType, "Service account JSON type is 'service_account'");
        check(hasProjectId, "Service account JSON specifies 'project_id'");
        check(hasClientEmail, "Service account JSON specifies 'client_email'");
        check(hasPrivateKey, "Service account JSON contains valid PEM private key format");

        backendProjectId = serviceAccount.project_id;
      } catch (err) {
        check(false, "Service account JSON is valid JSON format", err.message);
      }
    }
  }

  // ─── 3. Project ID Alignment ─────────────────────────────────────────────────
  console.log("\n3. Cross-Tier Project ID Alignment");
  const projectsMatch =
    Boolean(frontendProjectId) &&
    Boolean(backendProjectId) &&
    frontendProjectId === backendProjectId;

  check(
    projectsMatch,
    `Frontend and Backend target the identical Firebase Project ID: '${frontendProjectId}'`,
    `Frontend='${frontendProjectId}', Backend='${backendProjectId}'`
  );

  // ─── 4. Git Security & Secrets Exclusion (.gitignore) ───────────────────────
  console.log("\n4. Git Secrets Exclusion Audit (.gitignore)");
  const rootGitignore = fs.existsSync(path.resolve(rootDir, ".gitignore"))
    ? fs.readFileSync(path.resolve(rootDir, ".gitignore"), "utf8")
    : "";
  const backendGitignore = fs.existsSync(path.resolve(backendDir, ".gitignore"))
    ? fs.readFileSync(path.resolve(backendDir, ".gitignore"), "utf8")
    : "";
  const frontendGitignore = fs.existsSync(path.resolve(frontendDir, ".gitignore"))
    ? fs.readFileSync(path.resolve(frontendDir, ".gitignore"), "utf8")
    : "";

  const rootIgnoresEnv = rootGitignore.includes(".env");
  const rootIgnoresKeys =
    rootGitignore.includes("*serviceAccount*.json") ||
    rootGitignore.includes("*firebase*.json");
  const backendIgnoresKeys =
    backendGitignore.includes("config/*.json") ||
    backendGitignore.includes("*serviceAccount*.json");
  const frontendIgnoresEnv = frontendGitignore.includes(".env");

  check(rootIgnoresEnv, "Root .gitignore excludes .env files");
  check(rootIgnoresKeys, "Root .gitignore excludes serviceAccount and firebase json files");
  check(backendIgnoresKeys, "Backend .gitignore excludes config JSON credentials");
  check(frontendIgnoresEnv, "Frontend .gitignore excludes .env files");

  // ─── 5. Firebase Client SDK Initialization Smoke Test ────────────────────────
  console.log("\n5. Firebase Client SDK Initialization Smoke Test");
  try {
    const clientAppPath = pathToFileURL(path.resolve(frontendDir, "node_modules/firebase/app/dist/index.mjs")).href;
    const clientAuthPath = pathToFileURL(path.resolve(frontendDir, "node_modules/firebase/auth/dist/index.mjs")).href;

    const { initializeApp: initClientApp, getApps: getClientApps } = await import(clientAppPath);
    const { getAuth: getClientAuth } = await import(clientAuthPath);

    const clientApp =
      getClientApps().length > 0
        ? getClientApps()[0]
        : initClientApp({
            apiKey: "dummy-key-for-init-check",
            projectId: frontendProjectId || "career-pivot-coach",
            appId: "dummy-app-id",
          });
    const clientAuth = getClientAuth(clientApp);
    check(Boolean(clientAuth), "Firebase Client SDK successfully initialized");
  } catch (err) {
    check(false, "Firebase Client SDK initialization", err.message);
  }

  // ─── 6. Firebase Admin SDK Live Read-Only Smoke Test ──────────────────────────
  console.log("\n6. Firebase Admin SDK Live Read-Only Smoke Test");
  if (serviceAccount && backendProjectId) {
    try {
      const adminApp =
        getAdminApps().length > 0
          ? getAdminApps()[0]
          : initAdminApp({
              credential: cert(serviceAccount),
              projectId: backendProjectId,
            });

      const adminAuth = getAdminAuth(adminApp);
      check(Boolean(adminAuth), "Firebase Admin SDK app and auth service initialized");

      // Non-destructive read-only smoke probe: listUsers(1)
      // This validates credential handshake with Google Cloud OAuth2 servers without modifying accounts.
      const userList = await adminAuth.listUsers(1);
      check(
        userList !== undefined && Array.isArray(userList.users),
        `Live Google IAM credential handshake succeeded (Retrieved account batch: ${userList.users.length} existing user(s))`
      );
    } catch (err) {
      check(false, "Live Firebase Admin IAM credential handshake", err.message);
    }
  } else {
    check(false, "Firebase Admin SDK Live Smoke Test", "Service account details unavailable");
  }

  console.log("\n===============================================================");
  console.log(`  AUDIT RESULTS: ${passCount} PASSED, ${failCount} FAILED       `);
  console.log("===============================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

run();
