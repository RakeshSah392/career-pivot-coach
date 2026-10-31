/**
 * server.js — application entry point.
 *
 * Boot order:
 *   1. Load environment variables — `import "dotenv/config"` is a side-effect
 *      import that runs as part of the ES module graph, before any other
 *      module body executes. This is the only reliable way to populate
 *      process.env before app.js and db.js are evaluated in an ES module
 *      context. A plain `dotenv.config()` call in the module body always
 *      executes AFTER all static imports have already been linked and
 *      evaluated by the runtime.
 *   2. Connect to MongoDB
 *   3. Start the HTTP server only after DB is ready
 *
 * A failed DB connection exits the process with a non-zero code so process
 * managers (PM2, Docker, K8s) know to restart or surface the failure.
 */

import "dotenv/config"; // ← side-effect import: populates process.env first

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const startServer = async () => {
  try {
    // ── 1. Database ───────────────────────────────────────────────────────────
    await connectDB();

    // ── 2. HTTP Server ────────────────────────────────────────────────────────
    const server = app.listen(PORT, () => {
      console.log("─────────────────────────────────────────────");
      console.log(`🚀 Career Pivot Coach API`);
      console.log(`   Environment : ${NODE_ENV}`);
      console.log(`   Port        : ${PORT}`);
      console.log(`   Health      : http://localhost:${PORT}/api/health`);
      console.log("─────────────────────────────────────────────");
    });

    // ── 3. Graceful Shutdown ──────────────────────────────────────────────────
    const shutdown = (signal) => {
      console.log(`\n⚠️  ${signal} received — shutting down gracefully…`);
      server.close(() => {
        console.log("🔌 HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));

    // Catch unhandled promise rejections that slip through after boot.
    process.on("unhandledRejection", (err) => {
      console.error("💥 Unhandled Rejection:", err.message);
      server.close(() => process.exit(1));
    });

  } catch (err) {
    // connectDB already logged the specific cause.
    console.error("💥 Failed to start server:", err.message);
    process.exit(1); // non-zero exit → restart policy kicks in
  }
};

startServer();
