// ==============================================================================
// HAMMAD STUDYHUB — PUBLIC WEBSITE (BEFORE STUDENT LOGIN)
// Clean, professional, trustworthy educational SaaS homepage introducing the
// platform, creator Muhammad Hammad, features, mission, and student authentication.
//
// STRICT RESTRICTION: No private study materials or resources are shown here.
// ==============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Video,
  Image as ImageIcon,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  ShieldCheck,
  ArrowRight,
  Smartphone,
  Search,
  Bookmark,
  Bell,
  MessageCircle,
  ExternalLink,
  Users,
  Target,
  Compass,
  Zap,
} from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const PublicHomePage: React.FC = () => {
  return (
    <div className="space-y-12 sm:space-y-24 pb-20 w-full max-w-full overflow-x-hidden">
      <SEOHead
        title="Hammad StudyHub — Learn. Revise. Grow."
        description="Your studies, organized in one place. Created by Muhammad Hammad. High-quality daily lecture notes, whiteboard photos, video lessons, and past papers."
      />

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-28 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-brand-50/50 via-white to-slate-50 dark:from-navy-900/60 dark:via-navy-950 dark:to-navy-950">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-brand-500/10 dark:bg-brand-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7 relative z-10">
          {/* Creator & Platform Brand Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse" />
            <span className="font-extrabold text-slate-900 dark:text-white">Hammad StudyHub</span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span className="font-medium text-slate-600 dark:text-slate-400">Created by Muhammad Hammad</span>
          </div>

          {/* Main Title & Taglines */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-[1.12]">
              Your studies, organized{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 dark:from-brand-400 dark:via-indigo-400 dark:to-brand-300">
                in one place.
              </span>
            </h1>
            <p className="text-base sm:text-xl font-bold text-brand-700 dark:text-brand-300 tracking-wide uppercase">
              Learn. Revise. Grow.
            </p>
          </div>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            A modern, barrier-free educational platform designed for students. Access all your subject lecture notes,
            recorded explanations, whiteboard snapshots, assignments, and model past papers organized day-by-day.
          </p>

          {/* Action CTAs: Signup, Login, Contact */}
          <div className="pt-3 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Link to="/signup">
              <Button size="lg" variant="primary" className="font-bold px-7 shadow-lg shadow-brand-600/25">
                <span>Create Free Student Account</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>

            <Link to="/login">
              <Button size="lg" variant="outline" className="font-bold px-7 bg-white dark:bg-navy-900">
                Student Sign In
              </Button>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Protected Student Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-brand-500" />
              <span>Optimized for Phones & Tablets</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              <span>Direct WhatsApp Support</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 sm:space-y-28">
        {/* 2. About Hammad StudyHub Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-bold uppercase tracking-wider">
              <span>About The Platform</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Why was Hammad StudyHub created?
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Every semester, students struggle with scattered study files: lecture slides lost inside buried WhatsApp group chats,
              broken Google Drive permissions, missing whiteboard photos before exams, and confusion about what was taught on any given day.
            </p>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Hammad StudyHub</strong> was conceived and architected by <strong>Muhammad Hammad</strong> to solve this exact problem.
              It brings all course materials, lecture notes, daily whiteboards, and assignment deadlines into a single, beautifully organized hub.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <Link to="/about">
                <Button variant="secondary" size="sm" className="font-bold">
                  <span>Read Creator Story</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-elevated border border-slate-800 space-y-6 relative overflow-hidden">
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase text-brand-400 tracking-wider">
                  Platform Architecture
                </span>
                <h3 className="text-xl font-bold text-white">
                  Built to make learning materials effortless to find.
                </h3>
              </div>

              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    1
                  </div>
                  <p>
                    <strong className="text-white">Day-by-Day Calendar Timeline:</strong> Every lecture is cataloged by the exact calendar date it was delivered in class.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    2
                  </div>
                  <p>
                    <strong className="text-white">Dual Access (Read Online or Download):</strong> Students can instantly read PDFs and slides in their browser without downloading, or save them directly for offline revision.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    3
                  </div>
                  <p>
                    <strong className="text-white">Reliable Backup Storage:</strong> Files are stored safely in cloud storage, free from expired link errors or Google Drive storage limitations.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Curated by Muhammad Hammad</span>
                <span className="font-mono text-emerald-400">100% Free for Students</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. What The Platform Offers (Learning Formats) */}
        <section className="space-y-10 text-center">
          <div className="space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Complete Academic Arsenal
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
              What does Hammad StudyHub offer?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Everything you need for your courses, categorized cleanly and accessible on any device.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3 hover:border-brand-500/50 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                PDF Lecture Notes & Handouts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Clean, typed or scanned lecture handouts and study summaries published class-by-class.
              </p>
            </Card>

            <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3 hover:border-brand-500/50 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recorded Video Lessons
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                High-yield video explanations and YouTube playlist links embedded cleanly without ads.
              </p>
            </Card>

            <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3 hover:border-brand-500/50 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Whiteboard Snapshots
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Crystal clear classroom whiteboard diagrams, derivations, and circuit schematics.
              </p>
            </Card>

            <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3 hover:border-brand-500/50 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assignments & Worksheets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Official problem sets, lab exercises, and model solutions with explicit submission dates.
              </p>
            </Card>

            <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3 hover:border-brand-500/50 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Past Papers & Exam Reviews
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Midterm and terminal exam questions, quizzes, and revision guides from previous semesters.
              </p>
            </Card>

            <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3 hover:border-brand-500/50 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Important Announcements
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Critical updates, schedule revisions, exam dates, and reminders posted directly by administrators and CRs.
              </p>
            </Card>
          </div>
        </section>

        {/* 4. Main Benefits & Features */}
        <section className="space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Student Advantages
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
              Features built for better grades
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Everything in StudyHub is optimized to reduce study friction and save your precious revision time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="p-2.5 w-fit rounded-xl bg-brand-100 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Catch Up by Date
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Missed class on Tuesday? Select that date on your subject timeline to view everything covered that day.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="p-2.5 w-fit rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Instant Search
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Find any topic across all courses in seconds with keyword, chapter, or course code search.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="p-2.5 w-fit rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                <Bookmark className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Save & Revise
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Bookmark challenging topics and mark completed chapters on your personal revision checklist.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="p-2.5 w-fit rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Phone & Tablet Ready
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Zero horizontal scrolling. Touch-friendly controls for reading notes easily on mobile screens on the bus or in bed.
              </p>
            </div>
          </div>
        </section>

        {/* 5. How Students Use The Platform (3 Easy Steps) */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white shadow-elevated space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-mono uppercase text-brand-400 tracking-wider">
              Simple 3-Step Setup
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              How to start learning on StudyHub
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-lg mx-auto flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="text-base font-bold text-white">
                Create Your Account
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sign up in under 30 seconds with your name and email. No complicated verification barriers.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg mx-auto flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="text-base font-bold text-white">
                Open Student Dashboard
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Log in and land directly on your personal dashboard with latest uploads, subjects, and announcements.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg mx-auto flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="text-base font-bold text-white">
                Read Online or Download
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Click any lecture note to read it instantly in your browser or save the file directly to your device.
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link to="/signup">
              <Button size="lg" variant="primary" className="font-bold px-8 shadow-md">
                Get Started Now &rarr;
              </Button>
            </Link>
          </div>
        </section>

        {/* 6. Platform Mission and Vision */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-7 sm:p-9 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Our Mission
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              To eradicate the stress of missing academic materials by providing students with an organized,
              accessible, and dependable learning environment that puts classroom lectures at their fingertips 24/7.
            </p>
          </div>

          <div className="p-7 sm:p-9 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Our Vision
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              To build a collaborative academic hub where every student can focus entirely on understanding core concepts,
              revising effectively, and achieving academic excellence without technical bottlenecks.
            </p>
          </div>
        </section>

        {/* 7. Creator & Administration Support Section */}
        <section className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-navy-950 text-white border border-emerald-900/60 shadow-elevated flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <span>Direct Student Support</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-white">
              Have Questions or Need Specific Notes?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Muhammad Hammad actively manages and updates study materials. If you need a specific lecture handout,
              past paper, or assistance with an account, reach out directly:
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <a
              href="https://wa.me/923242779514?text=Hello%20Muhammad%20Hammad,%20I%20am%20a%20student%20on%20Hammad%20StudyHub%20and%20need%20assistance."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-transform hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp (03242779514)</span>
            </a>

            <a
              href="https://instagram.com/not_urs_hammi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white shadow-md transition-transform hover:scale-105"
            >
              <span>Instagram (@not_urs_hammi)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* 8. Final CTA Banner */}
        <section className="text-center p-8 sm:p-14 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-card space-y-6">
          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to elevate your learning experience?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Join your fellow students on Hammad StudyHub. Sign up in seconds and access your organized courses.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Link to="/signup">
              <Button size="lg" variant="primary" className="font-bold px-8 shadow-lg shadow-brand-600/30">
                Create Free Account
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="font-bold px-8 text-white border-slate-700 hover:bg-slate-800">
                Student Sign In
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

