// ==============================================================================
// HAMMAD STUDYHUB — SUBJECT CARD COMPONENT
// ==============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Code,
  Cpu,
  BookOpen,
  Atom,
  Users,
  Calendar,
  FileText,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { Subject } from '../../types';
import { formatLessonDate } from '../../lib/utils';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface SubjectCardProps {
  subject: Subject;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const getSubjectIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'code':
        return <Code className="w-5 h-5" />;
      case 'cpu':
        return <Cpu className="w-5 h-5" />;
      case 'atom':
        return <Atom className="w-5 h-5" />;
      case 'users':
        return <Users className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'indigo':
        return {
          iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
          accentBorder: 'border-l-indigo-500',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
          accentBorder: 'border-l-emerald-500',
        };
      case 'teal':
        return {
          iconBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
          accentBorder: 'border-l-teal-500',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
          accentBorder: 'border-l-rose-500',
        };
      default:
        return {
          iconBg: 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400',
          accentBorder: 'border-l-brand-500',
        };
    }
  };

  const style = getColorClasses(subject.color);

  return (
    <Card hover className={`flex flex-col justify-between overflow-hidden border-l-4 ${style.accentBorder}`}>
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header with Icon, Code, and Featured Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${style.iconBg}`}>
              {getSubjectIcon(subject.icon)}
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {subject.code}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                <Link
                  to={`/subjects/${subject.slug}`}
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus:outline-none"
                >
                  {subject.name}
                </Link>
              </h3>
            </div>
          </div>
          {subject.is_featured && (
            <Badge variant="brand" size="sm">
              Featured
            </Badge>
          )}
        </div>

        {/* Description */}
        {subject.description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {subject.description}
          </p>
        )}

        {/* Instructor */}
        {subject.instructor && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{subject.instructor}</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-navy-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            <FileText className="w-3.5 h-3.5 text-brand-500" />
            <span>{subject.resource_count ?? 0} {subject.resource_count === 1 ? 'Resource' : 'Resources'}</span>
          </span>
          {subject.latest_lesson_date && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3" />
              <span>{formatLessonDate(subject.latest_lesson_date, { format: 'short' })}</span>
            </span>
          )}
        </div>

        <Link
          to={`/subjects/${subject.slug}`}
          className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 group/link"
        >
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </Card>
  );
};
