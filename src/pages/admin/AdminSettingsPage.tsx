// ==============================================================================
// HAMMAD STUDYHUB — PLATFORM ADMIN SETTINGS
// Configures branding, database, and Direct Social Media Contacts (WhatsApp & Instagram)
// ==============================================================================

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Database,
  Save,
  RotateCcw,
  CheckCircle,
  Info,
  Key,
  MessageCircle,
  Instagram,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  clearAllStoredData,
  getPlatformSocials,
  savePlatformSocials,
} from '../../lib/demoStore';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/common/SEOHead';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';

export const AdminSettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const currentSocials = getPlatformSocials();

  const [platformName, setPlatformName] = useState('Hammad StudyHub');
  const [tagline, setTagline] = useState('Learn. Revise. Grow.');
  const [creatorName, setCreatorName] = useState('Muhammad Hammad');
  const [contactEmail, setContactEmail] = useState('hammadstudyhub@example.com');
  const [defaultDateMode, setDefaultDateMode] = useState<'today' | 'custom'>('today');

  // Direct Social Media Contacts for Student Requests
  const [whatsappNumber, setWhatsappNumber] = useState(currentSocials.whatsapp_number);
  const [instagramId, setInstagramId] = useState(currentSocials.instagram_id);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security Check: Only Master Admin can manage platform settings
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Restricted Administrator Access
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Platform settings and direct social media handles can only be modified by the Master Administrator. Class Representatives (CR & GR) have access to manage study notes, upload PDFs, and post class notices.
        </p>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    savePlatformSocials({
      whatsapp_number: whatsappNumber,
      instagram_id: instagramId,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const updatedSocials = getPlatformSocials();

  return (
    <div className="max-w-4xl space-y-8">
      <SEOHead title="Platform Settings & Social Contacts — Admin Hub" />

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          <span>Platform Settings & Social Channels</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure branding, academic defaults, and manage direct WhatsApp & Instagram contact details for students.
        </p>
      </div>

      {/* Direct Social Media Channels (WhatsApp & Instagram) */}
      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              <span>Student Direct Contact Channels</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students who need specific notes or past paper solutions can click to reach you directly on these handles.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* WhatsApp Field & Preview */}
          <div className="space-y-2">
            <Input
              label="Admin WhatsApp Number"
              type="text"
              leftIcon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="03242779514"
              helperText="Students will be redirected to chat with this number on WhatsApp."
            />
            <div className="pt-1">
              <a
                href={updatedSocials.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <span>Test WhatsApp Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Instagram Field & Preview */}
          <div className="space-y-2">
            <Input
              label="Admin Instagram Username"
              type="text"
              leftIcon={<Instagram className="w-4 h-4 text-pink-600" />}
              value={instagramId}
              onChange={(e) => setInstagramId(e.target.value)}
              placeholder="not_urs_hammi"
              helperText="Students will be redirected to this Instagram profile."
            />
            <div className="pt-1">
              <a
                href={updatedSocials.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline"
              >
                <span>Test Instagram Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </Card>

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
                  : 'Running in Local Storage Mode (Client-side Data Persistence).'}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isSupabaseConfigured
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isSupabaseConfigured ? 'LIVE CLOUD' : 'LOCAL STORAGE'}
          </span>
        </div>
      </Card>

      {/* General Settings Form */}
      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card">
        <form onSubmit={handleSave} className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            General Platform Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Platform Title"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
            />
            <Input
              label="Brand Tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Creator Name"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
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
              <span>Platform settings and social contacts updated successfully.</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button type="submit" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />}>
              Save Preferences & Social Links
            </Button>
          </div>
        </form>
      </Card>

      {/* Clear Stored Data Action */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Clear Stored Content
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Wipes all local subjects, resources, registered students, and notices to reset to a clean state.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllStoredData}
          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-red-500" />}
        >
          Clear Stored Content
        </Button>
      </Card>
    </div>
  );
};
