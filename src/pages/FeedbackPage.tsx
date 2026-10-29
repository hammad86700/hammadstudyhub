// ==============================================================================
// HAMMAD STUDYHUB — FEEDBACK & REPORT FORM PAGE
// ==============================================================================

import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { useSubmitFeedback } from '../hooks/useFeedback';
import { SEOHead } from '../components/common/SEOHead';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Textarea, Select } from '../components/common/Input';

export const FeedbackPage: React.FC = () => {
  const [category, setCategory] = useState<'general' | 'broken_link' | 'resource_request' | 'correction' | 'other'>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitMutation = useSubmitFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    await submitMutation.mutateAsync({
      category,
      message: message.trim(),
      contact_email: email.trim() || undefined,
    });

    setIsSubmitted(true);
    setMessage('');
    setEmail('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <SEOHead
        title="Feedback & Support"
        description="Submit feedback, report broken links, or request study notes on Hammad StudyHub."
      />

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <MessageSquare className="w-6 h-6 text-brand-600" />
          <span>Student Feedback & Resource Requests</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Have a suggestion, found a broken link, or need a specific chapter uploaded? Let us know.
        </p>
      </div>

      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card">
        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Thank You for Your Feedback!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your submission has been securely recorded. Muhammad Hammad will review it to keep StudyHub running smoothly.
            </p>
            <div className="pt-3">
              <Button size="sm" onClick={() => setIsSubmitted(false)}>
                Submit Another Message
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Topic Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              options={[
                { value: 'general', label: 'General Feedback or Suggestion' },
                { value: 'broken_link', label: 'Report Broken Google Drive Link' },
                { value: 'resource_request', label: 'Request Missing Subject / Lecture Notes' },
                { value: 'correction', label: 'Report Typo or Note Correction' },
                { value: 'other', label: 'Other Support Inquiry' },
              ]}
            />

            <Textarea
              label="Your Message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide details, such as the subject name, lesson date, or URL if reporting an issue..."
            />

            <Input
              label="Your Email (Optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com (only if you'd like a reply)"
              helperText="Zero spam. We never share student emails with third parties."
            />

            <div className="pt-2">
              <Button
                type="submit"
                size="md"
                className="w-full"
                isLoading={submitMutation.isPending}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Message
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
