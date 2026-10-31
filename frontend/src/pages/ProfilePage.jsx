import React, { useState, useEffect } from 'react';
import { User, Save, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { candidateApi } from '../api/client.js';
import { Card, Button, Alert, Badge } from '../components/UI.jsx';
import { Link } from 'react-router-dom';

export const ProfilePage = () => {
  const { candidate, email, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentIndustry, setCurrentIndustry] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [skillsText, setSkillsText] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (candidate) {
      setFullName(candidate.fullName || '');
      setCurrentTitle(candidate.currentTitle || '');
      setCurrentIndustry(candidate.currentIndustry || '');
      setTargetRole(candidate.targetRole || '');
      setTargetIndustry(candidate.targetIndustry || '');
      setYearsOfExperience(candidate.yearsOfExperience || 0);
      setSkillsText((candidate.skills || []).join(', '));
      setLinkedin(candidate.socialLinks?.linkedin || '');
      setGithub(candidate.socialLinks?.github || '');
      setPortfolio(candidate.socialLinks?.portfolio || '');
    }
  }, [candidate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const skillsArray = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await candidateApi.updateProfile(email, {
        fullName: fullName.trim(),
        currentTitle: currentTitle.trim(),
        currentIndustry: currentIndustry.trim(),
        targetRole: targetRole.trim(),
        targetIndustry: targetIndustry.trim(),
        yearsOfExperience: Number(yearsOfExperience) || 0,
        skills: skillsArray,
        socialLinks: {
          linkedin: linkedin.trim(),
          github: github.trim(),
          portfolio: portfolio.trim(),
        },
      });

      await refreshProfile();
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-400" /> Candidate Profile
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal background, declared competencies, and pivot target specifications.
          </p>
        </div>
        <div className="self-start sm:self-auto max-w-full">
          <Badge variant="purple" className="truncate max-w-[280px] sm:max-w-none">
            {email}
          </Badge>
        </div>
      </div>

      {successMsg && <Alert type="success" message={successMsg} />}
      {errorMsg && <Alert type="danger" message={errorMsg} />}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <h3 className="text-sm font-semibold text-white mb-4">Core Identity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-white mb-4">Current Experience & Target Pivot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Title</label>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Industry</label>
              <input
                type="text"
                value={currentIndustry}
                onChange={(e) => setCurrentIndustry(e.target.value)}
                placeholder="e.g. Fintech / SaaS"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Role (Pivot Objective)
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Principal Cloud Platform Architect"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="60"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Declared Skills <span className="text-slate-500 font-normal">(comma-separated)</span>
            </label>
            <textarea
              rows={2}
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="e.g. Node.js, Express, React, MongoDB, Docker, AWS"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Skills listed here without direct project context in your resume will be flagged as Partial evidence in gap analysis.
            </span>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-white mb-4">Social & Portfolio Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">LinkedIn URL</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">GitHub URL</label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Portfolio / Website</label>
              <input
                type="url"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://yourportfolio.dev"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Resume summary link */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="text-sm font-semibold text-white">Active Resume Document</h4>
                <p className="text-xs text-slate-400">
                  {candidate?.resume?.originalName
                    ? `Currently uploaded: ${candidate.resume.originalName} (${candidate.resume.parsedMeta?.wordCount || 0} words)`
                    : 'No resume uploaded yet.'}
                </p>
              </div>
            </div>
            <Link to="/resume" className="w-full sm:w-auto">
              <Button variant="secondary" size="sm" icon={ArrowRight} className="w-full sm:w-auto">
                {candidate?.resume?.originalName ? 'Replace / View Resume' : 'Upload Resume'}
              </Button>
            </Link>
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" size="md" isLoading={saving} icon={Save} className="w-full sm:w-auto">
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

