// ==============================================================================
// HAMMAD STUDYHUB — STUDENT ASSIGNMENT UPLOAD MODAL
// Mobile-friendly multi-file uploader for handwritten images and documents.
// ==============================================================================

import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Subject, SubmissionFile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { fileToBase64, formatFileSize } from '../../lib/cloudFileStorage';
import { createAssignmentSubmission } from '../../lib/teacherAssignmentStore';
import { Button } from '../common/Button';

interface StudentAssignmentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSuccess?: () => void;
}

interface QueuedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  isImage: boolean;
  previewUrl?: string;
  progress: number;
}

export const StudentAssignmentUploadModal: React.FC<StudentAssignmentUploadModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onSuccess,
}) => {
  const { profile } = useAuth();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileQueue, setFileQueue] = useState<QueuedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync default subject when subjects change
  React.useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  if (!isOpen) return null;

  const handleFilesAdded = (files: FileList | File[]) => {
    setErrorMessage(null);
    const added: QueuedFile[] = [];

    Array.from(files).forEach((file) => {
      // Validate file extension
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'ppt', 'pptx'];

      if (!validExtensions.includes(ext)) {
        setErrorMessage(`File "${file.name}" has an unsupported format. Please upload images (JPG/PNG) or documents (PDF/Word/PPT).`);
        return;
      }

      // Max file size: 25MB per file
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage(`File "${file.name}" exceeds the 25MB limit.`);
        return;
      }

      const isImg = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
      const preview = isImg ? URL.createObjectURL(file) : undefined;

      added.push({
        id: `fqueue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        isImage: isImg,
        previewUrl: preview,
        progress: 100,
      });
    });

    if (added.length > 0) {
      setFileQueue((prev) => [...prev, ...added]);

      // If title is blank, pre-fill with clean name from first file
      if (!title && added[0]) {
        const cleanName = added[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
        setTitle(`${cleanName} Assignment`);
      }
    }
  };

  const removeQueuedFile = (id: string) => {
    setFileQueue((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter an assignment title.');
      return;
    }

    if (!selectedSubjectId) {
      setErrorMessage('Please select a subject for this assignment.');
      return;
    }

    if (fileQueue.length === 0) {
      setErrorMessage('Please attach at least one image or document file.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

      // Convert all files to Base64 so they can be viewed cross-device and offline
      const processedFiles: SubmissionFile[] = [];

      for (const item of fileQueue) {
        const base64Data = await fileToBase64(item.file);
        processedFiles.push({
          id: `subm-file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          file_name: item.name,
          file_size: item.size,
          mime_type: item.file.type || 'application/octet-stream',
          file_url: base64Data,
          file_data: base64Data,
        });
      }

      const res = await createAssignmentSubmission({
        student_id: profile?.id || 'guest-student',
        student_name: profile?.display_name || 'Student',
        roll_no: profile?.roll_no || 'N/A',
        subject_id: selectedSubjectId,
        subject_name: selectedSubject ? `${selectedSubject.name} (${selectedSubject.code})` : 'Subject',
        title: title.trim(),
        description: description.trim(),
        files: processedFiles,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to submit assignment.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Assignment submitted successfully! Your subject teacher has been notified.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred during assignment submission.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Upload New Assignment
              </h3>
              <p className="text-xs text-slate-500">
                Submit handwritten homework pictures, PDFs, or slides to your teacher.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. Subject Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Assignment Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Assignment Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Logic Gates Truth Tables & K-Map Derivations"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* 3. Description (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Assignment Notes / Remarks (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional message or details for your subject teacher..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* 4. Multi-File Drag & Drop Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Attach Images or Documents ({fileQueue.length} files selected) <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Supports handwritten photos (JPG/PNG) & documents (PDF/Word/PPT). You can attach multiple photos for multi-page assignments.
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) handleFilesAdded(e.dataTransfer.files);
              }}
              className={`p-6 rounded-2xl border-2 border-dashed text-center transition-colors ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-navy-950/40'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Drag and drop photos or document files here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    or click below to browse from your device
                  </p>
                </div>

                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer transition-colors shadow-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Select Files / Photos</span>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => {
                      if (e.target.files) handleFilesAdded(e.target.files);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Queued Files List with Thumbnails */}
            {fileQueue.length > 0 && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {fileQueue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.isImage && item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate">
                          {idx + 1}. {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{item.size}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQueuedFile(item.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              className="font-bold px-5"
              isLoading={isSubmitting}
            >
              Submit Assignment ({fileQueue.length} Files)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

