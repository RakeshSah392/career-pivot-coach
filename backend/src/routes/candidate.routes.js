/**
 * candidate.routes.js
 *
 * All routes under /api/candidates.
 * Protected with Firebase Admin ID-token verification, verified email enforcement,
 * and canonical UID-based ownership checks.
 */

import { Router } from "express";
import upload from "../middleware/upload.js";
import {
  authenticate,
  requireVerifiedEmail,
  requireOwnership,
} from "../middleware/auth.js";
import {
  createProfile,
  getMe,
  getProfile,
  updateProfile,
  uploadResume,
  getResumeMeta,
} from "../controllers/candidateController.js";

const router = Router();

// Canonical profile routes
router.post("/",           authenticate, createProfile);
router.get("/profile/me",  authenticate, getMe);
router.patch("/profile/me", authenticate, updateProfile);

// Parameterized profile routes with ownership checks
router.get("/:email",      authenticate, requireOwnership, getProfile);
router.patch("/:email",    authenticate, requireOwnership, updateProfile);

// Resume routes (require verified email and ownership)
router.post(
  "/:email/resume",
  authenticate,
  requireVerifiedEmail,
  requireOwnership,
  upload.single("resume"),
  uploadResume
);
router.get(
  "/:email/resume",
  authenticate,
  requireVerifiedEmail,
  requireOwnership,
  getResumeMeta
);

export default router;
