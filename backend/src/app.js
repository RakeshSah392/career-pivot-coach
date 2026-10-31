import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
// Origin is injected via environment variable (CLIENT_ORIGIN or FRONTEND_URL); no hard-coded URLs.
const allowedOrigins = (process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, health check monitors, mobile clients)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      // Allow local development on any localhost / 127.0.0.1 port
      if (process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' not allowed.`));
    },
    credentials: true,
  })
);

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // 100 in prod, relaxed in development/testing
  standardHeaders: true,     // Return rate-limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests — please try again later.",
  },
});

app.use("/api", limiter);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  // Mongoose readyState: 0=disconnected 1=connected 2=connecting 3=disconnecting
  const dbStateMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? "Career Pivot Coach API is healthy" : "API degraded — database not connected",
    api: "online",
    database: {
      status: dbStateMap[dbState] ?? "unknown",
    },
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
import candidateRoutes from "./routes/candidate.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import roadmapRoutes from "./routes/roadmap.routes.js";
import interviewRoutes from "./routes/interview.routes.js";

app.use("/api/candidates", candidateRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/interviews", interviewRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
