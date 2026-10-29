// ==============================================================================
// HAMMAD STUDYHUB — ABOUT PAGE
// ==============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Target, ShieldCheck, Heart, Sparkles, User, Globe } from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { Card } from '../components/common/Card';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <SEOHead
        title="About Hammad StudyHub — Muhammad Hammad"
        description="Learn about the educational vision and architecture of Hammad StudyHub, created by Muhammad Hammad."
      />

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 text-xs font-semibold border border-brand-200 dark:border-brand-800">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Educational Platform Overview</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          About Hammad StudyHub
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
          <strong>Learn. Revise. Grow.</strong> Your studies, organized in one place.
        </p>
      </div>

      {/* Creator Profile */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-white to-slate-50 dark:from-navy-900 dark:to-navy-950 border border-slate-200 dark:border-slate-800 shadow-card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-navy-900 flex items-center justify-center text-white text-2xl font-extrabold shadow-md shrink-0">
            MH
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Platform Architect & Creator
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Muhammad Hammad
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Muhammad Hammad envisioned and developed <strong>Hammad StudyHub</strong> to eliminate the academic chaos students face during revision. By consolidating daily classroom notes, whiteboard snapshots, video explanations, worksheets, and past papers into a date-structured, zero-friction interface, students can focus purely on learning and comprehension.
            </p>
          </div>
        </div>
      </Card>

      {/* Core Principle & Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">The Core Principle</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong>&quot;One platform. Every subject. Every lesson. Everything organized.&quot;</strong>
            <br />
            Materials are systematically tied to the actual academic calendar date of each lecture, ensuring students can always track what happened in class regardless of when materials were uploaded.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Built for Open Access</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Hammad StudyHub does not require students to create an account, enter personal phone numbers, or pay subscriptions to read public study resources. Personal bookmarks and revision progress are stored locally and privately in the student&apos;s browser.
          </p>
        </Card>
      </div>

      {/* Fair Use & Academic Ethics */}
      <Card className="p-6 sm:p-8 space-y-3 bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-brand-500" />
          <span>Academic Integrity & Distribution Policy</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Hammad StudyHub distributes learning resources strictly for educational, non-commercial purposes. Study notes, whiteboard diagrams, and model questions are compiled to facilitate academic comprehension. All document sharing permissions are managed via Google Drive with public view settings. If you believe any material requires updating or permission review, please submit a notice through our <Link to="/feedback" className="text-brand-600 dark:text-brand-400 underline font-semibold">Feedback & Report form</Link>.
        </p>
      </Card>
    </div>
  );
};
