/**
 * roadmap.routes.js
 *
 * Route definitions for Personalized Learning Roadmaps and Portfolio Projects.
 * Mounted at /api/roadmaps.
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
  generateRoadmap,
  getRoadmaps,
  getRoadmap,
  updateMilestone,
} from "../controllers/roadmapController.js";

const router = Router();

router.post("/:email/generate", authenticate, requireVerifiedEmail, requireOwnership, generateRoadmap);
router.get("/:email", authenticate, requireVerifiedEmail, requireOwnership, getRoadmaps);
router.get("/:email/:roadmapId", authenticate, requireVerifiedEmail, requireOwnership, getRoadmap);
router.patch("/:email/:roadmapId/milestones/:milestoneId", authenticate, requireVerifiedEmail, requireOwnership, updateMilestone);

export default router;
