/**
 * migrate-firebase-uids.js
 *
 * Safe MongoDB candidate record migration script for Firebase Authentication.
 * Idempotently links existing CandidateProfile documents with Firebase UIDs.
 *
 * Usage:
 *   node src/scripts/migrate-firebase-uids.js
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dir, "../../.env") });

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { auth, isFirebaseAdminConfigured } from "../config/firebase.js";
import CandidateProfile from "../models/CandidateProfile.js";

async function runMigration() {
  console.log("=== CAREER PIVOT COACH: FIREBASE UID MIGRATION ===");
  await connectDB();

  try {
    const candidates = await CandidateProfile.find({});
    console.log(`Found ${candidates.length} total candidate record(s) in MongoDB.`);

    let alreadyLinked = 0;
    let newlyMigrated = 0;
    let pendingRegistration = 0;
    let errors = 0;

    for (const candidate of candidates) {
      if (candidate.firebaseUid) {
        alreadyLinked++;
        continue;
      }

      if (!isFirebaseAdminConfigured || !auth) {
        console.log(`[Pending] Candidate '${candidate.email}' has no firebaseUid (Admin SDK offline, will auto-link on login).`);
        pendingRegistration++;
        continue;
      }

      try {
        const firebaseUser = await auth.getUserByEmail(candidate.email);
        if (firebaseUser) {
          candidate.firebaseUid = firebaseUser.uid;
          await candidate.save();
          console.log(`[Success] Linked candidate '${candidate.email}' to Firebase UID: ${firebaseUser.uid}`);
          newlyMigrated++;
        }
      } catch (err) {
        if (err.code === "auth/user-not-found") {
          console.log(`[Notice] Candidate '${candidate.email}' does not exist in Firebase Auth yet (will auto-link upon first registration).`);
          pendingRegistration++;
        } else {
          console.error(`[Error] Failed to migrate candidate '${candidate.email}':`, err.message);
          errors++;
        }
      }
    }

    console.log("\n=== MIGRATION SUMMARY ===");
    console.log(`Total Candidates Checked: ${candidates.length}`);
    console.log(`Already Linked with UID: ${alreadyLinked}`);
    console.log(`Newly Migrated & Linked: ${newlyMigrated}`);
    console.log(`Pending First Registration: ${pendingRegistration}`);
    console.log(`Errors Encountered: ${errors}`);
    console.log("Migration executed safely without modifying unverified records.");
  } catch (err) {
    console.error("Migration fatal error:", err);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}

runMigration();
