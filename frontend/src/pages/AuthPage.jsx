import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, LogIn, UserPlus, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Button, Alert } from '../components/UI.jsx';

export const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'login' ? 'login' : 'register';
  const [mode, setMode] = useState(initialMode);

  const { login, register, resetPassword, isAuthenticated, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Cloud Platform Architect');
  const [yearsOfExperience, setYearsOfExperience] = useState(4);
  const [skillsText, setSkillsText] = useState('Node.js, Express, React, MongoDB');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const qMode = searchParams.get('mode');
    if (qMode === 'login' || qMode === 'register' || qMode === 'reset') {
      setMode(qMode);
    }
  }, [searchParams]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
    setFormError('');
    setSuccessNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessNotice('');

    if (!email || !email.includes('@')) {
      setFormError('Please provide a valid email address.');
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setSuccessNotice(`Password reset email dispatched to ${email}. Check your inbox.`);
      } catch (err) {
        setFormError(err.message || 'Failed to dispatch password reset email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setFormError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        navigate('/dashboard');
      } else {
        if (password !== confirmPassword) {
          setFormError('Passwords do not match.');
          setLoading(false);
          return;
        }

        if (!fullName.trim()) {
          setFormError('Full name is required to create a candidate profile.');
          setLoading(false);
          return;
        }

        const skillsArray = skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const result = await register(
          email.trim().toLowerCase(),
          password,
          {
            fullName: fullName.trim(),
            currentTitle: currentTitle.trim(),
            targetRole: targetRole.trim(),
            yearsOfExperience: Number(yearsOfExperience) || 0,
            skills: skillsArray,
          }
        );

        if (result?.requiresVerification) {
          setSuccessNotice(
            `Account initialized! A verification email has been sent to ${email}. Please verify your email to unlock your workspace.`
          );
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please verify credentials and backend status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-600/30">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {mode === 'login'
            ? 'Sign In to Your Workspace'
            : mode === 'register'
            ? 'Create Candidate Profile'
            : 'Reset Account Password'}
        </h1>
        <p className="text-xs text-slate-400 mt-2">
          {mode === 'login'
            ? 'Access your saved resume, skill gaps, roadmaps, and interview history.'
            : mode === 'register'
            ? 'Initialize your personalized career pivot profile with verified Firebase credentials.'
            : 'Enter your email to receive a secure password recovery link.'}
        </p>
      </div>

      <Card>
        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            New Candidate
          </button>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {!isFirebaseConfigured && (
          <Alert
            type="warning"
            title="Firebase Web App Configuration Pending"
            message="VITE_FIREBASE_API_KEY is not yet configured in frontend/.env. Provide your Firebase Web App credentials to complete live authentication."
            className="mb-5"
          />
        )}

        {formError && (
          <Alert
            type="danger"
            title="Authentication Error"
            message={formError}
            className="mb-5"
          />
        )}

        {successNotice && (
          <Alert
            type="success"
            title="Verification Dispatched"
            message={successNotice}
            className="mb-5"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Candidate Email <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password <span className="text-rose-400">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min 6 characters)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Current Title
                  </label>
                  <input
                    type="text"
                    value={currentTitle}
                    onChange={(e) => setCurrentTitle(e.target.value)}
                    placeholder="Full Stack Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Years of Exp.
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Pivot Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Senior Cloud Platform Architect"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Declared Skills <span className="text-slate-500 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="Node.js, Express, React, MongoDB"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Skills declared in your profile will be classified as Partial until evidenced in resume text.
                </span>
              </div>
            </>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              className="w-full"
              icon={
                mode === 'login'
                  ? LogIn
                  : mode === 'register'
                  ? UserPlus
                  : KeyRound
              }
            >
              {mode === 'login'
                ? 'Sign In & Load Workspace'
                : mode === 'register'
                ? 'Initialize Candidate Profile'
                : 'Send Password Reset Link'}
            </Button>
          </div>

          {mode === 'reset' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                &larr; Back to Sign In
              </button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};
