// ==============================================================================
// HAMMAD STUDYHUB — PRIVACY POLICY
// ==============================================================================

import React from 'react';
import { Shield, Lock, EyeOff, Database } from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { Card } from '../components/common/Card';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <SEOHead
        title="Privacy Policy"
        description="Learn how Hammad StudyHub respects student privacy with zero-tracking and local device storage."
      />

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-brand-600" />
          <span>Privacy Policy</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last updated: October 2026 &bull; Created by Muhammad Hammad
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-brand-500" />
            <span>1. Zero Mandatory Student Tracking or Registration</span>
          </h2>
          <p>
            Hammad StudyHub is built as an open, accessible academic resource portal. Students are not required to create user accounts, sign in, or provide phone numbers or personal identifying data to browse and access public study materials.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>2. Local Device Storage for Bookmarks & History</span>
          </h2>
          <p>
            Features such as <strong>Saved Bookmarks</strong>, <strong>Recently Viewed Resources</strong>, and the <strong>Revision Checklist</strong> operate entirely inside your device browser using standard Web LocalStorage. This data is never synchronized to a tracking server or sold to advertisers.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" />
            <span>3. External Document Links (Google Drive & YouTube)</span>
          </h2>
          <p>
            When viewing study materials hosted on Google Drive or watching embedded YouTube lectures, interactions are governed by Google Privacy Policies. Hammad StudyHub does not inject advertising or malicious trackers into external document frames.
          </p>
        </Card>
      </div>
    </div>
  );
};
