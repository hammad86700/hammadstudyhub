// ==============================================================================
// HAMMAD STUDYHUB — STUDENT & REPRESENTATIVE LOGIN PAGE
// ==============================================================================

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/common/SEOHead';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const StudentLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, isLoggedIn, isAdmin, isStudyManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || (isStudyManager ? '/admin' : '/subjects');

  React.useEffect(() => {
    if (isLoggedIn) {
      if (isStudyManager) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/subjects', { replace: true });
      }
    }
  }, [isLoggedIn, isStudyManager, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const res = await signIn(email, password);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      if (res.profile?.role === 'admin' || res.profile?.role === 'cr' || res.profile?.role === 'gr') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20 space-y-8">
      <SEOHead
        title="Student Sign In — Hammad StudyHub"
        description="Log in to access your study materials, revision playlists, and message representatives on Hammad StudyHub."
      />

      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Sign In to StudyHub
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Access your courses, revision checklist, and message CR / GR.
        </p>
      </div>

      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            required
            autoFocus
            leftIcon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
          />

          <Input
            label="Password"
            type="password"
            required
            leftIcon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Button
            type="submit"
            size="md"
            className="w-full font-semibold"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs text-center">
          <p className="text-slate-500">
            Don&apos;t have an account yet?{' '}
            <Link
              to="/signup"
              className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Sign Up Now
            </Link>
          </p>

          <p className="text-slate-400 pt-1">
            Are you the Master Administrator?{' '}
            <Link
              to="/admin/login"
              className="font-semibold text-slate-600 dark:text-slate-300 hover:underline inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
              <span>Admin Portal Login</span>
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

