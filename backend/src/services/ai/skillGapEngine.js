/**
 * skillGapEngine.js
 *
 * Core analytical engine for comparing candidate evidence against job requirements.
 * Fully transparent, deterministic, and explainable.
 *
 * Adheres to key principles:
 * - "Missing evidence" != "Absent skill".
 * - Explainable gap priorities.
 * - Actionable, grounded recommendations.
 */

import { extractResumeIntelligence } from "./resumeAnalyzer.js";
import { parseJobDescription } from "./jobParser.js";

/**
 * Computes skill evaluations, gap priorities, and transparent readiness scoring.
 *
 * @param {object} params
 * @param {string} params.resumeText
 * @param {string[]} params.declaredSkills
 * @param {string} params.jobTitle
 * @param {string} params.jobDescription
 * @param {string} [params.targetCompany=""]
 * @returns {object} Comprehensive analysis payload ready for persistence
 */
export const evaluateSkillGaps = ({
  resumeText,
  declaredSkills = [],
  jobTitle,
  jobDescription,
  targetCompany = "",
}) => {
  // 1. Parse job requirements
  const parsedJob = parseJobDescription(jobTitle, jobDescription);

  // 2. Extract resume intelligence & evidence map
  const evidenceMap = extractResumeIntelligence(resumeText, declaredSkills);

  const evaluations = [];

  // Helper to process a skill
  const processSkill = (skillName, importance) => {
    // Check if already in evidence map (case-insensitive search)
    let found = null;
    for (const [key, val] of evidenceMap.entries()) {
      if (key.toLowerCase() === skillName.toLowerCase()) {
        found = val;
        break;
      }
    }

    let status = "missing_evidence";
    let evidence = null;
    let gapPriority = "HIGH";
    let reasoning = "";

    if (found && found.status === "demonstrated") {
      status = "demonstrated";
      evidence = found.evidence;
      gapPriority = "NONE";
      reasoning = `Demonstrated with evidence in resume: "${found.evidence}"`;
    } else if (found && found.status === "partial") {
      status = "partial";
      evidence = null;
      gapPriority = importance === "required" ? "MEDIUM" : "LOW";
      reasoning =
        "Skill is declared on candidate profile, but specific project or experience context was not evidenced in resume text.";
    } else {
      status = "missing_evidence";
      evidence = null;
      gapPriority = importance === "required" ? "HIGH" : "MEDIUM";
      reasoning =
        "No direct evidence found in the current resume or profile. This indicates missing resume documentation, not necessarily absence of competency.";
    }

    evaluations.push({
      skill: skillName,
      category: found?.category || "technical",
      importance,
      status,
      evidence,
      gapPriority,
      reasoning,
    });
  };

  // Evaluate required skills
  for (const skill of parsedJob.requiredSkills) {
    processSkill(skill, "required");
  }

  // Evaluate preferred skills
  for (const skill of parsedJob.preferredSkills) {
    // Avoid duplicate evaluation if already in required
    if (!parsedJob.requiredSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      processSkill(skill, "preferred");
    }
  }

  // Fallback: If no skills found in JD, evaluate candidate's declared skills against general role
  if (evaluations.length === 0) {
    for (const skill of declaredSkills.slice(0, 5)) {
      processSkill(skill, "required");
    }
  }

  // 3. Compute Summary Counts & Match Score
  const requiredEvaluations = evaluations.filter((e) => e.importance === "required");
  const preferredEvaluations = evaluations.filter((e) => e.importance === "preferred");

  const calcScore = (items) => {
    if (items.length === 0) return 1.0;
    const totalPoints = items.reduce((acc, curr) => {
      if (curr.status === "demonstrated") return acc + 1.0;
      if (curr.status === "partial") return acc + 0.5;
      return acc;
    }, 0);
    return totalPoints / items.length;
  };

  const reqScore = calcScore(requiredEvaluations);
  const prefScore = calcScore(preferredEvaluations);

  let matchScore = 0;
  let scoringFormula = "";

  if (preferredEvaluations.length > 0) {
    matchScore = Math.round((reqScore * 0.7 + prefScore * 0.3) * 100);
    scoringFormula = "Weighted: Required Skills (70%) + Preferred Skills (30%)";
  } else {
    matchScore = Math.round(reqScore * 100);
    scoringFormula = "100% based on Required Skills (no preferred skills specified)";
  }

  // Determine readiness level
  let readinessLevel = "SUBSTANTIAL_GAP";
  if (matchScore >= 80) {
    readinessLevel = "READY";
  } else if (matchScore >= 50) {
    readinessLevel = "COMPETITIVE_WITH_UPSKILLING";
  }

  // 4. Key Strengths & Priority Gaps
  const keyStrengths = evaluations
    .filter((e) => e.status === "demonstrated")
    .map((e) => `${e.skill} (${e.importance})`);

  const priorityGaps = evaluations
    .filter((e) => e.gapPriority === "HIGH" || e.gapPriority === "MEDIUM")
    .map((e) => `${e.skill} (${e.gapPriority} Priority - ${e.status === "partial" ? "partial evidence" : "unmentioned"})`);

  // 5. Actionable Roadmap
  const actionPlan = evaluations
    .filter((e) => e.gapPriority !== "NONE")
    .map((e) => {
      let recommendation = "";
      if (e.status === "partial") {
        recommendation = `You have listed ${e.skill} in your profile. Add 1-2 quantified bullet points in your resume describing concrete deliverables, tools, or projects where you used ${e.skill}.`;
      } else {
        recommendation = `Target role requests ${e.skill} (${e.importance}). If you have experience with ${e.skill}, add it to your resume with measurable impact. If it is a new domain, build a targeted proof-of-concept project.`;
      }
      return {
        priority: e.gapPriority,
        skill: e.skill,
        recommendation,
      };
    })
    .sort((a, b) => {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return order[a.priority] - order[b.priority];
    });

  return {
    targetRole: jobTitle,
    targetCompany,
    jobDescriptionRaw: jobDescription,
    jobRequirements: {
      requiredSkills: parsedJob.requiredSkills,
      preferredSkills: parsedJob.preferredSkills,
      responsibilities: parsedJob.responsibilities,
    },
    skillEvaluations: evaluations,
    summary: {
      totalSkillsEvaluated: evaluations.length,
      demonstratedCount: evaluations.filter((e) => e.status === "demonstrated").length,
      partialCount: evaluations.filter((e) => e.status === "partial").length,
      missingEvidenceCount: evaluations.filter((e) => e.status === "missing_evidence").length,
      matchScore,
      readinessLevel,
      scoringFormula,
    },
    keyStrengths,
    priorityGaps,
    actionPlan,
    metadata: {
      engine: "deterministic-nlp-baseline",
      isAiGenerated: false,
      transparencyNotice:
        "Analysis derived deterministically via rule-based semantic NLP extraction. No remote LLM was invoked.",
    },
  };
};

