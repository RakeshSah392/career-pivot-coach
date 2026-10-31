/**
 * analysis.routes.js
 *
 * Route definitions for Resume Intelligence & Skill Gap Analysis.
 * Mounted under /api/analysis.
 * Protected with Firebase Admin ID-token verification, verified email enforcement,
 * and canonical UID-based ownership checks.
 */

import { Router } from "express";
import {
  authenticate,
  requireVerifiedEmail,
  requireOwnership,
} from "../middleware/auth.js";
import {
  runAnalysis,
  getAnalyses,
  getAnalysis,
} from "../controllers/analysisController.js";

const router = Router();

router.post("/:email/run", authenticate, requireVerifiedEmail, requireOwnership, runAnalysis);
router.get("/:email", authenticate, requireVerifiedEmail, requireOwnership, getAnalyses);
router.get("/:email/:analysisId", authenticate, requireVerifiedEmail, requireOwnership, getAnalysis);

export default router;
