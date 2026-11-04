// ==============================================================================
// HAMMAD STUDYHUB — STUDENT ANONYMOUS QUESTIONS & POLLS INTERFACE
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle,
  Clock,
  Send,
  Lock,
  Star,
  Sparkles,
  AlertCircle,
  FileQuestion,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubjects } from '../../hooks/useSubjects';
import {
  getActiveQuestionsForStudent,
  hasStudentParticipated,
  submitAnonymousResponse,
  AnonymousQuestion,
} from '../../lib/anonymousStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { formatLessonDate, formatRelativeTime } from '../../lib/utils';

export const StudentQuestionsSection: React.FC = () => {
  const { profile } = useAuth();
  const { data: allSubjects = [] } = useSubjects();

  const [questions, setQuestions] = useState<AnonymousQuestion[]>([]);
  const [answers, setAnswers] = useState<
    Record<
      string,
      {
        selected_option?: string;
        selected_options?: string[];
        rating_value?: number;
        written_text?: string;
      }
    >
  >({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [submittedIds, setSubmittedIds] = useState<Record<string, boolean>>({});

  const refreshQuestions = () => {
    const subjectIds = allSubjects.map((s) => s.id);
    const active = getActiveQuestionsForStudent(subjectIds);
    setQuestions(active);

    if (profile?.id) {
      const statuses: Record<string, boolean> = {};
      active.forEach((q) => {
        statuses[q.id] = hasStudentParticipated(q.id, profile.id);
      });
      setSubmittedIds(statuses);
    }
  };

  useEffect(() => {
    refreshQuestions();
    window.addEventListener('studyhub_polls_updated', refreshQuestions);
    return () => window.removeEventListener('studyhub_polls_updated', refreshQuestions);
  }, [profile?.id, allSubjects.length]);

  const handleSingleSelect = (questionId: string, opt: string) => {
    setAnswers({
      ...answers,
      [questionId]: { ...answers[questionId], selected_option: opt },
    });
  };

  const handleMultiSelect = (questionId: string, opt: string) => {
    const current = answers[questionId]?.selected_options || [];
    const next = current.includes(opt) ? current.filter((o) => o !== opt) : [...current, opt];
    setAnswers({
      ...answers,
      [questionId]: { ...answers[questionId], selected_options: next },
    });
  };

  const handleRatingSelect = (questionId: string, val: number) => {
    setAnswers({
      ...answers,
      [questionId]: { ...answers[questionId], rating_value: val },
    });
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers({
      ...answers,
      [questionId]: { ...answers[questionId], written_text: text },
    });
  };

  const handleSubmitResponse = async (q: AnonymousQuestion) => {
    if (!profile?.id) return;
    setSubmittingId(q.id);
    setErrorMessages({ ...errorMessages, [q.id]: '' });

    const ans = answers[q.id] || {};

    const result = await submitAnonymousResponse(
      {
        question_id: q.id,
        subject_id: q.subject_id,
        question_type: q.question_type,
        selected_option: ans.selected_option,
        selected_options: ans.selected_options,
        rating_value: ans.rating_value,
        written_text: ans.written_text,
      },
      profile.id
    );

    setSubmittingId(null);
    if (result.success) {
      setSubmittedIds({ ...submittedIds, [q.id]: true });
      refreshQuestions();
    } else {
      setErrorMessages({ ...errorMessages, [q.id]: result.error || 'Failed to submit response.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800/90 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
              <FileQuestion className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Anonymous Questions &amp; Teacher Polls
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Answer questions and give feedback to your course instructors. Your answers are submitted anonymously — teachers only see aggregate summaries or anonymous text.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <span>{questions.length} Active {questions.length === 1 ? 'Question' : 'Questions'}</span>
        </div>
      </div>

      {/* Questions List */}
      {questions.length > 0 ? (
        <div className="space-y-5">
          {questions.map((q) => {
            const hasAnswered = submittedIds[q.id];
            const ans = answers[q.id] || {};
            const isSubmitting = submittingId === q.id;
            const error = errorMessages[q.id];

            return (
              <Card key={q.id} className="p-5 sm:p-6 space-y-4">
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {q.subject_name || 'Course'}
                      </span>
                      {q.teacher_name && (
                        <span className="text-xs font-medium text-slate-500">
                          Instructor: {q.teacher_name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {q.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Closes {formatRelativeTime(q.closing_date)}</span>
                  </div>
                </div>

                {q.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {q.description}
                  </p>
                )}

                {/* Anonymous Response Notice (Section 3.B) */}
                <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/60 flex items-center gap-2 text-xs text-purple-900 dark:text-purple-300">
                  <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>
                    <strong>Anonymous Response:</strong> Your name and roll number will not appear alongside your answer.
                  </span>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Response Input Area */}
                {hasAnswered ? (
                  /* Already Submitted Banner */
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold">Response Submitted Anonymously</div>
                      <div className="text-[11px] opacity-90">
                        Thank you for your feedback! Your answer has been recorded into the teacher&apos;s aggregate summary.
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Interactive Response Options */
                  <div className="space-y-4 pt-1">
                    {/* Single-Choice MCQ */}
                    {q.question_type === 'single_choice' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt: string, i: number) => (
                          <label
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-colors ${
                              ans.selected_option === opt
                                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-semibold ring-1 ring-brand-500'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`single-${q.id}`}
                              checked={ans.selected_option === opt}
                              onChange={() => handleSingleSelect(q.id, opt)}
                              className="text-brand-600 focus:ring-brand-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Multiple-Choice MCQ */}
                    {q.question_type === 'multiple_choice' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt: string, i: number) => {
                          const isChecked = (ans.selected_options || []).includes(opt);
                          return (
                            <label
                              key={i}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-colors ${
                                isChecked
                                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-semibold ring-1 ring-brand-500'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleMultiSelect(q.id, opt)}
                                className="rounded text-brand-600 focus:ring-brand-500"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Rating Scale (1 to 5) */}
                    {q.question_type === 'rating_scale' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleRatingSelect(q.id, val)}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                (ans.rating_value || 0) >= val
                                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-300 hover:border-amber-300'
                              }`}
                            >
                              <Star className={`w-6 h-6 ${(ans.rating_value || 0) >= val ? 'fill-current' : ''}`} />
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{val}</span>
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 max-w-xs">
                          <span>1 = Poor</span>
                          <span>5 = Excellent</span>
                        </div>
                      </div>
                    )}

                    {/* Short Written Answer & Student Feedback */}
                    {(q.question_type === 'short_answer' || q.question_type === 'student_feedback') && (
                      <div className="space-y-1.5">
                        <textarea
                          rows={3}
                          value={ans.written_text || ''}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          placeholder="Type your response here... (Do not include your name or roll number)"
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <div className="text-[11px] text-amber-600 dark:text-amber-400">
                          Privacy reminder: Your response text will be displayed directly to the teacher in shuffled order without identifying details.
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => handleSubmitResponse(q)}
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Response Anonymously'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No active questions or polls"
          description="Your course instructors haven't posted any active anonymous questions at this time. Check back soon!"
        />
      )}
    </div>
  );
};
