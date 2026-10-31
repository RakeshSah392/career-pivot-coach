/**
 * interview.routes.js
 *
 * Route definitions for Mock Interview Sessions and Evaluation Foundation.
 * Mounted at /api/interviews.
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
  createSession,
  getSessions,
  getSession,
  submitAnswer,
  finalizeSession,
} from "../controllers/interviewController.js";

const router = Router();

router.post("/:email/sessions", authenticate, requireVerifiedEmail, requireOwnership, createSession);
router.get("/:email/sessions", authenticate, requireVerifiedEmail, requireOwnership, getSessions);
router.get("/:email/sessions/:sessionId", authenticate, requireVerifiedEmail, requireOwnership, getSession);
router.post("/:email/sessions/:sessionId/answers", authenticate, requireVerifiedEmail, requireOwnership, submitAnswer);
router.post("/:email/sessions/:sessionId/finalize", authenticate, requireVerifiedEmail, requireOwnership, finalizeSession);

export default router;
