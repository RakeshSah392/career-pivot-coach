/**
 * interviewQuestionBank.js
 *
 * Curated repository of role-specific and gap-targeted interview questions.
 * Designed for ₹0 budget deterministic interview generation with transparent rubrics.
 */

export const QUESTION_REPOSITORY = [
  // ── Docker
  {
    targetSkill: "Docker",
    questionType: "technical",
    difficulty: "intermediate",
    questionText:
      "How do multi-stage Docker builds optimize container images for production, and what security practices do you enforce in a production Dockerfile?",
    expectedKeyConcepts: [
      "multi-stage",
      "builder stage",
      "image size",
      "non-root user",
      "attack surface",
      "layer caching",
      "alpine or distroless",
      "vulnerability scanning",
    ],
    sampleAnswerOutline:
      "Explain separating the build environment from the lean runtime image using multiple FROM instructions, dropping unnecessary compilers, enforcing non-root users (USER directive), and pinning base image versions.",
  },

  // ── Kubernetes
  {
    targetSkill: "Kubernetes",
    questionType: "technical",
    difficulty: "advanced",
    questionText:
      "Explain how Kubernetes handles zero-downtime rolling updates, and how liveness vs readiness probes prevent traffic routing to unready pods.",
    expectedKeyConcepts: [
      "rolling update",
      "readiness probe",
      "liveness probe",
      "endpoints",
      "traffic routing",
      "maxSurge",
      "maxUnavailable",
      "graceful shutdown",
    ],
    sampleAnswerOutline:
      "Describe how readiness probes stop traffic from hitting newly started pods until warm, while liveness probes restart deadlocked pods. Detail rolling update strategies with maxSurge and maxUnavailable.",
  },

  // ── AWS
  {
    targetSkill: "AWS",
    questionType: "technical",
    difficulty: "intermediate",
    questionText:
      "How do you design a secure, highly available network topology on AWS for a backend API and private database cluster?",
    expectedKeyConcepts: [
      "vpc",
      "public subnet",
      "private subnet",
      "nat gateway",
      "security group",
      "multi-az",
      "bastion",
      "iam roles",
    ],
    sampleAnswerOutline:
      "Describe placing internet-facing load balancers in public subnets with NAT Gateways, while keeping backend compute and databases strictly in private subnets across multiple Availability Zones with least-privilege security groups.",
  },

  // ── Kafka
  {
    targetSkill: "Kafka",
    questionType: "system_design",
    difficulty: "advanced",
    questionText:
      "How does Apache Kafka guarantee message ordering, and how do consumer groups achieve horizontal scaling without race conditions?",
    expectedKeyConcepts: [
      "partition",
      "partition key",
      "consumer group",
      "offset",
      "ordering guarantee",
      "rebalance",
      "throughput",
      "idempotence",
    ],
    sampleAnswerOutline:
      "Explain that ordering is strictly guaranteed per partition, not across the entire topic. Detail how consumer groups assign partitions 1:1 to consumers, and how partition keys dictate destination partitions.",
  },

  // ── Redis
  {
    targetSkill: "Redis",
    questionType: "technical",
    difficulty: "intermediate",
    questionText:
      "Compare the Cache-Aside pattern with Write-Through caching in Redis. How do you handle cache invalidation and avoid cache stampedes?",
    expectedKeyConcepts: [
      "cache-aside",
      "write-through",
      "cache invalidation",
      "ttl",
      "stampede",
      "mutex",
      "stale data",
      "consistency",
    ],
    sampleAnswerOutline:
      "Detail Cache-Aside (app reads cache, falls back to DB on miss) vs Write-Through (cache updated synchronously on DB write). Address cache stampedes using probabilistic early expiration or distributed locks.",
  },

  // ── CI/CD
  {
    targetSkill: "CI/CD",
    questionType: "technical",
    difficulty: "intermediate",
    questionText:
      "Walk through your ideal automated deployment pipeline from Git pull request to production release. What automated gates must pass?",
    expectedKeyConcepts: [
      "linting",
      "unit tests",
      "integration tests",
      "artifact build",
      "branch protection",
      "canary or blue-green",
      "security scan",
      "automated rollback",
    ],
    sampleAnswerOutline:
      "Explain automated triggers on PR for linting, security SAST scanning, and unit tests, followed by artifact containerization, staging integration tests, and blue-green or canary release with automated healthcheck rollbacks.",
  },

  // ── TypeScript
  {
    targetSkill: "TypeScript",
    questionType: "technical",
    difficulty: "intermediate",
    questionText:
      "How do TypeScript conditional types, generics, and runtime validation tools (like Zod) bridge compile-time safety and untrusted API input?",
    expectedKeyConcepts: [
      "generics",
      "conditional types",
      "runtime validation",
      "schema inference",
      "zod",
      "type contract",
      "type safety",
      "unknown vs any",
    ],
    sampleAnswerOutline:
      "Discuss how TypeScript compiler checks vanish at runtime, making input parsing libraries essential. Explain using `z.infer` to extract compile-time types from runtime validation schemas.",
  },

  // ── Microservices
  {
    targetSkill: "Microservices",
    questionType: "system_design",
    difficulty: "advanced",
    questionText:
      "How do you maintain data consistency across decoupled microservices without relying on distributed two-phase commit transactions?",
    expectedKeyConcepts: [
      "saga pattern",
      "choreography",
      "orchestration",
      "compensating transaction",
      "eventual consistency",
      "idempotency",
      "outbox pattern",
    ],
    sampleAnswerOutline:
      "Discuss the Saga pattern using choreography or orchestration, compensating transactions for rollbacks, the transactional outbox pattern to avoid dual-write bugs, and idempotent consumers.",
  },

  // ── System Design
  {
    targetSkill: "System Design",
    questionType: "system_design",
    difficulty: "advanced",
    questionText:
      "How would you design a rate-limiting system capable of handling 500,000 requests per second across a globally distributed API cluster?",
    expectedKeyConcepts: [
      "sliding window",
      "token bucket",
      "redis cluster",
      "api gateway",
      "latency",
      "http 429",
      "distributed state",
      "atomic increment",
    ],
    sampleAnswerOutline:
      "Compare Token Bucket and Sliding Window log algorithms. Propose distributed counters via Redis cluster with Lua scripts, or edge rate-limiting at Cloudflare/API Gateway to protect backend services.",
  },

  // ── Testing & QA
  {
    targetSkill: "Testing & QA",
    questionType: "technical",
    difficulty: "intermediate",
    questionText:
      "What is the distinction between unit, integration, and contract testing? How do you prevent test suites from becoming slow and brittle?",
    expectedKeyConcepts: [
      "unit test",
      "integration test",
      "contract test",
      "test pyramid",
      "mocking",
      "isolation",
      "flakiness",
      "ci runtime",
    ],
    sampleAnswerOutline:
      "Reference the test pyramid with fast isolated unit tests at the base, followed by integration tests using ephemeral databases, and contract testing for inter-service API agreements without brittle end-to-end setups.",
  },

  // ── Behavioral: Outage & Incident Management
  {
    targetSkill: "Incident Management",
    questionType: "behavioral",
    difficulty: "intermediate",
    questionText:
      "Tell me about a high-severity production outage or bug you encountered. How did you triage, resolve it under pressure, and prevent recurrence?",
    expectedKeyConcepts: [
      "situation",
      "triage",
      "rollback",
      "root cause analysis",
      "post-mortem",
      "action items",
      "blameless",
      "communication",
    ],
    sampleAnswerOutline:
      "Structure using STAR (Situation, Task, Action, Result). Emphasize immediate mitigation (e.g. rollback or traffic shedding) over root-cause debugging during active outages, followed by a blameless post-mortem.",
  },

  // ── Behavioral: Technical Disagreement & Collaboration
  {
    targetSkill: "Cross-Functional Collaboration",
    questionType: "behavioral",
    difficulty: "intermediate",
    questionText:
      "Describe a situation where you had a strong technical disagreement with a team member or stakeholder on an architectural approach. How was it resolved?",
    expectedKeyConcepts: [
      "disagreement",
      "objective data",
      "benchmark",
      "active listening",
      "consensus",
      "compromise",
      "business impact",
      "commit",
    ],
    sampleAnswerOutline:
      "Use STAR format. Detail focusing on objective technical criteria (benchmarks, complexity, delivery timeline) rather than personal preference, actively listening, and finding consensus or disagreeing and committing.",
  },

  // ── Behavioral: Leadership & Mentorship
  {
    targetSkill: "Team Leadership",
    questionType: "behavioral",
    difficulty: "intermediate",
    questionText:
      "How do you approach mentoring junior or mid-level engineers, and how do you balance code review rigor with psychological safety?",
    expectedKeyConcepts: [
      "mentorship",
      "code review",
      "constructive feedback",
      "knowledge sharing",
      "growth",
      "pairing",
      "standards",
      "encouragement",
    ],
    sampleAnswerOutline:
      "Discuss pair programming, asking guided questions rather than dictating solutions, clearly differentiating between blocking bugs and non-blocking nitpicks in code reviews, and celebrating milestones.",
  },
];

/**
 * Generates an interview question dynamically for a skill not present in the static repository.
 */
export const createDynamicQuestion = (skillName, questionType = "technical") => {
  if (questionType === "behavioral") {
    return {
      targetSkill: skillName,
      questionType: "behavioral",
      difficulty: "intermediate",
      questionText: `Describe a challenging project where you utilized ${skillName}. What architectural trade-offs did you make, and how did you measure success?`,
      expectedKeyConcepts: [
        skillName.toLowerCase(),
        "trade-off",
        "challenge",
        "impact",
        "measurable result",
        "collaboration",
      ],
      sampleAnswerOutline:
        "Frame using the STAR method: describe the business challenge, the technical decision to use the skill, trade-offs encountered, and quantifiable outcomes.",
    };
  }

  return {
    targetSkill: skillName,
    questionType: "technical",
    difficulty: "intermediate",
    questionText: `What are the core architectural principles and common production pitfalls when working with ${skillName} in a high-scale environment?`,
    expectedKeyConcepts: [
      skillName.toLowerCase(),
      "architecture",
      "production",
      "scalability",
      "pitfall",
      "performance",
      "best practice",
    ],
    sampleAnswerOutline:
      `Discuss the fundamental responsibilities of ${skillName}, how it integrates into backend or distributed systems, failure modes to watch out for, and monitoring strategies.`,
  };
};

/**
 * Selects and generates a tailored question set for an interview session.
 *
 * @param {object} params
 * @param {string[]} params.gapSkills - Skills identified from SkillGapAnalysis
 * @param {string} params.targetRole - Target job title
 * @param {string} [params.interviewType="technical"] - "technical" | "behavioral" | "mixed"
 * @param {number} [params.questionCount=3] - Number of questions to generate (1 to 8)
 * @returns {Array<object>} Selected questions ready for session embedding
 */
export const generateQuestionsForSession = ({
  gapSkills = [],
  targetRole = "Software Engineer",
  interviewType = "technical",
  questionCount = 3,
}) => {
  const count = Math.max(1, Math.min(8, questionCount));
  const selected = [];
  const usedSkills = new Set();

  const behavioralTarget =
    interviewType === "mixed"
      ? Math.max(1, Math.floor(count / 2))
      : interviewType === "behavioral"
      ? count
      : 0;

  const technicalLimit =
    interviewType === "behavioral" ? 0 : count - behavioralTarget;

  // 1. Gather relevant questions matching gap skills first (up to technicalLimit)
  if (interviewType === "technical" || interviewType === "mixed") {
    for (const gap of gapSkills) {
      if (selected.length >= technicalLimit) break;
      const matched = QUESTION_REPOSITORY.find(
        (q) =>
          q.targetSkill.toLowerCase() === gap.toLowerCase() &&
          q.questionType !== "behavioral"
      );

      if (matched && !usedSkills.has(matched.targetSkill.toLowerCase())) {
        selected.push({ ...matched });
        usedSkills.add(matched.targetSkill.toLowerCase());
      } else if (!usedSkills.has(gap.toLowerCase())) {
        selected.push(createDynamicQuestion(gap, "technical"));
        usedSkills.add(gap.toLowerCase());
      }
    }
  }

  // 2. Add behavioral questions if type is "behavioral" or "mixed"
  if (interviewType === "behavioral" || interviewType === "mixed") {
    const behavioralPool = QUESTION_REPOSITORY.filter(
      (q) => q.questionType === "behavioral"
    );
    for (const bq of behavioralPool) {
      if (selected.length >= count) break;
      if (!usedSkills.has(bq.targetSkill.toLowerCase())) {
        selected.push({ ...bq });
        usedSkills.add(bq.targetSkill.toLowerCase());
      }
    }
  }

  // 3. Fill remaining slots from repository pool
  if (selected.length < count) {
    const remainingPool = QUESTION_REPOSITORY.filter(
      (q) =>
        !usedSkills.has(q.targetSkill.toLowerCase()) &&
        (interviewType === "mixed" ||
          (interviewType === "behavioral" && q.questionType === "behavioral") ||
          (interviewType === "technical" && q.questionType !== "behavioral"))
    );

    for (const q of remainingPool) {
      if (selected.length >= count) break;
      selected.push({ ...q });
      usedSkills.add(q.targetSkill.toLowerCase());
    }
  }

  // 4. Fallback if repository pool exhausted
  while (selected.length < count) {
    selected.push(
      createDynamicQuestion(
        `Technical Problem Solving for ${targetRole}`,
        interviewType === "behavioral" ? "behavioral" : "technical"
      )
    );
  }

  return selected.slice(0, count);
};
