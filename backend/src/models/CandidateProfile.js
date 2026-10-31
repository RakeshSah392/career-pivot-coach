import mongoose from "mongoose";

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const ResumeSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true },
    mimeType:     { type: String, required: true },
    sizeBytes:    { type: Number, required: true },
    // Extracted plain-text content from the resume (PDF or TXT).
    // Stored in MongoDB; files are NOT persisted to disk in production.
    extractedText: { type: String, default: "" },
    // Lightweight metadata derived from the text (filled by service layer).
    parsedMeta: {
      wordCount:      { type: Number, default: 0 },
      charCount:      { type: Number, default: 0 },
      extractedAt:    { type: Date },
    },
  },
  { _id: true, timestamps: true }
);

const SocialLinksSchema = new mongoose.Schema(
  {
    linkedin: { type: String, trim: true, default: "" },
    github:   { type: String, trim: true, default: "" },
    portfolio:{ type: String, trim: true, default: "" },
  },
  { _id: false }
);

// ─── Root schema ─────────────────────────────────────────────────────────────

const CandidateProfileSchema = new mongoose.Schema(
  {
    // Canonical Firebase User Identity anchor
    firebaseUid: {
      type:     String,
      unique:   true,
      sparse:   true, // Sparse unique index allows safe migration of existing records
      trim:     true,
      index:    true,
    },
    email: {
      type:     String,
      required: [true, "Email is required."],
      unique:   true,
      lowercase: true,
      trim:     true,
      match:    [/^\S+@\S+\.\S+$/, "Invalid email format."],
    },
    fullName: {
      type:     String,
      required: [true, "Full name is required."],
      trim:     true,
      maxlength: [120, "Name may not exceed 120 characters."],
    },
    currentTitle:   { type: String, trim: true, default: "" },
    currentIndustry:{ type: String, trim: true, default: "" },
    targetRole:     { type: String, trim: true, default: "" },
    targetIndustry: { type: String, trim: true, default: "" },
    yearsOfExperience: { type: Number, min: 0, max: 60, default: 0 },
    skills: {
      type:    [String],
      default: [],
      // Limit array noise — front-end should send de-duped, trimmed strings.
    },
    socialLinks: { type: SocialLinksSchema, default: () => ({}) },

    // A candidate may upload one resume at a time; replace-on-upload semantics.
    resume: { type: ResumeSchema, default: null },
  },
  {
    timestamps: true,    // createdAt, updatedAt
    versionKey: false,
  }
);

// ─── Virtual ─────────────────────────────────────────────────────────────────
CandidateProfileSchema.virtual("hasResume").get(function () {
  return !!this.resume?.extractedText;
});

const CandidateProfile = mongoose.model("CandidateProfile", CandidateProfileSchema);

export default CandidateProfile;

