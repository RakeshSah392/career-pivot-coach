import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Map,
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen,
  Code,
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  Shield,
  Play,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { roadmapApi, analysisApi } from '../api/client.js';
import { Card, Button, Badge, ProgressBar, Alert, LoadingSpinner, EmptyState } from '../components/UI.jsx';

export const RoadmapPage = () => {
  const { candidate, email } = useAuth();

  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasAnalysis, setHasAnalysis] = useState(false);

  const checkExistingAnalysis = async () => {
    if (!email) return;
    try {
      const aRes = await analysisApi.getAnalyses(email);
      setHasAnalysis(aRes?.data?.length > 0);
    } catch {}
  };

  const loadRoadmaps = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await roadmapApi.getRoadmaps(email);
      if (res?.data?.length > 0) {
        setRoadmaps(res.data);
        setSelectedRoadmap(res.data[0]);
      } else {
        setRoadmaps([]);
        setSelectedRoadmap(null);
      }
    } catch (err) {
      console.warn('Roadmap fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmaps();
    checkExistingAnalysis();
  }, [email]);

  const handleGenerateRoadmap = async () => {
    setGenerating(true);
    setErrorMsg('');
    try {
      const res = await roadmapApi.generateRoadmap(email, {});
      if (res?.data) {
        await loadRoadmaps();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate roadmap. Please run a skill gap analysis first.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleMilestone = async (milestoneId, currentStatus) => {
    if (!selectedRoadmap) return;
    setUpdatingMilestoneId(milestoneId);
    setErrorMsg('');

    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      const res = await roadmapApi.updateMilestone(
        email,
        selectedRoadmap._id,
        milestoneId,
        { status: newStatus }
      );

      if (res?.data) {
        setSelectedRoadmap(res.data);
        setRoadmaps((prev) =>
          prev.map((r) => (r._id === res.data._id ? res.data : r))
        );
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update milestone progress.');
    } finally {
      setUpdatingMilestoneId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading personalized learning curriculum..." size="lg" />;
  }

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Map className="w-6 h-6 text-indigo-400" /> Personalized Learning Roadmap & Portfolio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized weekly curriculum and production project blueprints targeting your identified gap skills.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {roadmaps.length > 1 && (
            <select
              value={selectedRoadmap?._id || ''}
              onChange={(e) => {
                const found = roadmaps.find((r) => r._id === e.target.value);
                if (found) setSelectedRoadmap(found);
              }}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {roadmaps.map((r, idx) => (
                <option key={r._id} value={r._id}>
                  Roadmap #{roadmaps.length - idx}: {r.targetRole} ({r.durationWeeks} wks)
                </option>
              ))}
            </select>
          )}

          <Button
            size="sm"
            onClick={handleGenerateRoadmap}
            isLoading={generating}
            disabled={!hasAnalysis}
            icon={Sparkles}
          >
            {selectedRoadmap ? 'Regenerate Roadmap' : 'Generate Roadmap'}
          </Button>
        </div>
      </div>

      {errorMsg && <Alert type="danger" message={errorMsg} />}

      {!hasAnalysis && !selectedRoadmap && (
        <Card>
          <EmptyState
            icon={Map}
            title="Skill Gap Analysis Required"
            description="A learning roadmap is tailored directly from your identified skill gaps. Please run an analysis against your target job first."
            action={
              <Link to="/analysis">
                <Button size="md" icon={ArrowRight}>
                  Run Skill Gap Analysis First
                </Button>
              </Link>
            }
          />
        </Card>
      )}

      {selectedRoadmap && (
        <div className="space-y-8">
          {/* Roadmap Summary Banner */}
          <Card className="border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="purple">{selectedRoadmap.targetCompany || 'Target Organization'}</Badge>
                  <Badge variant={selectedRoadmap.status === 'completed' ? 'success' : 'primary'}>
                    {selectedRoadmap.status.toUpperCase()}
                  </Badge>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {selectedRoadmap.targetRole}
                </h2>
                <div className="text-xs text-slate-400 mt-1">
                  Duration: {selectedRoadmap.durationWeeks} Weeks • {selectedRoadmap.totalMilestones} Structured Milestones
                </div>
              </div>

              <div className="w-full md:w-auto md:min-w-[200px] text-left md:text-right">
                <div className="text-2xl font-bold text-emerald-400 mb-1">
                  {selectedRoadmap.progressPercentage}%
                </div>
                <div className="text-xs text-slate-400 mb-2">
                  {selectedRoadmap.completedMilestones} of {selectedRoadmap.totalMilestones} Milestones Completed
                </div>
                <ProgressBar progress={selectedRoadmap.progressPercentage} color="emerald" />
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <span>Engine: {selectedRoadmap.metadata?.engine}</span>
              <span className="text-slate-500">{selectedRoadmap.metadata?.transparencyNotice}</span>
            </div>
          </Card>

          {/* Weekly Milestones List */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" /> Weekly Milestone Progression
              </h3>
              <span className="text-xs text-slate-400">
                Click "Mark Complete" as you master each milestone
              </span>
            </div>

            <div className="space-y-4">
              {selectedRoadmap.milestones.map((milestone) => {
                const isCompleted = milestone.status === 'completed';
                const isUpdating = updatingMilestoneId === milestone._id;

                return (
                  <Card
                    key={milestone._id}
                    hover
                    className={`transition-all ${
                      isCompleted ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-mono text-xs font-bold text-indigo-400">
                            Week {milestone.weekNumber}
                          </span>
                          <Badge variant={milestone.priority === 'HIGH' ? 'danger' : 'warning'}>
                            {milestone.priority} Priority Gap
                          </Badge>
                          {milestone.focusSkills.map((skill, sIdx) => (
                            <Badge key={sIdx} variant="neutral">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <h4 className="text-base font-bold text-white">{milestone.title}</h4>
                      </div>

                      <Button
                        size="sm"
                        variant={isCompleted ? 'secondary' : 'success'}
                        isLoading={isUpdating}
                        onClick={() => handleToggleMilestone(milestone._id, milestone.status)}
                        icon={isCompleted ? Check : CheckCircle2}
                      >
                        {isCompleted ? 'Completed ✓ (Click to reset)' : 'Mark Milestone Complete'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      {/* Left: Learning Objectives & Practical Exercises */}
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Learning Objectives
                          </h5>
                          <ul className="space-y-1.5 text-slate-400">
                            {milestone.learningObjectives.map((obj, oIdx) => (
                              <li key={oIdx} className="flex items-start gap-2">
                                <span className="text-indigo-400 font-bold">•</span>
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                            <Code className="w-3.5 h-3.5 text-emerald-400" /> Practical Exercises
                          </h5>
                          <ul className="space-y-1.5 text-slate-400">
                            {milestone.practicalExercises.map((ex, eIdx) => (
                              <li key={eIdx} className="flex items-start gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                                <Play className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{ex}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Right: Free Resources & Completion Criteria */}
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5 text-amber-400" /> Free Curated Resources
                          </h5>
                          <div className="space-y-2">
                            {milestone.freeResources.map((res, rIdx) => (
                              <a
                                key={rIdx}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group"
                              >
                                <div>
                                  <div className="font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
                                    {res.title}
                                  </div>
                                  <div className="text-[10px] text-slate-500 capitalize">{res.type}</div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                              </a>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-purple-400" /> Completion Criteria
                          </h5>
                          <ul className="space-y-1.5 text-slate-400">
                            {milestone.completionCriteria.map((crit, cIdx) => (
                              <li key={cIdx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                                <span>{crit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Portfolio Project Recommendations */}
          <div className="space-y-6 pt-6 border-t border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" /> Tailored Portfolio Project Blueprints
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Engineered to demonstrate proof of competence for your specific missing skills.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedRoadmap.portfolioProjects.map((proj, pIdx) => (
                <Card key={pIdx} className="flex flex-col justify-between border-slate-800 bg-slate-900/60">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="purple">{proj.difficulty}</Badge>
                      <span className="text-xs font-semibold text-slate-400">
                        Est. {proj.estimatedHours} Hours
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white mb-1.5">{proj.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {proj.targetSkills.map((ts, tIdx) => (
                        <Badge key={tIdx} variant="success">
                          Addresses: {ts}
                        </Badge>
                      ))}
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                      <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                        Architecture Overview
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                        {proj.architectureOverview}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                        Core Suggested Features
                      </div>
                      <ul className="space-y-1 text-xs text-slate-400">
                        {proj.suggestedFeatures.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-1.5">
                            <span className="text-indigo-400 font-bold">•</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                        Measurable Deliverables
                      </div>
                      <ul className="space-y-1 text-xs text-slate-400">
                        {proj.deliverables.map((del, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{del}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

