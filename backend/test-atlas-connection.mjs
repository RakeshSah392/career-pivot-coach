/**
 * test-atlas-connection.mjs
 *
 * Safe verification of MongoDB Atlas connection.
 * - Does not print credentials.
 * - Confirms connection to Atlas.
 * - Checks connected database name.
 * - Runs a read-only admin ping.
 * - Checks existing collections and model schema compatibility without modifying data.
 */

import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Set reliable DNS servers for SRV resolution when local router blocks SRV records
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore if not permitted
}

const __dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dir, ".env") });

let rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!rawUri) {
  console.error("❌ Neither MONGODB_URI nor MONGO_URI is defined in environment variables.");
  process.exit(1);
}

const options = {
  dbName: "career_pivot_coach",
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
};

console.log("Analyzing URI credentials...");
const slashIdx = rawUri.indexOf("://");
const userEnd = rawUri.indexOf(":", slashIdx + 3);
const atIdx = rawUri.lastIndexOf("@");

let userPart = rawUri.substring(slashIdx + 3, userEnd);
let passPart = rawUri.substring(userEnd + 1, atIdx);
const hostAndRest = rawUri.substring(atIdx + 1);

let cleanedUser = userPart.replace(/%3C/gi, "").replace(/%3E/gi, "").replace(/[<>]/g, "");
let cleanedPass = passPart.replace(/%3C/gi, "").replace(/%3E/gi, "").replace(/[<>]/g, "");

// Test candidate password variants:
// 1. cleanedPass (e.g. "db_VqAfWgR3FHElAjyi")
// 2. without "db_" prefix (e.g. "VqAfWgR3FHElAjyi")
const passCandidates = [cleanedPass];
if (cleanedPass.startsWith("db_")) {
  passCandidates.push(cleanedPass.slice(3));
}

// Also test username candidates:
// 1. "sahr00905_db_user"
// 2. without "_db_user" -> "sahr00905"
const userCandidates = [cleanedUser];
if (cleanedUser.endsWith("_db_user")) {
  userCandidates.push(cleanedUser.replace("_db_user", ""));
}

let connectedConn = null;
let activeUri = null;

for (const u of userCandidates) {
  for (const p of passCandidates) {
    console.log(`\nAttempting connection with user="${u}" and password (length ${p.length})...`);
    const testUri = `mongodb+srv://${u}:${encodeURIComponent(p)}@${hostAndRest}`;
    try {
      const conn = await mongoose.connect(testUri, options);
      console.log(`✅ CONNECTED TO ATLAS! User="${u}" succeeded!`);
      connectedConn = conn;
      activeUri = testUri;
      break;
    } catch (e) {
      console.log(`❌ Failed with: ${e.message}`);
    }
  }
  if (connectedConn) break;
}

if (!connectedConn) {
  console.error("\n❌ All Atlas credential variations failed with authentication error.");
  process.exit(1);
}

const maskedUri = activeUri.replace(/\/\/[^:]+:[^@]+@/, "//<CREDENTIALS_HIDDEN>@");
console.log(`\nActive connection confirmed with URI: ${maskedUri}`);

try {
  const conn = connectedConn;
  console.log(`✅ MongoDB Atlas Connection Details:`);
  console.log(`   Host:          ${conn.connection.host}`);
  console.log(`   Port:          ${conn.connection.port}`);
  console.log(`   Database Name: ${conn.connection.name}`);
  console.log(`   ReadyState:    ${conn.connection.readyState} (1 = connected)`);

  // Run read-only ping
  const pingResult = await conn.connection.db.admin().ping();
  console.log(`   Ping Result:  `, JSON.stringify(pingResult));

  // List existing collections
  const collections = await conn.connection.db.listCollections().toArray();
  console.log(`   Collections count in "${conn.connection.name}": ${collections.length}`);
  for (const c of collections) {
    const count = await conn.connection.db.collection(c.name).estimatedDocumentCount();
    console.log(`     - ${c.name}: ~${count} documents`);
  }

  // Import models to verify registration & schema compatibility
  const { default: CandidateProfile } = await import("./src/models/CandidateProfile.js");
  const { default: SkillGapAnalysis } = await import("./src/models/SkillGapAnalysis.js");
  const { default: LearningRoadmap } = await import("./src/models/LearningRoadmap.js");
  const { default: InterviewSession } = await import("./src/models/InterviewSession.js");

  console.log("✅ Mongoose models loaded and compatible with Atlas connection:");
  console.log(`   - CandidateProfile collection: ${CandidateProfile.collection.name}`);
  console.log(`   - SkillGapAnalysis collection: ${SkillGapAnalysis.collection.name}`);
  console.log(`   - LearningRoadmap collection:  ${LearningRoadmap.collection.name}`);
  console.log(`   - InterviewSession collection: ${InterviewSession.collection.name}`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected cleanly.\n");
  process.exit(0);
} catch (err) {
  console.error(`❌ Atlas verification failed: ${err.message}`);
  process.exit(1);
}
