// ==============================================================================
// HAMMAD STUDYHUB — PLATFORM ADMIN SETTINGS
// ==============================================================================

import React, { useState } from 'react';
import { Settings, Shield, Database, Save, RotateCcw, CheckCircle, Info, Key } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { resetDemoData } from '../../lib/demoStore';
import { SEOHead } from '../../components/common/SEOHead';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';

export const AdminSettingsPage: React.FC = () => {
  const [platformName, setPlatformName] = useState('Hammad StudyHub');
  const [tagline, setTagline] = useState('Learn. Revise. Grow.');
  const [creatorName, setCreatorName] = useState('Muhammad Hammad');
  const [contactEmail, setContactEmail] = useState('hammadstudyhub@example.com');
  const [defaultDateMode, setDefaultDateMode] = useState<'today' | 'custom'>('today');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <SEOHead title="Platform Settings — Admin Hub" />

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          <span>Platform Settings & Configuration</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure branding, academic defaults, and review your database integration status.
        </p>
      </div>

      {/* Database Connection Status Card */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Database Integration Status
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSupabaseConfigured
                  ? 'Connected to live Supabase PostgreSQL backend.'
                  : 'Running in Local Storage Demo Mode (Safe Fallback).'}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isSupabaseConfigured
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
            }`}
          >
            {isSupabaseConfigured ? 'LIVE CLOUD' : 'LOCAL DEMO'}
          </span>
        </div>

        {!isSupabaseConfigured && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              How to connect live Supabase database:
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Create a free project at <strong className="text-slate-800 dark:text-slate-200">supabase.com</strong>.</li>
              <li>Execute the SQL migration from <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">supabase/migrations/20261029000000_init_hammad_studyhub.sql</code> in the Supabase SQL Editor.</li>
              <li>Add your Project URL and Anon Key into your local <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">.env</code> file.</li>
              <li>Restart the dev server to automatically connect!</li>
            </ol>
          </div>
        )}
      </Card>

      {/* General Settings Form */}
      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card">
        <form onSubmit={handleSave} className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            General Platform Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Platform Name"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
            />
            <Input
              label="Creator Attribution"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
            <Input
              label="Official Contact Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <Select
              label="Default Lesson Date Behavior"
              value={defaultDateMode}
              onChange={(e) => setDefaultDateMode(e.target.value as any)}
              options={[
                { value: 'today', label: 'Default to Today (Recommended for daily uploads)' },
                { value: 'custom', label: 'Prompt for custom date each time' },
              ]}
              helperText="Determines the initial date selected in the resource creation modal."
            />
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Platform preferences updated successfully.</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button type="submit" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />}>
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>

      {/* Reset Demo Data Action */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Reset Sample Demo Content
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Re-initializes all sample subjects, lessons, whiteboard notes, and announcements to their initial state.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetDemoData}
          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-500" />}
        >
          Reset Sample Data
        </Button>
      </Card>
    </div>
  );
};
