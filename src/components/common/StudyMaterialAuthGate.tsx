// ==============================================================================
// HAMMAD STUDYHUB — STUDY MATERIAL AUTHENTICATION GATE
// Protects confidential academic resources, notes, and lectures from public scraping
// Prompts students to Sign Up or Log In to access daily materials.
// ==============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  FileText,
  Video,
  UserCheck,
} from 'lucide-react';
import { Button } from './Button';

interface StudyMaterialAuthGateProps {
  title?: string;
  description?: string;
  subjectName?: string;
  showTeaserCards?: boolean;
}

export const StudyMaterialAuthGate: React.FC<StudyMaterialAuthGateProps> = ({
  title,
  description,
  subjectName,
  showTeaserCards = true,
}) => {
  const displayTitle =
    title ||
    (subjectName
      ? `Student Access Required for ${subjectName}`
      : 'Student Account Required to Access Study Materials');

  const displayDesc =
    description ||
    (subjectName
      ? `Daily lecture notes, YouTube recordings, whiteboard diagrams, and model solutions for ${subjectName} are exclusively available to registered students.`
      : 'Class lecture notes, YouTube video explanations, PDFs, whiteboard snapshots, and past papers are reserved for enrolled students.');

  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-200/80 dark:border-brand-900/40 bg-gradient-to-b from-white via-brand-50/20 to-slate-50 dark:from-navy-900 dark:via-navy-950 dark:to-navy-950 p-6 sm:p-10 shadow-card text-center space-y-6">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-brand-500/10 dark:bg-brand-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Main Gate Container */}
      <div className="max-w-xl mx-auto space-y-4 relative z-10">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-brand-600 text-white mx-auto flex items-center justify-center shadow-md shadow-brand-500/20">
          <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Protected Academic Content</span>
          </div>

          <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {displayTitle}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
            {displayDesc}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button
              size="md"
              variant="primary"
              className="w-full sm:w-auto font-bold shadow-md shadow-brand-600/20"
              leftIcon={<GraduationCap className="w-4 h-4" />}
            >
              Create Student Account
            </Button>
          </Link>

          <Link to="/login" className="w-full sm:w-auto">
            <Button
              size="md"
              variant="outline"
              className="w-full sm:w-auto font-bold bg-white dark:bg-navy-900 hover:bg-slate-50"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Your Account
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Are you a Class Representative (CR) or Administrator? Use your authorized credentials to sign in.
        </p>
      </div>

      {/* Teaser Preview Cards (Blurred/Locked Visual) */}
      {showTeaserCards && (
        <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800/80">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-3">
            Available Inside Platform After Sign-In
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto opacity-70 pointer-events-none select-none">
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-navy-900/60 backdrop-blur-xs flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Complete Lecture Notes
                </div>
                <div className="text-[10px] text-slate-400">PDFs & Handouts</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-navy-900/60 backdrop-blur-xs flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  YouTube Video Lectures
                </div>
                <div className="text-[10px] text-slate-400">Topic-by-topic recordings</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-navy-900/60 backdrop-blur-xs flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Past Papers & Solutions
                </div>
                <div className="text-[10px] text-slate-400">Solved model tests</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
