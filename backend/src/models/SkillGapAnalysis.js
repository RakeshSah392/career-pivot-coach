import mongoose from "mongoose";

const SkillEvaluationSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true },
    category: { type: String, default: "technical", trim: true },
    importance: {
      type: String,
      enum: ["required", "preferred"],
      required: true,
    },
    status: {
      type: String,
      enum: ["demonstrated", "partial", "missing_evidence"],
      required: true,
    },
    evidence: {
      type: String,
      default: null,
      trim: true,
    },
    gapPriority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW", "NONE"],
      required: true,
    },
    reasoning: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const ActionItemSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      required: true,
    },
    skill: { type: String, required: true, trim: true },
    recommendation: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const TransferableSkillSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true },
    sourceExperience: { type: String, required: true, trim: true },
    applicability: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const AIInsightsSchema = new mongoose.Schema(
  {
    comparisonSummary: { type: String, default: "", trim: true },
    skillsExplanation: { type: String, default: "", trim: true },
    transferableSkills: { type: [TransferableSkillSchema], default: [] },
    tailoredRecommendations: { type: [String], default: [] },
    transitionAdvice: { type: [String], default: [] },
    modelUsed: { type: String, default: "", trim: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SkillGapAnalysisSchema = new mongoose.Schema(
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
      required: [true, "Target job title is required."],
      trim: true,
    },
    targetCompany: {
      type: String,
      trim: true,
      default: "",
    },
    jobDescriptionRaw: {
      type: String,
      required: [true, "Job description text is required."],
    },
    jobRequirements: {
      requiredSkills: { type: [String], default: [] },
      preferredSkills: { type: [String], default: [] },
      responsibilities: { type: [String], default: [] },
    },
    resumeSnapshot: {
      originalName: { type: String, default: "" },
      extractedAt: { type: Date },
      charCount: { type: Number, default: 0 },
      wordCount: { type: Number, default: 0 },
    },
    skillEvaluations: {
      type: [SkillEvaluationSchema],
      default: [],
    },
    summary: {
      totalSkillsEvaluated: { type: Number, default: 0 },
      demonstratedCount: { type: Number, default: 0 },
      partialCount: { type: Number, default: 0 },
      missingEvidenceCount: { type: Number, default: 0 },
      matchScore: { type: Number, min: 0, max: 100, required: true },
      readinessLevel: {
        type: String,
        enum: ["READY", "COMPETITIVE_WITH_UPSKILLING", "SUBSTANTIAL_GAP"],
        required: true,
      },
      scoringFormula: {
        type: String,
        default: "Weighted: Required (70%) + Preferred (30%)",
      },
    },
    keyStrengths: {
      type: [String],
      default: [],
    },
    priorityGaps: {
      type: [String],
      default: [],
    },
    actionPlan: {
      type: [ActionItemSchema],
      default: [],
    },
    aiInsights: {
      type: AIInsightsSchema,
      default: null,
    },
    metadata: {
      engine: {
        type: String,
        default: "deterministic-nlp-baseline",
      },
      isAiGenerated: {
        type: Boolean,
        default: false,
      },
      transparencyNotice: {
        type: String,
        default:
          "Analysis derived deterministically via rule-based semantic NLP extraction. No remote LLM was invoked.",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

SkillGapAnalysisSchema.index({ candidateEmail: 1, createdAt: -1 });

const SkillGapAnalysis = mongoose.model(
  "SkillGapAnalysis",
  SkillGapAnalysisSchema
);

export default SkillGapAnalysis;

