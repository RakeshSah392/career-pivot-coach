/**
 * jobParser.js
 *
 * Deterministic semantic parser for job descriptions.
 * Extracts structured requirements: required skills, preferred skills, and responsibilities.
 * Requires ₹0 and executes locally with zero external network dependencies.
 */

import { SKILL_TAXONOMY } from "./skillTaxonomy.js";

/**
 * Normalises text into readable lines, stripping excessive whitespace and formatting.
 */
const cleanLines = (text) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

/**
 * Analyzes and classifies sections of a job description.
 */
export const parseJobDescription = (jobTitle, jobDescription) => {
  if (!jobDescription || typeof jobDescription !== "string") {
    throw new Error("Job description text is required for analysis.");
  }

  const lines = cleanLines(jobDescription);

  let currentSection = "general"; // 'requirements' | 'preferred' | 'responsibilities' | 'general'
  const sectionText = {
    requirements: [],
    preferred: [],
    responsibilities: [],
    general: [],
  };

  const REQ_HEADERS = /^(?:requirements|must[\s-]have|what you(?:'ll)? bring|qualifications|basic qualifications|minimum qualifications|core skills)/i;
  const PREF_HEADERS = /^(?:preferred|nice[\s-]to[\s-]have|bonus|plus|preferred qualifications|good to have|desired skills)/i;
  const RESP_HEADERS = /^(?:responsibilities|what you(?:'ll)? do|role overview|the role|key duties|what you will be doing)/i;

  for (const line of lines) {
    const headerClean = line.replace(/^[^a-zA-Z0-9]+/, "").trim();

    if (REQ_HEADERS.test(headerClean)) {
      currentSection = "requirements";
      continue;
    }
    if (PREF_HEADERS.test(headerClean)) {
      currentSection = "preferred";
      continue;
    }
    if (RESP_HEADERS.test(headerClean)) {
      currentSection = "responsibilities";
      continue;
    }

    sectionText[currentSection].push(line);
  }

  const reqFullText = (sectionText.requirements.join(" ") || sectionText.general.join(" "));
  const prefFullText = sectionText.preferred.join(" ");
  const allText = jobDescription;

  const requiredSkillsSet = new Set();
  const preferredSkillsSet = new Set();

  for (const skill of SKILL_TAXONOMY) {
    let matchedInReq = skill.patterns.some((p) => p.test(reqFullText));
    let matchedInPref = skill.patterns.some((p) => p.test(prefFullText));
    let matchedAnywhere = skill.patterns.some((p) => p.test(allText));

    if (matchedInPref) {
      preferredSkillsSet.add(skill.name);
    } else if (matchedInReq) {
      requiredSkillsSet.add(skill.name);
    } else if (matchedAnywhere) {
      // Default to required if no preferred section exists
      requiredSkillsSet.add(skill.name);
    }
  }

  // Extract key responsibilities (bullet points or action lines)
  const rawRespLines = sectionText.responsibilities.length > 0
    ? sectionText.responsibilities
    : lines.filter((l) => /^[-*•·]/.test(l) || /^(?:design|build|lead|architect|maintain|collaborate|implement|develop)\b/i.test(l));

  const responsibilities = rawRespLines
    .map((l) => l.replace(/^[-*•·\d.]+\s*/, "").trim())
    .filter((l) => l.length >= 15)
    .slice(0, 10); // top 10

  // Fallback: If no skills matched taxonomy, extract prominent capitalized technical terms
  if (requiredSkillsSet.size === 0 && preferredSkillsSet.size === 0) {
    const techWords = allText.match(/\b[A-Z][a-zA-Z0-9+#.]{1,15}\b/g) || [];
    const filtered = [...new Set(techWords)].filter(
      (w) => !["The", "We", "You", "Our", "And", "With", "For", "Role", "Team", "Job"].includes(w)
    );
    filtered.slice(0, 5).forEach((w) => requiredSkillsSet.add(w));
  }

  return {
    jobTitle: jobTitle.trim(),
    requiredSkills: Array.from(requiredSkillsSet),
    preferredSkills: Array.from(preferredSkillsSet),
    responsibilities,
  };
};

