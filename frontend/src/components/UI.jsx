import React from 'react';
import { Loader2 } from 'lucide-react';

export const Card = ({ children, className = '', hover = false }) => (
  <div
    className={`bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-xl p-4 sm:p-6 shadow-xl ${
      hover ? 'transition-all duration-200 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5' : ''
    } ${className}`}
  >
    {children}
  </div>
);

export const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variants = {
    primary: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    neutral: 'bg-slate-800 text-slate-400 border-slate-700',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide transition-colors ${
        variants[variant] || variants.primary
      } ${className}`}
    >
      {children}
    </span>
  );
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 focus:ring-indigo-500 active:bg-indigo-700',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500 active:bg-slate-900',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 focus:ring-emerald-500',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 focus:ring-rose-500',
    ghost:
      'bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-white',
  };

  const sizes = {
    sm: 'text-xs px-3 py-2 sm:py-1.5 min-h-[36px] sm:min-h-0 gap-1.5',
    md: 'text-sm px-4 py-2.5 sm:py-2 min-h-[42px] sm:min-h-0 gap-2',
    lg: 'text-base px-6 py-3 sm:py-2.5 min-h-[46px] gap-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          {children}
        </>
      )}
    </button>
  );
};

export const ProgressBar = ({ progress = 0, color = 'indigo', className = '' }) => {
  const percentage = Math.max(0, Math.min(100, Math.round(progress)));

  const colors = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <div className={`w-full bg-slate-800 rounded-full h-2.5 overflow-hidden ${className}`}>
      <div
        className={`h-2.5 rounded-full transition-all duration-500 ${colors[color] || colors.indigo}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export const Alert = ({ type = 'info', title, message, className = '' }) => {
  const styles = {
    info: 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200',
    success: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200',
    warning: 'bg-amber-950/40 border-amber-500/30 text-amber-200',
    danger: 'bg-rose-950/40 border-rose-500/30 text-rose-200',
  };

  return (
    <div className={`p-4 border rounded-xl ${styles[type] || styles.info} ${className}`}>
      {title && <h5 className="font-semibold mb-1 text-sm">{title}</h5>}
      <p className="text-xs leading-relaxed opacity-90">{message}</p>
    </div>
  );
};

export const LoadingSpinner = ({ label = 'Loading...', size = 'md' }) => {
  const sizeClass = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
      <Loader2 className={`${sizeClass} animate-spin text-indigo-500`} />
      <span className="text-sm font-medium tracking-wide">{label}</span>
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
    {Icon && (
      <div className="mx-auto w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
    <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">{description}</p>
    {action}
  </div>
);

