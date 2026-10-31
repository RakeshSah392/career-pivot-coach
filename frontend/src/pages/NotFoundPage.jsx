import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../components/UI.jsx';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-white mb-2">404</h1>
      <h2 className="text-lg font-semibold text-slate-300 mb-3">Page Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        The route you requested does not exist or has been relocated within the Career Pivot Coach workspace.
      </p>
      <Link to="/dashboard">
        <Button icon={ArrowLeft}>Return to Dashboard</Button>
      </Link>
    </div>
  );
};

