/**
 * auth.js
 *
 * Firebase Authentication & Authorization Middleware for Express.
 * Verifies Firebase ID Tokens, enforces verified email requirements,
 * and validates resource ownership using canonical Firebase UIDs.
 */

import { auth, isFirebaseAdminConfigured } from "../config/firebase.js";
import CandidateProfile from "../models/CandidateProfile.js";

/**
 * Verifies the Firebase ID Token in the Authorization header.
 * Attaches decoded user info to req.user: { uid, email, email_verified }
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Bearer ID token is missing.",
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. ID token cannot be empty.",
    });
  }

  if (!isFirebaseAdminConfigured || !auth) {
    return res.status(503).json({
      success: false,
      message:
        "Authentication service temporarily unavailable: Firebase Admin SDK credentials are not configured on the backend.",
    });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase().trim(),
      email_verified: Boolean(decoded.email_verified),
      decoded,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token. Please sign in again.",
      error: err.code || err.message,
    });
  }
};

/**
 * Enforces email verification.
 * Blocks access to protected platform features until user has verified their email address.
 */
export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      code: "EMAIL_NOT_VERIFIED",
      message:
        "Email verification required. Please click the verification link sent to your inbox to unlock workspace access.",
    });
  }

  next();
};

/**
 * Validates candidate resource ownership.
 * Never trusts client-supplied URL parameters alone.
 * Validates that any supplied email in params matches req.user.email,
 * and ensures the candidate document is bound to the authenticated Firebase UID.
 */
export const requireOwnership = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // If route includes :email, enforce that it matches the authenticated user's email
  if (req.params.email) {
    const paramEmail = decodeURIComponent(req.params.email).toLowerCase().trim();
    if (paramEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to access or modify another candidate's resources.",
      });
    }
  }

  // Resolve candidate document by canonical Firebase UID (or claim unmigrated record with matching email)
  try {
    let candidate = await CandidateProfile.findOne({ firebaseUid: req.user.uid });

    if (!candidate && req.user.email) {
      // Safe migration check: If record exists with matching email but no firebaseUid, link it securely!
      candidate = await CandidateProfile.findOne({ email: req.user.email });
      if (candidate && !candidate.firebaseUid) {
        candidate.firebaseUid = req.user.uid;
        await candidate.save();
        console.log(`[Auth Middleware] Migrated candidate '${candidate.email}' to Firebase UID: ${req.user.uid}`);
      }
    }

    req.candidate = candidate;
    next();
  } catch (err) {
    return next(err);
  }
};

