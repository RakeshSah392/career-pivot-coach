import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  BarChart2,
  Map,
  MessageSquare,
  Cpu,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Badge, Button, Card } from '../components/UI.jsx';

export const LandingPage = () => {
  const { isAuthenticated, candidate } = useAuth();

  const features = [
    {
      icon: FileText,
      title: 'Resume Intelligence & Evidence',
      description:
        'Upload your PDF or TXT resume. We extract text in RAM with 0 byte disk persistence, parsing genuine accomplishments into structured technical evidence.',
      tag: 'Zero Storage Leakage',
    },
    {
      icon: BarChart2,
      title: 'Explainable Skill-Gap Engine',
      description:
        'Paste any target job description. We categorize competencies as Demonstrated (proven in resume), Partial (declared in profile), or Missing Evidence—never assuming absent skills without context.',
      tag: 'Transparent Scoring',
    },
    {
      icon: Map,
      title: 'Personalized Weekly Roadmap',
      description:
        'A customized 4-8 week milestone plan with measurable completion criteria, hands-on exercises, and 100% free official documentation resources.',
      tag: '₹0 Free Resources',
    },
    {
      icon: Layers,
      title: 'Resume-Worthy Portfolio Projects',
      description:
        'No generic to-do apps. Get production blueprints designed specifically to address your gap skills with architectural diagrams, test suites, and Dockerized setups.',
      tag: 'Production Grade',
    },
    {
      icon: MessageSquare,
      title: 'Mock Interview Simulator',
      description:
        'Practice role-specific technical and behavioral questions targeted directly at your skill gaps. Evaluated instantaneously across correctness, clarity, and trade-offs.',
      tag: 'Multi-Factor Rubric',
    },
    {
      icon: ShieldCheck,
      title: 'Deterministic AI Integrity',
      description:
        'We never fabricate candidate credentials or hide behind opaque API wrappers. Every score, rubric, and roadmap is grounded in explainable deterministic NLP.',
      tag: '100% Explainable',
    },
  ];

  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto text-center px-4 pt-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Production-Oriented Career Transition Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-none mb-6">
          Architect Your Next <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
            Senior Engineering Pivot
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Bridge the delta between your existing software experience and modern Cloud, Platform, or Architecture
          roles using transparent skill gap extraction, custom weekly roadmaps, and mock interview evaluation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md sm:max-w-none mx-auto">
          {isAuthenticated ? (
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" icon={ArrowRight} className="w-full sm:w-auto">
                Enter Dashboard ({candidate?.fullName || 'Active'})
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth?mode=register" className="w-full sm:w-auto">
                <Button size="lg" icon={ArrowRight} className="w-full sm:w-auto">
                  Create Candidate Profile
                </Button>
              </Link>
              <Link to="/auth?mode=login" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Access Existing Profile
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Live metrics strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto border border-slate-800 bg-slate-900/40 backdrop-blur rounded-2xl p-4 sm:p-6 text-center">
          <div>
            <div className="text-2xl font-bold text-white mb-0.5">₹0</div>
            <div className="text-xs text-slate-400">Total API Cost</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-400 mb-0.5">100%</div>
            <div className="text-xs text-slate-400">Explainable Rubrics</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400 mb-0.5">PDF & TXT</div>
            <div className="text-xs text-slate-400">Local Resume Parsing</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400 mb-0.5">4-Dimension</div>
            <div className="text-xs text-slate-400">Interview Rubric</div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            A Genuinely Functional Full-Stack Pipeline
          </h2>
          <p className="text-sm text-slate-400">
            From resume upload to mock interview feedback, every component is integrated directly with live
            Express and MongoDB micro-services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <Card key={idx} hover className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="neutral">{f.tag}</Badge>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{f.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Step by Step Workflow */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="border border-slate-800 bg-slate-900/60 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
            How The Career Pivot Pipeline Operates
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                1
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Create Profile & Upload Resume</h4>
                <p className="text-xs text-slate-400">
                  Provide your target career aspirations and upload a text-based PDF or .txt resume. We extract text and compute metadata locally.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                2
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Paste Target Role Job Description</h4>
                <p className="text-xs text-slate-400">
                  Our semantic parser isolates Required Skills, Preferred Qualifications, and Core Responsibilities.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                3
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Inspect Transparent Skill Gaps</h4>
                <p className="text-xs text-slate-400">
                  Review exact text excerpts verifying demonstrated skills alongside actionable gap priorities (HIGH, MEDIUM, LOW).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                4
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Execute Weekly Roadmap & Portfolio Projects</h4>
                <p className="text-xs text-slate-400">
                  Work through organized weekly milestones, track progress dynamically in MongoDB, and build portfolio blueprints that address your gaps.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                5
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Rehearse with Gap-Targeted Mock Interviews</h4>
                <p className="text-xs text-slate-400">
                  Answer scenario-based technical and STAR behavioral questions with instant multi-rubric evaluation and readiness scoring.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <span className="text-xs text-slate-400">Ready to start your pivot journey?</span>
            <Link to={isAuthenticated ? '/dashboard' : '/auth?mode=register'} className="w-full sm:w-auto">
              <Button size="md" icon={ArrowRight} className="w-full sm:w-auto">
                {isAuthenticated ? 'Go to Dashboard' : 'Launch Free Platform'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

