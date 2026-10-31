/**
 * interviewService.js
 *
 * Domain service coordinating Interview Session lifecycle:
 * generation, answer evaluation, progress tracking, and finalization.
 */

import mongoose from "mongoose";
import InterviewSession from "../models/InterviewSession.js";
import SkillGapAnalysis from "../models/SkillGapAnalysis.js";
import { getProfileByEmail } from "./candidateService.js";
import { generateQuestionsForSession } from "./ai/interviewQuestionBank.js";
import { evaluateAnswer } from "./ai/interviewEvaluator.js";

/**
 * Creates and persists a new mock interview session with tailored questions.
 *
 * @param {string} email - Candidate's email identifier
 * @param {object} [input={}] - { interviewType?: string, questionCount?: number, targetRole?: string }
 * @returns {Promise<InterviewSession>}
 */
export const createSession = async (email, input = {}) => {
  const candidate = await getProfileByEmail(email);

  // Retrieve candidate's latest skill gap analysis to identify exact targets
  const latestAnalysis = await SkillGapAnalysis.findOne({
    candidateEmail: email.toLowerCase(),
  }).sort({ createdAt: -1 });

  let gapSkills = [];
  if (latestAnalysis && latestAnalysis.skillEvaluations) {
    gapSkills = latestAnalysis.skillEvaluations
      .filter((e) => e.gapPriority !== "NONE")
      .map((e) => e.skill);
  }

  // Fallback to declared profile skills if no analysis exists yet
  if (gapSkills.length === 0 && candidate.skills) {
    gapSkills = candidate.skills;
  }

  const targetRole =
    input.targetRole ||
    latestAnalysis?.targetRole ||
    candidate.targetRole ||
    "Software Engineer";

  const questions = generateQuestionsForSession({
    gapSkills,
    targetRole,
    interviewType: input.interviewType || "technical",
    questionCount: input.questionCount || 3,
  });

  const session = await InterviewSession.create({
    candidateId: candidate._id,
    candidateEmail: candidate.email,
    targetRole,
    interviewType: input.interviewType || "technical",
    status: "in_progress",
    totalQuestions: questions.length,
    answeredQuestions: 0,
    overallScore: 0,
    readinessAssessment: "NOT_ASSESSED",
    questions,
    metadata: {
      engine: "deterministic-rubric-evaluator",
      isAiGenerated: false,
      transparencyNotice:
        "Evaluated using deterministic rubric-based semantic analysis. No remote LLM was invoked.",
    },
  });

  return session;
};

/**
 * Retrieves all interview sessions for a candidate.
 *
 * @param {string} email
 * @returns {Promise<InterviewSession[]>}
 */
export const getSessionsForCandidate = async (email) => {
  await getProfileByEmail(email);

  const sessions = await InterviewSession.find({
    candidateEmail: email.toLowerCase(),
  }).sort({ createdAt: -1 });

  return sessions;
};

/**
 * Retrieves a single interview session by ID, enforcing candidate isolation.
 *
 * @param {string} email
 * @param {string} sessionId
 * @returns {Promise<InterviewSession>}
 */
export const getSessionById = async (email, sessionId) => {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const err = new Error("Invalid sessionId format.");
    err.statusCode = 400;
    throw err;
  }

  const session = await InterviewSession.findOne({
    _id: sessionId,
    candidateEmail: email.toLowerCase(),
  });

  if (!session) {
    const err = new Error("Interview session not found for this candidate.");
    err.statusCode = 404;
    throw err;
  }

  return session;
};

/**
 * Submits an answer to a specific question within a session, evaluates it,
 * and updates the running session score.
 *
 * @param {string} email
 * @param {string} sessionId
 * @param {object} input - { questionId, answerText }
 * @returns {Promise<object>} Evaluated question and updated session status
 */
export const submitQuestionAnswer = async (email, sessionId, input) => {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const err = new Error("Invalid sessionId format.");
    err.statusCode = 400;
    throw err;
  }
  if (!mongoose.Types.ObjectId.isValid(input.questionId)) {
    const err = new Error("Invalid questionId format.");
    err.statusCode = 400;
    throw err;
  }

  const session = await InterviewSession.findOne({
    _id: sessionId,
    candidateEmail: email.toLowerCase(),
  });

  if (!session) {
    const err = new Error("Interview session not found for this candidate.");
    err.statusCode = 404;
    throw err;
  }

  if (session.status === "completed") {
    const err = new Error("Cannot submit answers to an already completed interview session.");
    err.statusCode = 400;
    throw err;
  }

  const question = session.questions.id(input.questionId);
  if (!question) {
    const err = new Error("Question not found in this interview session.");
    err.statusCode = 404;
    throw err;
  }

  // 1. Evaluate answer using deterministic rubric
  const evaluation = evaluateAnswer({
    question,
    answerText: input.answerText,
  });

  // 2. Persist answer and evaluation on question subdocument
  question.userAnswer = input.answerText.trim();
  question.answeredAt = new Date();
  question.evaluation = evaluation;

  // 3. Recalculate answered count and running average score
  const evaluatedQuestions = session.questions.filter((q) => q.evaluation !== null);
  session.answeredQuestions = evaluatedQuestions.length;

  const totalScore = evaluatedQuestions.reduce(
    (acc, q) => acc + q.evaluation.overallQuestionScore,
    0
  );
  session.overallScore = Math.round(totalScore / evaluatedQuestions.length);

  await session.save();

  return {
    questionId: question._id,
    questionText: question.questionText,
    targetSkill: question.targetSkill,
    evaluation: question.evaluation,
    sessionMetrics: {
      answeredQuestions: session.answeredQuestions,
      totalQuestions: session.totalQuestions,
      runningOverallScore: session.overallScore,
    },
  };
};

/**
 * Finalizes an interview session, calculates final readiness assessment,
 * and consolidates feedback.
 *
 * @param {string} email
 * @param {string} sessionId
 * @returns {Promise<InterviewSession>} Finalized session
 */
export const finalizeSession = async (email, sessionId) => {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const err = new Error("Invalid sessionId format.");
    err.statusCode = 400;
    throw err;
  }

  const session = await InterviewSession.findOne({
    _id: sessionId,
    candidateEmail: email.toLowerCase(),
  });

  if (!session) {
    const err = new Error("Interview session not found for this candidate.");
    err.statusCode = 404;
    throw err;
  }

  if (session.status === "completed") {
    return session; // idempotent return if already finalized
  }

  const answeredQuestions = session.questions.filter((q) => q.evaluation !== null);
  if (answeredQuestions.length === 0) {
    const err = new Error(
      "Cannot finalize interview session. Please answer at least one question before completing."
    );
    err.statusCode = 400;
    throw err;
  }

  // 1. Calculate overall score
  const totalScore = answeredQuestions.reduce(
    (acc, q) => acc + q.evaluation.overallQuestionScore,
    0
  );
  const finalScore = Math.round(totalScore / answeredQuestions.length);

  // 2. Assign readiness assessment
  let readinessAssessment = "NEEDS_PRACTICE";
  if (finalScore >= 80) {
    readinessAssessment = "INTERVIEW_READY";
  } else if (finalScore >= 60) {
    readinessAssessment = "COMPETITIVE";
  }

  // 3. Consolidate strengths and critical improvements
  const keyStrengthsSet = new Set();
  const criticalGapsSet = new Set();

  for (const q of answeredQuestions) {
    if (q.evaluation?.strengths) {
      q.evaluation.strengths.forEach((s) => keyStrengthsSet.add(s));
    }
    if (q.evaluation?.improvements) {
      q.evaluation.improvements.forEach((i) => criticalGapsSet.add(i));
    }
  }

  session.overallScore = finalScore;
  session.readinessAssessment = readinessAssessment;
  session.status = "completed";
  session.completedAt = new Date();
  session.summaryFeedback = {
    keyStrengths: Array.from(keyStrengthsSet).slice(0, 5),
    criticalGaps: Array.from(criticalGapsSet).slice(0, 5),
    overallNotes: `Candidate completed ${answeredQuestions.length}/${session.totalQuestions} questions with an average score of ${finalScore}/100 (${readinessAssessment}).`,
  };

  await session.save();
  return session;
};

