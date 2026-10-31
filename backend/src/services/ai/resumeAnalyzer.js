/**
 * resumeAnalyzer.js
 *
 * Extracts skills, evidence snippets, and experience indicators from resume text.
 * Strictly adheres to the rule: NEVER hallucinate or invent experience.
 * Every demonstrated skill MUST have direct text evidence from the uploaded resume.
 */

import { SKILL_TAXONOMY } from "./skillTaxonomy.js";

/**
 * Splits plain text into distinct sentences.
 */
const splitIntoSentences = (text) => {
  return text
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
};

/**
 * Analyzes resume text against the skill taxonomy and declared candidate profile skills.
 *
 * @param {string} resumeText - Raw text extracted from candidate's resume
 * @param {string[]} [declaredSkills=[]] - Skills declared on CandidateProfile
 * @returns {Map<string, { evidenced: boolean, snippet: string | null, confidence: number }>}
 */
export const extractResumeIntelligence = (resumeText = "", declaredSkills = []) => {
  const sentences = splitIntoSentences(resumeText);
  const evidenceMap = new Map();

  // Normalize declared skills for comparison
  const normalizedDeclared = new Set(
    (declaredSkills || []).map((s) => s.toLowerCase().trim())
  );

  for (const skill of SKILL_TAXONOMY) {
    let bestSnippet = null;
    let highestConfidence = 0;

    for (const pattern of skill.patterns) {
      for (const sentence of sentences) {
        if (pattern.test(sentence)) {
          // Found direct evidence
          bestSnippet = sentence.length > 240 ? `${sentence.slice(0, 237)}...` : sentence;
          highestConfidence = 1.0;
          break;
        }
      }
      if (bestSnippet) break;
    }

    const isDeclared = normalizedDeclared.has(skill.name.toLowerCase());

    if (bestSnippet) {
      evidenceMap.set(skill.name, {
        skill: skill.name,
        category: skill.category,
        status: "demonstrated",
        evidence: bestSnippet,
        confidence: highestConfidence,
        source: "resume_text",
      });
    } else if (isDeclared) {
      // Declared by user in profile, but lacking explicit resume sentence proof
      evidenceMap.set(skill.name, {
        skill: skill.name,
        category: skill.category,
        status: "partial",
        evidence: null,
        confidence: 0.5,
        source: "profile_declared_only",
      });
    }
  }

  // Also verify any custom declared skills not in the predefined taxonomy
  for (const declared of declaredSkills) {
    const existing = Array.from(evidenceMap.keys()).find(
      (k) => k.toLowerCase() === declared.toLowerCase()
    );
    if (!existing) {
      const reg = new RegExp(`\\b${declared.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const matchedSentence = sentences.find((s) => reg.test(s));

      if (matchedSentence) {
        evidenceMap.set(declared, {
          skill: declared,
          category: "custom",
          status: "demonstrated",
          evidence: matchedSentence.length > 240 ? `${matchedSentence.slice(0, 237)}...` : matchedSentence,
          confidence: 0.9,
          source: "resume_text",
        });
      } else {
        evidenceMap.set(declared, {
          skill: declared,
          category: "custom",
          status: "partial",
          evidence: null,
          confidence: 0.5,
          source: "profile_declared_only",
        });
      }
    }
  }

  return evidenceMap;
};

