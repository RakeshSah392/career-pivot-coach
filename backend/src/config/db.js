import mongoose from "mongoose";
import dns from "dns";

/**
 * Connects to MongoDB using MONGODB_URI or MONGO_URI environment variables.
 * Fallback to local MongoDB (mongodb://127.0.0.1:27017/career_pivot_coach) if unconfigured.
 * Throws on failure so the caller (server.js) can decide whether to abort.
 */
const connectDB = async () => {
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri || uri.trim().length === 0) {
    console.log("ℹ️ No remote database URI configured. Defaulting to local MongoDB development database.");
    uri = "mongodb://127.0.0.1:27017/career_pivot_coach";
  }

  // Sanitization: strip accidental template angle brackets if pasted from Atlas docs
  if (uri.includes("<") || uri.includes("%3C")) {
    uri = uri.replace(/%3C([^%]+)%3E/g, "$1").replace(/<([^>]+)>/g, "$1");
  }

  // SRV DNS Resilience: for mongodb+srv:// URIs, configure public fallback DNS servers
  // to avoid local router SRV rejection (querySrv ECONNREFUSED)
  if (uri.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // Ignore if environment prevents setting DNS servers
    }
  }

  const options = {
    dbName: "career_pivot_coach",
    serverSelectionTimeoutMS: 10000,
  };

  try {
    const conn = await mongoose.connect(uri, options);
    console.log(`✅ MongoDB connected: ${conn.connection.host} [db: ${conn.connection.name}]`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    throw err; // bubble up — server.js will exit
  }
};

export default connectDB;

