import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { analysisApi } from '../api/client.js';
import { Card, Button, Badge, ProgressBar, Alert, LoadingSpinner, EmptyState } from '../components/UI.jsx';

export const AnalysisPage = () => {
  const { candidate, email } = useAuth();
  const navigate = useNavigate();

  const [jobTitle, setJobTitle] = useState('Senior Cloud Platform Engineer');
  const [company, setCompany] = useState('CloudScale Global');
  const [jobDescription, setJobDescription] = useState(`Senior Cloud Platform Engineer — CloudScale Global

Responsibilities:
- Architect and maintain containerized microservices and Kubernetes clusters.
- Establish automated CI/CD deployment pipelines on AWS infrastructure.
- Drive high availability, disaster recovery, and service observability.

Requirements:
- 4+ years of backend engineering experience with Node.js and MongoDB.
- Production proficiency with Docker containerization and Kubernetes orchestration.
- Hands-on experience with AWS cloud services (VPC, IAM, ECS/EKS).
- Automated CI/CD pipeline implementation with GitHub Actions.

Preferred Qualifications:
- Experience with Kafka distributed event streaming.
- Redis in-memory caching and distributed rate limiting.
- Familiarity with TypeScript.`);

  const [running, setRunning] = useState(false);
  const [consentToAi, setConsentToAi] = useState(false);
  const [analysesList, setAnalysesList] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [skillFilter, setSkillFilter] = useState('all'); // 'all' | 'demonstrated' | 'partial' | 'missing'

  const loadAnalyses = async () => {
    if (!email) return;
    try {
      const res = await analysisApi.getAnalyses(email);
      if (res?.data?.length > 0) {
        setAnalysesList(res.data);
        setSelectedAnalysis(res.data[0]);
      }
    } catch (err) {
      console.warn('Failed to load analyses:', err.message);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, [email]);

  const handleRunAnalysis = async (e) => {
    e.preventDefault();
    if (!candidate?.resume?.extractedText) {
      setErrorMsg('You must upload a resume before running a skill-gap analysis.');
      return;
    }

    setRunning(true);
    setErrorMsg('');

    try {
      const res = await analysisApi.runAnalysis(email, {
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        jobDescription: jobDescription.trim(),
        consentToAiProcessing: consentToAi,
      });

      if (res?.data) {
        setSelectedAnalysis(res.data);
        await loadAnalyses();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Analysis failed to execute.');
    } finally {
      setRunning(false);
    }
  };

  const filteredSkills = (selectedAnalysis?.skillEvaluations || []).filter((s) => {
    if (skillFilter === 'all') return true;
    if (skillFilter === 'demonstrated') return s.status === 'demonstrated';
    if (skillFilter === 'partial') return s.status === 'partial';
    if (skillFilter === 'missing') return s.status === 'missing_evidence';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-400" /> Resume Intelligence & Skill Gap Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare verified resume evidence against target job specifications with transparent classification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {analysesList.length > 1 && (
            <select
              value={selectedAnalysis?._id || ''}
              onChange={(e) => {
                const found = analysesList.find((a) => a._id === e.target.value);
                if (found) setSelectedAnalysis(found);
              }}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {analysesList.map((a, idx) => (
                <option key={a._id} value={a._id}>
                  Run #{analysesList.length - idx}: {a.targetRole} ({new Date(a.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {errorMsg && <Alert type="danger" message={errorMsg} />}

      {!candidate?.resume?.extractedText && (
        <Alert
          type="warning"
          title="Resume Required"
          message="No active resume was found on your profile. Please upload a PDF or plain-text resume first to extract skills."
        />
      )}

      {/* Input Form for New Analysis */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" /> Run Skill Gap Analysis on Target Role
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Paste the job posting description below. The semantic parser will extract required skills, preferred
          skills, and responsibilities, evaluating them against your resume evidence.
        </p>

        <form onSubmit={handleRunAnalysis} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Job Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior Cloud Platform Engineer"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company / Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. CloudScale Global"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Job Description (Requirements, Responsibilities, Preferred Qualifications) <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Privacy Consent Guard */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <input
              id="aiConsentCheckbox"
              type="checkbox"
              checked={consentToAi}
              onChange={(e) => setConsentToAi(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
            />
            <label htmlFor="aiConsentCheckbox" className="text-xs text-slate-300 leading-snug cursor-pointer select-none">
              <span className="font-semibold text-white block">
                Enable Google Gemini AI Contextual Insights (Optional)
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Explicit consent: Anonymizes your resume (redacting emails, phone numbers, and full names) before external AI processing. Unchecked processes 100% locally on-device.
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              Deterministic parsing • Zero hallucinated candidate skills
            </span>
            <Button
              type="submit"
              size="md"
              isLoading={running}
              disabled={!candidate?.resume?.extractedText}
              icon={BarChart2}
              className="w-full sm:w-auto"
            >
              Analyze Skill Gap
            </Button>
          </div>
        </form>
      </Card>

      {/* Analysis Results */}
      {selectedAnalysis && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="border-indigo-500/30 bg-gradient-to-br from-slate-900 to-indigo-950/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="purple">{selectedAnalysis.targetCompany || 'Target Organization'}</Badge>
                  <Badge
                    variant={
                      selectedAnalysis.summary.matchScore >= 80
                        ? 'success'
                        : selectedAnalysis.summary.matchScore >= 50
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {selectedAnalysis.summary.readinessLevel.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {selectedAnalysis.targetRole}
                </h2>
                <div className="text-xs text-slate-400 mt-1">
                  Formula: {selectedAnalysis.summary.scoringFormula}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="text-left sm:text-right">
                  <div className="text-3xl font-extrabold text-indigo-400">
                    {selectedAnalysis.summary.matchScore}%
                  </div>
                  <div className="text-xs text-slate-400">Match Score</div>
                </div>
                <Link to="/roadmap" className="w-full sm:w-auto">
                  <Button size="md" icon={ArrowRight} className="w-full sm:w-auto">
                    Generate Learning Roadmap
                  </Button>
                </Link>
              </div>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-center">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xl font-bold text-white">{selectedAnalysis.summary.totalSkillsEvaluated}</div>
                <div className="text-[11px] text-slate-400">Total Skills Evaluated</div>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xl font-bold text-emerald-400">
                  {selectedAnalysis.summary.demonstratedCount}
                </div>
                <div className="text-[11px] text-slate-400">Demonstrated (Proven)</div>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xl font-bold text-amber-400">{selectedAnalysis.summary.partialCount}</div>
                <div className="text-[11px] text-slate-400">Partial (Declared)</div>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xl font-bold text-rose-400">
                  {selectedAnalysis.summary.missingEvidenceCount}
                </div>
                <div className="text-[11px] text-slate-400">Missing Evidence</div>
              </div>
            </div>
          </Card>

          {/* AI Contextual Insights (Google Gemini Developer API Integration) */}
          {selectedAnalysis.aiInsights && (
            <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-purple-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-indigo-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Contextual Career Pivot Intelligence
                    </h3>
                    <p className="text-xs text-indigo-300/80">
                      AI-powered comparison grounded strictly in verified resume evidence.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="purple">
                    Model: {selectedAnalysis.aiInsights.modelUsed || 'gemini-2.5-flash'}
                  </Badge>
                </div>
              </div>

              {/* Comparison Summary */}
              {selectedAnalysis.aiInsights.comparisonSummary && (
                <div className="mb-5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-indigo-400 font-semibold block text-[11px] uppercase tracking-wider mb-1">
                    Executive Pivot Assessment
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {selectedAnalysis.aiInsights.comparisonSummary}
                  </p>
                </div>
              )}

              {/* Transferable Skills Badges */}
              {selectedAnalysis.aiInsights.transferableSkills?.length > 0 && (
                <div className="mb-5">
                  <span className="text-slate-300 font-semibold block text-xs mb-2">
                    Identified Transferable Capabilities:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedAnalysis.aiInsights.transferableSkills.map((ts, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950/60 border border-indigo-500/20 text-xs"
                      >
                        <div className="font-semibold text-indigo-300 mb-0.5">{ts.skill}</div>
                        <div className="text-[11px] text-slate-400">
                          <span className="text-slate-500">From: </span>{ts.sourceExperience}
                        </div>
                        {ts.applicability && (
                          <div className="text-[11px] text-slate-300 mt-1 italic">
                            "{ts.applicability}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transition Suggestions */}
              {selectedAnalysis.aiInsights.transitionAdvice?.length > 0 && (
                <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20">
                  <span className="text-indigo-300 font-semibold block text-xs mb-1.5">
                    Strategic Transition Suggestions:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedAnalysis.aiInsights.transitionAdvice.map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Detailed Skill Breakdown */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-semibold text-white">Competency & Evidence Breakdown</h3>
                <p className="text-xs text-slate-400">
                  Every skill is verified against text in your resume or marked as missing documentation.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium overflow-x-auto max-w-full pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSkillFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    skillFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({selectedAnalysis.skillEvaluations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSkillFilter('demonstrated')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    skillFilter === 'demonstrated'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Demonstrated
                </button>
                <button
                  type="button"
                  onClick={() => setSkillFilter('partial')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    skillFilter === 'partial'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Partial
                </button>
                <button
                  type="button"
                  onClick={() => setSkillFilter('missing')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    skillFilter === 'missing'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Missing Evidence
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredSkills.map((evalItem, idx) => {
                const isDemonstrated = evalItem.status === 'demonstrated';
                const isPartial = evalItem.status === 'partial';

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isDemonstrated
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : isPartial
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : 'border-slate-800 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-white">{evalItem.skill}</span>
                        <Badge variant="neutral">{evalItem.category}</Badge>
                        <Badge variant={evalItem.importance === 'required' ? 'purple' : 'neutral'}>
                          {evalItem.importance}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            isDemonstrated ? 'success' : isPartial ? 'warning' : 'danger'
                          }
                        >
                          {evalItem.status.replace(/_/g, ' ')}
                        </Badge>
                        {evalItem.gapPriority !== 'NONE' && (
                          <Badge variant={evalItem.gapPriority === 'HIGH' ? 'danger' : 'warning'}>
                            {evalItem.gapPriority} Priority Gap
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Evidence Quote or Reasoning */}
                    {evalItem.evidence ? (
                      <div className="mt-2 text-xs bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-slate-300 font-mono italic">
                        <span className="text-emerald-400 font-semibold not-italic block text-[10px] uppercase mb-0.5">
                          Extracted Resume Evidence
                        </span>
                        "{evalItem.evidence}"
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-400 leading-relaxed">
                        <span className="text-amber-400 font-semibold block text-[10px] uppercase mb-0.5">
                          Analytical Reasoning
                        </span>
                        {evalItem.reasoning}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Action Plan & Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Demonstrated Strengths
              </h3>
              {selectedAnalysis.keyStrengths?.length > 0 ? (
                <ul className="space-y-2 text-xs text-slate-300">
                  {selectedAnalysis.keyStrengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No demonstrated strengths identified yet.</p>
              )}
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Prioritized Action Items
              </h3>
              {selectedAnalysis.actionPlan?.length > 0 ? (
                <div className="space-y-2.5 text-xs">
                  {selectedAnalysis.actionPlan.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-slate-800 bg-slate-950">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{item.skill}</span>
                        <Badge variant={item.priority === 'HIGH' ? 'danger' : 'warning'}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{item.recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No action items required. You are 100% matched!</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

