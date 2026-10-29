// ==============================================================================
// HAMMAD STUDYHUB — ADMINISTRATOR LOGIN
// ==============================================================================

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/common/SEOHead';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signInAsDemoAdmin, isDemoMode, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/admin';

  // If already logged in, redirect to admin
  React.useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const res = await signIn(email, password);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleDemoLogin = () => {
    signInAsDemoAdmin();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <SEOHead title="Administrator Login" />

      <div className="w-full max-w-md space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Administrator Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hammad StudyHub &bull; Platform Management & Content Controls
          </p>
        </div>

        {/* Demo Mode Notice & Quick Access */}
        {isDemoMode && (
          <aside
            aria-label="Demo administrator access"
            className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2"
          >
            <div className="flex items-center gap-1.5 font-bold">
              <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Demo Mode Active (Zero Configuration)</span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Cloud Supabase keys have not been configured yet. You can test all administrator features immediately using the Demo Administrator mode:
            </p>
            <Button
              type="button"
              variant="accent"
              size="sm"
              className="w-full text-xs font-semibold py-1.5"
              onClick={handleDemoLogin}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Sign In as Demo Admin (1-Click)
            </Button>
          </aside>
        )}

        {/* Form Card */}
        <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <Input
              label="Admin Email"
              type="email"
              required
              autoFocus
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isDemoMode ? 'admin@hammadstudyhub.com' : 'admin@example.com'}
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
              Sign In to Admin Hub
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
            >
              &larr; Return to Public Website
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
