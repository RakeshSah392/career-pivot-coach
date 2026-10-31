/**
 * firebase.js
 *
 * Backend Firebase Admin SDK initialization for Career Pivot Coach.
 * Securely loads credentials from environment variables or service account JSON.
 * Never exposes private keys or commits them to version control.
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..", "..");

// Ensure backend .env is loaded regardless of process working directory
if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  dotenv.config({ path: path.resolve(backendRoot, ".env") });
}

let isFirebaseAdminConfigured = false;
let authInstance = null;
let adminApp = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID || "career-pivot-coach";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountEnvPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  let resolvedServiceAccountPath = null;
  if (serviceAccountEnvPath) {
    const candidates = [
      path.resolve(serviceAccountEnvPath),
      path.resolve(process.cwd(), serviceAccountEnvPath),
      path.resolve(backendRoot, serviceAccountEnvPath),
      path.resolve(backendRoot, "..", serviceAccountEnvPath),
      path.resolve(backendRoot, "config", "firebaseServiceAccount.json"),
      path.resolve(backendRoot, "..", "backend", "config", "firebaseServiceAccount.json"),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        resolvedServiceAccountPath = candidate;
        break;
      }
    }
  }

  if (serviceAccountJsonEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonEnv);
      adminApp =
        getApps().length > 0
          ? getApps()[0]
          : initializeApp({
              credential: cert(serviceAccount),
              projectId: serviceAccount.project_id || projectId,
            });

      isFirebaseAdminConfigured = true;
      console.log(`[Firebase Admin] Initialized via FIREBASE_SERVICE_ACCOUNT_JSON env string.`);
    } catch (parseErr) {
      console.error("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", parseErr.message);
    }
  } else if (resolvedServiceAccountPath) {
    const rawKey = fs.readFileSync(resolvedServiceAccountPath, "utf8");
    const serviceAccount = JSON.parse(rawKey);

    adminApp =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id || projectId,
          });

    isFirebaseAdminConfigured = true;
    console.log(`[Firebase Admin] Initialized via Service Account JSON (${path.basename(resolvedServiceAccountPath)}).`);
  } else if (clientEmail && privateKey) {
    // Unescape private key newlines if stored in .env string
    if (privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    adminApp =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
            projectId,
          });

    isFirebaseAdminConfigured = true;
    console.log(`[Firebase Admin] Initialized via environment credentials for project: ${projectId}`);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    adminApp =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            projectId,
          });
    isFirebaseAdminConfigured = true;
    console.log("[Firebase Admin] Initialized via Application Default Credentials.");
  } else {
    // Graceful initialization for development or unconfigured local mode
    console.warn(
      "[Firebase Admin] Credentials not configured. Set FIREBASE_CLIENT_EMAIL & FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT_PATH in backend/.env to verify live tokens."
    );
  }

  if (isFirebaseAdminConfigured && adminApp) {
    authInstance = getAuth(adminApp);
  }
} catch (err) {
  console.error("[Firebase Admin] Initialization failed:", err.message);
}

export { adminApp as admin, authInstance as auth, isFirebaseAdminConfigured };
export default adminApp;
