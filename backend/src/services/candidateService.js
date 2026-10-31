/**
 * candidateService.js
 *
 * All database operations for the CandidateProfile domain.
 * Controllers stay thin — business logic lives here.
 */

import CandidateProfile from "../models/CandidateProfile.js";
import { extractTextFromBuffer } from "./resumeParser.js";

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Create a new candidate profile.
 * Throws a structured error if email is already registered.
 */
export const createProfile = async (data) => {
  try {
    const profile = await CandidateProfile.create(data);
    return profile;
  } catch (err) {
    // Mongoose duplicate-key error
    if (err.code === 11000) {
      // Safe migration check: If record exists with same email but no firebaseUid, link it!
      if (data.email && data.firebaseUid) {
        const existing = await CandidateProfile.findOne({ email: data.email.toLowerCase() });
        if (existing && !existing.firebaseUid) {
          existing.firebaseUid = data.firebaseUid;
          if (data.fullName && !existing.fullName) existing.fullName = data.fullName;
          if (data.currentTitle && !existing.currentTitle) existing.currentTitle = data.currentTitle;
          if (data.targetRole && !existing.targetRole) existing.targetRole = data.targetRole;
          await existing.save();
          console.log(`[candidateService] Auto-linked existing candidate profile '${existing.email}' to Firebase UID: ${data.firebaseUid}`);
          return existing;
        }
      }

      const duplicateErr = new Error("A profile with this email already exists.");
      duplicateErr.statusCode = 409;
      throw duplicateErr;
    }
    throw err;
  }
};

/**
 * Fetch a profile canonically by Firebase UID.
 */
export const getProfileByUid = async (uid) => {
  const profile = await CandidateProfile.findOne({ firebaseUid: uid });
  if (!profile) {
    const err = new Error("Candidate profile not found for this user account.");
    err.statusCode = 404;
    throw err;
  }
  return profile;
};

/**
 * Fetch a profile by email.
 */
export const getProfileByEmail = async (email) => {
  const profile = await CandidateProfile.findOne({ email: email.toLowerCase() });
  if (!profile) {
    const err = new Error("Candidate profile not found.");
    err.statusCode = 404;
    throw err;
  }
  return profile;
};

/**
 * Update mutable profile fields (everything except email).
 * Returns the updated document.
 */
export const updateProfile = async (email, updates) => {
  const profile = await CandidateProfile.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!profile) {
    const err = new Error("Candidate profile not found.");
    err.statusCode = 404;
    throw err;
  }
  return profile;
};

// ─── Resume ───────────────────────────────────────────────────────────────────

/**
 * Parse an uploaded file buffer and persist extracted text into the
 * candidate's profile document.  Replaces any previous resume.
 *
 * @param {string} email
 * @param {{ buffer: Buffer, originalname: string, mimetype: string, size: number }} file
 * @returns {CandidateProfile} Updated profile document
 */
export const attachResume = async (email, file) => {
  // 1. Parse — throws on unsupported type or empty content.
  const { text, wordCount, charCount, extractedAt } = await extractTextFromBuffer(
    file.buffer,
    file.mimetype
  );

  // 2. Persist
  const profile = await CandidateProfile.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: {
        resume: {
          originalName: file.originalname,
          mimeType:     file.mimetype,
          sizeBytes:    file.size,
          extractedText: text,
          parsedMeta: { wordCount, charCount, extractedAt },
        },
      },
    },
    { new: true, runValidators: true }
  );

  if (!profile) {
    const err = new Error("Candidate profile not found. Create a profile before uploading a resume.");
    err.statusCode = 404;
    throw err;
  }

  return profile;
};

/**
 * Return resume metadata without the full extracted text
 * (keeps response payload small for list/dashboard views).
 */
export const getResumeMeta = async (email) => {
  const profile = await CandidateProfile.findOne(
    { email: email.toLowerCase() },
    { "resume.originalName": 1, "resume.mimeType": 1, "resume.sizeBytes": 1, "resume.parsedMeta": 1, "resume.createdAt": 1 }
  );
  if (!profile) {
    const err = new Error("Candidate profile not found.");
    err.statusCode = 404;
    throw err;
  }
  if (!profile.resume) {
    const err = new Error("No resume found for this profile.");
    err.statusCode = 404;
    throw err;
  }
  return profile.resume;
};

