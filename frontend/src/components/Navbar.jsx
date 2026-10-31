import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  FileText,
  BarChart2,
  Map,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Activity,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { systemApi } from '../api/client.js';

export const Navbar = () => {
  const { candidate, isAuthenticated, isEmailVerified, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await systemApi.getHealth();
        setIsBackendHealthy(res?.success && res?.database?.status === 'connected');
      } catch {
        setIsBackendHealthy(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Layers },
    { name: 'Resume', path: '/resume', icon: FileText },
    { name: 'Skill Gap', path: '/analysis', icon: BarChart2 },
    { name: 'Roadmap', path: '/roadmap', icon: Map },
    { name: 'Mock Interviews', path: '/interviews', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Career Pivot <span className="text-indigo-400">Coach</span>
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
              AI Transition Engine
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/60">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side: System health + Profile indicator */}
        <div className="hidden md:flex items-center gap-4">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              isBackendHealthy
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
            title={isBackendHealthy ? 'Backend API & MongoDB Online' : 'Backend Disconnected'}
          >
            <Activity className="w-3 h-3 animate-pulse" />
            <span>{isBackendHealthy ? 'API Active' : 'API Offline'}</span>
          </div>

          {isAuthenticated && !isEmailVerified && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400"
              title="Email verification required to access workspace features"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Verify Email</span>
            </div>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <Link to="/profile" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-xs font-semibold text-indigo-300 group-hover:border-indigo-500">
                  {candidate?.fullName?.[0] || 'C'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-indigo-400 transition-colors truncate max-w-[120px]">
                    {candidate?.fullName || 'Candidate'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {candidate?.targetRole || 'Pivoting'}
                  </div>
                </div>
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth?mode=login"
                className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/auth?mode=register"
                className="text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-600/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="p-3 bg-slate-800/50 rounded-xl mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    {candidate?.fullName}
                  </div>
                  <div className="text-xs text-slate-400">{candidate?.email}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2 min-h-[38px] text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit</span>
                </button>
              </div>

              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all ${
                      active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/auth?mode=login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm text-slate-300 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/auth?mode=register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

