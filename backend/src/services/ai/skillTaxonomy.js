/**
 * skillTaxonomy.js
 *
 * Curated dictionary of skills across domains with synonyms and categorization.
 * Enables zero-budget, high-precision keyword-in-context extraction without remote LLMs.
 */

export const SKILL_TAXONOMY = [
  // ── Languages
  {
    name: "JavaScript",
    category: "Languages",
    patterns: [/\bjavascript\b/i, /\bjs\b/i, /\bes6\+?\b/i],
  },
  {
    name: "TypeScript",
    category: "Languages",
    patterns: [/\btypescript\b/i, /\bts\b/i],
  },
  {
    name: "Python",
    category: "Languages",
    patterns: [/\bpython\b/i, /\bpy\b/i],
  },
  {
    name: "Java",
    category: "Languages",
    patterns: [/\bjava\b/i],
  },
  {
    name: "Go",
    category: "Languages",
    patterns: [/\bgolang\b/i, /\bgo\b/i],
  },
  {
    name: "C++",
    category: "Languages",
    patterns: [/\bc\+\+\b/i, /\bcpp\b/i],
  },
  {
    name: "SQL",
    category: "Languages",
    patterns: [/\bsql\b/i, /\bstructured query language\b/i],
  },

  // ── Backend & Frameworks
  {
    name: "Node.js",
    category: "Backend",
    patterns: [/\bnode\.?js\b/i, /\bnodejs\b/i, /\bnode\b/i],
  },
  {
    name: "Express.js",
    category: "Backend",
    patterns: [/\bexpress\.?js\b/i, /\bexpress\b/i],
  },
  {
    name: "NestJS",
    category: "Backend",
    patterns: [/\bnest\.?js\b/i, /\bnestjs\b/i],
  },
  {
    name: "FastAPI",
    category: "Backend",
    patterns: [/\bfastapi\b/i],
  },
  {
    name: "Django",
    category: "Backend",
    patterns: [/\bdjango\b/i],
  },
  {
    name: "Spring Boot",
    category: "Backend",
    patterns: [/\bspring boot\b/i, /\bspring\b/i],
  },
  {
    name: "REST APIs",
    category: "Backend",
    patterns: [/\brest(?:ful)?\s*(?:api|apis|services)?\b/i],
  },
  {
    name: "GraphQL",
    category: "Backend",
    patterns: [/\bgraphql\b/i],
  },

  // ── Frontend
  {
    name: "React",
    category: "Frontend",
    patterns: [/\breact\.?js\b/i, /\breact\b/i, /\breactjs\b/i],
  },
  {
    name: "Next.js",
    category: "Frontend",
    patterns: [/\bnext\.?js\b/i, /\bnextjs\b/i],
  },
  {
    name: "Vue.js",
    category: "Frontend",
    patterns: [/\bvue\.?js\b/i, /\bvue\b/i, /\bvuejs\b/i],
  },
  {
    name: "Angular",
    category: "Frontend",
    patterns: [/\bangular\b/i],
  },
  {
    name: "HTML5/CSS3",
    category: "Frontend",
    patterns: [/\bhtml5?\b/i, /\bcss3?\b/i, /\btailwind(?:\s*css)?\b/i],
  },

  // ── Databases
  {
    name: "MongoDB",
    category: "Databases",
    patterns: [/\bmongodb\b/i, /\bmongo\b/i, /\bmongoose\b/i],
  },
  {
    name: "PostgreSQL",
    category: "Databases",
    patterns: [/\bpostgresql\b/i, /\bpostgres\b/i],
  },
  {
    name: "MySQL",
    category: "Databases",
    patterns: [/\bmysql\b/i],
  },
  {
    name: "Redis",
    category: "Databases",
    patterns: [/\bredis\b/i],
  },
  {
    name: "Kafka",
    category: "Databases",
    patterns: [/\bkafka\b/i, /\bapache kafka\b/i],
  },

  // ── Cloud & Infrastructure
  {
    name: "AWS",
    category: "Cloud & DevOps",
    patterns: [/\baws\b/i, /\bamazon web services\b/i, /\bec2\b/i, /\bs3\b/i, /\blambda\b/i],
  },
  {
    name: "GCP",
    category: "Cloud & DevOps",
    patterns: [/\bgcp\b/i, /\bgoogle cloud(?: platform)?\b/i],
  },
  {
    name: "Azure",
    category: "Cloud & DevOps",
    patterns: [/\bazure\b/i, /\bmicrosoft azure\b/i],
  },
  {
    name: "Docker",
    category: "Cloud & DevOps",
    patterns: [/\bdocker\b/i, /\bcontainers?\b/i, /\bcontainerization\b/i],
  },
  {
    name: "Kubernetes",
    category: "Cloud & DevOps",
    patterns: [/\bkubernetes\b/i, /\bk8s\b/i],
  },
  {
    name: "CI/CD",
    category: "Cloud & DevOps",
    patterns: [/\bci[\/\-]cd\b/i, /\bcontinuous integration\b/i, /\bgithub actions\b/i, /\bgitlab ci\b/i, /\bjenkins\b/i],
  },
  {
    name: "Terraform",
    category: "Cloud & DevOps",
    patterns: [/\bterraform\b/i, /\biac\b/i, /\binfrastructure as code\b/i],
  },

  // ── System Architecture & Engineering
  {
    name: "Microservices",
    category: "Architecture",
    patterns: [/\bmicroservices?\b/i, /\bmicroservice architecture\b/i],
  },
  {
    name: "System Design",
    category: "Architecture",
    patterns: [/\bsystem design\b/i, /\bdistributed systems?\b/i, /\bhigh availability\b/i, /\bscalability\b/i],
  },
  {
    name: "Testing & QA",
    category: "Engineering Practices",
    patterns: [/\bunit test(?:ing|s)?\b/i, /\bjest\b/i, /\bmocha\b/i, /\btdd\b/i, /\bcypress\b/i, /\bintegration testing\b/i],
  },
  {
    name: "Git",
    category: "Engineering Practices",
    patterns: [/\bgit\b/i, /\bgithub\b/i, /\bgitlab\b/i, /\bversion control\b/i],
  },

  // ── Leadership & Collaboration
  {
    name: "Agile/Scrum",
    category: "Methodology",
    patterns: [/\bagile\b/i, /\bscrum\b/i, /\bkanban\b/i, /\bsprints?\b/i],
  },
  {
    name: "Team Leadership",
    category: "Leadership",
    patterns: [/\btech lead\b/i, /\bteam lead\b/i, /\bmentoring\b/i, /\bcode reviews?\b/i, /\bleadership\b/i],
  },
  {
    name: "Machine Learning / AI",
    category: "AI & Data",
    patterns: [/\bmachine learning\b/i, /\bdeep learning\b/i, /\bartificial intelligence\b/i, /\bml\b/i, /\bllms?\b/i, /\bgenerative ai\b/i],
  },
];

