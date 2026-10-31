import React from 'react';
import { Compass, ShieldCheck, Cpu, DollarSign, Database } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/90 text-slate-400 text-xs py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <span>Career Pivot Coach</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              A production-oriented career transition platform engineered to bridge the gap between
              your existing professional experience and target role requirements using explainable skill intelligence.
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> ₹0 Budget Architecture
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-indigo-400" /> Local MongoDB
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-amber-400" /> Deterministic NLP
              </span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
              Core Engine Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>Candidate & Resume Parser</li>
              <li>Skill Gap Analytical Engine</li>
              <li>Personalized Weekly Roadmap</li>
              <li>Portfolio Project Blueprints</li>
              <li>Mock Interview Evaluator</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
              Transparency & Ethics
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              All skill gap classifications, roadmaps, and mock interview rubrics are computed via
              transparent rule-based NLP. No unverified third-party LLMs are called or falsely claimed.
            </p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Explainable Scoring
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} Career Pivot Coach. Production-oriented Hackathon Project.
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2">
            <span>React 19 + Vite</span>
            <span>Node.js + Express (ESM)</span>
            <span>Tailwind CSS</span>
            <span>Mongoose</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

