import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle2, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingSpinner, Card, Button, Alert } from './UI.jsx';

export const ProtectedRoute = ({ children }) => {
  const {
    isAuthenticated,
    isEmailVerified,
    isLoading,
    user,
    checkVerificationStatus,
    resendVerificationEmail,
    logout,
  } = useAuth();
  const location = useLocation();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner label="Authenticating session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Mandatory: Enforce email verification before granting access to protected features
  if (!isEmailVerified) {
    const handleCheckVerification = async () => {
      setChecking(true);
      setFeedback(null);
      try {
        const verified = await checkVerificationStatus();
        if (!verified) {
          setFeedback({
            type: 'warning',
            message: 'Email not verified yet. Please click the link sent to your inbox and try again.',
          });
        }
      } catch (err) {
        setFeedback({ type: 'danger', message: err.message });
      } finally {
        setChecking(false);
      }
    };

    const handleResend = async () => {
      setResending(true);
      setFeedback(null);
      try {
        await resendVerificationEmail();
        setFeedback({
          type: 'success',
          message: 'A fresh verification email has been dispatched to your address.',
        });
      } catch (err) {
        setFeedback({ type: 'danger', message: err.message });
      } finally {
        setResending(false);
      }
    };

    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <Card className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Email Verification Required</h2>
          <p className="text-xs text-slate-400 mb-6">
            To protect your candidate portfolio and mock interview history, Career Pivot Coach requires a verified email address before granting workspace access.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-left mb-5">
            <span className="text-[11px] text-slate-500 block mb-0.5">Account Email</span>
            <span className="text-sm font-medium text-slate-200">{user?.email}</span>
          </div>

          {feedback && (
            <Alert
              type={feedback.type}
              message={feedback.message}
              className="mb-5 text-left"
            />
          )}

          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              isLoading={checking}
              icon={CheckCircle2}
              className="w-full"
            >
              I Have Verified My Email
            </Button>
            <Button
              variant="outline"
              onClick={handleResend}
              isLoading={resending}
              icon={RefreshCw}
              className="w-full text-xs"
            >
              Resend Verification Link
            </Button>
            <Button
              variant="ghost"
              onClick={logout}
              icon={LogOut}
              className="w-full text-xs text-slate-400 hover:text-white"
            >
              Sign Out / Use Different Account
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return children;
};
