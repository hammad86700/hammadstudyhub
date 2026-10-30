// ==============================================================================
// HAMMAD STUDYHUB — ADD YOUTUBE LECTURE MODAL
// Allows Admin, CR, and GR to add YouTube lecture videos directly to any subject
// with instant URL parsing, live thumbnail preview, title, and optional description.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  Play,
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Subject, Resource } from '../../types';
import { parseYouTubeUrl } from '../../lib/googleDrive';
import { getTodayDateString, slugify } from '../../lib/utils';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface AddYouTubeLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  defaultSubjectId?: string;
  onAddLecture: (resourceData: Partial<Resource>) => Promise<void>;
  isLoading?: boolean;
}

export const AddYouTubeLectureModal: React.FC<AddYouTubeLectureModalProps> = ({
  isOpen,
  onClose,
  subjects,
  defaultSubjectId,
  onAddLecture,
  isLoading = false,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId || subjects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lessonDate, setLessonDate] = useState(getTodayDateString());
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Update default subject whenever modal opens or defaultSubjectId changes
  useEffect(() => {
    if (defaultSubjectId) {
      setSubjectId(defaultSubjectId);
    } else if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [defaultSubjectId, subjects, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setYoutubeUrl('');
      setTitle('');
      setDescription('');
      setChapter('');
      setTopic('');
      setErrorMsg('');
      setLessonDate(getTodayDateString());
    }
  }, [isOpen]);

  const parsedYouTube = youtubeUrl ? parseYouTubeUrl(youtubeUrl) : null;
  const isVideoValid = Boolean(parsedYouTube?.isValid && parsedYouTube.videoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isVideoValid || !parsedYouTube?.embedUrl) {
      setErrorMsg('Please enter a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please provide a lecture title.');
      return;
    }

    if (!subjectId) {
      setErrorMsg('Please select a subject.');
      return;
    }

    try {
      await onAddLecture({
        subject_id: subjectId,
        title: title.trim(),
        slug: slugify(title.trim()),
        description: description.trim() || undefined,
        resource_type: 'video',
        source_provider: 'youtube',
        external_url: youtubeUrl.trim(),
        embed_url: parsedYouTube.embedUrl,
        lesson_date: lessonDate,
        chapter: chapter.trim() || undefined,
        topic: topic.trim() || undefined,
        tags: ['YouTube Lecture', 'Video'],
        status: 'published',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish YouTube lecture.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add YouTube Video Lecture"
      description="Attach a YouTube lecture recording or explanation video directly to a specific course subject."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Target Subject Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Subject Course <span className="text-red-500">*</span>
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
            required
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>
        </div>

        {/* YouTube URL with Instant Preview */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            YouTube Video Link <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Video className="w-4 h-4 text-red-500 absolute left-3 top-3" />
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* YouTube Video Validation Status & Thumbnail Preview */}
          {youtubeUrl && (
            <div className="mt-2.5">
              {isVideoValid && parsedYouTube?.videoId ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                  <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-black shrink-0 border border-emerald-300 dark:border-emerald-700">
                    <img
                      src={`https://img.youtube.com/vi/${parsedYouTube.videoId}/mqdefault.jpg`}
                      alt="YouTube Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Valid YouTube Video Detected</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                      Video ID: {parsedYouTube.videoId}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Enter a standard YouTube watch link, youtu.be short link, or shorts link.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lecture Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Lecture Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Lecture 6: Object Oriented Programming in C++ (Classes & Objects)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Lesson Date, Chapter & Topic in 3 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Lesson Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Chapter (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 3"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Topic (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Constructors"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Optional Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Lecture Description / Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Detailed explanation of topics covered, instructor notes, or homework mentioned in the lecture..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isLoading || !isVideoValid || !title.trim()}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {isLoading ? 'Publishing...' : 'Publish YouTube Lecture'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

