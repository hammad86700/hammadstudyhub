// ==============================================================================
// HAMMAD STUDYHUB — TEACHER ANONYMOUS QUESTIONS & POLLS DASHBOARD
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  BarChart2,
  CheckCircle,
  Clock,
  Download,
  Lock,
  Eye,
  Star,
  MessageSquare,
  AlertCircle,
  Archive,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherAssignedSubjects } from '../../lib/teacherAssignmentStore';
import {
  getTeacherQuestions,
  getQuestionResponseSummary,
  closeAnonymousQuestion,
  exportAnonymizedSummaryCsv,
  AnonymousQuestion,
  QuestionResponseSummary,
} from '../../lib/anonymousStore';
import { CreateQuestionModal } from './CreateQuestionModal';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { formatRelativeTime } from '../../lib/utils';

export const TeacherQuestionsSection: React.FC = () => {
  const { profile } = useAuth();
  const assignedSubjects = React.useMemo(() => {
    return getTeacherAssignedSubjects(profile);
  }, [profile]);

  const [questions, setQuestions] = useState<AnonymousQuestion[]>([]);
  const [filter, setFilter] = useState<'active' | 'closed'>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, QuestionResponseSummary>>({});

  const refreshData = () => {
    if (profile?.id) {
      const qList = getTeacherQuestions(profile.id);
      setQuestions(qList);

      const sumMap: Record<string, QuestionResponseSummary> = {};
      qList.forEach((q) => {
        sumMap[q.id] = getQuestionResponseSummary(q.id);
      });
      setSummaries(sumMap);
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('studyhub_polls_updated', refreshData);
    return () => window.removeEventListener('studyhub_polls_updated', refreshData);
  }, [profile?.id]);

  const handleCloseQuestion = async (questionId: string) => {
    if (confirm('Are you sure you want to close this question? Students will no longer be able to submit responses.')) {
      await closeAnonymousQuestion(questionId);
      refreshData();
    }
  };

  const handleExportCsv = (q: AnonymousQuestion) => {
    const csv = exportAnonymizedSummaryCsv(q.id);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `anonymous-poll-${q.title.substring(0, 20)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = questions.filter((q) => {
    if (filter === 'active') return q.status === 'active';
    return q.status === 'closed' || q.status === 'archived';
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Anonymous Questions &amp; Polls
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Create polls, rating checks, and anonymous feedback prompts for your assigned courses. Student identities are never revealed.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={assignedSubjects.length === 0}
          className="shrink-0 shadow-xs"
        >
          Create Question / Poll
        </Button>
      </div>

      {/* Filter Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filter === 'active'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Active Questions ({questions.filter((q) => q.status === 'active').length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('closed')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filter === 'closed'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Closed Questions ({questions.filter((q) => q.status !== 'active').length})
        </button>
      </div>

      {/* Questions List */}
      {filtered.length > 0 ? (
        <div className="space-y-5">
          {filtered.map((q) => {
            const summary = summaries[q.id] || { total_responses: 0, is_threshold_met: true };
            const isClosed = q.status === 'closed';

            return (
              <Card key={q.id} className="p-5 sm:p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {q.subject_name || 'Course'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 capitalize">
                        {q.question_type.replace('_', ' ')}
                      </span>
                      {q.is_anonymous && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Anonymous
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {q.title}
                    </h3>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-300">
                      {summary.total_responses} {summary.total_responses === 1 ? 'Response' : 'Responses'}
                    </span>

                    {summary.total_responses > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportCsv(q)}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        title="Download anonymized summary CSV"
                      >
                        Export CSV
                      </Button>
                    )}

                    {!isClosed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloseQuestion(q.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Close Question
                      </Button>
                    )}
                  </div>
                </div>

                {q.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {q.description}
                  </p>
                )}

                {/* Aggregate Results Visualizer */}
                <div className="pt-2">
                  {!summary.is_threshold_met ? (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Lock className="w-4 h-4" />
                        <span>Privacy Threshold Protected</span>
                      </div>
                      <p>
                        Results are protected and hidden until at least {summary.min_threshold} students have responded (currently {summary.total_responses}).
                      </p>
                    </div>
                  ) : summary.total_responses === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-400 italic">
                      No student responses submitted yet.
                    </div>
                  ) : (
                    /* Detailed Summary */
                    <div className="space-y-3">
                      {/* MCQs Option Distribution */}
                      {summary.option_counts && summary.option_percentages && (
                        <div className="space-y-2.5">
                          {Object.keys(summary.option_counts).map((opt) => {
                            const count = summary.option_counts![opt];
                            const pct = summary.option_percentages![opt];
                            return (
                              <div key={opt} className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  <span>{opt}</span>
                                  <span className="text-slate-500">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-navy-950 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-brand-600 transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Rating Scale Summary */}
                      {summary.average_rating !== undefined && summary.rating_distribution && (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              Average Rating Score:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Star className="w-5 h-5 text-amber-400 fill-current" />
                              <span className="text-base font-black text-slate-900 dark:text-white">
                                {summary.average_rating} / 5
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-5 gap-2 text-center text-xs">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <div key={star} className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800">
                                <div className="font-bold text-amber-500">{star} ★</div>
                                <div className="text-slate-400 text-[11px] mt-0.5">
                                  {summary.rating_distribution![star]} votes
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Short Written Answers / Feedback (Shuffled, Zero Student Metadata) */}
                      {summary.shuffled_text_responses && summary.shuffled_text_responses.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                            <span>Anonymous Written Responses ({summary.shuffled_text_responses.length})</span>
                            <span className="text-[11px] font-normal text-slate-400">Order shuffled for privacy</span>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {summary.shuffled_text_responses.map((ans: string, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed"
                              >
                                &ldquo;{ans}&rdquo;
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Lock className="w-3 h-3 text-purple-500" />
                    <span>Identity separated from response content</span>
                  </span>
                  <span>{isClosed ? 'Question Closed' : `Closes ${formatRelativeTime(q.closing_date)}`}</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={`No ${filter} questions`}
          description={
            filter === 'active'
              ? 'You have no active questions or polls right now. Create one using the button above!'
              : 'You have no closed questions in your archive.'
          }
        />
      )}

      {/* Creation Modal */}
      <CreateQuestionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refreshData}
      />
    </div>
  );
};
