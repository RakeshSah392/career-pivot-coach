/**
 * interviewEvaluator.js
 *
 * Transparent, deterministic rubric-based evaluation engine for candidate mock interview responses.
 *
 * Principles:
 * - ₹0 cost, zero network dependencies.
 * - Multi-dimensional rubric: Correctness, Clarity, Relevance, Practical Understanding.
 * - Grounded, explainable feedback citing exact covered and missing concepts.
 * - Never claims LLM generation: labeled `engine: "deterministic-rubric-evaluator"`.
 */

/**
 * Normalizes text to lowercase tokens for semantic keyword matching.
 */
const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/**
 * Evaluates an interview answer against question criteria and rubrics.
 *
 * @param {object} params
 * @param {object} params.question - The InterviewQuestion document/object
 * @param {string} params.answerText - The candidate's submitted answer
 * @returns {object} Rubric scores, strengths, improvements, and overall score
 */
export const evaluateAnswer = ({ question, answerText = "" }) => {
  const cleanAnswer = answerText.trim();
  const words = cleanAnswer.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
      correctness: 0,
      clarity: 0,
      relevance: 0,
      practicalUnderstanding: 0,
      overallQuestionScore: 0,
      strengths: [],
      improvements: [
        "No response was provided. Attempting every question is critical in technical interviews.",
      ],
      evaluationNotes: "Empty answer submitted.",
      evaluatedAt: new Date(),
    };
  }

  const answerLower = cleanAnswer.toLowerCase();
  const expectedConcepts = question.expectedKeyConcepts || [];

  // ── 1. Correctness & Technical Depth (0 - 100) ──────────────────────────────
  const coveredConcepts = [];
  const missingConcepts = [];

  for (const concept of expectedConcepts) {
    const conceptLower = concept.toLowerCase();
    // Allow partial phrase or whole-word match
    const regex = new RegExp(`\\b${conceptLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    if (regex.test(answerLower) || answerLower.includes(conceptLower)) {
      coveredConcepts.push(concept);
    } else {
      missingConcepts.push(concept);
    }
  }

  let correctness = 40; // baseline for attempt
  if (expectedConcepts.length > 0) {
    const coverageRatio = coveredConcepts.length / expectedConcepts.length;
    correctness = Math.round(30 + coverageRatio * 70);
  } else {
    // If no concepts registered, baseline on technical terminology density
    correctness = wordCount >= 30 ? 75 : 55;
  }
  correctness = Math.min(100, Math.max(15, correctness));

  // ── 2. Clarity & Communication Structure (0 - 100) ──────────────────────────
  let clarity = 50;

  if (wordCount < 15) {
    clarity = 30; // too brief to demonstrate structured thought
  } else if (wordCount >= 15 && wordCount < 40) {
    clarity = 65;
  } else if (wordCount >= 40 && wordCount <= 350) {
    clarity = 85;
  } else if (wordCount > 350 && wordCount <= 550) {
    clarity = 75; // slightly verbose
  } else {
    clarity = 65; // overly verbose for a single question
  }

  // Bonus for structural connective words (indicating well-reasoned progression)
  const connectiveKeywords = [
    "first",
    "second",
    "because",
    "therefore",
    "in order to",
    "specifically",
    "as a result",
    "for example",
    "in contrast",
    "finally",
  ];
  const hasConnectives = connectiveKeywords.some((cw) => answerLower.includes(cw));
  if (hasConnectives && clarity <= 90) clarity += 10;

  // ── 3. Relevance (0 - 100) ──────────────────────────────────────────────────
  let relevance = 60;
  const targetSkill = (question.targetSkill || "").toLowerCase();

  const mentionsTarget = targetSkill && answerLower.includes(targetSkill);
  if (mentionsTarget) relevance += 20;

  if (coveredConcepts.length > 0) {
    relevance += Math.min(20, coveredConcepts.length * 5);
  } else if (wordCount < 20) {
    relevance -= 25;
  }
  relevance = Math.min(100, Math.max(20, relevance));

  // ── 4. Practical Understanding & Trade-offs (0 - 100) ───────────────────────
  let practicalUnderstanding = 50;

  // Trade-off indicators
  const tradeOffIndicators = [
    "trade-off",
    "tradeoff",
    "however",
    "downside",
    "compromise",
    "versus",
    "on the other hand",
    "bottleneck",
    "alternative",
  ];
  const mentionsTradeOff = tradeOffIndicators.some((t) => answerLower.includes(t));
  if (mentionsTradeOff) practicalUnderstanding += 15;

  // Production resilience & operational safeguards
  const productionIndicators = [
    "monitoring",
    "logging",
    "metric",
    "latency",
    "failover",
    "rollback",
    "healthcheck",
    "security",
    "scale",
    "concurrency",
    "resilience",
    "cache",
    "timeout",
  ];
  const matchedProd = productionIndicators.filter((p) => answerLower.includes(p));
  if (matchedProd.length >= 2) practicalUnderstanding += 20;
  else if (matchedProd.length === 1) practicalUnderstanding += 10;

  // Behavioral questions: check STAR method components
  if (question.questionType === "behavioral") {
    const starIndicators = ["situation", "task", "action", "result", "learned", "impact", "we achieved"];
    const matchedStar = starIndicators.filter((s) => answerLower.includes(s));
    if (matchedStar.length >= 2) practicalUnderstanding += 15;
  }

  practicalUnderstanding = Math.min(100, Math.max(20, practicalUnderstanding));

  // ── 5. Weighted Overall Question Score ──────────────────────────────────────
  // Correctness: 35% | Practical Depth: 25% | Clarity: 20% | Relevance: 20%
  const overallQuestionScore = Math.round(
    correctness * 0.35 +
    practicalUnderstanding * 0.25 +
    clarity * 0.20 +
    relevance * 0.20
  );

  // ── 6. Strengths & Actionable Improvements ──────────────────────────────────
  const strengths = [];
  const improvements = [];

  if (coveredConcepts.length > 0) {
    strengths.push(
      `Accurately addressed key technical concept(s): ${coveredConcepts.join(", ")}.`
    );
  }
  if (mentionsTradeOff) {
    strengths.push("Articulated practical architectural trade-offs rather than assuming a single silver bullet.");
  }
  if (clarity >= 80) {
    strengths.push("Well-structured communication with appropriate detail and conciseness.");
  }
  if (strengths.length === 0) {
    strengths.push("Clear communication attempt providing an initial foundation to build upon.");
  }

  if (missingConcepts.length > 0) {
    improvements.push(
      `Strengthen your response by explicitly discussing: ${missingConcepts.slice(0, 3).join(", ")}.`
    );
  }
  if (!mentionsTradeOff) {
    improvements.push(
      "Highlight operational trade-offs (e.g. complexity, latency, memory vs CPU) to demonstrate senior-level thinking."
    );
  }
  if (wordCount < 40) {
    improvements.push(
      "Expand on concrete production examples or metrics from your past projects to illustrate practical experience."
    );
  }

  return {
    correctness,
    clarity,
    relevance,
    practicalUnderstanding,
    overallQuestionScore,
    strengths,
    improvements,
    evaluationNotes:
      `Score: ${overallQuestionScore}/100. Answer addressed ${coveredConcepts.length}/${expectedConcepts.length} core concepts.`,
    evaluatedAt: new Date(),
  };
};

