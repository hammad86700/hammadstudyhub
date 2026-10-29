// ==============================================================================
// HAMMAD STUDYHUB — REPORT CONTENT & BROKEN LINK MODAL
// ==============================================================================

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Send } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, Textarea, Select } from '../common/Input';
import { useSubmitFeedback } from '../../hooks/useFeedback';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId?: string;
  resourceTitle?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceTitle,
}) => {
  const [category, setCategory] = useState<'broken_link' | 'resource_request' | 'correction' | 'other'>('broken_link');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const submitMutation = useSubmitFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    await submitMutation.mutateAsync({
      category,
      message: resourceTitle ? `[Resource: ${resourceTitle}] ${message.trim()}` : message.trim(),
      contact_email: email.trim() || undefined,
      resource_id: resourceId,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setMessage('');
      setEmail('');
      onClose();
    }, 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Resource or Link Issue"
      description="Let us know if a Google Drive link requires permissions, a video is unavailable, or notes contain an error."
    >
      {isSuccess ? (
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
          <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Report Submitted!</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thank you for helping keep Hammad StudyHub accurate and up-to-date.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {resourceTitle && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Reporting: </span>
              <span className="text-slate-600 dark:text-slate-400 truncate">{resourceTitle}</span>
            </div>
          )}

          <Select
            label="Issue Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            options={[
              { value: 'broken_link', label: 'Broken or Inaccessible Google Drive Link' },
              { value: 'correction', label: 'Correction / Typo in Study Material' },
              { value: 'resource_request', label: 'Missing Notes / Additional Chapter Request' },
              { value: 'other', label: 'Other Issue' },
            ]}
          />

          <Textarea
            label="Description of the issue"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. The Google Drive file says 'Access Denied: You need permission' when attempting to open..."
          />

          <Input
            label="Your Email (Optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com (if you'd like a notification when resolved)"
            helperText="We will never share or spam your email address."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={submitMutation.isPending}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
