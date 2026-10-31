// ==============================================================================
// HAMMAD STUDYHUB — STORAGE OVERVIEW CARD COMPONENT
// Architect: Muhammad Hammad
// Displays real-time Available and Used storage, tier quota, and category breakdown.
// ==============================================================================

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HardDrive,
  Cloud,
  FileText,
  Presentation,
  Image as ImageIcon,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { Resource, Subject } from '../../types';
import { calculateStorageMetrics } from '../../lib/storageMetrics';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface StorageOverviewCardProps {
  resources: Resource[];
  subjects?: Subject[];
  onUploadClick?: () => void;
}

export const StorageOverviewCard: React.FC<StorageOverviewCardProps> = ({
  resources,
  subjects = [],
  onUploadClick,
}) => {
  const metrics = useMemo(() => {
    return calculateStorageMetrics(resources, subjects);
  }, [resources, subjects]);

  return (
    <Card className="p-6 border-brand-200/80 dark:border-brand-900/40 bg-gradient-to-br from-white via-slate-50/50 to-brand-50/20 dark:from-navy-900 dark:via-navy-900/90 dark:to-navy-950 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Platform Cloud Storage Monitor
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>System Storage Online</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Available and used backup capacity for lecture notes, slides, and study materials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <Link
            to="/admin/resources"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>Manage Resources</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {onUploadClick && (
            <Button size="sm" onClick={onUploadClick} leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
              Upload Material
            </Button>
          )}
        </div>
      </div>

      {/* Primary Storage Metrics Grid: Available, Used, Total Limit, Files Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Storage Card (Hero Metric) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-950 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Available Storage
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
              {metrics.formattedAvailable}
            </h4>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ({metrics.availablePercentage}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Remaining cloud capacity ready for new materials
          </p>
        </div>

        {/* Used Storage Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Used Storage
            </span>
            <Cloud className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {metrics.formattedUsed}
            </h4>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              ({metrics.usedPercentage}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Current space consumed by uploaded study files
          </p>
        </div>

        {/* Total Storage Tier Limit */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Storage Tier
            </span>
            <HardDrive className="w-4 h-4 text-slate-400" />
          </div>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.formattedLimit}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Standard dedicated cloud tier allocation
          </p>
        </div>

        {/* Total Uploaded Materials Count */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Stored Documents
            </span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {metrics.totalFilesCount}
            </h4>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              files
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Across {subjects.length} academic courses
          </p>
        </div>
      </div>

      {/* Visual Storage Meter / Capacity Gauge */}
      <div className="space-y-2 p-4 rounded-2xl bg-white/80 dark:bg-navy-950/80 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Capacity Allocation Status</span>
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-mono">
            <strong>{metrics.formattedUsed}</strong> used of <strong>{metrics.formattedLimit}</strong> ({metrics.availablePercentage}% free)
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-brand-500 rounded-full transition-all duration-500 min-w-[6px]"
            style={{ width: `${Math.max(metrics.usedPercentage, 1)}%` }}
            title={`Used: ${metrics.formattedUsed} (${metrics.usedPercentage}%)`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>0 GB</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {metrics.formattedAvailable} Available
          </span>
          <span>{metrics.formattedLimit}</span>
        </div>
      </div>

      {/* Categorized Storage Breakdown by File Type */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-brand-600" />
          <span>Storage Breakdown by Format</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* PDFs */}
          <div className="p-3 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                <span>PDF Notes</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {metrics.byType.pdf?.count || 0} files
              </span>
            </div>
            <p className="text-sm font-extrabold text-red-600 dark:text-red-400 font-mono">
              {metrics.byType.pdf?.formatted || '0 B'}
            </p>
          </div>

          {/* Slides */}
          <div className="p-3 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Presentation className="w-3.5 h-3.5 text-amber-500" />
                <span>PowerPoint</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {metrics.byType.presentation?.count || 0} files
              </span>
            </div>
            <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {metrics.byType.presentation?.formatted || '0 B'}
            </p>
          </div>

          {/* Whiteboards */}
          <div className="p-3 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>Whiteboards</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {metrics.byType.whiteboard?.count || 0} files
              </span>
            </div>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.byType.whiteboard?.formatted || '0 B'}
            </p>
          </div>

          {/* Assignments */}
          <div className="p-3 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <ClipboardCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Assignments</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {metrics.byType.assignment?.count || 0} files
              </span>
            </div>
            <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              {metrics.byType.assignment?.formatted || '0 B'}
            </p>
          </div>

          {/* Past Papers */}
          <div className="p-3 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                <span>Past Papers</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {metrics.byType.past_paper?.count || 0} files
              </span>
            </div>
            <p className="text-sm font-extrabold text-purple-600 dark:text-purple-400 font-mono">
              {metrics.byType.past_paper?.formatted || '0 B'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Subjects by Storage Usage (if any uploaded files exist) */}
      {metrics.bySubject.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-brand-600" />
            <span>Subject Storage Distribution</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {metrics.bySubject.slice(0, 6).map((sub) => (
              <div
                key={sub.subjectId}
                className="p-2.5 rounded-xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {sub.subjectName}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sub.count} {sub.count === 1 ? 'file' : 'files'}
                  </span>
                </div>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs shrink-0">
                  {sub.formatted}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
