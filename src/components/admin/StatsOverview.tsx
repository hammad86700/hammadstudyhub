// ==============================================================================
// HAMMAD STUDYHUB — ADMIN STATS OVERVIEW COMPONENT
// Derived dynamically from actual database records (never fabricated)
// ==============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileCheck, FileEdit, Bell, Layers, Plus, Upload, Users } from 'lucide-react';
import { Subject, Resource, Announcement } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface StatsOverviewProps {
  subjects: Subject[];
  resources: Resource[];
  announcements: Announcement[];
  studentCount?: number;
  onNewResource: () => void;
  onNewSubject: () => void;
  onBulkImport: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  subjects,
  resources,
  announcements,
  studentCount = 0,
  onNewResource,
  onNewSubject,
  onBulkImport,
}) => {
  const publishedCount = resources.filter((r) => r.status === 'published').length;
  const draftCount = resources.filter((r) => r.status === 'draft').length;
  const activeSubjectsCount = subjects.filter((s) => s.is_active).length;

  const pdfCount = resources.filter((r) => r.resource_type === 'pdf').length;
  const videoCount = resources.filter((r) => r.resource_type === 'video').length;
  const whiteboardCount = resources.filter((r) => r.resource_type === 'whiteboard').length;
  const assignmentCount = resources.filter((r) => r.resource_type === 'assignment').length;
  const pastPaperCount = resources.filter((r) => r.resource_type === 'past_paper').length;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Active Subjects
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {activeSubjectsCount}
            </h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Published Resources
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {publishedCount}
            </h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Drafts (Unpublished)
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {draftCount}
            </h3>
          </div>
        </Card>

        <Link to="/admin/students" className="block">
          <Card hover className="p-4 flex items-center gap-3 border-brand-200 dark:border-brand-900/60 bg-brand-50/20 dark:bg-navy-900/40">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-300">
                Students & CR/GR &rarr;
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {studentCount}
              </h3>
            </div>
          </Card>
        </Link>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Active Notices
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {announcements.length}
            </h3>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Content Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launch Actions */}
        <Card className="p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-600" />
            <span>Publishing Quick Actions</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Easily upload class notes or register newly added semester courses.
          </p>
          <div className="space-y-2 pt-1">
            <Button
              className="w-full justify-start text-xs py-2"
              onClick={onNewResource}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add New Resource
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-xs py-2"
              onClick={onNewSubject}
              leftIcon={<BookOpen className="w-3.5 h-3.5" />}
            >
              Create New Subject
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start text-xs py-2"
              onClick={onBulkImport}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Bulk Import CSV
            </Button>
          </div>
        </Card>

        {/* Resources Distribution Breakdown */}
        <Card className="lg:col-span-2 p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Resources by Content Category</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-slate-500">PDFs</span>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{pdfCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-slate-500">Videos</span>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{videoCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-slate-500">Whiteboards</span>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{whiteboardCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-slate-500">Assignments</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{assignmentCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500">Past Papers</span>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{pastPaperCount}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
