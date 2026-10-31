import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  BarChart2,
  Map,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Cpu,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { analysisApi, roadmapApi, interviewApi } from '../api/client.js';
import { Card, Badge, Button, ProgressBar, LoadingSpinner, Alert } from '../components/UI.jsx';

export const DashboardPage = () => {
  const { candidate, email, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [latestRoadmap, setLatestRoadmap] = useState(null);
  const [latestInterview, setLatestInterview] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!email) return;
      setLoading(true);
      try {
        await refreshProfile();

        // 1. Fetch latest analysis
        try {
          const aRes = await analysisApi.getAnalyses(email);
          if (aRes?.data?.length > 0) {
            setLatestAnalysis(aRes.data[0]);
          }
        } catch (e) {
          console.warn('Analysis load warning:', e.message);
        }

        // 2. Fetch latest roadmap
        try {
          const rRes = await roadmapApi.getRoadmaps(email);
          if (rRes?.data?.length > 0) {
            setLatestRoadmap(rRes.data[0]);
          }
        } catch (e) {
          console.warn('Roadmap load warning:', e.message);
        }

        // 3. Fetch latest mock interview
        try {
          const iRes = await interviewApi.getSessions(email);
          if (iRes?.data?.length > 0) {
            setLatestInterview(iRes.data[0]);
          }
        } catch (e) {
          console.warn('Interview load warning:', e.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [email]);

  const hasResume = !!candidate?.resume?.extractedText;

  if (loading) {
    return <LoadingSpinner label="Loading candidate command center..." size="lg" />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4">
      {/* Welcome Banner */}
      <div className="relative border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 rounded-2xl p-5 sm:p-6 md:p-8 overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Candidate Workspace
              </span>
              <Badge variant="purple">{candidate?.currentTitle || 'Engineer'}</Badge>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight break-words">
              Welcome back, {candidate?.fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              Target Pivot:{' '}
              <span className="text-slate-200 font-semibold">{candidate?.targetRole || 'Principal Cloud Architect'}</span>{' '}
              • Experience:{' '}
              <span className="text-slate-200 font-semibold">{candidate?.yearsOfExperience || 0} years</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!hasResume && (
              <Link to="/resume">
                <Button variant="primary" icon={FileText}>
                  Upload Resume
                </Button>
              </Link>
            )}
            {hasResume && !latestAnalysis && (
              <Link to="/analysis">
                <Button variant="primary" icon={BarChart2}>
                  Run Skill Gap Analysis
                </Button>
              </Link>
            )}
            {latestAnalysis && !latestRoadmap && (
              <Link to="/roadmap">
                <Button variant="primary" icon={Map}>
                  Generate Roadmap
                </Button>
              </Link>
            )}
            {latestRoadmap && (
              <Link to="/interviews">
                <Button variant="primary" icon={MessageSquare}>
                  Start Mock Interview
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Status Stepper */}
      <Card>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Pivot Readiness Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Step 1: Profile */}
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-slate-200">1. Profile Active</div>
              <div className="text-[11px] text-slate-400">{candidate?.email}</div>
            </div>
          </div>

          {/* Step 2: Resume */}
          <Link
            to="/resume"
            className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
              hasResume
                ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            {hasResume ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-semibold text-slate-200">2. Resume Parsed</div>
              <div className="text-[11px] text-slate-400">
                {hasResume ? `${candidate.resume.parsedMeta?.wordCount || 0} words` : 'Pending Upload'}
              </div>
            </div>
          </Link>

          {/* Step 3: Analysis */}
          <Link
            to="/analysis"
            className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
              latestAnalysis
                ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            {latestAnalysis ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-semibold text-slate-200">3. Skill Gap</div>
              <div className="text-[11px] text-slate-400">
                {latestAnalysis ? `${latestAnalysis.summary.matchScore}% Match` : 'Not run yet'}
              </div>
            </div>
          </Link>

          {/* Step 4: Roadmap */}
          <Link
            to="/roadmap"
            className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
              latestRoadmap
                ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            {latestRoadmap ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-semibold text-slate-200">4. Roadmap</div>
              <div className="text-[11px] text-slate-400">
                {latestRoadmap ? `${latestRoadmap.progressPercentage}% Complete` : 'Pending Generation'}
              </div>
            </div>
          </Link>

          {/* Step 5: Mock Interview */}
          <Link
            to="/interviews"
            className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
              latestInterview?.status === 'completed'
                ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            {latestInterview?.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-semibold text-slate-200">5. Mock Interview</div>
              <div className="text-[11px] text-slate-400">
                {latestInterview?.status === 'completed'
                  ? `${latestInterview.overallScore}/100 Score`
                  : 'Ready to Practice'}
              </div>
            </div>
          </Link>
        </div>
      </Card>

      {/* Grid of Active Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Module 1: Resume & Profile Status */}
        <Card hover className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <Badge variant={hasResume ? 'success' : 'warning'}>
                {hasResume ? 'Resume Verified' : 'Resume Required'}
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Resume Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {hasResume
                ? `Active file: ${candidate.resume.originalName} (${(candidate.resume.sizeBytes / 1024).toFixed(1)} KB). Text extracted and verified.`
                : 'Upload your PDF or TXT resume to extract genuine skills, experience, and projects.'}
            </p>

            {hasResume && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Word Count:</span>
                  <span className="font-medium text-slate-200">{candidate.resume.parsedMeta?.wordCount} words</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Parsed At:</span>
                  <span>{new Date(candidate.resume.parsedMeta?.extractedAt || candidate.resume.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          <Link to="/resume">
            <Button variant="secondary" size="sm" className="w-full" icon={ArrowRight}>
              {hasResume ? 'Manage Resume' : 'Upload Resume Now'}
            </Button>
          </Link>
        </Card>

        {/* Module 2: Skill Gap Analysis */}
        <Card hover className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              {latestAnalysis ? (
                <Badge variant={latestAnalysis.summary.matchScore >= 80 ? 'success' : 'warning'}>
                  {latestAnalysis.summary.readinessLevel.replace(/_/g, ' ')}
                </Badge>
              ) : (
                <Badge variant="neutral">Not Run</Badge>
              )}
            </div>

            <h3 className="text-base font-semibold text-white mb-1">Skill Gap Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {latestAnalysis
                ? `Analyzed against "${latestAnalysis.targetRole}". Match score: ${latestAnalysis.summary.matchScore}%.`
                : 'Compare your resume evidence against a target job description to classify skill readiness.'}
            </p>

            {latestAnalysis && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Match Score</span>
                  <span className="text-indigo-400">{latestAnalysis.summary.matchScore}%</span>
                </div>
                <ProgressBar
                  progress={latestAnalysis.summary.matchScore}
                  color={latestAnalysis.summary.matchScore >= 75 ? 'emerald' : 'indigo'}
                />
                <div className="text-[11px] text-slate-500 pt-1">
                  Demonstrated: {latestAnalysis.summary.demonstratedCount} • Missing: {latestAnalysis.summary.missingEvidenceCount}
                </div>
              </div>
            )}
          </div>

          <Link to="/analysis">
            <Button variant="secondary" size="sm" className="w-full" icon={ArrowRight}>
              {latestAnalysis ? 'View Full Analysis' : 'Run First Analysis'}
            </Button>
          </Link>
        </Card>

        {/* Module 3: Learning Roadmap & Projects */}
        <Card hover className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Map className="w-5 h-5" />
              </div>
              {latestRoadmap ? (
                <Badge variant={latestRoadmap.status === 'completed' ? 'success' : 'primary'}>
                  {latestRoadmap.status.toUpperCase()}
                </Badge>
              ) : (
                <Badge variant="neutral">Not Generated</Badge>
              )}
            </div>

            <h3 className="text-base font-semibold text-white mb-1">Learning Roadmap & Projects</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {latestRoadmap
                ? `${latestRoadmap.durationWeeks}-week roadmap covering ${latestRoadmap.totalMilestones} milestones with tailored portfolio projects.`
                : 'Generate a personalized weekly study roadmap with free resources targeting your gaps.'}
            </p>

            {latestRoadmap && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-emerald-400">{latestRoadmap.progressPercentage}%</span>
                </div>
                <ProgressBar progress={latestRoadmap.progressPercentage} color="emerald" />
                <div className="text-[11px] text-slate-500 pt-1">
                  Completed {latestRoadmap.completedMilestones} of {latestRoadmap.totalMilestones} weekly milestones
                </div>
              </div>
            )}
          </div>

          <Link to="/roadmap">
            <Button variant="secondary" size="sm" className="w-full" icon={ArrowRight}>
              {latestRoadmap ? 'Track Milestones' : 'Generate Roadmap'}
            </Button>
          </Link>
        </Card>
      </div>

      {/* Module 4: Mock Interview Highlights */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Mock Interview Readiness Simulator</h3>
            </div>
            <p className="text-xs text-slate-400">
              Practice scenario-based technical questions and STAR behavioral interviews targeted to your skill gaps.
            </p>
          </div>
          <Link to="/interviews">
            <Button variant="primary" size="sm" icon={ArrowRight}>
              Launch Interview Studio
            </Button>
          </Link>
        </div>

        {latestInterview ? (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div>
              <div className="text-xs text-slate-500">Latest Session Role</div>
              <div className="text-sm font-semibold text-slate-200 truncate">{latestInterview.targetRole}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Overall Score</div>
              <div className="text-xl font-bold text-indigo-400">{latestInterview.overallScore}/100</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Readiness Tier</div>
              <Badge variant={latestInterview.overallScore >= 75 ? 'success' : 'warning'}>
                {latestInterview.readinessAssessment.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-slate-500">Status</div>
              <div className="text-xs font-medium text-slate-300 capitalize">{latestInterview.status}</div>
            </div>
          </div>
        ) : (
          <div className="pt-4 text-xs text-slate-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500" />
            <span>No interview sessions completed yet. Start your first session to receive instant rubric evaluations!</span>
          </div>
        )}
      </Card>
    </div>
  );
};

