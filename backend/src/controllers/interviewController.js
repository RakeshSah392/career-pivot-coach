/**
 * interviewController.js
 *
 * HTTP controller layer for Mock Interview Sessions and Evaluation.
 */

import {
  createSessionSchema,
  submitAnswerSchema,
} from "../utils/interviewValidation.js";
import * as interviewService from "../services/interviewService.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const createSession = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email) {
    res.status(400);
    throw new Error("Candidate email parameter is required.");
  }

  const parsed = createSessionSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400);
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(" | ")
    );
  }

  const session = await interviewService.createSession(email, parsed.data);

  res.status(201).json({
    success: true,
    message: "Mock interview session created with tailored questions.",
    data: session,
  });
});

export const getSessions = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email) {
    res.status(400);
    throw new Error("Candidate email parameter is required.");
  }

  const sessions = await interviewService.getSessionsForCandidate(email);

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions,
  });
});

export const getSession = asyncHandler(async (req, res) => {
  const { email, sessionId } = req.params;

  if (!email || !sessionId) {
    res.status(400);
    throw new Error("Both email and sessionId parameters are required.");
  }

  const session = await interviewService.getSessionById(email, sessionId);

  res.status(200).json({
    success: true,
    data: session,
  });
});

export const submitAnswer = asyncHandler(async (req, res) => {
  const { email, sessionId } = req.params;

  if (!email || !sessionId) {
    res.status(400);
    throw new Error("Both email and sessionId parameters are required.");
  }

  const parsed = submitAnswerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400);
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(" | ")
    );
  }

  const result = await interviewService.submitQuestionAnswer(
    email,
    sessionId,
    parsed.data
  );

  res.status(200).json({
    success: true,
    message: "Answer evaluated and recorded successfully.",
    data: result,
  });
});

export const finalizeSession = asyncHandler(async (req, res) => {
  const { email, sessionId } = req.params;

  if (!email || !sessionId) {
    res.status(400);
    throw new Error("Both email and sessionId parameters are required.");
  }

  const finalizedSession = await interviewService.finalizeSession(
    email,
    sessionId
  );

  res.status(200).json({
    success: true,
    message: "Interview session finalized with overall readiness assessment.",
    data: finalizedSession,
  });
});

