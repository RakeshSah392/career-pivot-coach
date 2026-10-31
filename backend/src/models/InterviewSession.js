import mongoose from "mongoose";

const EvaluationRubricSchema = new mongoose.Schema(
  {
    correctness: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    clarity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    relevance: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    practicalUnderstanding: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    overallQuestionScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    evaluationNotes: {
      type: String,
      default: "",
      trim: true,
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const InterviewQuestionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    questionType: {
      type: String,
      enum: ["technical", "behavioral", "system_design"],
      required: true,
    },
    targetSkill: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["entry", "intermediate", "advanced"],
      default: "intermediate",
    },
    expectedKeyConcepts: {
      type: [String],
      default: [],
    },
    sampleAnswerOutline: {
      type: String,
      default: "",
    },
    userAnswer: {
      type: String,
      default: null,
      trim: true,
    },
    answeredAt: {
      type: Date,
      default: null,
    },
    evaluation: {
      type: EvaluationRubricSchema,
      default: null,
    },
  },
  { _id: true, timestamps: true }
);

const InterviewSessionSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateProfile",
      required: true,
      index: true,
    },
    candidateEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
    },
    interviewType: {
      type: String,
      enum: ["technical", "behavioral", "mixed"],
      default: "technical",
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
      index: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    answeredQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    readinessAssessment: {
      type: String,
      enum: ["NEEDS_PRACTICE", "COMPETITIVE", "INTERVIEW_READY", "NOT_ASSESSED"],
      default: "NOT_ASSESSED",
    },
    summaryFeedback: {
      keyStrengths: { type: [String], default: [] },
      criticalGaps: { type: [String], default: [] },
      overallNotes: { type: String, default: "" },
    },
    questions: {
      type: [InterviewQuestionSchema],
      default: [],
    },
    metadata: {
      engine: {
        type: String,
        default: "deterministic-rubric-evaluator",
      },
      isAiGenerated: {
        type: Boolean,
        default: false,
      },
      transparencyNotice: {
        type: String,
        default:
          "Evaluated using deterministic rubric-based semantic analysis. No remote LLM was invoked.",
      },
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

InterviewSessionSchema.index({ candidateEmail: 1, createdAt: -1 });

const InterviewSession = mongoose.model(
  "InterviewSession",
  InterviewSessionSchema
);

export default InterviewSession;

