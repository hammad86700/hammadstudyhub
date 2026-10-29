// ==============================================================================
// HAMMAD STUDYHUB — TERMS OF USE
// ==============================================================================

import React from 'react';
import { FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { Card } from '../components/common/Card';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <SEOHead
        title="Terms of Use"
        description="Terms and conditions for utilizing academic resources on Hammad StudyHub."
      />

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <FileText className="w-7 h-7 text-brand-600" />
          <span>Terms of Use</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last updated: October 2026 &bull; Hammad StudyHub
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            1. Educational & Non-Commercial Purpose
          </h2>
          <p>
            Hammad StudyHub, created by <strong>Muhammad Hammad</strong>, is provided free of charge for non-commercial educational study, homework preparation, revision, and academic reference. Commercial exploitation, reselling, or re-licensing of distributed materials without explicit authorization is prohibited.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Intellectual Property & Academic Distribution
          </h2>
          <p>
            Study notes, whiteboard illustrations, and presentations remain the intellectual property of their respective creators and instructors. Materials shared via Google Drive are intended for authorized academic study. If an authorized rights holder desires a link modified or removed, submit a notice via the Feedback page and it will be addressed promptly.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. Disclaimer of Warranty
          </h2>
          <p>
            While every effort is made to maintain accurate and up-to-date lecture resources, study materials are provided on an &quot;as is&quot; basis to assist student learning. Students are encouraged to cross-reference lecture notes with their institutional textbooks and syllabus guidelines.
          </p>
        </Card>
      </div>
    </div>
  );
};
