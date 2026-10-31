/**
 * curriculumEngine.js
 *
 * Deterministic engine for generating personalized learning roadmaps and
 * tailored portfolio project recommendations from SkillGapAnalysis records.
 *
 * Adheres to:
 * - ₹0 budget (all resources are free and open-source).
 * - Priority-driven scheduling (HIGH priority gaps sequenced first).
 * - Experience-adapted exercises (junior vs senior candidates).
 * - Production-oriented, non-generic portfolio projects.
 */

// ─── Free Curated Knowledge Catalog ──────────────────────────────────────────

const SKILL_MODULES = {
  Docker: {
    title: "Containerization & Production Docker Workflows",
    category: "Cloud & DevOps",
    resources: [
      {
        title: "Docker Official Documentation & Guides",
        type: "documentation",
        url: "https://docs.docker.com/get-started/",
      },
      {
        title: "Dockerfile Best Practices Guide",
        type: "documentation",
        url: "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/",
      },
    ],
    getObjectives: (isSenior) => [
      "Understand container runtime isolation, cgroups, and namespace concepts.",
      isSenior
        ? "Design optimized multi-stage builds with minimal attack surface and vulnerability scanning."
        : "Write clean Dockerfiles using standard multi-stage builds for frontend and backend.",
      "Manage multi-container compositions with networks, persistent volumes, and healthchecks.",
    ],
    getExercises: (isSenior) => [
      "Containerize an existing Express API and MongoDB instance using Docker Compose.",
      isSenior
        ? "Implement non-root user execution, read-only root filesystems, and health probe auto-restarts."
        : "Implement container layer caching and reduce final image size under 150MB.",
    ],
    getCriteria: () => [
      "Docker Compose boots entire multi-tier stack with a single command.",
      "Final production container image size is verified under 150MB with non-root user.",
      "Container healthchecks report healthy state under automated probe testing.",
    ],
  },

  Kubernetes: {
    title: "Kubernetes Cluster Architecture & Orchestration",
    category: "Cloud & DevOps",
    resources: [
      {
        title: "Kubernetes Official Interactive Basics",
        type: "tutorial",
        url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
      },
      {
        title: "Kubernetes Core Concepts & API Reference",
        type: "documentation",
        url: "https://kubernetes.io/docs/concepts/",
      },
    ],
    getObjectives: (isSenior) => [
      "Master Deployments, ReplicaSets, Services (ClusterIP/NodePort), and Ingress controllers.",
      isSenior
        ? "Architect production rolling updates, resource quotas, horizontal pod autoscalers (HPA), and Secrets management."
        : "Deploy containerized applications to local Minikube or Kind clusters.",
    ],
    getExercises: (isSenior) => [
      "Write declarative YAML manifests for Deployments, ConfigMaps, Secrets, and ClusterIP Services.",
      isSenior
        ? "Configure Horizontal Pod Autoscaler (HPA) and test automated scaling under simulated traffic bursts."
        : "Deploy and verify pod self-healing by simulating pod termination.",
    ],
    getCriteria: () => [
      "Manifests successfully deploy to local Minikube/Kind cluster without errors.",
      "Service discovery routes ingress traffic seamlessly across pod replicas.",
      "Zero-downtime rolling update verified during application version upgrade.",
    ],
  },

  AWS: {
    title: "AWS Cloud Fundamentals & Cloud-Native Services",
    category: "Cloud & DevOps",
    resources: [
      {
        title: "AWS Free Tier Documentation & Architecture Center",
        type: "documentation",
        url: "https://aws.amazon.com/architecture/",
      },
      {
        title: "AWS Well-Architected Framework Guide",
        type: "documentation",
        url: "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html",
      },
    ],
    getObjectives: (isSenior) => [
      "Understand core AWS compute (EC2, ECS, Lambda) and storage (S3, EBS).",
      isSenior
        ? "Design resilient VPC networking with public/private subnets, NAT Gateways, IAM least-privilege roles, and CloudWatch alarms."
        : "Configure S3 bucket policies, IAM users, and deploy backend microservices.",
    ],
    getExercises: () => [
      "Architect a multi-tier infrastructure diagram separating public web tier from private database tier.",
      "Deploy an API using containerized AWS App Runner or local LocalStack cloud emulation.",
    ],
    getCriteria: (isSenior) => [
      isSenior
        ? "Architecture diagram adheres to AWS Well-Architected security principles with production multi-region redundancy and auto-scaling."
        : "Architecture diagram adheres to AWS Well-Architected least-privilege security principles.",
      "Functional deployment verified with automated healthcheck monitoring and structured logging.",
    ],
  },

  Kafka: {
    title: "Event-Driven Architecture & Apache Kafka Streams",
    category: "Databases & Messaging",
    resources: [
      {
        title: "Apache Kafka Quickstart Documentation",
        type: "documentation",
        url: "https://kafka.apache.org/quickstart",
      },
      {
        title: "Confluent Event-Driven Design Fundamentals",
        type: "tutorial",
        url: "https://developer.confluent.io/learn/event-driven-architecture/",
      },
    ],
    getObjectives: (isSenior) => [
      "Grasp distributed log architecture, topics, partitions, consumer groups, and offsets.",
      isSenior
        ? "Implement at-least-once vs exactly-once semantics, dead-letter queues (DLQ), and partition rebalancing strategies."
        : "Produce and consume structured JSON messages across independent services.",
    ],
    getExercises: () => [
      "Spin up Kafka and Zookeeper/KRaft locally via Docker Compose.",
      "Build a producer service that publishes order events and an asynchronous consumer that processes payments.",
    ],
    getCriteria: () => [
      "Message throughput verified across multiple consumer group members.",
      "Failed message consumer gracefully routes poison pills to a Dead Letter Queue without crashing.",
    ],
  },

  "CI/CD": {
    title: "Automated CI/CD Pipelines & Continuous Delivery",
    category: "Cloud & DevOps",
    resources: [
      {
        title: "GitHub Actions Official Workflow Documentation",
        type: "documentation",
        url: "https://docs.github.com/en/actions",
      },
    ],
    getObjectives: (isSenior) => [
      "Design automated test, lint, build, and deployment pipelines.",
      isSenior
        ? "Implement environment branch protection, automated semantic versioning, artifact caching, and security scanning."
        : "Write GitHub Actions workflows triggered on pull requests.",
    ],
    getExercises: () => [
      "Configure a GitHub Actions YAML workflow that runs linting, unit tests, and builds Docker images on pull requests.",
    ],
    getCriteria: () => [
      "Pipeline runs automatically on Git push and reports test status.",
      "Workflow fails and blocks merge when code quality or test thresholds are breached.",
    ],
  },

  TypeScript: {
    title: "Production TypeScript & Type-Safe Architecture",
    category: "Languages",
    resources: [
      {
        title: "TypeScript Handbook & Best Practices",
        type: "documentation",
        url: "https://www.typescriptlang.org/docs/handbook/intro.html",
      },
    ],
    getObjectives: (isSenior) => [
      "Master generics, mapped types, conditional types, and strict null checks.",
      isSenior
        ? "Design end-to-end type safety across API boundaries with Zod schema inference."
        : "Convert existing JavaScript models and controllers to strict TypeScript.",
    ],
    getExercises: () => [
      "Refactor a REST or Express endpoint to use strict request/response DTO interfaces with Zod validation.",
    ],
    getCriteria: () => [
      "Strict mode (`tsc --noImplicitAny`) compiles with zero type errors.",
      "Runtime validation guarantees input types match compile-time contracts.",
    ],
  },

  "Testing & QA": {
    title: "Comprehensive Test Automation & Quality Engineering",
    category: "Engineering Practices",
    resources: [
      {
        title: "Jest Framework Documentation",
        type: "documentation",
        url: "https://jestjs.io/docs/getting-started",
      },
    ],
    getObjectives: () => [
      "Master unit testing, integration testing, mocking, and coverage analysis.",
      "Implement Test-Driven Development (TDD) for critical business calculations.",
    ],
    getExercises: () => [
      "Write unit tests achieving >80% statement coverage on business logic.",
      "Write integration tests simulating real HTTP request-response cycles with in-memory DB.",
    ],
    getCriteria: () => [
      "Test suite executes in CI under 60 seconds with zero flakiness.",
      "Code coverage report verifies >=80% branch coverage on service layer.",
    ],
  },

  Microservices: {
    title: "Microservices Architecture & Distributed System Design",
    category: "Architecture",
    resources: [
      {
        title: "Microservices Architecture Patterns by Chris Richardson",
        type: "documentation",
        url: "https://microservices.io/patterns/index.html",
      },
    ],
    getObjectives: (isSenior) => [
      "Decompose monoliths using domain-driven design bounded contexts.",
      isSenior
        ? "Implement Saga distributed transactions, API Gateways, Circuit Breakers, and distributed tracing."
        : "Implement independent service communication via HTTP and messaging.",
    ],
    getExercises: () => [
      "Design and implement two decoupled services with an API gateway routing traffic between them.",
    ],
    getCriteria: () => [
      "Services deploy independently without shared database dependencies.",
      "Circuit breaker gracefully falls back when a downstream service is simulated offline.",
    ],
  },

  Redis: {
    title: "In-Memory Caching & Distributed Rate Limiting with Redis",
    category: "Databases",
    resources: [
      {
        title: "Redis Official Documentation & Data Structures",
        type: "documentation",
        url: "https://redis.io/docs/",
      },
    ],
    getObjectives: () => [
      "Understand in-memory caching patterns: Cache-Aside, Write-Through, and TTL expiration.",
      "Implement distributed rate limiting, pub/sub messaging, and session stores.",
    ],
    getExercises: () => [
      "Integrate Redis cache-aside caching on high-latency API queries with automated invalidation.",
      "Build a distributed sliding-window rate limiter using Redis atomic commands.",
    ],
    getCriteria: () => [
      "Cached query latency drops by >80% compared to cold database reads.",
      "Rate limiter blocks requests exceeding quota with standard HTTP 429.",
    ],
  },
};

// ─── Portfolio Project Catalog ────────────────────────────────────────────────

const PROJECT_BLUEPRINTS = [
  {
    requiredMatchKeys: ["Docker", "Kubernetes", "AWS", "CI/CD"],
    blueprint: {
      title: "Cloud-Native Microservices Deployment & Observability Pipeline",
      description:
        "An enterprise-grade containerized service ecosystem orchestrated on Kubernetes with automated GitHub Actions CI/CD and production monitoring.",
      targetSkills: ["Docker", "Kubernetes", "CI/CD", "AWS"],
      difficulty: "Advanced",
      estimatedHours: 45,
      architectureOverview:
        "Multi-tier containerized architecture comprising an API Gateway, an authentication service, and a business microservice. Orchestrated with Helm/Kubernetes manifests, ingress routing, Prometheus metrics, and automated deployment pipelines.",
      suggestedFeatures: [
        "Multi-stage Dockerfiles achieving sub-100MB production images with non-root execution.",
        "Declarative Kubernetes manifests for Deployments, ClusterIP Services, Ingress, and Secrets.",
        "GitHub Actions CI/CD running automated tests, image vulnerability scans, and cluster rollouts.",
        "Horizontal Pod Autoscaler (HPA) configured to scale pods under simulated traffic loads.",
      ],
      deliverables: [
        "Public GitHub repository with comprehensive README and architectural diagrams.",
        "Fully working Docker Compose and Kubernetes manifest directory.",
        "Automated CI/CD workflow running live tests on pull requests.",
      ],
      completionCriteria: [
        "Zero-downtime rolling deployment verified during release test.",
        "HPA scales pods up from 2 to 6 replicas when load test is triggered.",
      ],
    },
  },
  {
    requiredMatchKeys: ["Kafka", "Redis", "Microservices"],
    blueprint: {
      title: "High-Throughput Event-Driven Transaction Processing Engine",
      description:
        "A distributed asynchronous event streaming platform processing high-volume transactions with decoupled order, payment, and inventory microservices.",
      targetSkills: ["Kafka", "Redis", "Microservices", "System Design"],
      difficulty: "Advanced",
      estimatedHours: 40,
      architectureOverview:
        "Producer services publish domain events to Apache Kafka topics. Consumer microservices asynchronously process events with idempotent writes, Redis cache-aside state management, and dead-letter queues for unprocessable messages.",
      suggestedFeatures: [
        "Distributed message streaming with Apache Kafka partitions and consumer groups.",
        "Redis distributed caching layer cutting database query loads by >70%.",
        "Dead Letter Queue (DLQ) automated retry mechanism for transient network failures.",
        "Distributed tracing and structured logging for complete request observability.",
      ],
      deliverables: [
        "GitHub repository with architecture documentation and Docker Compose setup.",
        "Load testing script (k6 or Artillery) demonstrating >1,000 requests/sec throughput.",
        "Comprehensive integration test suite covering partition rebalancing and DLQ handling.",
      ],
      completionCriteria: [
        "System maintains zero message loss when simulating worker failure.",
        "Redis cache hit ratio verified above 85% during sustained benchmarks.",
      ],
    },
  },
  {
    requiredMatchKeys: ["TypeScript", "Testing & QA", "Node.js"],
    blueprint: {
      title: "Enterprise Type-Safe Backend Platform with TDD & Domain-Driven Design",
      description:
        "A production-grade, strictly typed backend platform built with clean architecture, comprehensive test harnesses, and automated API contract enforcement.",
      targetSkills: ["TypeScript", "Testing & QA", "REST APIs", "Node.js"],
      difficulty: "Intermediate",
      estimatedHours: 30,
      architectureOverview:
        "Layered Hexagonal Architecture separating Domain Entities, Application Use Cases, and Infrastructure Adapters. Fully typed end-to-end with runtime schema inference.",
      suggestedFeatures: [
        "Strict TypeScript compilation (`noImplicitAny`, `strictNullChecks`) across all layers.",
        "Automated test harness with unit, integration, and contract tests exceeding 85% coverage.",
        "Zod validation middleware inferring compile-time types directly from runtime schemas.",
        "Standardized OpenAPI/Swagger documentation generated from TypeScript types.",
      ],
      deliverables: [
        "GitHub repository with continuous integration verifying tests and coverage badges.",
        "Interactive Swagger/OpenAPI documentation page.",
        "Detailed architecture decision records (ADRs) explaining domain design choices.",
      ],
      completionCriteria: [
        "Test suite executes in CI under 45 seconds with >=85% branch coverage.",
        "Zero TypeScript compilation warnings or any types in production source code.",
      ],
    },
  },
];

/**
 * Fallback generator for arbitrary skills not explicitly mapped in blueprints.
 */
const createDynamicModule = (skillName, category, isSenior) => ({
  title: `${skillName} Practical Mastery & Application`,
  category: category || "Specialized Technology",
  resources: [
    {
      title: `${skillName} Official Documentation & Guides`,
      type: "documentation",
      url: `https://www.google.com/search?q=${encodeURIComponent(skillName + " official documentation")}`,
    },
  ],
  getObjectives: () => [
    `Master fundamental syntax, patterns, and architectural conventions of ${skillName}.`,
    isSenior
      ? `Evaluate ${skillName} trade-offs, performance characteristics, and production deployment considerations.`
      : `Apply ${skillName} in hands-on code modules solving practical business problems.`,
  ],
  getExercises: () => [
    `Build an isolated prototype demonstrating core ${skillName} capabilities.`,
    `Write automated tests verifying correct edge-case handling with ${skillName}.`,
  ],
  getCriteria: (isSenior) => [
    isSenior
      ? `Production deployment checklist and automated test harness verify ${skillName} stability at scale.`
      : `Working code implementation of ${skillName} committed to version control.`,
    `Test harness verifies stability and expected behavior across edge scenarios.`,
  ],
});

/**
 * Generates a full LearningRoadmap payload from candidate profile and skill gap analysis.
 *
 * @param {object} params
 * @param {object} params.candidate - CandidateProfile Mongoose document
 * @param {object} params.analysis - SkillGapAnalysis Mongoose document
 * @returns {object} Structured roadmap ready for persistence
 */
export const generateRoadmapFromAnalysis = ({ candidate, analysis }) => {
  const isSenior = (candidate.yearsOfExperience || 0) >= 5;
  const evaluations = analysis.skillEvaluations || [];

  // 1. Identify and categorize gap skills (excluding demonstrated ones)
  const gapEvaluations = evaluations.filter((e) => e.gapPriority !== "NONE");

  // Sort by priority: HIGH first, then MEDIUM, then LOW
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sortedGaps = [...gapEvaluations].sort(
    (a, b) => priorityOrder[a.gapPriority] - priorityOrder[b.gapPriority]
  );

  const milestones = [];

  if (sortedGaps.length === 0) {
    // Edge case: Candidate demonstrated 100% of skills!
    // Offer an Advanced Architectural Mastery & System Scalability milestone
    milestones.push({
      weekNumber: 1,
      title: "Advanced System Scalability & Production Architecture",
      focusSkills: ["System Design", "Architecture"],
      priority: "HIGH",
      learningObjectives: [
        "Review production latency profiling, distributed tracing, and disaster recovery.",
        "Perform architectural audit of existing systems to optimize bottlenecks.",
      ],
      practicalExercises: [
        "Conduct load testing and benchmark 99th-percentile response times under stress.",
        "Document an Architecture Decision Record (ADR) for multi-region failover.",
      ],
      freeResources: [
        {
          title: "System Design Primer by Donne Martin",
          type: "documentation",
          url: "https://github.com/donnemartin/system-design-primer",
        },
      ],
      completionCriteria: [
        "Published comprehensive ADR documenting scalability optimizations.",
      ],
      status: "pending",
      completedAt: null,
    });
  } else {
    // Generate weekly milestones: assign 1-2 skills per week
    let currentWeek = 1;

    for (let i = 0; i < sortedGaps.length; i += 2) {
      const primaryGap = sortedGaps[i];
      const secondaryGap = sortedGaps[i + 1] || null;

      const skillsInWeek = [primaryGap.skill];
      if (secondaryGap) skillsInWeek.push(secondaryGap.skill);

      const mod1 =
        SKILL_MODULES[primaryGap.skill] ||
        createDynamicModule(primaryGap.skill, primaryGap.category, isSenior);
      const mod2 = secondaryGap
        ? SKILL_MODULES[secondaryGap.skill] ||
          createDynamicModule(secondaryGap.skill, secondaryGap.category, isSenior)
        : null;

      const title = secondaryGap
        ? `Week ${currentWeek}: ${primaryGap.skill} & ${secondaryGap.skill} Integration`
        : `Week ${currentWeek}: ${mod1.title}`;

      const objectives = [
        ...mod1.getObjectives(isSenior),
        ...(mod2 ? mod2.getObjectives(isSenior).slice(0, 2) : []),
      ];

      const exercises = [
        ...mod1.getExercises(isSenior),
        ...(mod2 ? mod2.getExercises(isSenior).slice(0, 1) : []),
      ];

      const criteria = [
        ...mod1.getCriteria(isSenior),
        ...(mod2 ? mod2.getCriteria(isSenior).slice(0, 1) : []),
      ];

      const resources = [
        ...mod1.resources,
        ...(mod2 ? mod2.resources.slice(0, 1) : []),
      ];

      milestones.push({
        weekNumber: currentWeek,
        title,
        focusSkills: skillsInWeek,
        priority: primaryGap.gapPriority,
        learningObjectives: objectives,
        practicalExercises: exercises,
        freeResources: resources,
        completionCriteria: criteria,
        status: "pending",
        completedAt: null,
      });

      currentWeek++;
      if (currentWeek > 12) break; // Cap at 12 weeks for realistic scope
    }
  }

  // 2. Select / Synthesize Portfolio Projects
  const gapSkillNames = sortedGaps.map((g) => g.skill);
  const matchedProjects = [];

  for (const bp of PROJECT_BLUEPRINTS) {
    const matchesAny = bp.requiredMatchKeys.some((k) =>
      gapSkillNames.some((g) => g.toLowerCase() === k.toLowerCase())
    );
    if (matchesAny) {
      matchedProjects.push({ ...bp.blueprint });
    }
    if (matchedProjects.length >= 2) break;
  }

  // If no blueprint matched, generate a tailored project from top gap skills
  if (matchedProjects.length === 0) {
    const primarySkills = gapSkillNames.slice(0, 3);
    matchedProjects.push({
      title: `${analysis.targetRole} Showcase Portfolio Project`,
      description: `A production-ready application specifically designed to demonstrate hands-on competence in ${primarySkills.join(", ")}.`,
      targetSkills: primarySkills.length > 0 ? primarySkills : ["Software Architecture"],
      difficulty: isSenior ? "Advanced" : "Intermediate",
      estimatedHours: isSenior ? 35 : 25,
      architectureOverview: `Modular full-stack or backend architecture highlighting clear separation of concerns, containerization, and structured testing around ${primarySkills.join(" and ")}.`,
      suggestedFeatures: [
        `Core business logic demonstrating ${primarySkills[0] || "core patterns"}.`,
        "Robust input validation, structured logging, and automated error handling.",
        "Containerized development environment with automated test suites.",
      ],
      deliverables: [
        "GitHub repository with architecture documentation and runnable demo instructions.",
        "Test report demonstrating solid coverage over key business paths.",
      ],
      completionCriteria: [
        "Project runs locally with a single setup command.",
        "Automated tests verify core functionality with zero manual configuration.",
      ],
    });
  }

  return {
    candidateId: candidate._id,
    candidateEmail: candidate.email,
    analysisId: analysis._id,
    targetRole: analysis.targetRole,
    targetCompany: analysis.targetCompany || "",
    durationWeeks: milestones.length,
    totalMilestones: milestones.length,
    completedMilestones: 0,
    progressPercentage: 0,
    status: "active",
    milestones,
    portfolioProjects: matchedProjects,
    metadata: {
      engine: "deterministic-curriculum-engine",
      isAiGenerated: false,
      transparencyNotice:
        "Curriculum and portfolio roadmap constructed deterministically using skill taxonomy analysis. No remote LLM was invoked.",
      generatedAt: new Date(),
    },
  };
};
