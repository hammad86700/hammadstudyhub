// ==============================================================================
// HAMMAD STUDYHUB — TEACHER ANONYMOUS QUESTION & POLL BUILDER MODAL
// ==============================================================================

import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Plus,
  Trash2,
  Calendar,
  Lock,
  Eye,
  AlertCircle,
  Send,
  Star,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherAssignedSubjects } from '../../lib/teacherAssignmentStore';
import {
  createAnonymousQuestion,
  AnonymousQuestionType,
} from '../../lib/anonymousStore';
import { Button } from '../common/Button';

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { profile } = useAuth();
  const assignedSubjects = React.useMemo(() => {
    return getTeacherAssignedSubjects(profile);
  }, [profile]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(assignedSubjects[0]?.id || '');
  const [questionType, setQuestionType] = useState<AnonymousQuestionType>('single_choice');
  const [options, setOptions] = useState<string[]>(['Option A', 'Option B', 'Option C', 'Option D']);
  const [closingDate, setClosingDate] = useState<string>(() => {
    // Default closing date: 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().substring(0, 16);
  });
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [minThreshold, setMinThreshold] = useState(1);
  const [hideUntilClosed, setHideUntilClosed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (assignedSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(assignedSubjects[0].id);
    }
  }, [assignedSubjects, selectedSubjectId]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, `Option ${String.fromCharCode(65 + options.length)}`]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter the question or poll prompt.');
      return;
    }
    if (!selectedSubjectId) {
      setErrorMessage('Please select one of your assigned courses.');
      return;
    }
    if (!closingDate) {
      setErrorMessage('Please select a closing date and time.');
      return;
    }

    const selectedSubject = assignedSubjects.find((s) => s.id === selectedSubjectId);

    setIsSubmitting(true);
    try {
      const result = await createAnonymousQuestion({
        teacher_id: profile.id,
        teacher_name: profile.display_name,
        subject_id: selectedSubjectId,
        subject_name: selectedSubject?.name,
        title,
        description,
        question_type: questionType,
        options:
          questionType === 'single_choice' || questionType === 'multiple_choice'
            ? options.map((o) => o.trim()).filter(Boolean)
            : undefined,
        rating_min: 1,
        rating_max: 5,
        rating_labels: { min_label: 'Poor', max_label: 'Excellent' },
        is_anonymous: isAnonymous,
        closing_date: new Date(closingDate).toISOString(),
        min_responses_threshold: minThreshold,
        hide_results_until_closed: hideUntilClosed,
      });

      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(result.error || 'Failed to create question.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-navy-900 rounded-3xl shadow-modal border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-navy-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Create Anonymous Question / Poll</h3>
              <p className="text-xs text-slate-300">
                Collect honest feedback from your students with guaranteed response anonymity.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Assigned Subject Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Assigned Course / Subject <span className="text-red-500">*</span>
            </label>
            {assignedSubjects.length > 0 ? (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {assignedSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl">
                You do not have any Admin-approved assigned subjects yet. Please contact the administrator.
              </div>
            )}
          </div>

          {/* Question Title / Prompt */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Question or Poll Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Which topic in Chapter 3 did you find most challenging?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Description or Instructions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Instructions / Context (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background context or clarify what feedback you are looking for..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Question Type Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Question Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { label: 'Single-Choice MCQ', val: 'single_choice' },
                { label: 'Multiple-Choice MCQ', val: 'multiple_choice' },
                { label: 'Rating Scale (1-5)', val: 'rating_scale' },
                { label: 'Short Written Answer', val: 'short_answer' },
                { label: 'Student Feedback', val: 'student_feedback' },
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setQuestionType(t.val as AnonymousQuestionType)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    questionType === t.val
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Options for MCQs */}
          {(questionType === 'single_choice' || questionType === 'multiple_choice') && (
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                <span>Answer Options</span>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 text-xs font-bold text-slate-400 shrink-0">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rating Preview */}
          {questionType === 'rating_scale' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">Rating Scale Preview:</span>
              <div className="flex items-center gap-1 text-amber-400 py-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 fill-current" />
                ))}
                <span className="ml-2 text-slate-500 text-[11px]">(1 = Poor to 5 = Excellent)</span>
              </div>
            </div>
          )}

          {/* Closing Date & Response Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Closing Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Minimum Response Threshold
              </label>
              <select
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-950"
              >
                <option value={1}>Show results immediately (1 response)</option>
                <option value={3}>Require at least 3 responses (Recommended for privacy)</option>
                <option value={5}>Require at least 5 responses</option>
              </select>
            </div>
          </div>

          {/* Anonymous Setting Toggle */}
          <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-brand-800 dark:text-brand-300">
                <Lock className="w-3.5 h-3.5" />
                <span>Anonymous Responses: {isAnonymous ? 'ON' : 'OFF'}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                When enabled, student names and roll numbers are never revealed to you alongside their answers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isAnonymous ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white transition-transform block absolute top-1 ${
                  isAnonymous ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || assignedSubjects.length === 0}
              leftIcon={<Send className="w-4 h-4" />}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Question / Poll'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

