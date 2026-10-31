import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  Play,
  Send,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { interviewApi, analysisApi } from '../api/client.js';
import { Card, Button, Badge, ProgressBar, Alert, LoadingSpinner, EmptyState } from '../components/UI.jsx';

export const InterviewPage = () => {
  const { candidate, email } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Session Configuration
  const [interviewType, setInterviewType] = useState('technical');
  const [questionCount, setQuestionCount] = useState(3);
  const [targetRole, setTargetRole] = useState(candidate?.targetRole || 'Senior Cloud Platform Engineer');
  const [creating, setCreating] = useState(false);

  // Active Answering State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadSessions = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await interviewApi.getSessions(email);
      if (res?.data?.length > 0) {
        setSessions(res.data);
        // Default to active session if in_progress, else latest session
        const inProgress = res.data.find((s) => s.status === 'in_progress');
        setActiveSession(inProgress || res.data[0]);
      } else {
        setSessions([]);
        setActiveSession(null);
      }
    } catch (err) {
      console.warn('Session load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [email]);

  const handleStartSession = async (e) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg('');

    try {
      const res = await interviewApi.createSession(email, {
        interviewType,
        questionCount: Number(questionCount),
        targetRole: targetRole.trim(),
      });

      if (res?.data) {
        setActiveSession(res.data);
        setCurrentQuestionIndex(0);
        setAnswerText('');
        await loadSessions();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start interview session.');
    } finally {
      setCreating(false);
    }
  };

  const currentQuestion = activeSession?.questions?.[currentQuestionIndex];

  const handleSubmitAnswer = async () => {
    if (!answerText.trim() || !currentQuestion) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await interviewApi.submitAnswer(email, activeSession._id, {
        questionId: currentQuestion._id,
        answerText: answerText.trim(),
      });

      if (res?.data) {
        // Refresh full session from backend
        const updated = await interviewApi.getSessionById(email, activeSession._id);
        if (updated?.data) {
          setActiveSession(updated.data);
          setSessions((prev) =>
            prev.map((s) => (s._id === updated.data._id ? updated.data : s))
          );
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeSession = async () => {
    if (!activeSession) return;
    setFinalizing(true);
    setErrorMsg('');

    try {
      const res = await interviewApi.finalizeSession(email, activeSession._id);
      if (res?.data) {
        setActiveSession(res.data);
        await loadSessions();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to finalize session. Please answer at least one question.');
    } finally {
      setFinalizing(false);
    }
  };

  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;

  if (loading) {
    return <LoadingSpinner label="Loading mock interview command studio..." size="lg" />;
  }

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-400" /> Mock Interview Studio & Rubric Evaluator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rehearse role-specific technical and behavioral questions targeted directly at your skill gaps.
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={activeSession?._id || ''}
              onChange={(e) => {
                const found = sessions.find((s) => s._id === e.target.value);
                if (found) {
                  setActiveSession(found);
                  setCurrentQuestionIndex(0);
                  setAnswerText('');
                }
              }}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {sessions.map((s, idx) => (
                <option key={s._id} value={s._id}>
                  Session #{sessions.length - idx}: {s.targetRole} ({s.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {errorMsg && <Alert type="danger" message={errorMsg} />}

      {/* Session Launcher */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Configure New Interview Practice Session</h3>
          </div>
          <Badge variant="purple">Deterministic Rubric</Badge>
        </div>

        <form onSubmit={handleStartSession} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Pivot Role</label>
            <input
              type="text"
              required
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Cloud Platform Engineer"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interview Format</label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="technical">Technical Architecture</option>
              <option value="behavioral">STAR Behavioral</option>
              <option value="mixed">Mixed (Technical + STAR)</option>
            </select>
          </div>

          <div>
            <Button type="submit" size="md" isLoading={creating} className="w-full" icon={Play}>
              Start Session
            </Button>
          </div>
        </form>
      </Card>

      {/* Active Session Simulation */}
      {activeSession && (
        <div className="space-y-6">
          {/* Active Session Summary Bar */}
          <Card className="border-indigo-500/30 bg-slate-900/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={activeSession.status === 'completed' ? 'success' : 'primary'}>
                    {activeSession.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-400 capitalize">{activeSession.interviewType} Format</span>
                </div>
                <h2 className="text-lg font-bold text-white">{activeSession.targetRole}</h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-bold text-indigo-400">
                    {activeSession.overallScore}/100
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Answered {activeSession.answeredQuestions} of {activeSession.totalQuestions}
                  </div>
                </div>

                {activeSession.status === 'in_progress' && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={handleFinalizeSession}
                    isLoading={finalizing}
                    disabled={activeSession.answeredQuestions === 0}
                    icon={CheckCircle2}
                    className="w-full sm:w-auto"
                  >
                    Finalize Session
                  </Button>
                )}
              </div>
            </div>

            {/* Question Selector Tabs */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800 overflow-x-auto pb-1">
              {activeSession.questions.map((q, idx) => {
                const isSelected = idx === currentQuestionIndex;
                const isAnswered = !!q.evaluation;

                return (
                  <button
                    key={q._id}
                    type="button"
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setAnswerText(q.userAnswer || '');
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isAnswered
                        ? 'bg-slate-800 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>Q{idx + 1}</span>
                    <span className="truncate max-w-[80px]">{q.targetSkill}</span>
                    {isAnswered && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Question Prompt Card */}
          {currentQuestion && (
            <div className="space-y-6">
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="purple">Question {currentQuestionIndex + 1} of {activeSession.totalQuestions}</Badge>
                    <Badge variant="neutral">{currentQuestion.questionType}</Badge>
                    <Badge variant="success">Skill: {currentQuestion.targetSkill}</Badge>
                  </div>
                  <Badge variant="neutral">{currentQuestion.difficulty}</Badge>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white mb-3 leading-snug">
                  {currentQuestion.questionText}
                </h3>

                {currentQuestion.sampleAnswerOutline && (
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-1">
                      💡 Evaluation Focus & Expected Concepts
                    </span>
                    <p className="text-[11px] leading-relaxed font-mono">
                      {currentQuestion.sampleAnswerOutline}
                    </p>
                  </div>
                )}
              </Card>

              {/* Answer Input or Existing Answer View */}
              {activeSession.status === 'in_progress' && !currentQuestion.evaluation && (
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Your Simulated Interview Response
                    </label>
                    <span className={`text-[11px] font-mono ${wordCount < 30 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {wordCount} words {wordCount < 30 && '(Aim for 40-300 words with trade-offs)'}
                    </span>
                  </div>

                  <textarea
                    rows={7}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Provide a substantive response detailing architectural decisions, production trade-offs, and concrete technical mechanisms..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                  />

                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mt-3">
                    <span className="text-[11px] text-slate-500">
                      Evaluated on Correctness, Clarity, Relevance, and Practical Trade-offs.
                    </span>
                    <Button
                      size="md"
                      onClick={handleSubmitAnswer}
                      isLoading={submitting}
                      disabled={wordCount === 0}
                      icon={Send}
                      className="w-full sm:w-auto"
                    >
                      Submit Answer for Rubric Evaluation
                    </Button>
                  </div>
                </Card>
              )}

              {/* Instant Evaluation Feedback Card */}
              {currentQuestion.evaluation && (
                <Card className="border-indigo-500/40 bg-gradient-to-br from-slate-900 to-indigo-950/20">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <h4 className="text-base font-bold text-white">Answer Rubric Evaluation</h4>
                      </div>
                      <p className="text-xs text-slate-400">
                        {currentQuestion.evaluation.evaluationNotes}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-2xl font-bold text-indigo-400">
                        {currentQuestion.evaluation.overallQuestionScore}/100
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Question Score
                      </div>
                    </div>
                  </div>

                  {/* 4 Rubric Meters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">Correctness & Depth</span>
                        <span className="text-indigo-400">{currentQuestion.evaluation.correctness}%</span>
                      </div>
                      <ProgressBar progress={currentQuestion.evaluation.correctness} color="indigo" />
                      <span className="text-[10px] text-slate-500 block">35% Rubric Weight</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">Practical & Trade-offs</span>
                        <span className="text-emerald-400">
                          {currentQuestion.evaluation.practicalUnderstanding}%
                        </span>
                      </div>
                      <ProgressBar
                        progress={currentQuestion.evaluation.practicalUnderstanding}
                        color="emerald"
                      />
                      <span className="text-[10px] text-slate-500 block">25% Rubric Weight</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">Clarity & Structure</span>
                        <span className="text-amber-400">{currentQuestion.evaluation.clarity}%</span>
                      </div>
                      <ProgressBar progress={currentQuestion.evaluation.clarity} color="amber" />
                      <span className="text-[10px] text-slate-500 block">20% Rubric Weight</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">Relevance</span>
                        <span className="text-purple-400">{currentQuestion.evaluation.relevance}%</span>
                      </div>
                      <ProgressBar progress={currentQuestion.evaluation.relevance} color="purple" />
                      <span className="text-[10px] text-slate-500 block">20% Rubric Weight</span>
                    </div>
                  </div>

                  {/* Submitted Answer Display */}
                  <div className="mb-6">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Candidate Submitted Answer
                    </span>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                      {currentQuestion.userAnswer}
                    </div>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-500/30">
                      <h5 className="font-semibold text-emerald-300 text-xs mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Identified Strengths
                      </h5>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {currentQuestion.evaluation.strengths.map((str, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-950/20 p-3.5 rounded-xl border border-amber-500/30">
                      <h5 className="font-semibold text-amber-300 text-xs mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Actionable Improvements
                      </h5>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {currentQuestion.evaluation.improvements.map((imp, iIdx) => (
                          <li key={iIdx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Navigation to next question */}
                  {currentQuestionIndex < activeSession.totalQuestions - 1 && (
                    <div className="mt-6 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          const nextIdx = currentQuestionIndex + 1;
                          setCurrentQuestionIndex(nextIdx);
                          setAnswerText(activeSession.questions[nextIdx]?.userAnswer || '');
                        }}
                        icon={ChevronRight}
                      >
                        Proceed to Question {currentQuestionIndex + 2}
                      </Button>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Finalized Session Overview */}
          {activeSession.status === 'completed' && (
            <Card className="border-emerald-500/40 bg-emerald-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">
                      Interview Session Finalized
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    {activeSession.summaryFeedback?.overallNotes}
                  </p>
                </div>
                <Badge variant={activeSession.overallScore >= 75 ? 'success' : 'warning'}>
                  {activeSession.readinessAssessment?.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <h5 className="font-semibold text-emerald-300 mb-2">Consolidated Strengths</h5>
                  <ul className="space-y-1 text-slate-300">
                    {activeSession.summaryFeedback?.keyStrengths?.map((str, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-amber-300 mb-2">Priority Improvement Focus</h5>
                  <ul className="space-y-1 text-slate-300">
                    {activeSession.summaryFeedback?.criticalGaps?.map((gap, gIdx) => (
                      <li key={gIdx} className="flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

