import mongoose from "mongoose";

const FreeResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["documentation", "hands_on", "tutorial", "specification"],
      default: "documentation",
    },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const MilestoneSchema = new mongoose.Schema(
  {
    weekNumber: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    focusSkills: { type: [String], required: true },
    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      required: true,
    },
    learningObjectives: { type: [String], required: true },
    practicalExercises: { type: [String], required: true },
    freeResources: { type: [FreeResourceSchema], default: [] },
    completionCriteria: { type: [String], required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    completedAt: { type: Date, default: null },
  },
  { _id: true, timestamps: true }
);

const PortfolioProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    targetSkills: { type: [String], required: true },
    difficulty: {
      type: String,
      enum: ["Intermediate", "Advanced"],
      default: "Intermediate",
    },
    estimatedHours: { type: Number, required: true, min: 5, max: 120 },
    architectureOverview: { type: String, required: true, trim: true },
    suggestedFeatures: { type: [String], required: true },
    deliverables: { type: [String], required: true },
    completionCriteria: { type: [String], required: true },
  },
  { _id: true }
);

const LearningRoadmapSchema = new mongoose.Schema(
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
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillGapAnalysis",
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
    },
    targetCompany: {
      type: String,
      trim: true,
      default: "",
    },
    durationWeeks: {
      type: Number,
      required: true,
      min: 1,
      max: 16,
    },
    totalMilestones: {
      type: Number,
      required: true,
      default: 0,
    },
    completedMilestones: {
      type: Number,
      required: true,
      default: 0,
    },
    progressPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
      index: true,
    },
    milestones: {
      type: [MilestoneSchema],
      default: [],
    },
    portfolioProjects: {
      type: [PortfolioProjectSchema],
      default: [],
    },
    metadata: {
      engine: {
        type: String,
        default: "deterministic-curriculum-engine",
      },
      isAiGenerated: {
        type: Boolean,
        default: false,
      },
      transparencyNotice: {
        type: String,
        default:
          "Curriculum and portfolio roadmap constructed deterministically using skill taxonomy analysis. No remote LLM was invoked.",
      },
      generatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

LearningRoadmapSchema.index({ candidateEmail: 1, createdAt: -1 });

const LearningRoadmap = mongoose.model("LearningRoadmap", LearningRoadmapSchema);

export default LearningRoadmap;

