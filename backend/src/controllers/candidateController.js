/**
 * candidateController.js
 *
 * Thin HTTP layer — validates input, delegates to service, formats response.
 * No business logic lives here.
 */

import { createProfileSchema, updateProfileSchema } from "../utils/profileValidation.js";
import * as candidateService from "../services/candidateService.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wraps an async route handler so thrown errors propagate to Express's
 * centralised errorHandler without try/catch boilerplate in every controller.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─── Profile controllers ──────────────────────────────────────────────────────

export const createProfile = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.user?.uid) {
    payload.firebaseUid = req.user.uid;
    payload.email = req.user.email;
  }

  const parsed = createProfileSchema.safeParse(payload);
  if (!parsed.success) {
    res.status(400);
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(" | ")
    );
  }

  const profile = await candidateService.createProfile(parsed.data);

  res.status(201).json({
    success: true,
    message: "Candidate profile created.",
    data: profile,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  if (!req.user?.uid) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  // Canonical UID lookup
  let profile;
  try {
    profile = await candidateService.getProfileByUid(req.user.uid);
  } catch (err) {
    if (err.statusCode === 404 && req.user.email) {
      // Safe fallback/migration check for unmigrated record
      profile = await candidateService.getProfileByEmail(req.user.email);
      if (profile && !profile.firebaseUid) {
        profile.firebaseUid = req.user.uid;
        await profile.save();
      }
    } else {
      throw err;
    }
  }

  res.status(200).json({ success: true, data: profile });
});

export const getProfile = asyncHandler(async (req, res) => {
  const email = decodeURIComponent(req.params.email || req.user?.email || "").toLowerCase();
  if (!email) {
    res.status(400);
    throw new Error("Email parameter is required.");
  }

  const profile = await candidateService.getProfileByEmail(email);

  res.status(200).json({ success: true, data: profile });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const email = (req.params.email ? decodeURIComponent(req.params.email) : req.user?.email)?.toLowerCase();

  if (!email) {
    res.status(400);
    throw new Error("Candidate email could not be determined from authentication context or parameters.");
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400);
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(" | ")
    );
  }

  const profile = await candidateService.updateProfile(email, parsed.data);

  res.status(200).json({
    success: true,
    message: "Profile updated.",
    data: profile,
  });
});

// ─── Resume controllers ───────────────────────────────────────────────────────

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file received. Attach a PDF or .txt file under the field name 'resume'.");
  }

  const { email } = req.params;
  if (!email) {
    res.status(400);
    throw new Error("Email parameter is required.");
  }

  const profile = await candidateService.attachResume(email, req.file);

  res.status(200).json({
    success: true,
    message: "Resume uploaded and parsed successfully.",
    data: {
      originalName: profile.resume.originalName,
      mimeType:     profile.resume.mimeType,
      sizeBytes:    profile.resume.sizeBytes,
      parsedMeta:   profile.resume.parsedMeta,
      // Return a preview of the extracted text (first 300 chars) for
      // immediate confirmation — never the full text in this endpoint.
      textPreview:  profile.resume.extractedText.slice(0, 300) + "…",
    },
  });
});

export const getResumeMeta = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const meta = await candidateService.getResumeMeta(email);

  res.status(200).json({ success: true, data: meta });
});

